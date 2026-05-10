import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { StateContext } from './App';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
    const { appState } = useContext(StateContext);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('sessionId') || '';

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [regData, setRegData] = useState(null);

    const performRegistration = useCallback(async (profile) => {
        if (!sessionId) {
            setStatus('error');
            setMessage('Invalid session. Please scan the QR code again.');
            return;
        }

        // Check for Maximum capacity
        if (appState.registeredCount >= 150) {
            setStatus('error');
            setMessage('Today reached maximum counts (150/150). System locked.');
            return;
        }

        setStatus('loading');
        try {
            const todayStr = new Date().toLocaleDateString('en-CA');

            // ATOMIC DUPLICATE CHECK: 
            // We use a specific ID (YYYY-MM-DD_ROLLNUMBER) to prevent multiple records for the same day.
            const uniqueId = `${todayStr}_${profile.rollNumber.toUpperCase()}`;
            const docRef = doc(db, 'registrations', uniqueId);

            // check if user already exists for today
            const existingDoc = await getDoc(docRef);
            if (existingDoc.exists()) {
                setStatus('error');
                setMessage('Duplicate Register: You have already registered for today!');
                return;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            await setDoc(docRef, {
                studentId: profile.studentId,
                rollNumber: profile.rollNumber.toUpperCase(),
                name: profile.name,
                date: todayStr,
                time: timeStr,
                timestamp: Date.now(),
                sessionId: sessionId
            });

            setStatus('success');
            setRegData({ date: todayStr, time: timeStr });

        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Transaction Error. Please try again.');
        }
    }, [sessionId]);

    useEffect(() => {
        const savedProfile = localStorage.getItem('studentProfile');
        if (savedProfile) {
            performRegistration(JSON.parse(savedProfile));
        } else {
            setTimeout(() => navigate('/student'), 3000);
            setStatus('error');
            setMessage('No profile found. Redirecting...');
        }
    }, [performRegistration, navigate]);

    if (status === 'success' && regData) {
        return (
            <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div className="card text-center" style={{ padding: '3rem 2rem', borderTop: '4px solid var(--secondary)', maxWidth: '400px', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle2 size={64} fill="var(--secondary)" color="white" style={{ margin: '0 0 1.5rem 0', display: 'inline-block' }} />
                    <h2 style={{ color: 'var(--secondary)' }}>Successfully Registered</h2>
                    <p className="text-muted">Cloud entry confirmed</p>
                    <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginTop: '2rem' }}>
                        <p style={{ fontWeight: 600 }}>{regData.date}</p>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{regData.time}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <div className="card text-center" style={{ maxWidth: '400px', width: '100%', padding: '3rem 2rem' }}>
                {status === 'loading' ? (
                    <>
                        <Loader2 className="animate-spin" size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2>Verifying ID...</h2>
                        <p className="text-muted">Checking for duplicates</p>
                    </>
                ) : (
                    <>
                        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ color: 'var(--danger)' }}>Failed</h2>
                        <p className="text-muted" style={{ marginTop: '1rem', fontWeight: 500 }}>{message}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/student')} style={{ marginTop: '2rem', width: '100%' }}>Go Back</button>
                    </>
                )}
            </div>
        </div>
    );
}
