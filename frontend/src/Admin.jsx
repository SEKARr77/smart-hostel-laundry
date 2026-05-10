import React, { useContext, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { StateContext } from './App';
import { db } from './firebase';
import { doc, updateDoc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { Users, Clock, History, LayoutDashboard, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, Share2, RefreshCw, ShieldCheck } from 'lucide-react';

export default function Admin() {
    const { appState } = useContext(StateContext);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
    const [passwordInput, setPasswordInput] = useState('');
    const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
    const [error, setError] = useState('');

    const todayStr = new Date().toLocaleDateString('en-CA');
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [allLogs, setAllLogs] = useState({});
    const [currentMonth, setCurrentMonth] = useState(new Date(new Date().setDate(1)));

    // Handle Authentication
    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');

        if (authMode === 'signup') {
            if (passwordInput.length < 4) return setError('Password too short (min 4 chars)');
            const stateRef = doc(db, 'system', 'state');
            await setDoc(stateRef, {
                superAdminPassword: passwordInput,
                staffStatus: 'Absent',
                lastUpdated: Date.now()
            }, { merge: true });
            alert("Admin Access Initialized Successfully!");
            setIsAuthenticated(true);
        } else if (authMode === 'login') {
            if (passwordInput === appState.superAdminPassword) {
                setIsAuthenticated(true);
            } else {
                setError('Invalid Admin Password');
            }
        }
    };

    // Auto-detect signup mode if no password exists
    useEffect(() => {
        if (!appState.superAdminPassword) {
            setAuthMode('signup');
        } else {
            setAuthMode('login');
        }
    }, [appState.superAdminPassword]);

    // ... (rest of the original Admin logic)
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchLogs = async () => {
            const q = query(collection(db, 'registrations'), where('date', '==', selectedDate));
            const snap = await getDocs(q);
            const logs = snap.docs.map(d => d.data()).sort((a, b) => b.timestamp - a.timestamp);
            setAllLogs(prev => ({ ...prev, [selectedDate]: logs }));
        };
        fetchLogs();
    }, [selectedDate, isAuthenticated]);

    // QR Session Rotation Logic
    useEffect(() => {
        if (!isAuthenticated) return;
        const checkSession = async () => {
            const stateRef = doc(db, 'system', 'state');
            const snap = await getDoc(stateRef);
            if (!snap.exists() || !snap.data().lastUpdated || (Date.now() - snap.data().lastUpdated > 86400000)) {
                rotateQr();
            }
        };
        checkSession();
    }, [isAuthenticated]);

    const rotateQr = async () => {
        const stateRef = doc(db, 'system', 'state');
        await setDoc(stateRef, {
            currentQrSession: crypto.randomUUID(),
            staffStatus: appState.staffStatus || 'Absent',
            lastUpdated: Date.now()
        }, { merge: true });
    };

    const toggleStaffStatus = async () => {
        const newStatus = appState.staffStatus === 'Present' ? 'Absent' : 'Present';
        const stateRef = doc(db, 'system', 'state');
        await updateDoc(stateRef, { staffStatus: newStatus });
    };

    const [newPass, setNewPass] = useState('');
    const updateAdminPassword = async (e) => {
        e.preventDefault();
        if (!newPass) return;
        const stateRef = doc(db, 'system', 'state');
        await updateDoc(stateRef, { superAdminPassword: newPass });
        setNewPass('');
        alert("Super Admin Password Updated!");
    };

    const downloadQR = () => {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = 'Laundry_QR.png';
        link.click();
    };

    const shareQR = async () => {
        const canvas = document.getElementById('qr-canvas');
        if (!canvas) return;
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'Laundry_QR.png', { type: 'image/png' });
            if (navigator.share) {
                await navigator.share({ files: [file], title: 'Share QR' });
            }
        });
    };

    const currentUrl = window.location.origin;
    const qrUrl = `${currentUrl}/student/register?sessionId=${appState.currentQrSession}`;
    const selectedLogs = (selectedDate === todayStr ? appState.dailyLogs[todayStr] : allLogs[selectedDate]) || [];

    // Calendar logic
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const renderCalendar = () => {
        const days = [];
        for (let i = 0; i < firstDayIndex; i++) days.push(<div key={`e-${i}`} className="calendar-day empty"></div>);
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i).toLocaleDateString('en-CA');
            const isSelected = selectedDate === dateStr;
            const isToday = todayStr === dateStr;
            days.push(
                <div key={i} className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDate(dateStr)}>
                    <span>{i}</span>
                </div>
            );
        }
        return <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>{days}</div>;
    };

    if (!isAuthenticated) {
        return (
            <div className="container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                            {authMode === 'signup' ? 'Set Admin Access' : 'Admin Login'}
                        </h1>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                            {authMode === 'signup' ? 'Initialize the super admin security.' : 'Access restricted to hostel staff.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="text-muted" style={{ fontSize: '0.75rem' }}>Admin Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="••••••••"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600 }}>{error}</p>}

                        <button className="btn btn-primary" style={{ width: '100%' }}>
                            {authMode === 'signup' ? 'Create Account' : 'Enter Portal'}
                        </button>
                    </form>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
                        {authMode === 'signup' && (
                            <button className="text-muted" onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Back to Login</button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in">
            <div className="portal-header">
                <div>
                    <h1>Admin Portal <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>(Firebase Cloud)</span></h1>
                    <p className="text-muted">High-security Hostel Laundry Management</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="btn" onClick={() => setIsAuthenticated(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)' }}>Logout</button>
                    <LayoutDashboard size={32} color="var(--primary)" />
                </div>
            </div>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={20} color="var(--text-muted)" />
                        <span className="text-muted">Today's Registrations</span>
                    </div>
                    <span className="stat-value">{appState.registeredCount}</span>
                </div>

                <div className="card stat-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} color="var(--text-muted)" />
                        <span className="text-muted">Staff Status</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span className={`badge ${appState.staffStatus === 'Present' ? 'badge-present' : 'badge-absent'}`}>
                            {appState.staffStatus}
                        </span>
                        <button className="btn btn-primary" onClick={toggleStaffStatus} style={{ padding: '0.5rem 1rem' }}>Toggle</button>
                    </div>
                </div>
            </div>

            <div className="admin-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card qr-container" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--background)' }}>QR Access</h3>
                            <button onClick={rotateQr} className="btn-icon" style={{ color: 'var(--background)' }} title="Rotate Manually"><RefreshCw size={16} /></button>
                        </div>
                        <div style={{ background: 'white', padding: '0.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <QRCodeCanvas id="qr-canvas" value={qrUrl} size={160} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                            <button onClick={downloadQR} className="btn" style={{ flex: 1, padding: '0.5rem', background: 'var(--surface-hover)', fontSize: '0.8rem' }}>
                                <Download size={14} /> Download
                            </button>
                            <button onClick={shareQR} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}>
                                <Share2 size={14} /> Share
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ margin: '0 0 1rem 0' }}>Security Settings</h3>
                        <form onSubmit={updateAdminPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Set/Update Super Admin Password for student updates.</p>
                            <input
                                type="password"
                                className="input"
                                placeholder="New Password"
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                style={{ background: 'white' }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>
                                Save Password
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <CalendarIcon size={20} color="var(--primary)" />
                            <h3 style={{ margin: 0 }}>History</h3>
                        </div>
                        {renderCalendar()}
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Log: {selectedDate}</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Roll</th><th>Name</th><th>Time</th></tr>
                            </thead>
                            <tbody>
                                {selectedLogs.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center text-muted">No data found.</td></tr>
                                ) : (
                                    selectedLogs.map((log, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 600 }}>{log.rollNumber}</td>
                                            <td>{log.name}</td>
                                            <td>{log.time}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
