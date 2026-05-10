import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import Admin from './Admin';
import Student from './Student';
import Register from './Register';

export const StateContext = createContext();

export default function App() {
  const [appState, setAppState] = useState({
    staffStatus: 'Absent',
    registeredCount: 0,
    currentQrSession: '',
    dailyLogs: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sync System State (Staff Status, QR Session)
    const stateDoc = doc(db, 'system', 'state');
    const unsubState = onSnapshot(stateDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppState(prev => ({
          ...prev,
          staffStatus: data.staffStatus || 'Absent',
          currentQrSession: data.currentQrSession || ''
        }));
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firebase not configured or no access:", err);
      setLoading(false); // Stop loading even on error so user can see what's wrong
    });

    // 2. Sync Registrations for today to get the live count
    const todayStr = new Date().toLocaleDateString('en-CA');
    const logsQuery = query(collection(db, 'registrations'), where('date', '==', todayStr));

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(d => d.data());
      // Sort by time descending
      const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);

      setAppState(prev => {
        const newDailyLogs = { ...prev.dailyLogs, [todayStr]: sortedLogs };
        return {
          ...prev,
          registeredCount: sortedLogs.length,
          dailyLogs: newDailyLogs
        };
      });
    });

    return () => {
      unsubState();
      unsubLogs();
    };
  }, []);

  // Helper to fetch logs for a specific date (called by Admin calendar if needed, or we just sync everything)
  // For simplicity in this demo, let's pre-load all logs or load on demand.
  // We'll update the Admin to load date logs when clicked.

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="text-center">
          <p>Connecting to Firebase Cloud...</p>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Make sure to update credentials in firebase.js</p>
        </div>
      </div>
    );
  }

  return (
    <StateContext.Provider value={{ appState, setAppState }}>
      <Router>
        <Routes>
          <Route path="/admin" element={<Admin />} />
          <Route path="/student" element={<Student />} />
          <Route path="/student/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </Router>
    </StateContext.Provider>
  );
}
