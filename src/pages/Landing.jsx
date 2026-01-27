import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.logo}>BRUH<span style={{color: '#2ecc71'}}>Todo Lists</span></div>
      </nav>

      <header style={styles.hero}>
        <h1 style={styles.title}>Manage your tasks with <br/>precision and ease.</h1>
        <button style={styles.mainBtn} onClick={() => navigate('/login')}>
            Get Started Now
        </button>
      </header>

      <footer style={styles.footer}>
        © 2026 Todo_list_Management System
      </footer>
    </div>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 10%', backgroundColor: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', color: '#333' },
  navBtn: { padding: '8px 20px', backgroundColor: 'transparent', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '5px', cursor: 'pointer' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px' },
  title: { fontSize: '3rem', color: '#2c3e50', lineHeight: '1.2' },
  subtitle: { fontSize: '1.1rem', color: '#7f8c8d', maxWidth: '600px', margin: '20px 0 40px' },
  mainBtn: { padding: '15px 40px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' },
  footer: { padding: '20px', textAlign: 'center', color: '#999', fontSize: '0.9rem' }
};