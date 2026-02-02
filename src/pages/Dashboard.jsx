import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// --- Constants ---
const API_BASE = 'http://127.0.0.1:8000/api/tasks'; // run with laravel
const DRAFT_KEY = 'BRUH';// for saving draft so when user accidentally refresh the value is still there

// --- Global CSS for Scrollbars & Inputs ---
const GlobalStyles = () => (
    <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0f1316; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        /* Smooth Input Focus */
        .wiz-input:focus {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
            outline: none;
        }
    `}</style>
);

export default function Dashboard() {
    const navigate = useNavigate();

    // --- State ---
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentView, setCurrentView] = useState('board'); 
    
    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false); // loading when user is creating 

    // --- OPTIMIZATION: Memoize Task Lists ---
    const taskGroups = useMemo(() => {// skips filtering  soo the app runs faster
        //return an Object containing 4 separate lists
        return {
            todo: tasks.filter(t => t.status === 'todo'),
            inProgress: tasks.filter(t => t.status === 'in-progress'),
            completed: tasks.filter(t => t.status === 'completed'),
            pinned: tasks.filter(t => t.is_pinned)
        };
        // Dependancy Array
        //trigger if the variable change
        // yes: run code filter
        //no: skip the code above adn give result
    }, [tasks]);

    // --- FORM STATE ---
    const [formData, setFormData] = useState(() => {
        //check if anything save in the Draft key that exist in the local Storage
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        // If Found data
        if (savedDraft) {
            try {
                //converting the string value to object
                //local storage only saves the string. use JSON.parse to turn the string to Js object
                const parsed = JSON.parse(savedDraft);
                //check if the task draft its new
                //check parse.id if id is null then an edit session for the old task, ignore it and restore draft to new task
                if (parsed.id === null) return { ...parsed, image: null };// restore the data but reset image because it cannot save in local storage
        //user must upload the image again for security ans technical reason
            } catch (e) { console.error(e); }
        }
        //if storage empty, or data was bad, or it was an edit draft
        //return a perfect clean, empty form
        return { id: null, title: '', description: '', due_date: '', priority: 'Low', image: null };
    });

    // Auto-Save Draft
    useEffect(() => {
        if (formData.id === null) {
            const draftToSave = { ...formData, image: null };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draftToSave));
        }
    }, [formData]);

    // --- Helpers ---
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : null;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // --- API Calls ---

    const fetchTasks = useCallback(async () => {
        //check if use have a token. if not kick to login
        const headers = getAuthHeader();
        if (!headers) { navigate('/login'); return; }
        
        setLoading(true);// turn on loading
        try {
            //calling for laravel
            const res = await axios.get(API_BASE, { headers });
            //data cleaning 
            //postgresql might send 'is_pinned' as 0 or 1
            // the '!!' is to convert 1 to true and 0 to false.
            //ensure React always get proper boolean
            const cleanedTasks = (res.data || []).map(t => ({ ...t, is_pinned: !!t.is_pinned }));
            setTasks(cleanedTasks);
        } catch (err) { 

            // shows 401, the token is old. Logout
            console.error(err);
            if (err.response?.status === 401) handleLogout();
        } finally { 
            setLoading(false); //turn off spinner if failed
        }
    }, [navigate]);
    //run fetch Task function
    useEffect(() => { fetchTasks(); }, [fetchTasks]);
    //update any any field in form saving from writing 10 function
    const handleFormChange = (k, v) => setFormData(p => ({ ...p, [k]: v }));
    
    const resetForm = () => {
        localStorage.removeItem(DRAFT_KEY);
        setFormData({ id: null, title: '', description: '', due_date: '', priority: 'Low', image: null });
        setShowModal(false); 
        setShowEditModal(false);
        setIsCreating(false);
    };

    const togglePin = async (task) => {
        const newPinnedState = !task.is_pinned;
        
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_pinned: newPinnedState } : t));
        try {
            await axios.put(`${API_BASE}/${task.id}`, { is_pinned: newPinnedState }, { headers: getAuthHeader() });
        } catch (err) {console.error(err); fetchTasks(); }
    };

    const handleCreate = async (e) => {
        e.preventDefault(); 
        setIsCreating(true);
        const headers = getAuthHeader();
        const data = new FormData();
        Object.keys(formData).forEach(k => { if (formData[k] !== null) data.append(k, formData[k]); });

        try {
            const res = await axios.post(API_BASE, data, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });
            setTasks(p => [...p, { ...res.data, is_pinned: false }]);
            resetForm(); 
        } catch (err) { console.error(err); alert("Failed to create task"); } 
        finally { setIsCreating(false); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API_BASE}/${formData.id}`, formData, { headers: getAuthHeader() });
            setTasks(p => p.map(t => t.id === formData.id ? { ...res.data, is_pinned: t.is_pinned } : t)); 
            resetForm();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`${API_BASE}/${id}`, { headers: getAuthHeader() });
            setTasks(p => p.filter(t => t.id !== id));
        } catch (err) { console.error(err); }
    };

    const moveTaskStatus = async (task, newStatus) => {
        setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        try {
            await axios.put(`${API_BASE}/${task.id}`, { status: newStatus }, { headers: getAuthHeader() });
        } catch (err) {console.error(err); fetchTasks(); }
    };

    const openEditModal = (t) => {
        setFormData({ 
            id: t.id, title: t.title, description: t.description || '', 
            due_date: t.due_date ? t.due_date.substring(0, 16) : '', 
            priority: t.priority, image: null 
        });
        setShowEditModal(true);
    };

    // --- Render ---
    return (
        <div style={styles.appWrapper}>
            <GlobalStyles />
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.logo}>BRUH</div>
                <nav style={styles.nav}>
                    <NavItem active={currentView === 'board'} onClick={() => setCurrentView('board')}>Dashboard</NavItem>
                    <NavItem active={currentView === 'calendar'} onClick={() => setCurrentView('calendar')}>Calendar</NavItem>
                    <NavItem>Settings</NavItem>
                    <div style={{ ...styles.navItem, marginTop: 'auto', color: '#f87171' }} onClick={handleLogout}>Logout</div>
                </nav>
            </aside>

            {/* Main Area */}
            <main style={styles.mainArea}>
                <header style={styles.topHeader}>
                    <h2 style={styles.pageTitle}>{currentView === 'board' ? 'Board View' : 'Calendar View'}</h2>
                    <button style={styles.createBtn} onClick={() => setShowModal(true)}>
                        {formData.title ? 'Resume Draft' : '+ Create Task'}
                    </button>
                </header>

                <div style={styles.contentGrid}>
                    <div style={styles.mainContentContainer}>
                        {loading ? <div style={styles.loading}>Loading Tasks...</div> : (
                            currentView === 'board' ? (
                                <div style={styles.boardContainer}>
                                    <Column title="To Do" status="todo" tasks={taskGroups.todo} onPin={togglePin} onEdit={openEditModal} onDelete={handleDelete} onMove={moveTaskStatus} />
                                    <Column title="In Progress" status="in-progress" tasks={taskGroups.inProgress} onPin={togglePin} onEdit={openEditModal} onDelete={handleDelete} onMove={moveTaskStatus} />
                                    <Column title="Done" status="completed" tasks={taskGroups.completed} onPin={togglePin} onEdit={openEditModal} onDelete={handleDelete} onMove={moveTaskStatus} />
                                </div>
                            ) : (
                                <CalendarView tasks={tasks} />
                            )
                        )}
                    </div>

                    <aside style={styles.pinnedSidebar}>
                        <div style={styles.pinnedHeaderArea}>
                            <h3 style={styles.pinnedHeader}>📌 Pinned ({taskGroups.pinned.length})</h3>
                        </div>
                        <div style={styles.pinnedList}>
                            {taskGroups.pinned.length === 0 ? (
                                <div style={styles.emptyPin}>
                                    <span style={{fontSize: '20px', display:'block', marginBottom:'10px'}}>🕸️</span>
                                    No pinned tasks.<br/>Click the 📌 icon to pin.
                                </div>
                            ) : (
                                taskGroups.pinned.map(task => (
                                    <PinnedCard key={task.id} task={task} onUnpin={() => togglePin(task)} />
                                ))
                            )}
                        </div>
                    </aside>
                </div>
            </main>

            {/* IMPROVED MODAL */}
            {(showModal || showEditModal) && (
                <ModalOverlay onClose={resetForm}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3>{showModal ? 'Create New Task' : 'Edit Task'}</h3>
                            <button onClick={resetForm} style={styles.closeBtn}>✕</button>
                        </div>
                        
                        {showModal && formData.title && !formData.id && (
                            <div style={styles.draftAlert}>
                                <span>📝 Draft restored from "BRUH" storage.</span>
                            </div>
                        )}

                        <form onSubmit={showModal ? handleCreate : handleUpdate}>
                            <FormInput label="Task Title" placeholder="e.g., Redesign Homepage" value={formData.title} onChange={e=>handleFormChange('title', e.target.value)} required />
                            <FormTextArea label="Description" placeholder="Add details..." value={formData.description} onChange={e=>handleFormChange('description', e.target.value)} />
                            
                            <div style={styles.formRow}>
                                <FormInput type="datetime-local" label="Due Date" value={formData.due_date} onChange={e=>handleFormChange('due_date', e.target.value)} required />
                                <FormSelect label="Priority" value={formData.priority} onChange={e=>handleFormChange('priority', e.target.value)} />
                            </div>
                            
                            {showModal && (
                                <div style={{marginBottom: '20px'}}>
                                    <label style={styles.label}>Attachment</label>
                                    <div style={styles.fileInputWrapper}>
                                        <input type="file" style={styles.modalFileInput} onChange={e=>handleFormChange('image', e.target.files[0])} />
                                    </div>
                                </div>
                            )}
                            
                            <div style={styles.modalFooter}>
                                <button type="button" onClick={resetForm} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={isCreating} style={styles.submitBtn}>
                                    {isCreating ? 'Saving...' : 'Save Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

// --- SUB COMPONENTS ---

const CalendarView = ({ tasks }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const calendarSlots = [...blanks, ...days];
    const changeMonth = (offset) => setCurrentDate(new Date(year, month + offset, 1));

    return (
        <div style={styles.calendarWrapper}>
            <div style={styles.calendarHeader}>
                <button onClick={() => changeMonth(-1)} style={styles.calNavBtn}>◀</button>
                <h3 style={styles.calTitle}>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => changeMonth(1)} style={styles.calNavBtn}>▶</button>
            </div>
            <div style={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} style={styles.calDayName}>{d}</div>)}
                {calendarSlots.map((day, index) => {
                    if (!day) return <div key={index} style={styles.calCellEmpty}></div>;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                    return (
                        <div key={index} style={{...styles.calCell, borderColor: isToday ? '#10b981' : '#334155'}}>
                            <span style={{...styles.calDateNum, color: isToday ? '#10b981' : '#cbd5e1'}}>{day}</span>
                            <div style={styles.calTaskContainer}>
                                {dayTasks.map(t => (
                                    <div key={t.id} style={{...styles.calTaskDot, backgroundColor: t.priority === 'High' ? '#ef4444' : '#10b981'}} title={t.title}>{t.title}</div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Column = ({ title, tasks, onPin, onEdit, onDelete, onMove }) => (
    <div style={styles.column}>
        <div style={styles.columnHeader}><span style={styles.columnTitle}>{title}</span><span style={styles.count}>{tasks.length}</span></div>
        <div style={styles.cardList}>
            {tasks.length === 0 ? <div style={styles.emptyState}>No Tasks</div> : tasks.map(t => (
                <Card key={t.id} task={t} onPin={onPin} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
            ))}
        </div>
    </div>
);

const Card = ({ task, onPin, onEdit, onDelete, onMove }) => {
    const isPinned = !!task.is_pinned; const isHigh = task.priority === 'High';
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No Date';
    return (
        <div style={styles.card}>
            <div style={styles.cardTags}>
                <span style={{...styles.tag, color: isHigh ? '#ef4444' : '#10b981', backgroundColor: isHigh ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}}>{task.priority}</span>
                <button onClick={() => onPin(task)} style={{...styles.iconBtn, color: isPinned ? '#fbbf24' : '#475569', transform: isPinned ? 'scale(1.1)' : 'scale(1)'}}>{isPinned ? '📌' : '📍'}</button>
            </div>
            
            <h4 style={styles.cardTitle}>{task.title}</h4>
            
            {/* --- ADDED DESCRIPTION HERE --- */}
            {task.description && (
                <p style={styles.cardDesc}>{task.description}</p>
            )}
            
            {task.image_path && <div style={styles.imageContainer}><img src={`http://127.0.0.1:8000/storage/${task.image_path}`} style={styles.cardImg} alt="Task" /></div>}
            
            <div style={styles.cardFooter}>
                <span style={styles.date}>📅 {formatDate(task.due_date)}</span>
                <div style={styles.cardActions}>
                    <button onClick={()=>onEdit(task)} style={styles.iconBtn} title="Edit">✏️</button>
                    <button onClick={()=>onDelete(task.id)} style={styles.iconBtn} title="Delete">🗑️</button>
                    {task.status !== 'completed' && <button onClick={()=>onMove(task,'completed')} style={{...styles.iconBtn, color: '#10b981'}} title="Done">✅</button>}
                </div>
            </div>
        </div>
    );
};

const PinnedCard = ({ task, onUnpin }) => (
    <div style={styles.pinnedCard}>
        <div style={styles.pinnedCardHeader}><span style={styles.pinnedTitle}>{task.title}</span><button onClick={onUnpin} style={styles.unpinBtn}>✕</button></div>
        <div style={styles.pinnedMeta}>
            <span style={{...styles.tag, color: task.priority==='High'?'#ef4444':'#10b981', backgroundColor: task.priority==='High'?'rgba(239, 68, 68, 0.1)':'rgba(16, 185, 129, 0.1)'}}>{task.priority}</span>
            <span style={{fontSize: '10px', color: '#64748b', textTransform:'capitalize'}}>{task.status.replace('-', ' ')}</span>
        </div>
    </div>
);

// Helpers
const FormInput = ({ label, type="text", value, onChange, required, placeholder }) => (<div style={{marginBottom:'20px', width:'100%'}}><label style={styles.label}>{label}</label><input type={type} className="wiz-input" style={styles.modalInput} value={value} onChange={onChange} required={required} placeholder={placeholder} /></div>);
const FormTextArea = ({ label, value, onChange, placeholder }) => (<div style={{marginBottom:'20px'}}><label style={styles.label}>{label}</label><textarea className="wiz-input" style={{...styles.modalInput, height:'100px', resize:'none'}} value={value} onChange={onChange} placeholder={placeholder} /></div>);
const FormSelect = ({ label, value, onChange }) => (<div style={{marginBottom:'20px', width:'100%'}}><label style={styles.label}>{label}</label><select className="wiz-input" style={styles.modalInput} value={value} onChange={onChange}><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>);
const NavItem = ({ children, active, onClick }) => (<div onClick={onClick} style={{...styles.navItem, backgroundColor: active?'#1e293b':'transparent', color: active?'#10b981':'#94a3b8'}}>{children}</div>);
const ModalOverlay = ({children, onClose}) => (<div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>{children}</div>);

// --- Styles ---
const styles = {
    appWrapper: { display: 'flex', height: '100vh', backgroundColor: '#0b0e11', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", overflow: 'hidden' },
    sidebar: { width: '260px', backgroundColor: '#111418', padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f2937', flexShrink: 0 },
    logo: { fontSize: '24px', fontWeight: '800', color: '#10b981', marginBottom: '40px', letterSpacing: '-0.5px' },
    nav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    navItem: { padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' },
    mainArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
    topHeader: { height: '80px', padding: '0 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111418', borderBottom: '1px solid #1f2937' },
    pageTitle: { fontSize: '24px', fontWeight: '700' },
    createBtn: { backgroundColor: '#10b981', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', transition: 'opacity 0.2s' },
    contentGrid: { display: 'flex', flex: 1, overflow: 'hidden' },
    
    mainContentContainer: { flex: 1, overflowX: 'auto', display: 'flex', flexDirection: 'column' },
    boardContainer: { display: 'flex', gap: '30px', padding: '40px', height: '100%', minWidth: '1000px' }, // min-width ensures columns don't squish
    loading: { color: '#10b981', margin: 'auto', fontSize: '18px', fontWeight: '500' },
    draftAlert: { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' },

    // Calendar
    calendarWrapper: { padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' },
    calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    calTitle: { fontSize: '18px', fontWeight: '700', color: '#e2e8f0' },
    calNavBtn: { background: '#1f2937', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
    calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', flex: 1 },
    calDayName: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', fontWeight: '600', paddingBottom: '10px' },
    calCell: { backgroundColor: '#15191c', borderRadius: '8px', border: '1px solid #334155', minHeight: '80px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' },
    calCellEmpty: { backgroundColor: 'transparent' },
    calDateNum: { fontSize: '12px', fontWeight: '700', color: '#cbd5e1' },
    calTaskContainer: { display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '60px' },
    calTaskDot: { fontSize: '10px', padding: '2px 4px', borderRadius: '3px', color: '#000', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

    column: { minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '20px' },
    columnHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    columnTitle: { fontWeight: '700', color: '#cbd5e1', fontSize: '16px' },
    count: { background: '#1f2937', color: '#94a3b8', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' },
    cardList: { display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingBottom: '20px', paddingRight: '5px' },
    emptyState: { color: '#475569', fontSize: '14px', fontStyle: 'italic', padding: '20px', textAlign: 'center', border: '1px dashed #334155', borderRadius: '12px' },
    
    card: { backgroundColor: '#15191c', borderRadius: '12px', padding: '20px', border: '1px solid #334155', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' },
    cardTags: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    tag: { fontSize: '11px', padding: '4px 8px', borderRadius: '4px', fontWeight: '700' },
    cardTitle: { fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', lineHeight: '1.4', color: '#f1f5f9' },
    
    // --- ADDED THIS STYLE ---
    cardDesc: { fontSize: '13px', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
    // ------------------------

    imageContainer: { width: '100%', height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' },
    cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1f2937', paddingTop: '12px', marginTop: 'auto' },
    date: { fontSize: '12px', color: '#64748b', fontWeight: '500' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '4px', color: '#94a3b8', transition: 'color 0.2s' },
    cardActions: { display: 'flex', gap: '8px' },

    pinnedSidebar: { width: '280px', backgroundColor: '#0f1316', borderLeft: '1px solid #1f2937', padding: '24px', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 },
    pinnedHeaderArea: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    pinnedHeader: { fontSize: '14px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
    pinnedCount: { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
    pinnedList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    emptyPin: { color: '#475569', fontSize: '13px', textAlign: 'center', marginTop: '40px', lineHeight: '1.6' },
    pinnedCard: { backgroundColor: '#161b22', padding: '14px', borderRadius: '10px', border: '1px solid #fbbf24', boxShadow: '0 4px 10px -2px rgba(251, 191, 36, 0.1)', transition: 'transform 0.2s' },
    pinnedCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
    pinnedTitle: { fontSize: '13px', fontWeight: '600', color: '#e2e8f0', lineHeight: '1.4' },
    unpinBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '0 4px', lineHeight: 1 },
    pinnedMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },

    // Improved Modal Styles
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' },
    modalContent: { backgroundColor: '#1e293b', width: '90%', maxWidth: '550px', padding: '40px', borderRadius: '24px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    closeBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '24px', transition: 'color 0.2s' },
    label: { display: 'block', marginBottom: '10px', color: '#cbd5e1', fontSize: '14px', fontWeight: '600' },
    modalInput: { width: '100%', background: '#0f172a', border: '1px solid #334155', color: 'white', padding: '14px', borderRadius: '12px', fontSize: '15px', transition: 'all 0.2s' },
    formRow: { display: 'flex', gap: '20px' },
    modalFileInput: { width: '100%', color: '#94a3b8', fontSize: '14px' },
    fileInputWrapper: { background: '#0f172a', padding: '10px', borderRadius: '12px', border: '1px dashed #334155' },
    
    modalFooter: { display: 'flex', gap: '15px', marginTop: '10px' },
    submitBtn: { flex: 2, background: '#10b981', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', color: '#022c22', fontSize: '15px' },
    cancelBtn: { flex: 1, background: 'transparent', padding: '14px', border: '1px solid #334155', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', color: '#cbd5e1' }
};