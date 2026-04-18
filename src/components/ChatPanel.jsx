import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const SENDER_TYPE = 'admin';

const ChatPanel = ({ projectId, projectTitle, clientEmail }) => {
    const { session } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [notifyClient, setNotifyClient] = useState(true); // Default to true so admins don't forget to notify
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch initial messages
    const fetchMessages = useCallback(async () => {
        if (!projectId) return;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });
        if (!error) setMessages(data || []);
    }, [projectId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Mark messages as read when panel is opened
    useEffect(() => {
        if (projectId) {
            supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('project_id', projectId)
                .eq('sender_type', 'client')
                .is('read_at', null)
                .then(() => {});
        }
    }, [projectId, messages.length]);

    // Real-time subscription
    useEffect(() => {
        if (!projectId) return;

        const channel = supabase
            .channel(`chat:${projectId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `project_id=eq.${projectId}`
            }, (payload) => {
                setMessages(prev => {
                    // Avoid duplicate if we sent it ourselves
                    if (prev.find(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            })
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setIsOnline(Object.keys(state).length > 1);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString(), role: SENDER_TYPE });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending || !projectId) return;

        setSending(true);
        const msg = {
            project_id: projectId,
            sender_type: SENDER_TYPE,
            sender_email: session?.user?.email || 'admin@mido.fr',
            content: newMessage.trim(),
        };

        const { error } = await supabase.from('messages').insert([msg]);
        if (!error) {
            setNewMessage('');
            if (notifyClient && clientEmail) {
                try {
                    fetch('/api/send-automation-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: clientEmail,
                            type: 'crm_notification',
                            data: { message: `Vous avez reçu un nouveau message : "${msg.content}"` }
                        })
                    });
                } catch(e) { console.error('Notification error', e); }
            }
        }
        setSending(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !projectId) return;
        setUploading(true);

        try {
            const ext = file.name.split('.').pop();
            const path = `chat/${projectId}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
            const fileType = file.type.startsWith('image/') ? 'image' : 'file';

            const msg = {
                project_id: projectId,
                sender_type: SENDER_TYPE,
                sender_email: session?.user?.email || 'admin@mido.fr',
                content: null,
                file_url: urlData.publicUrl,
                file_name: file.name,
                file_type: fileType,
            };

            const { error: insertError } = await supabase.from('messages').insert([msg]);
            if (!insertError && notifyClient && clientEmail) {
                try {
                    fetch('/api/send-automation-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: clientEmail,
                            type: 'crm_notification',
                            data: { message: `Un nouveau document a été ajouté à votre projet : ${file.name}` }
                        })
                    });
                } catch(e) { console.error('Notification error', e); }
            }
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const formatTime = (timestamp) => {
        const d = new Date(timestamp);
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        const d = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
        if (d.toDateString() === yesterday.toDateString()) return 'Hier';
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = formatDate(msg.created_at);
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    if (!projectId) {
        return (
            <div className="chat-empty-state">
                <div className="chat-empty-icon">💬</div>
                <p>Sélectionne un projet pour voir la conversation</p>
            </div>
        );
    }

    return (
        <div className="chat-panel">
            {/* Chat Header */}
            <div className="chat-header glass-panel">
                <div className="chat-header-info">
                    <div className="chat-avatar">
                        {clientEmail?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h4 className="chat-header-name">{projectTitle}</h4>
                        <span className={`chat-status-dot ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? '● En ligne' : '○ Hors ligne'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="chat-date-divider">
                            <span>{date}</span>
                        </div>
                        {msgs.map((msg) => {
                            const isAdmin = msg.sender_type === 'admin';
                            return (
                                <div key={msg.id} className={`chat-bubble-row ${isAdmin ? 'sent' : 'received'}`}>
                                    <div className={`chat-bubble ${isAdmin ? 'bubble-sent' : 'bubble-received'}`}>
                                        {msg.file_type === 'image' ? (
                                            <img
                                                src={msg.file_url}
                                                alt={msg.file_name}
                                                className="chat-image"
                                                onClick={() => window.open(msg.file_url, '_blank')}
                                            />
                                        ) : msg.file_url ? (
                                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="chat-file-attachment">
                                                📎 {msg.file_name}
                                            </a>
                                        ) : (
                                            <p>{msg.content}</p>
                                        )}
                                        <div className="chat-meta">
                                            <span className="chat-time">{formatTime(msg.created_at)}</span>
                                            {isAdmin && (
                                                <span className="chat-read-receipt">
                                                    {msg.read_at ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                {uploading && (
                    <div className="chat-bubble-row sent">
                        <div className="chat-bubble bubble-sent uploading">
                            <div className="upload-spinner" />
                            <span>Envoi en cours...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="chat-input-bar" onSubmit={sendMessage}>
                <button
                    type="button"
                    className="chat-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Envoyer un fichier"
                >
                    📎
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.zip,.fig"
                />
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Écris un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    disabled={sending}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginRight: '8px' }}>
                    <input 
                        type="checkbox" 
                        checked={notifyClient} 
                        onChange={(e) => setNotifyClient(e.target.checked)} 
                    />
                    ✉️
                </label>
                <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={sending || !newMessage.trim()}
                    title="Envoyer"
                >
                    {sending ? '...' : '➤'}
                </button>
            </form>
        </div>
    );
};

export default ChatPanel;
