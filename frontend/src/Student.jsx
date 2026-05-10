import React, { useContext, useState, useEffect } from 'react';
import { StateContext } from './App';
import { Users, UserCircle2, Save, UserCheck, ShieldCheck } from 'lucide-react';

export default function Student() {
    const { appState } = useContext(StateContext);
    const [profile, setProfile] = useState({ studentId: '', rollNumber: '', name: '' });
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const savedProfile = localStorage.getItem('studentProfile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
            setIsSaved(true);
        }
    }, []);

    const saveProfile = (e) => {
        e.preventDefault();
        localStorage.setItem('studentProfile', JSON.stringify(profile));
        setIsSaved(true);
    };

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '800px', alignSelf: 'center', marginTop: '5vh' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>

                {/* Status Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card text-center" style={{ padding: '2rem' }}>
                        <UserCircle2 size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto', display: 'block' }} />
                        <h2>Portal Status</h2>
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
                        <h2 style={{ margin: 0 }}>Student Profile</h2>
                    </div>

                    {isSaved ? (
                        <div className="animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{profile.name}</p>
                                    <p className="text-muted" style={{ margin: 0 }}>{profile.rollNumber.toUpperCase()}</p>
                                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>ID: {profile.studentId}</p>
                                </div>
                                <UserCheck color="var(--secondary)" size={32} />
                            </div>
                            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                Automatic registration is active! Scan the Admin QR code to register instantly.
                            </p>
                            <button className="btn" onClick={() => setIsSaved(false)} style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Setup your profile once for instant 1-tap registration.</p>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Student ID</label>
                                <input type="text" className="input" placeholder="e.g. S12345" value={profile.studentId} onChange={e => setProfile({ ...profile, studentId: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Roll Number</label>
                                <input type="text" className="input" placeholder="e.g. 21CS01" value={profile.rollNumber} onChange={e => setProfile({ ...profile, rollNumber: e.target.value })} required style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div>
                                <label className="text-muted" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
                                <input type="text" className="input" placeholder="Full Name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                <Save size={18} /> Save & Activate
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="card text-center" style={{ marginTop: '2rem', padding: '1rem' }}>
                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                    *After saving, just scan the Dynamic QR at the counter to be registered immediately.
                </p>
            </div>
        </div>
    );
}
