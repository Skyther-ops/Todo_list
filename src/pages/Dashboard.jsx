import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function Dashboard() {
    const [task, setTask] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);


    // MOVE token retrieval inside the functions to ensure it's always fresh
 const fetchTask = useCallback(async () => {
    const activeToken = localStorage.getItem('token');
    if (!activeToken) {
        window.location.href = "/login";
        return;
    }

    try {
            setLoading(true); // Start loading
            const res = await axios.get('http://127.0.0.1:8000/api/tasks', {
                headers: { Authorization: `Bearer ${activeToken}` }
            });
            setTask(res.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false); // Stop loading regardless of success or failure
        }
    }, []); 

    // Simplified useEffect: Just call the callback
    useEffect(() => {
        fetchTask();
    }, [fetchTask]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const activeToken = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('due_date', dueDate);
        if (image) formData.append('image', image);

        try {
            await axios.post('http://127.0.0.1:8000/api/tasks', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${activeToken}`
                }
            });
            alert('Task added!');
            setTitle(''); setDescription(''); setDueDate(''); setImage(null);
            fetchTask(); // This now correctly refreshes the UI
        } catch (err) {
            console.error('Error adding task:', err.response?.data);
            alert('Error adding task: ' + (err.response?.data?.message || 'Check console'));
        }
    };

    // Helper to render the Kanban Columns
    const renderColumn = (status, label, color, bgColor) => (
        <div style={styles.column}>
            <div style={{ ...styles.columnHeader, borderLeft: `5px solid ${color}` }}>
                <h3 style={styles.columnTitle}>{label}</h3>
                <span style={styles.countBadge}>{task.filter(t => t.status === status).length}</span>
            </div>
            {task.filter(t => t.status === status).map(t => (
                <TaskCard key={t.id} t={t} backgroundColor={bgColor} />
            ))}
        </div>
    );

    const TaskCard = ({ t, backgroundColor }) => (
        <div style={{ ...styles.card, backgroundColor }}>
            <div style={styles.cardHeader}>
                <span style={styles.todayTag}>★ Today</span>
                <button style={styles.moreOptions}>···</button>
            </div>
            <h4 style={styles.cardTitle}>{t.title}</h4>
            <p style={styles.cardDesc}>{t.description}</p>
            <p style={styles.cardTime}>
                {new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            {t.image_path && (
                <img 
                    src={`http://127.0.0.1:8000/storage/${t.image_path}`} 
                    style={styles.cardImage} 
                    alt="task" 
                />
            )}
            <div style={styles.cardFooter}>
                <img src="https://via.placeholder.com/25" style={styles.miniAvatar} alt="avatar" />
            </div>
        </div>
    );
    // Add this right before your "return (" line
    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh', 
                backgroundColor: '#F9FAFB' 
            }}>
                <h2 style={{ color: '#4B5563', fontFamily: "'Inter', sans-serif" }}>
                    Syncing with Database...
                </h2>
            </div>
        );
    }


    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.mainTitle}>Todo_list</h1>
                <img src="https://via.placeholder.com/40" style={styles.avatar} alt="user" />
            </header>

            <form onSubmit={handleSubmit} style={styles.formContainer}>
                <h3 style={{ marginBottom: '15px' }}>Create New Task</h3>
                <input type="text" placeholder="Task Title" value={title} onChange={e => setTitle(e.target.value)} required style={styles.input} />
                <textarea placeholder="Add a detailed description..." value={description} onChange={e => setDescription(e.target.value)} style={{ ...styles.input, minHeight: '80px' }} />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Due Date & Time</label>
                        <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={styles.input} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Attach Image</label>
                        <input type="file" onChange={e => setImage(e.target.files[0])} style={styles.fileInput} />
                    </div>
                </div>
                <button type="submit" style={styles.addBtn}>Save as new Task</button>
            </form>

            <div style={styles.board}>
                {renderColumn('todo', 'Todo', '#FFD54F', '#FFF9C4')}
                {renderColumn('in-progress', 'In Progress', '#64B5F6', '#E3F2FD')}
                {renderColumn('completed', 'Completed', '#81C784', '#E8F5E9')}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '40px', backgroundColor: '#F9FAFB', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    mainTitle: { fontSize: '2.2rem', color: '#111827', fontWeight: '800' },
    avatar: { borderRadius: '50%', border: '2px solid #ddd' },
    board: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
    column: { flex: 1, backgroundColor: '#F3F4F6', padding: '16px', borderRadius: '20px', minHeight: '600px' },
    columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '12px', marginBottom: '20px' },
    columnTitle: { margin: 0, fontSize: '1.1rem', color: '#4B5563', fontWeight: '600' },
    countBadge: { background: '#E5E7EB', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem' },
    
    // Card Styles
    card: { padding: '20px', borderRadius: '24px', marginBottom: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    todayTag: { fontSize: '0.75rem', fontWeight: 'bold', color: '#B45309' },
    moreOptions: { border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' },
    cardTitle: { fontSize: '1.2rem', margin: '0 0 8px 0', color: '#111827' },
    cardDesc: { fontSize: '0.9rem', color: '#4B5563', marginBottom: '12px' },
    cardTime: { fontSize: '0.85rem', color: '#6B7280', fontWeight: '600' },
    cardImage: { width: '100%', borderRadius: '15px', marginTop: '12px' },
    miniAvatar: { borderRadius: '50%', marginTop: '10px' },

    // Form Styles
    formContainer: { backgroundColor: '#fff', padding: '24px', borderRadius: '24px', marginBottom: '40px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' },
    input: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '12px', boxSizing: 'border-box' },
    label: { display: 'block', fontSize: '0.8rem', color: '#6B7280', marginBottom: '6px' },
    addBtn: { width: '100%', padding: '14px', backgroundColor: '#FF8A65', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }
};