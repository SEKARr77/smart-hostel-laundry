import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.Headers;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

public class Main {
    static class Registration {
        String studentId;
        String rollNumber;
        String name;
        String time;

        public Registration(String id, String r, String n, String t) {
            this.studentId = id;
            this.rollNumber = r;
            this.name = n;
            this.time = t;
        }
    }

    private static ConcurrentHashMap<String, List<Registration>> dailyLogs = new ConcurrentHashMap<>();
    private static ConcurrentHashMap<String, Set<String>> dailyRollNumbers = new ConcurrentHashMap<>();

    private static String staffStatus = "Absent";
    private static String currentQrSession = UUID.randomUUID().toString();

    private static final List<HttpExchange> sseClients = new CopyOnWriteArrayList<>();

    public static void main(String[] args) throws IOException {
        String initialDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        dailyLogs.put(initialDate, new CopyOnWriteArrayList<>());
        dailyRollNumbers.put(initialDate, ConcurrentHashMap.newKeySet());

        // Dummy entry
        String yesterday = LocalDateTime.now().minusDays(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        dailyLogs.put(yesterday, new CopyOnWriteArrayList<>(Arrays.asList(
                new Registration("S101", "21CS01", "Alice L", "10:00 AM"),
                new Registration("S102", "21CS02", "Bob M", "11:30 AM"))));
        Set<String> yesterdaySet = ConcurrentHashMap.newKeySet();
        yesterdaySet.add("21cs01");
        yesterdaySet.add("21cs02");
        dailyRollNumbers.put(yesterday, yesterdaySet);

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        server.createContext("/api/state", handleCors(Main::getState));
        server.createContext("/api/register", handleCors(Main::register));
        server.createContext("/api/staff-status", handleCors(Main::updateStaffStatus));
        server.createContext("/api/sse", Main::sseHandler);

        server.setExecutor(Executors.newCachedThreadPool());
        server.start();
        System.out.println("Java Backend started on port 8080");

        Executors.newScheduledThreadPool(1).scheduleAtFixedRate(() -> {
            currentQrSession = UUID.randomUUID().toString();
            broadcastState();
        }, 24, 24, TimeUnit.HOURS);
    }

    private static HttpHandler handleCors(HttpHandler handler) {
        return exchange -> {
            Headers headers = exchange.getResponseHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "Content-Type");

            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            handler.handle(exchange);
        };
    }

    private static void sseHandler(HttpExchange exchange) throws IOException {
        Headers headers = exchange.getResponseHeaders();
        headers.add("Access-Control-Allow-Origin", "*");
        headers.add("Content-Type", "text/event-stream");
        headers.add("Cache-Control", "no-cache");
        headers.add("Connection", "keep-alive");
        exchange.sendResponseHeaders(200, 0);
        sseClients.add(exchange);
        try {
            sendSseData(exchange, buildStateJson());
        } catch (Exception e) {
            sseClients.remove(exchange);
        }
    }

    private static void broadcastState() {
        String json = buildStateJson();
        List<HttpExchange> deadClients = new ArrayList<>();
        for (HttpExchange client : sseClients) {
            try {
                sendSseData(client, json);
            } catch (IOException e) {
                deadClients.add(client);
            }
        }
        sseClients.removeAll(deadClients);
    }

    private static synchronized void sendSseData(HttpExchange exchange, String data) throws IOException {
        String payload = "data: " + data.replace("\n", "") + "\n\n";
        OutputStream os = exchange.getResponseBody();
        os.write(payload.getBytes(StandardCharsets.UTF_8));
        os.flush();
    }

    private static void getState(HttpExchange exchange) throws IOException {
        sendJsonResponse(exchange, 200, buildStateJson());
    }

    private static void register(HttpExchange exchange) throws IOException {
        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            sendJsonResponse(exchange, 405, "{\"error\": \"Method not allowed\"}");
            return;
        }
        Map<String, String> body = parseJsonBody(exchange.getRequestBody());
        String studentId = body.getOrDefault("studentId", "").trim();
        String rollNumber = body.getOrDefault("rollNumber", "").trim();
        String name = body.getOrDefault("name", "").trim();
        String sessionId = body.getOrDefault("sessionId", "");

        if (!sessionId.equals(currentQrSession)) {
            sendJsonResponse(exchange, 400, "{\"error\": \"QR Code expired. Please scan again.\"}");
            return;
        }

        if (rollNumber.isEmpty() || name.isEmpty() || studentId.isEmpty()) {
            sendJsonResponse(exchange, 400, "{\"error\": \"Invalid input. Missing details.\"}");
            return;
        }

        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        dailyLogs.putIfAbsent(todayDate, new CopyOnWriteArrayList<>());
        dailyRollNumbers.putIfAbsent(todayDate, ConcurrentHashMap.newKeySet());

        Set<String> todayRolls = dailyRollNumbers.get(todayDate);
        if (todayRolls.contains(rollNumber.toLowerCase())) {
            sendJsonResponse(exchange, 400,
                    "{\"error\": \"Duplicate Registration. You have already registered today.\"}");
            return;
        }

        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));
        dailyLogs.get(todayDate).add(0, new Registration(studentId, rollNumber, name, time));
        todayRolls.add(rollNumber.toLowerCase());

        broadcastState();
        sendJsonResponse(exchange, 200, "{\"message\": \"Successfully Registered\", \"date\": \"" + todayDate
                + "\", \"time\": \"" + time + "\"}");
    }

    private static void updateStaffStatus(HttpExchange exchange) throws IOException {
        Map<String, String> body = parseJsonBody(exchange.getRequestBody());
        String status = body.getOrDefault("status", "");
        if (status.equals("Present") || status.equals("Absent")) {
            staffStatus = status;
            broadcastState();
            sendJsonResponse(exchange, 200, "{\"message\": \"Status updated\"}");
        } else {
            sendJsonResponse(exchange, 400, "{\"error\": \"Invalid status\"}");
        }
    }

    private static String buildStateJson() {
        String todayDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        List<Registration> todayLogs = dailyLogs.getOrDefault(todayDate, Collections.emptyList());

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"staffStatus\": \"").append(escapeJson(staffStatus)).append("\", ");
        sb.append("\"registeredCount\": ").append(todayLogs.size()).append(", ");
        sb.append("\"currentQrSession\": \"").append(escapeJson(currentQrSession)).append("\", ");
        sb.append("\"dailyLogs\": {");
        int mapCounter = 0;
        int mapSize = dailyLogs.size();
        for (Map.Entry<String, List<Registration>> entry : dailyLogs.entrySet()) {
            sb.append("\"").append(escapeJson(entry.getKey())).append("\": [");
            List<Registration> list = entry.getValue();
            for (int i = 0; i < list.size(); i++) {
                Registration r = list.get(i);
                sb.append("{")
                        .append("\"studentId\": \"").append(escapeJson(r.studentId)).append("\",")
                        .append("\"rollNumber\": \"").append(escapeJson(r.rollNumber)).append("\",")
                        .append("\"name\": \"").append(escapeJson(r.name)).append("\",")
                        .append("\"time\": \"").append(escapeJson(r.time)).append("\"")
                        .append("}");
                if (i < list.size() - 1)
                    sb.append(",");
            }
            sb.append("]");
            if (mapCounter < mapSize - 1)
                sb.append(",");
            mapCounter++;
        }
        sb.append("}");
        sb.append("}");
        return sb.toString();
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static Map<String, String> parseJsonBody(InputStream is) throws IOException {
        String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        Map<String, String> map = new HashMap<>();
        Matcher m = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        while (m.find()) {
            map.put(m.group(1), m.group(2));
        }
        return map;
    }

    private static String escapeJson(String s) {
        if (s == null)
            return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
