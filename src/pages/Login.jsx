import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/login', { email, password });
            
            console.log("SERVER RESPONSE:", res.data); // Debugging

            // SAFETY NET: Check for 'token' OR 'access_token'
            const token = res.data.token || res.data.access_token;
            const user = res.data.user || res.data.data;

            if (token) {
                localStorage.setItem('token', token);
                if (user?.role) localStorage.setItem('role', user.role);
                
                // Redirect based on role
                if (user?.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                alert("Login successful, but no token received.");
            }
        } catch (err) {
            console.error(err);
            alert("Invalid credentials or server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0b1120', fontFamily: 'sans-serif' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: '#1e293b', borderRadius: '24px', border: '1px solid #334155' }}>
                <h1 style={{ color: '#fff', marginBottom: '8px', fontSize: '2.5rem', fontWeight: '800' }}>BRUH<span style={{color: '#10b981'}}>Task</span></h1>
                <p style={{ color: '#94a3b8', marginBottom: '32px' }}>Sign in to manage your board</p>
                
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <input 
                        type="email" placeholder="Email" required 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', boxSizing: 'border-box' }}
                        onChange={e => setEmail(e.target.value)} 
                    />
                    <input 
                        type="password" placeholder="Password" required 
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', boxSizing: 'border-box' }}
                        onChange={e => setPassword(e.target.value)} 
                    />
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}