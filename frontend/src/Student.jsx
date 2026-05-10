import React, { useContext, useState, useEffect } from 'react';
import { StateContext } from './App';
import { Users, UserCircle2, Save, UserCheck, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Student() {
    const { appState } = useContext(StateContext);
    const [profile, setProfile] = useState({ studentId: '', rollNumber: '', name: '' });
    const [isSaved, setIsSaved] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const savedProfile = localStorage.getItem('studentProfile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
            setIsSaved(true);
        }
    }, []);

    const saveProfile = (e) => {
        e.preventDefault();
        if (!profile.studentId || !profile.rollNumber || !profile.name) {
            alert("Please fill all details!");
            return;
        }

        try {
            localStorage.setItem('studentProfile', JSON.stringify(profile));
            setIsSaved(true);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) {
            alert("Local storage is disabled. Please enable it to save your profile.");
        }
    };

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '800px', alignSelf: 'center', marginTop: '5vh' }}>
            {showSuccess && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--secondary)', color: 'white', padding: '1rem 2rem', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <CheckCircle size={20} /> Profile Activated Successfully!
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>

                {/* Status Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card text-center" style={{ padding: '2rem' }}>
                        <UserCircle2 size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                        <h2 style={{ fontSize: '1.25rem' }}>Portal Status</h2>
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Staff Status</p>
                                <span className={`badge ${appState.staffStatus === 'Present' ? 'badge-present' : 'badge-absent'}`}>
                                    {appState.staffStatus}
                                </span>
                            </div>
                            <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                                <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Live Count</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{appState.registeredCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Column */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <ShieldCheck color="var(--primary)" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Student Profile</h2>
                    </div>

                    {isSaved ? (
                        <div className="animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>{profile.name}</p>
                                    <p className="text-muted" style={{ margin: 0, fontWeight: 500 }}>{profile.rollNumber.toUpperCase()}</p>
                                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>ID: {profile.studentId}</p>
                                </div>
                                <div style={{ background: 'var(--secondary)', color: 'white', padding: '0.5rem', borderRadius: '50%' }}>
                                    <UserCheck size={24} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
                                <div style={{ width: '8px', height: '8px', background: 'var(--secondary)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                                <p style={{ fontSize: '0.875rem', margin: 0, fontWeight: 600 }}>Automatic Mode Active</p>
                            </div>
                            <button className="btn" onClick={() => setIsSaved(false)} style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.8rem', width: '100%' }}>
                                Edit My Details
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Setup your profile once to enable 1-tap cloud registration.</p>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem' }}>Student ID</label>
                                <input type="text" className="input" placeholder="e.g. S1024" value={profile.studentId} onChange={e => setProfile({ ...profile, studentId: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem' }}>Roll Number</label>
                                <input type="text" className="input" placeholder="e.g. 21CS01" value={profile.rollNumber} onChange={e => setProfile({ ...profile, rollNumber: e.target.value })} required style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem' }}>Full Name</label>
                                <input type="text" className="input" placeholder="Full Name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
                                <Save size={18} /> Save & Activate
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="card text-center" style={{ marginTop: '2rem', padding: '1rem' }}>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                    *Privacy Note: Your profile details are stored only on this phone for instant registration.
                </p>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
