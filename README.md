# Smart Hostel Laundry Management System

A modern, mobile-friendly laundry management solution featuring real-time synchronization via **Firebase Cloud** and a **Dynamic QR Registration** system.

## 🚀 Features
- **Admin Portal**: 
  - Dynamic QR code generation (auto-rotates every 24h).
  - Real-time student registration logs.
  - Staff attendance tracking (Present/Absent).
  - Monthly history calendar.
  - QR Download & Share functionality.
- **Student Portal**:
  - Live status tracking of laundry staff.
  - One-tap "Automatic Identification" registration (no typing required).
  - Instant success confirmation with date/time stamps.
- **Backend & Cloud**:
  - Powered by **Firebase Firestore** for real-time global synchronization.
  - Includes a legacy **Java Backend** service for local execution.

## 🛠️ Tech Stack
- **Frontend**: React.js (Vite), Lucide Icons, QRCode.Canvas.
- **Backend**: Java (Native Http Server).
- **Database**: Firebase Firestore.
- **Styling**: Vanilla CSS (Modern aesthetic with glassmorphism and dark mode).

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (for Frontend)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) (for Backend)

### 2. Firebase Configuration
Before running, you must link your own Firebase project:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Cloud Firestore**.
3. Copy your Web App config and paste it into `frontend/src/firebase.js`.

### 3. Installation & Run
**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend (Optional Legacy):**
```bash
cd backend
javac Main.java
java Main
```

## 🔒 Security
- **QR Session IDs**: Registrations are only accepted if the `sessionId` from the scanned QR matches the current active session in the Cloud, preventing unauthorized manual entries.
- **Duplicate Prevention**: The system automatically blocks multiple registrations from the same student on the same calendar day.
