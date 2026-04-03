import React, { useState, useEffect, useRef } from 'react';
import { Send, ExternalLink, Trash2, Copy, ShieldAlert, X, Ghost, Users, CheckCircle2 } from 'lucide-react';
// 1. Import toast and Toaster
import toast, { Toaster } from 'react-hot-toast';

const ChittyFriends = ({ currentUser, directory, forcedUser, onTeleport }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [activeNotice, setActiveNotice] = useState(null); 
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedForGroup, setSelectedForGroup] = useState([]);
  
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chitty_msgs_db');
    return saved ? JSON.parse(saved) : [];
  });

  const isOwner = currentUser?.name?.toLowerCase() === "yousef jo" && currentUser?.password === "the owner";

  useEffect(() => {
    const allNotices = JSON.parse(localStorage.getItem('chitty_notices')) || [];
    const myNotice = allNotices.find(n => n.targetUser === currentUser.name);
    if (myNotice) {
      setActiveNotice(myNotice);
    }
  }, [currentUser.name]);

  useEffect(() => {
    localStorage.setItem('chitty_msgs_db', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const messagedUserNames = messages.reduce((acc, m) => {
    if (!m.isGroup) {
      if (m.from === currentUser.name) acc.add(m.to);
      if (m.to === currentUser.name) acc.add(m.from);
    }
    return acc;
  }, new Set());

  const sidebarList = directory.filter(d => 
    messagedUserNames.has(d.name) || (forcedUser && d.name === forcedUser.name)
  );

  const existingGroups = messages
    .filter(m => m.isGroup && m.participants?.includes(currentUser.name))
    .reduce((acc, m) => {
        if (!acc.find(g => g.name === m.to)) {
            acc.push({ name: m.to, isGroup: true, participants: m.participants });
        }
        return acc;
    }, []);

  useEffect(() => {
    if (forcedUser) setActiveChat(forcedUser);
    else if (!activeChat && sidebarList.length > 0) setActiveChat(sidebarList[0]);
  }, [forcedUser, sidebarList.length]);

  // --- DELETE LOGIC WITH TOAST ---
  const deleteMsg = (msg) => {
    const isMyOwn = msg.from === currentUser.name;
    
    // Custom toast with "Confirm" button instead of window.confirm
    toast((t) => (
      <span>
        Delete message? 
        <button 
          onClick={() => {
            confirmDeletion(msg);
            toast.dismiss(t.id);
          }}
          style={{ marginLeft: '10px', background: '#ff4d4d', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Yes
        </button>
      </span>
    ), { icon: '🗑️' });
  };

  const confirmDeletion = (msg) => {
    const isMyOwn = msg.from === currentUser.name;
    if (isOwner && !isMyOwn) {
      const notices = JSON.parse(localStorage.getItem('chitty_notices')) || [];
      const newNotice = {
        id: Date.now(),
        targetUser: msg.from,
        deletedText: msg.text,
        deletedImg: msg.postLink?.image || msg.image || null,
      };
      localStorage.setItem('chitty_notices', JSON.stringify([...notices, newNotice]));
      toast.success("Message deleted and user notified!");
    } else {
      toast.success("Message deleted");
    }
    setMessages(prev => prev.filter(m => m.id !== msg.id));
  };

  const closeNotice = () => {
    const allNotices = JSON.parse(localStorage.getItem('chitty_notices')) || [];
    const filtered = allNotices.filter(n => n.id !== activeNotice.id);
    localStorage.setItem('chitty_notices', JSON.stringify(filtered));
    setActiveNotice(null);
  };

  // --- SEND MESSAGE WITH TOAST ---
  const sendMsg = (e) => {
    e.preventDefault();
    if (!msgText.trim()) {
        toast.error("Can't send an empty message!");
        return;
    }
    if (!activeChat) return;

    const newMsg = {
      id: Date.now(),
      from: currentUser.name,
      to: activeChat.name,
      text: msgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGroup: !!activeChat.isGroup,
      participants: activeChat.participants || null,
      image: activeChat.image || null
    };
    setMessages(prev => [...prev, newMsg]);
    setMsgText('');
    // Optional: add a tiny "Sent" toast if you want feedback
    // toast.success('Sent!', { duration: 1000, position: 'bottom-center' });
  };

  const currentConvo = messages.filter(m => {
    if (activeChat?.isGroup) return m.isGroup && m.to === activeChat.name;
    return !m.isGroup && (
        (m.from === currentUser.name && m.to === activeChat?.name) ||
        (m.to === currentUser.name && m.from === activeChat?.name)
    );
  });

  return (
    <div style={s.container}>
      {/* 2. Add the Toaster component at the top level */}
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* --- ADMIN ALERT MODAL --- */}
      {activeNotice && (
        <div style={s.alertOverlay}>
          <div style={s.alertBox}>
            <button onClick={closeNotice} style={s.closeX}><X size={20} /></button>
            <div style={s.alertHeader}>
              <ShieldAlert size={40} color="#ff4d4d" />
              <h2 style={{margin:'10px 0 5px'}}>Notice from the admin</h2>
            </div>
            <div style={s.evidenceContainer}>
              <p style={{fontSize:'11px', color:'#888', textTransform:'uppercase', marginBottom:'8px'}}>Deleted Content:</p>
              {activeNotice.deletedImg && <img src={activeNotice.deletedImg} style={s.alertImg} alt="" />}
              <p style={{fontSize:'14px', fontWeight:'500', marginTop:'10px'}}>"{activeNotice.deletedText}"</p>
            </div>
            <p style={s.warningText}>Your message got deleted from admin, respect the rules 😊</p>
            <button style={s.understandBtn} onClick={closeNotice}>I Understand</button>
          </div>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <div style={s.sidebar}>////
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
            <h3 style={s.sidebarTitle}>{isGroupMode ? "NEW GROUP" : "CHATS"}</h3>
            <button onClick={() => { setIsGroupMode(!isGroupMode); setSelectedForGroup([]); }} 
                    style={{...s.groupBtn, background: isGroupMode ? '#ff4d4d' : '#007bff'}}>
                {isGroupMode ? <X size={14}/> : <Users size={14}/>}
            </button>
        </div>

        <div style={s.scrollList}>
            {!isGroupMode ? (
                [...sidebarList, ...existingGroups].map(f => (
                    <div key={f.name} onClick={() => setActiveChat(f)} 
                        style={{...s.friendItem, background: activeChat?.name === f.name ? '#f0f2f5' : 'transparent'}}>
                        <div style={s.avContainer}>{f.isGroup ? <Users size={16}/> : <img src={f.avatar || 'https://via.placeholder.com/35'} style={s.av} />}</div>
                        <span style={{fontSize:'13px', fontWeight: activeChat?.name === f.name ? 'bold' : 'normal'}}>{f.name}</span>
                    </div>
                ))
            ) : (
                directory.filter(d => messagedUserNames.has(d.name)).map(f => (
                    <div key={f.name} onClick={() => setSelectedForGroup(prev => prev.includes(f.name) ? prev.filter(u => u !== f.name) : [...prev, f.name])} 
                        style={{...s.friendItem, border: selectedForGroup.includes(f.name) ? '1px solid #007bff' : '1px solid transparent'}}>
                        <img src={f.avatar || 'https://via.placeholder.com/35'} style={s.av} />
                        <span style={{fontSize:'13px', flex:1}}>{f.name}</span>
                        {selectedForGroup.includes(f.name) && <CheckCircle2 size={16} color="#007bff" />}
                    </div>
                ))
            )}
        </div>

        {isGroupMode && selectedForGroup.length > 0 && (
            <button onClick={() => {
                const gName = `Group: ${selectedForGroup.slice(0, 2).join(', ')}${selectedForGroup.length > 2 ? '...' : ''}`;
                setActiveChat({ name: gName, isGroup: true, participants: [...selectedForGroup, currentUser.name] });
                setIsGroupMode(false);
                toast.success("Group created!"); // Group feedback
            }} style={s.confirmGroupBtn}>
                Chat +{selectedForGroup.length}
            </button>
        )}
      </div>

      {/* --- CHAT AREA --- */}
      <div style={s.chatArea}>
        {activeChat ? (
          <>
            <div style={s.chatHeader}>
              <div style={s.avContainer}>{activeChat.isGroup ? <Users size={16}/> : <img src={activeChat.avatar || 'https://via.placeholder.com/35'} style={s.av} />}</div>
              <span style={{fontWeight:'bold'}}>{activeChat.name}</span>
            </div>

            <div style={s.msgList} ref={scrollRef}>
              {currentConvo.map(m => {
                const isMyMessage = m.from === currentUser.name;
                return (
                  <div key={m.id} style={{
                    ...s.msgBubble, 
                    alignSelf: isMyMessage ? 'flex-end' : 'flex-start', 
                    background: isMyMessage ? '#007bff' : '#f0f0f0', 
                    color: isMyMessage ? '#fff' : '#000',
                  }}>
                    {activeChat.isGroup && !isMyMessage && <div style={{fontSize:'10px', fontWeight:'bold', marginBottom:'4px', opacity:0.7}}>{m.from}</div>}
                    {m.postLink?.image && <img src={m.postLink.image} style={s.previewImg} alt="" />}
                    {m.image && <img src={m.image} style={s.previewImg} alt="" />}
                    <div>{m.text}</div>
                    
                    {activeChat.postLink && (
                        <div onClick={() => onTeleport(activeChat.postLink)} style={s.teleportBtn}>
                            <ExternalLink size={12} /> Go to post
                        </div>
                    )}

                    <div style={s.msgFooter}>
                      <div style={{display:'flex', gap:'10px'}}>
                        {/* 3. Replaced alert("Copied!") with toast.success */}
                        <Copy size={12} style={{cursor:'pointer'}} onClick={() => {
                            navigator.clipboard.writeText(m.text);
                            toast.success("Text copied to clipboard!", { duration: 1500 });
                        }} />
                        {(isMyMessage || isOwner) && (
                          <Trash2 size={12} style={{cursor:'pointer'}} onClick={() => deleteMsg(m)} />
                        )}
                      </div>
                      <span style={{fontSize:'8px'}}>{m.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMsg} style={s.inputRow}>
              <input style={s.input} value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message..." />
              <button type="submit" style={s.sendBtn}><Send size={16}/></button>
            </form>
          </>
        ) : (
          <div style={s.emptyState}>
             <Ghost size={48} color="#ddd" />
             <p>Pick someone to talk to, bruh.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles remain the same...
const s = {
  container: { display:'flex', background:'#fff', height:'80vh', border:'1px solid #dbdbdb', borderRadius:'15px', overflow:'hidden', position:'relative' },
  sidebar: { width:'240px', borderRight:'1px solid #dbdbdb', padding:'15px', background:'#fafafa', display:'flex', flexDirection:'column' },
  sidebarTitle: { fontSize:'11px', color:'#999', letterSpacing:'1px' },
  scrollList: { flex:1, overflowY:'auto', paddingRight:'5px' },
  groupBtn: { border:'none', color:'#fff', padding:'6px', borderRadius:'8px', cursor:'pointer' },
  friendItem: { display:'flex', alignItems:'center', gap:'10px', padding:'10px', cursor:'pointer', borderRadius:'10px', marginBottom:'4px' },
  av: { width:'35px', height:'35px', borderRadius:'50%', objectFit:'cover' },
  avContainer: { width:'35px', height:'35px', borderRadius:'50%', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' },
  confirmGroupBtn: { marginTop:'10px', padding:'12px', background:'#28a745', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer' },
  chatArea: { flex:1, display:'flex', flexDirection:'column' },
  chatHeader: { padding:'15px', borderBottom:'1px solid #dbdbdb', display:'flex', alignItems:'center', gap:'10px' },
  msgList: { flex:1, padding:'20px', display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto' },
  msgBubble: { padding:'12px', borderRadius:'15px', maxWidth:'70%', fontSize:'14px' },
  msgFooter: { display:'flex', justifyContent:'space-between', marginTop:'6px', opacity:0.6, paddingTop:'4px', borderTop:'1px solid rgba(0,0,0,0.05)' },
  previewImg: { width:'100%', borderRadius:'8px', marginBottom:'5px' },
  teleportBtn: { marginTop:'8px', padding:'5px', background:'rgba(0,0,0,0.1)', borderRadius:'5px', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' },
  inputRow: { padding:'15px', borderTop:'1px solid #dbdbdb', display:'flex', gap:'10px' },
  input: { flex:1, border:'1px solid #ddd', borderRadius:'20px', padding:'10px 15px', outline:'none' },
  sendBtn: { background:'#007bff', color:'#fff', border:'none', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
  emptyState: { margin:'auto', textAlign:'center', color:'#ccc' },
  alertOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999 },
  alertBox: { background:'#fff', width:'380px', padding:'30px', borderRadius:'25px', textAlign:'center', position:'relative' },
  closeX: { position:'absolute', top:'15px', right:'15px', background:'none', border:'none', cursor:'pointer', color:'#bbb' },
  alertHeader: { marginBottom:'20px' },
  evidenceContainer: { background:'#f8f9fa', padding:'15px', borderRadius:'15px', border:'1px solid #eee', marginBottom:'20px' },
  alertImg: { width:'100%', maxHeight:'180px', objectFit:'cover', borderRadius:'10px' },
  warningText: { fontSize:'15px', fontWeight:'700', color:'#333', marginBottom:'20px' },
  understandBtn: { width:'100%', padding:'15px', background:'linear-gradient(45deg, #ff4d4d, #f9cb28)', color:'#fff', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer' }
};

export default ChittyFriends;