import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminSite() {
    // 1. STATE DECLARATIONS
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    
    // 2. LOGIC FUNCTIONS
    const fetchUsers = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }

        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err.response?.data);
            if (err.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // 3. EFFECTS
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // 4. EVENT HANDLERS
    const handleRegister = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        setLoading(true);
        setMessage('');
        
        try {
            await axios.post('http://127.0.0.1:8000/api/admin/create-user', 
                { name, email, password, role }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('User created successfully!');
            setName(''); setEmail(''); setPassword('');
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error(err);
            setMessage('Error registering user.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // 5. RENDER
    return (
        <div style={styles.appWrapper}>
            <aside style={styles.sidebar}>
                <div style={styles.logo}>BRUH<span style={{color: '#10b981'}}>Admin</span></div>
                <nav style={styles.nav}>
                    <div style={styles.navItem} onClick={() => navigate('/dashboard')}>User Dashboard</div>
                    
                    <div style={{...styles.navItem, backgroundColor: '#1e293b', color: '#10b981'}}>User Management</div>
                    
                    {/* FIXED: Changed StyleSheet to styles */}
                    <div style={styles.navItem}>System Log</div>
                    
                    {/* FIXED: Changed StyleSheet to styles */}
                    <div style={{...styles.navItem, marginTop: 'auto', color: '#f87171'}} onClick={handleLogout}>Logout</div>
                </nav>
            </aside>

            <main style={styles.mainArea}>
                <header style={styles.topHeader}>
                    <h2 style={styles.pageTitle}>Admin Management</h2>
                    {message && <span style={styles.successMsg}>{message}</span>}
                </header>
                
                <div style={styles.contentGrid}>
                    <section style={styles.formSection}>
                        <form onSubmit={handleRegister} style={styles.card}>
                            <h3 style={styles.cardHeader}>Add New User</h3>
                            
                            <label style={styles.label}>Full Name</label>
                            <input type="text" placeholder='Timmy' value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
                            
                            <label style={styles.label}>Email Address</label>
                            <input type="email" placeholder='timmy@gmail.com' value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input}/>

                            <label style={styles.label}>Password</label>
                            <input type="password" placeholder='••••••••' value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input}/>

                            <label style={styles.label}>System Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                                <option value="user">User</option>
                                <option value="admin">Administrator</option>
                            </select>

                            {/* FIXED: Background color syntax */}
                            <button 
                                type='submit' 
                                disabled={loading} 
                                style={{
                                    ...styles.submitBtn, 
                                    backgroundColor: loading ? '#064e3b' : '#10b981', 
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {loading ? 'Creating User...' : 'Create User'}
                            </button>
                        </form>
                    </section>

                    <section style={styles.tableSelection}>
                        <div style={styles.card}>
                            <h3 style={styles.cardHeader}>Registered Users ({users.length})</h3>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeaderRow}>
                                        <th style={styles.th}>Name</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={styles.tableRow}>
                                        <td style={styles.td}>{u.name}</td>
                                        <td style={styles.td}>{u.email}</td>
                                        <td style={styles.td}>
                                            {/* FIXED: Added toLowerCase() to handle 'Admin' vs 'admin' */}
                                            <span style={(u.role || '').toLowerCase() === 'admin' ? styles.adminBadge : styles.userBadge}>
                                                {u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

const styles = {
    appWrapper: { display: 'flex', height: '100vh', backgroundColor: '#0f172a', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    sidebar: { width: '250px', backgroundColor: '#0b0e11', borderRight: '1px solid #1f2937', padding: '24px', display: 'flex', flexDirection: 'column' },
    logo: { fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '40px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    navItem: { padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', fontWeight: '500' },
    mainArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topHeader: { padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111418', borderBottom: '1px solid #1f2937' },
    pageTitle: { fontSize: '20px', fontWeight: '700' },
    successMsg: { color: '#10b981', fontWeight: '600', fontSize: '0.9rem' },
    contentGrid: { padding: '40px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', overflowY: 'auto' },
    card: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' },
    cardHeader: { margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: '700', color: '#10b981' },
    label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' },
    input: { width: '100%', boxSizing: 'border-box', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
    submitBtn: { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderRow: { textAlign: 'left', borderBottom: '1px solid #334155' },
    th: { padding: '12px 8px', color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase' },
    tableRow: { borderBottom: '1px solid #334155' },
    td: { padding: '15px 8px', fontSize: '0.9rem' },
    adminBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' },
    userBadge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' },
};