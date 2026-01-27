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
            const token = res.data.token;
            if (token && res.data.user.role){
                localStorage.setItem('token', token);
                localStorage.setItem('role', res.data.user.role);
                navigate('/dashboard');
            } else {
                alert("Invalid Email or Password. Please contact Admin.");
            }

            // 2. Redirect based on role
            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err)
            alert("Invalid Email or Password. Please contact Admin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={loginStyles.wrapper}>
            <form style={loginStyles.card} onSubmit={handleLogin}>
                <h2 style={{textAlign: 'center', color: '#2c3e50'}}>Login</h2>
                <input 
                    type="email" placeholder="Email" required style={loginStyles.input}
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <input 
                    type="password" placeholder="Password" required style={loginStyles.input}
                    onChange={(e) => setPassword(e.target.value)} 
                />
                <button type="submit" disabled={loading} style={loginStyles.button}>
                    {loading ? 'Authenticating...' : 'Sign In'}
                </button>
                <p style={{textAlign: 'center', marginTop: '15px', color: '#7f8c8d', fontSize: '0.9rem'}}>
                    Forgot password? Contact your Admin.
                </p>
            </form>
        </div>
    );
}

const loginStyles = {
    wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#ecf0f1' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
    input: { display: 'block', width: '100%', padding: '12px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
    button: { width: '100%', padding: '12px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }
};