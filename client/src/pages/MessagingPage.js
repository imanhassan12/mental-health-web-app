import React, { useEffect, useState, useRef } from 'react';
import messageService from '../services/message.service';
import '../styles/Dashboard.css';
import { FaPaperPlane, FaPlus, FaUserMd, FaLock } from 'react-icons/fa';
import AuthService from '../services/auth.service';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import ClientService from '../services/client.service';

const MessagingPage = () => {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadClientId, setNewThreadClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [practitioners, setPractitioners] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showManageParticipants, setShowManageParticipants] = useState(false);
  const [manageSelected, setManageSelected] = useState([]);
  const [manageLoading, setManageLoading] = useState(false);
  const selectedThreadRef = useRef(selectedThread);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeouts = useRef({});
  const currentUser = AuthService.getCurrentUser();
  const socket = useSocket();
  const [readReceipts, setReadReceipts] = useState({});
  const [clients, setClients] = useState([]);

  useEffect(() => {
    selectedThreadRef.current = selectedThread;
  }, [selectedThread]);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Register socket event handlers
    const handleMessageNew = (...args) => {
      const { threadId, message } = args[0] || {};
      if (selectedThreadRef.current && threadId === selectedThreadRef.current.id) {
        fetchMessages(threadId);
      } else {
        toast.info(`New message in another thread`, { toastId: threadId, position: 'bottom-right', autoClose: 4000 });
      }
      fetchThreads();
    };
    const handleThreadParticipants = ({ threadId }) => {
      if (selectedThreadRef.current && threadId === selectedThreadRef.current.id) {
        fetchThreads();
      }
    };
    const handleTyping = (...args) => {
      const { threadId, userId, name } = args[0] || {};
      if (selectedThreadRef.current && threadId === selectedThreadRef.current.id && userId !== currentUser.id) {
        setTypingUsers(prev => ({ ...prev, [userId]: name }));
        // Clear after 3s
        if (typingTimeouts.current[userId]) clearTimeout(typingTimeouts.current[userId]);
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          });
        }, 3000);
      }
    };
    socket.on('message:new', handleMessageNew);
    socket.on('thread:participants', handleThreadParticipants);
    socket.on('typing', handleTyping);
    return () => {
      socket.off('message:new', handleMessageNew);
      socket.off('thread:participants', handleThreadParticipants);
      socket.off('typing', handleTyping);
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
    };
  }, [socket, currentUser.id]);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread.id);
    }
  }, [selectedThread]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (showNewThread) {
      messageService.getPractitioners().then(setPractitioners).catch(() => setPractitioners([]));
      // Fetch clients for dropdown
      ClientService.getAllClients().then(setClients).catch(() => setClients([]));
    }
  }, [showNewThread]);

  useEffect(() => {
    if (!messages || !currentUser) return;
    // Only mark the last unread message as read and fetch its read receipts if not already marked
    const unread = messages.filter(msg => msg.senderId !== currentUser.id);
    if (unread.length > 0) {
      const lastUnread = unread[unread.length - 1];
      const alreadyRead = (readReceipts[lastUnread.id] || []).some(r => r.user.id === currentUser.id);
      if (!alreadyRead) {
        markMessageAsRead(lastUnread.id);
        fetchReadReceipts(lastUnread.id);
      }
    }
  }, [messages, currentUser, readReceipts]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageRead = ({ messageId, user, readAt }) => {
      setReadReceipts(prev => {
        const prevList = prev[messageId] || [];
        // Avoid duplicates
        if (prevList.some(r => r.user.id === user.id)) return prev;
        return { ...prev, [messageId]: [...prevList, { user, readAt }] };
      });
    };
    socket.on('message:read', handleMessageRead);
    return () => {
      socket.off('message:read', handleMessageRead);
    };
  }, [socket]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const data = await messageService.getThreads();
      setThreads(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load threads.');
      setLoading(false);
    }
  };

  const fetchMessages = async (threadId) => {
    setLoading(true);
    try {
      const data = await messageService.getMessages(threadId);
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load messages.');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setLoading(true);
    try {
      await messageService.sendMessage({
        threadId: selectedThread.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedThread.id);
      setLoading(false);
    } catch (err) {
      setError('Failed to send message.');
      setLoading(false);
    }
  };

  const handleNewThread = async (e) => {
    e.preventDefault();
    if (!newThreadClientId.trim() && selectedParticipants.length === 0) return;
    setLoading(true);
    try {
      const thread = await messageService.createThread({
        clientId: newThreadClientId || undefined,
        participantIds: selectedParticipants
      });
      setShowNewThread(false);
      setNewThreadClientId('');
      setSelectedParticipants([]);
      fetchThreads();
      setSelectedThread(thread);
      setLoading(false);
    } catch (err) {
      setError('Failed to create thread.');
      setLoading(false);
    }
  };

  // Helper to get initials from name
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // Open manage participants modal
  const openManageParticipants = () => {
    if (selectedThread && selectedThread.participants) {
      setManageSelected(selectedThread.participants.map(tp => tp.practitioner.id));
      setShowManageParticipants(true);
    }
  };

  // Add participants
  const handleAddParticipants = async (e) => {
    e.preventDefault();
    setManageLoading(true);
    try {
      await messageService.addParticipants(selectedThread.id, manageSelected);
      setShowManageParticipants(false);
      fetchThreads();
      setManageLoading(false);
    } catch (err) {
      setError('Failed to add participants.');
      setManageLoading(false);
    }
  };

  // Remove a participant
  const handleRemoveParticipant = async (practitionerId) => {
    setManageLoading(true);
    try {
      await messageService.removeParticipant(selectedThread.id, practitionerId);
      fetchThreads();
      setManageLoading(false);
    } catch (err) {
      setError('Failed to remove participant.');
      setManageLoading(false);
    }
  };

  // Typing indicator logic
  const handleTyping = () => {
    if (socket && selectedThread) {
      socket.emit('typing', { threadId: selectedThread.id, userId: currentUser.id, name: currentUser.name });
    }
  };

  // Mark a message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await messageService.markMessageAsRead(messageId, AuthService.getToken());
      // Emit real-time read receipt
      if (socket && selectedThread) {
        socket.emit('message:read', { threadId: selectedThread.id, messageId, userId: currentUser.id, name: currentUser.name });
      }
    } catch (err) {
      // Optionally handle error
    }
  };

  // Fetch read receipts for a message
  const fetchReadReceipts = async (messageId) => {
    try {
      const res = await messageService.getMessageReaders(messageId, AuthService.getToken());
      setReadReceipts(prev => ({ ...prev, [messageId]: res }));
    } catch (err) {
      // Optionally handle error
    }
  };

  // Helper to build client tooltip
  const getClientTooltip = (client) => {
    if (!client) return '';
    return [
      `Name: ${client.name}`,
      client.username ? `Username: ${client.username}` : null,
      client.phone ? `Phone: ${client.phone}` : null,
      client.diagnosis ? `Diagnosis: ${client.diagnosis}` : null
    ].filter(Boolean).join('\n');
  };

  return (
    <div className="dashboard-page" style={{ display: 'flex', gap: '2rem', minHeight: '80vh' }}>
      {/* Inbox/Threads List */}
      <div className="dashboard-card" style={{ minWidth: 320, maxWidth: 350, flex: '0 0 350px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FaUserMd /> Inbox</h3>
          <button className="btn btn-primary" style={{ background: '#1479b8', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowNewThread(true)}><FaPlus /> New</button>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {threads.map(thread => {
            const isSelected = selectedThread && selectedThread.id === thread.id;
            const isClientThread = !!thread.client;
            return (
              <li key={thread.id} style={{ marginBottom: 8 }}>
                <button
                  className={`btn ${isSelected ? 'btn-primary' : ''}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? '#45c9cc' : isClientThread ? '#eaf6fa' : '#f9f9f9',
                    color: isSelected ? '#fff' : '#333',
                    border: isClientThread ? '2px solid #1479b8' : 'none',
                    borderRadius: 6,
                    padding: '10px 12px',
                    fontWeight: 500,
                    boxShadow: isSelected ? '0 2px 8px rgba(42,160,155,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s, border 0.2s'
                  }}
                  onClick={() => setSelectedThread(thread)}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}
                    title={getClientTooltip(thread.client)}
                  >
                    {thread.client ? thread.client.name : 'General Thread'}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    {thread.messages && thread.messages.length > 0 ? (thread.messages[0].content ? 'New message' : 'No messages') : 'No messages'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {thread.participants && thread.participants.map(tp => (
                      <span key={tp.practitioner.id} style={{ display: 'flex', alignItems: 'center', background: '#eaf6fa', color: '#1479b8', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 500, marginRight: 4 }}>
                        <span style={{ background: '#1479b8', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 6 }}>{getInitials(tp.practitioner.name)}</span>
                        {tp.practitioner.name}
                      </span>
                    ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Thread View */}
      <div className="dashboard-card full-width" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
        {selectedThread ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', marginBottom: 12, paddingBottom: 8 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaLock /> Thread
                {selectedThread.client && (
                  <span style={{ marginLeft: 16, color: '#1479b8', fontWeight: 600 }}
                    title={getClientTooltip(selectedThread.client)}
                  >
                    • Client: {selectedThread.client.name}
                    {selectedThread.client.username && (
                      <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>
                        ({selectedThread.client.username})
                      </span>
                    )}
                  </span>
                )}
              </h3>
              <span style={{ marginLeft: 16, color: '#888', fontSize: 15 }}>
                {selectedThread.client ? selectedThread.client.name : 'General Thread'}
                <span style={{ marginLeft: 12, display: 'inline-flex', gap: 4, flexWrap: 'wrap', verticalAlign: 'middle' }}>
                  {selectedThread.participants && selectedThread.participants.map(tp => (
                    <span key={tp.practitioner.id} style={{ display: 'inline-flex', alignItems: 'center', background: '#eaf6fa', color: '#1479b8', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 500, marginRight: 4 }}>
                      <span style={{ background: '#1479b8', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginRight: 6 }}>{getInitials(tp.practitioner.name)}</span>
                      {tp.practitioner.name}
                      <button onClick={() => handleRemoveParticipant(tp.practitioner.id)} style={{ marginLeft: 6, background: 'none', border: 'none', color: '#b81d1d', cursor: 'pointer', fontSize: 14, fontWeight: 700, padding: 0 }} title="Remove">×</button>
                    </span>
                  ))}
                </span>
              </span>
              <button onClick={openManageParticipants} style={{ marginLeft: 'auto', background: '#eaf6fa', color: '#1479b8', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Manage Participants</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 400, marginBottom: 12, paddingRight: 8 }}>
              {messages.map((msg, idx) => {
                const allReaders = readReceipts[msg.id] || [];
                const readers = allReaders.filter(r => r.user.id !== msg.senderId);
                const isLastMessage = idx === messages.length - 1;
                const allOtherParticipants = (selectedThread?.participants || []).filter(tp => tp.practitioner.id !== msg.senderId);
                const allOtherParticipantsHaveRead =
                  isLastMessage &&
                  allOtherParticipants.length > 0 &&
                  allOtherParticipants.every(tp => readers.some(r => r.user.id === tp.practitioner.id));
                return (
                  <div key={msg.id} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      background: '#eaf6fa',
                      color: '#333',
                      borderRadius: 8,
                      padding: '8px 14px',
                      maxWidth: '70%',
                      alignSelf: msg.senderId === currentUser.id ? 'flex-end' : 'flex-start',
                      boxShadow: '0 1px 4px rgba(20,121,184,0.07)'
                    }}>
                      <div style={{ fontWeight: 500 }}>{msg.content}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2, marginLeft: 2 }}>
                      {msg.sender && msg.sender.name} • {new Date(msg.timestamp).toLocaleString()}
                      {allReaders.length === 0 && msg.senderId === currentUser.id ? (
                        <span className="read-receipt" style={{ marginLeft: 8, color: '#bbb', fontStyle: 'italic', fontSize: 11 }}>
                          Not yet read
                        </span>
                      ) : readers.length > 0 ? (
                        <span className="read-receipt" style={{ marginLeft: 8, color: '#1479b8', fontWeight: 500 }}>
                          {readers.map((r, idx) => (
                            <span
                              key={r.user.id + '-' + new Date(r.readAt).getTime() + '-' + idx}
                              title={`${r.user.name} (${new Date(r.readAt).toLocaleString()})`}
                              style={{
                                display: 'inline-block',
                                background: '#eaf6fa',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                textAlign: 'center',
                                lineHeight: '22px',
                                fontSize: 12,
                                fontWeight: 600,
                                marginRight: 3,
                                border: '1px solid #b3e0f7',
                                cursor: 'pointer',
                                verticalAlign: 'middle'
                              }}
                            >
                              {getInitials(r.user.name)}
                            </span>
                          ))}
                          <span style={{ marginLeft: 4, fontSize: 11, color: '#888' }}>
                            {readers.length === 1 ? 'has read' : 'have read'}
                          </span>
                        </span>
                      ) : null}
                      {allOtherParticipantsHaveRead && (
                        <span style={{ color: '#45c9cc', fontWeight: 600, marginLeft: 8 }}>Seen</span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={newMessage}
                onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                placeholder="Type your message..."
                style={{ flex: 1, padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" style={{ background: '#45c9cc', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }} disabled={loading || !newMessage.trim()}>
                <FaPaperPlane /> Send
              </button>
            </form>
            {Object.values(typingUsers).length > 0 && (
              <div style={{ color: '#1479b8', fontSize: 13, margin: '6px 0 0 4px' }}>
                {Object.values(typingUsers).join(', ')} {Object.values(typingUsers).length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#888', textAlign: 'center', marginTop: 60 }}>
            Select a thread to view messages or start a new thread.
          </div>
        )}
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(20,121,184,0.15)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1479b8' }}>Start New Thread</h3>
            <form onSubmit={handleNewThread}>
              <label style={{ display: 'block', marginBottom: 8, color: '#333' }}>Client (optional):</label>
              <select
                value={newThreadClientId}
                onChange={e => setNewThreadClientId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, marginBottom: 16 }}
                disabled={loading}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.username ? `(${client.username})` : `(${client.id})`}
                  </option>
                ))}
              </select>
              <label style={{ display: 'block', marginBottom: 8, color: '#333' }}>Select Participants:</label>
              <select
                multiple
                value={selectedParticipants}
                onChange={e => setSelectedParticipants(Array.from(e.target.selectedOptions, o => o.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, marginBottom: 16, minHeight: 80 }}
                disabled={loading}
              >
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn" style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 16px' }} onClick={() => setShowNewThread(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#1479b8', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px' }} disabled={loading || selectedParticipants.length === 0}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Participants Modal */}
      {showManageParticipants && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(20,121,184,0.15)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: '#1479b8' }}>Manage Participants</h3>
            <form onSubmit={handleAddParticipants}>
              <label style={{ display: 'block', marginBottom: 8, color: '#333' }}>Select Participants:</label>
              <select
                multiple
                value={manageSelected}
                onChange={e => setManageSelected(Array.from(e.target.selectedOptions, o => o.value))}
                style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 15, marginBottom: 16, minHeight: 80 }}
                disabled={manageLoading}
              >
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                ))}
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn" style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 16px' }} onClick={() => setShowManageParticipants(false)} disabled={manageLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#1479b8', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px' }} disabled={manageLoading}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default MessagingPage; 