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
    const token = localStorage.getItem('token');

    // 2. LOGIC FUNCTIONS (Declared before useEffect)
    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err.response?.data);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // 3. EFFECTS (Synchronizes with the external PostgreSQL system)
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // 4. EVENT HANDLERS
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:8000/api/admin/create-user', 
                { name, email, password, role }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage('User created successfully!');
            setName(''); setEmail(''); setPassword('');
            fetchUsers(); // Refresh the list from the database
        } catch (err) {
            console.error(err)
            setMessage('Error registering user.');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // 5. RENDER
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Admin Management</h2>
                <button onClick={handleLogout} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Logout</button>
            </div>

            {message && <p style={{ color: 'green' }}>{message}</p>}

            <form onSubmit={handleRegister} style={styles.form}>
                <h3>Add New User</h3>
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />
                <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type='submit' style={styles.submitBtn}>Create User</button>
            </form>

            <hr />

            <h3>Registered Users</h3>
            {loading ? <p>Syncing with PostgreSQL...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px 0' }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

const styles = {
    form: { marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' },
    input: { display: 'block', width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' },
    submitBtn: { width: '100%', padding: '10px', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
};