import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
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

        setStatus('loading');
        try {
            const todayStr = new Date().toLocaleDateString('en-CA');

            // Check for duplicate today in Firestore
            const q = query(
                collection(db, 'registrations'),
                where('date', '==', todayStr),
                where('rollNumber', '==', profile.rollNumber.toUpperCase()),
                limit(1)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                setStatus('error');
                setMessage('Duplicate: You have already registered today.');
                return;
            }

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            await addDoc(collection(db, 'registrations'), {
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
            setMessage('Cloud Storage Error. Check your connection.');
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
                <div className="card text-center" style={{ padding: '3rem 2rem', borderTop: '4px solid var(--secondary)', maxWidth: '400px' }}>
                    <CheckCircle2 size={64} fill="var(--secondary)" color="white" style={{ margin: '0 0 1.5rem 0', display: 'inline-block' }} />
                    <h2 style={{ color: 'var(--secondary)' }}>Registered in Cloud</h2>
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
                        <h2>Uploading to Cloud...</h2>
                    </>
                ) : (
                    <>
                        <AlertCircle size={48} color="var(--danger)" style={{ margin: '0 auto 1.5rem auto' }} />
                        <h2 style={{ color: 'var(--danger)' }}>Failed</h2>
                        <p className="text-muted">{message}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/student')} style={{ marginTop: '2rem', width: '100%' }}>Go Back</button>
                    </>
                )}
            </div>
        </div>
    );
}
