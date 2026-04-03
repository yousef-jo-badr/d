import React, { useState, useEffect } from 'react';
import { 
  Home, Users, PlusSquare, LogOut, Heart, 
  MessageSquare, Palette, Search, 
  Settings, User, ChevronDown, ChevronUp,
  Trash2, Share2, Repeat, ArrowLeft, Terminal, Bell,
  EyeOff, Camera, Check, UserPlus, UserCheck, Grid, X, Send
} from 'lucide-react';
// 1. "Perfect" Hot Toast Import
import toast, { Toaster } from 'react-hot-toast';
import "./Main.css"; 
import ChittyAuth from './Logtochit';
import ChittyFriends from './Freinds';
import FavoritePage from './Favorite';
import Set from './Set';
import Profile from './Profile'; 

const DefaultAvatar = ({ src, size = 44, borderColor = 'transparent' }) => {
  const containerStyle = {
    width: size, height: size, backgroundColor: '#dbdbdb', borderRadius: '50%',
    position: 'relative', overflow: 'hidden', display: 'flex',
    justifyContent: 'center', alignItems: 'center',
    border: borderColor !== 'transparent' ? `2px solid ${borderColor}` : 'none', flexShrink: 0,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)' // Material touch
  };

  if (src) {
    return <img src={src} alt="profile" style={{...containerStyle, objectFit: 'cover'}} />;
  }

  return (
    <div style={containerStyle}>
      <div style={{width: '35%', height: '35%', backgroundColor: '#ffffff', borderRadius: '50%', position: 'absolute', top: '20%', zIndex: 2}} />
      <div style={{width: '70%', height: '70%', backgroundColor: '#ffffff', borderRadius: '50%', position: 'absolute', bottom: '-35%', zIndex: 1}} />
    </div>
  );
};

const SearchPage = ({ 
  directory, posts, themeColor, onSelectUser, 
  currentUser, handleLike, handleReply, getRelativeTime, handleViewProfile 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = searchTerm ? directory.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())) : [];
  const filteredPosts = searchTerm ? posts.filter(p => p.caption.toLowerCase().includes(searchTerm.toLowerCase())) : [];

  const styles = {
    searchBar: { display: 'flex', alignItems: 'center', background: '#f5f5f5', padding: '14px 18px', borderRadius: '24px', marginBottom: '25px', border: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' },
    input: { background: 'none', border: 'none', outline: 'none', marginLeft: '10px', width: '100%', fontSize: '16px' },
    sectionTitle: { fontSize: '13px', fontWeight: 'bold', color: '#8e8e8e', margin: '25px 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    userResult: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s', background: '#fff', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    postResult: { padding: '15px', border: '1px solid #eee', borderRadius: '16px', marginBottom: '15px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
  };

  return (
    <div className="fade-in">
      <div style={styles.searchBar}>
        <Search size={20} color={themeColor} />
        <input style={styles.input} placeholder="Search names or post keywords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
      </div>
      {searchTerm ? (
        <>
          <h3 style={styles.sectionTitle}>People</h3>
          {filteredUsers.map(u => (
            <div key={u.name} style={styles.userResult} onClick={() => handleViewProfile(u)} className="hover-lift">
              <DefaultAvatar size={44} src={u.profilePic} borderColor={themeColor} />
              <span style={{fontWeight: '600'}}>{u.name}</span>
            </div>
          ))}
          <h3 style={styles.sectionTitle}>Posts</h3>
          {filteredPosts.map(p => (
            <div key={p.id} style={styles.postResult}>
              <p><strong>{p.username}</strong> {p.caption}</p>
            </div>
          ))}
        </>
      ) : <p style={{textAlign:'center', color:'#999', marginTop: '30px'}}>Search for friends to share moments with...</p>}
    </div>
  );
};

const Admin = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('chitty_user_db')));
  const [posts, setPosts] = useState(() => JSON.parse(localStorage.getItem('chitty_posts_db')) || []);
  const [directory, setDirectory] = useState(() => JSON.parse(localStorage.getItem('chitty_directory_db')) || []);
  const [view, setView] = useState('feed'); 
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null); 
  const [now, setNow] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingPost, setSharingPost] = useState(null);
  const [postInput, setPostInput] = useState({ caption: '', img: '' });
  const [replyInput, setReplyInput] = useState({ postId: null, text: '' });
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('chitty_theme') || '#6750A4'); // Material Default
  const [btnRadius, setBtnRadius] = useState(() => localStorage.getItem('chitty_radius') || '24px'); // Fully Rounded Default
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commandText, setCommandText] = useState('');
  const [adminNotice, setAdminNotice] = useState(false);
  
  const isOwner = user?.name?.toLowerCase() === "yousef jo";
  const otherUsers = directory.filter(u => u.name !== user?.name);

  // --- UPDATED: Perfect Hot Toasts with manual X Button ---
  const notify = (msg, icon, type = 'success') => {
    toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{icon}</span>
          <span>{msg}</span>
        </div>
        <button 
          onClick={() => toast.dismiss(t.id)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
        >
          <X size={14} />
        </button>
      </div>
    ), {
      style: { 
        borderRadius: btnRadius, 
        background: '#fff', 
        color: '#333', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
        borderLeft: `4px solid ${type === 'error' ? '#ff4d4d' : themeColor}`,
        minWidth: '200px'
      }
    });
  };

  const handleSocialAction = (targetName, actionType) => {
    const updatedDir = directory.map(u => {
      if (u.name === targetName) {
        const list = u[actionType] || [];
        const isRemoving = list.includes(user.name);
        const newList = isRemoving ? list.filter(n => n !== user.name) : [...list, user.name];
        
        const label = actionType === 'friends' ? 'Friend list' : 'Followers';
        if (isRemoving) notify(`Removed from ${label}`, '🗑️', 'error');
        else notify(`Added to ${label}!`, '✨');

        return { ...u, [actionType]: newList };
      }
      return u;
    });
    setDirectory(updatedDir);
    localStorage.setItem('chitty_directory_db', JSON.stringify(updatedDir));
    if (viewingUser?.name === targetName) {
      setViewingUser(updatedDir.find(u => u.name === targetName));
    }
  };

  const refreshUserData = () => {
    const updated = JSON.parse(localStorage.getItem('chitty_user_db'));
    setUser(updated);
    setDirectory(JSON.parse(localStorage.getItem('chitty_directory_db')) || []);
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const noticeKey = `notice_for_${user?.name}`;
    if (localStorage.getItem(noticeKey)) {
        setAdminNotice(true);
    }
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chitty_theme', themeColor);
    localStorage.setItem('chitty_radius', btnRadius);
  }, [themeColor, btnRadius]);

  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleRunCommand = (e) => {
    e.preventDefault();
    const args = commandText.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const target = args[1];

    if (cmd === 'help') {
      notify("CMD: purge all, purge [name], message_all, clear_posts", '⌨️');
    } 
    else if (cmd === 'purge') {
      if (target === 'all') {
        setDirectory([]);
        localStorage.setItem('chitty_directory_db', JSON.stringify([]));
        notify("SYSTEM PURGED", '🔥');
      } else {
        const updated = directory.filter(u => u.name.toLowerCase() !== target.toLowerCase());
        setDirectory(updated);
        localStorage.setItem('chitty_directory_db', JSON.stringify(updated));
        notify(`User ${target} deleted`, '🗑️');
      }
    } 
    else if (cmd === 'message_all') {
      const msg = args.slice(1).join(' ');
      const allMsgs = JSON.parse(localStorage.getItem('chitty_msgs_db')) || [];
      const newMessages = directory.filter(u => u.name !== user.name).map(u => ({
          id: Date.now() + Math.random(),
          from: user.name,
          to: u.name,
          text: msg,
          time: "GLOBAL",
          seen: false
      }));
      localStorage.setItem('chitty_msgs_db', JSON.stringify([...allMsgs, ...newMessages]));
      notify(`Broadcast sent to ${newMessages.length} users.`, '📢');
    }
    else if (cmd === 'clear_posts') {
      setPosts([]);
      localStorage.setItem('chitty_posts_db', JSON.stringify([]));
      notify("All posts cleared.", '🧹');
    }
    setCommandText('');
  };

  const handleDeletePost = (post) => {
    if (window.confirm("Delete this moment?")) {
      const updated = posts.filter(p => p.id !== post.id);
      setPosts(updated);
      localStorage.setItem('chitty_posts_db', JSON.stringify(updated));
      if (isOwner && post.username !== user.name) {
          localStorage.setItem(`notice_for_${post.username}`, "true");
      }
      notify("Post deleted", '🗑️');
    }
  };

  const handleTeleport = (postId) => {
    setView('feed');
    setTimeout(() => {
      const el = document.getElementById(`post-${postId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSendToFriend = (friend) => {
    if (!sharingPost) return;
    const allMsgs = JSON.parse(localStorage.getItem('chitty_msgs_db')) || [];
    const newMsg = {
      id: Date.now() + Math.random(), from: user.name, to: friend.name, text: "Check out this moment!", postLink: sharingPost.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), seen: false
    };
    localStorage.setItem('chitty_msgs_db', JSON.stringify([...allMsgs, newMsg]));
    notify(`Sent moment to ${friend.name}!`, '🚀');
  };

  const handleMassSend = () => {
    if (!sharingPost) return;
    const allMsgs = JSON.parse(localStorage.getItem('chitty_msgs_db')) || [];
    const newMsgs = directory.filter(u => u.name !== user.name).map(friend => ({
      id: Date.now() + Math.random(), from: user.name, to: friend.name, text: "Check out this moment!", postLink: sharingPost.id,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), seen: false
    }));
    localStorage.setItem('chitty_msgs_db', JSON.stringify([...allMsgs, ...newMsgs]));
    notify(`Sent moment to all your friends!`, '🚀');
    setIsShareModalOpen(false);
  };

  const handleShare = async (post) => {
    try {
      if (navigator.share) await navigator.share({ title: 'Chitty', text: post.caption, url: window.location.href });
      else { 
        await navigator.clipboard.writeText(window.location.href); 
        notify("Link copied to clipboard!", '📋'); 
      }
    } catch (err) { console.log(err); }
  };

  const handleRemix = (post) => {
    setPostInput({ img: post.image || '', caption: `Remixing @${post.username}: ` });
    setIsModalOpen(true);
    notify("Remixing moment...", '🔄');
  };

  const handleReplySubmit = (postId) => {
    if (!replyInput.text.trim()) return;
    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, replies: [...(p.replies || []), { id: Date.now(), user: user.name, text: replyInput.text }] };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem('chitty_posts_db', JSON.stringify(updated));
    setReplyInput({ postId: null, text: '' });
    notify("Reply posted!", '💬');
  };

  const handleLike = (postId) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        const likes = p.likes || [];
        const hasLiked = likes.includes(user.name);
        if (!hasLiked) notify('Moment Liked!', '❤️');
        return { ...p, likes: hasLiked ? likes.filter(l => l !== user.name) : [...likes, user.name] };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem('chitty_posts_db', JSON.stringify(updated));
  };

  const handleAuth = (userData) => {
    setUser(userData);
    localStorage.setItem('chitty_user_db', JSON.stringify(userData));
    const currentDir = JSON.parse(localStorage.getItem('chitty_directory_db')) || [];
    if (!currentDir.find(d => d.name === userData.name)) {
      const newDir = [...currentDir, userData];
      setDirectory(newDir);
      localStorage.setItem('chitty_directory_db', JSON.stringify(newDir));
    }

    // VIP Entrance Check
    if (userData.name.toLowerCase() === "yousef jo") {
      toast('Welcome back owner! 🎆🎆🎆', {
        duration: 5000,
        icon: '🎉',
        style: { 
          borderRadius: '24px', 
          background: '#222', 
          color: '#fff', 
          fontSize: '18px', 
          padding: '16px 24px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)' 
        }
      });
    } else {
      toast.success(`Welcome, ${userData.name}!`, { style: { borderRadius: btnRadius }});
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chitty_user_db');
    setUser(null); 
    notify("Logged out safely", '👋');
  };

  const createPost = (e) => {
    e.preventDefault();
    if (!postInput.caption.trim()) {
        notify("Caption is required", '⚠️', 'error');
        return;
    }
    const newP = { 
        id: Date.now(), 
        username: user.name, 
        image: postInput.img, 
        caption: postInput.caption, 
        likes: [], 
        replies: [] 
    };
    const updated = [newP, ...posts];
    setPosts(updated);
    localStorage.setItem('chitty_posts_db', JSON.stringify(updated));
    setIsModalOpen(false);
    setPostInput({ caption: '', img: '' });
    notify("Moment shared to feed!", '✨');
  };

  const handleViewProfile = (targetUser) => {
    setViewingUser(targetUser);
    setView('user_preview'); 
  };

  const handleGoToChat = (targetUser) => {
    setActiveChatUser(targetUser);
    setView('friends');
    setViewingUser(null);
  };

  const closeNotice = () => {
      localStorage.removeItem(`notice_for_${user.name}`);
      setAdminNotice(false);
  };

  if (!user) return <ChittyAuth onSignIn={handleAuth} />;

  const s = {
    sideNav: { width: '250px', borderRight: '1px solid #eee', height: '100vh', position: 'sticky', top: 0, padding: '20px', display: 'flex', flexDirection: 'column' },
    navLinksGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 16px', borderRadius: '24px', cursor: 'pointer', transition: '0.2s' },
    navLabel: { fontSize: '16px' },
    mainWrapper: { flex: 1, padding: '20px', display: 'flex', justifyContent: 'center', overflowY: 'auto' },
    contentContainer: { maxWidth: '600px', width: '100%' },
    discovery: { marginBottom: '30px' },
    label: { fontSize: '13px', fontWeight: 'bold', color: '#8e8e8e', marginBottom: '15px', textTransform: 'uppercase' },
    nodeScroll: { display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' },
    node: { textAlign: 'center', cursor: 'pointer', flexShrink: 0 },
    card: { background: '#fff', border: '1px solid #efefef', marginBottom: '25px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' },
    cardHead: { padding: '12px 16px', display: 'flex', alignItems: 'center' },
    cardImg: { width: '100%', maxHeight: '600px', objectFit: 'cover' },
    input: { background: '#fafafa', border: '1px solid #dbdbdb', padding: '12px 16px', borderRadius: '24px', fontSize: '14px', outline: 'none' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', padding: '30px', borderRadius: '30px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    btnPrimary: { border: 'none', padding: '12px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', borderRadius: '24px' }, // Fully rounded
    commandBar: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 25px', zIndex: 900 },
    commandInput: { background: 'none', border: 'none', outline: 'none', width: '100%', fontFamily: 'monospace', fontSize: '14px' }
  };

  const dynamicBtn = { ...s.btnPrimary, backgroundColor: themeColor, borderRadius: btnRadius, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };

  const NavItem = ({ icon: Icon, label, viewName, onClick }) => (
    <div 
      style={{
        ...s.navItem, 
        color: view === viewName ? themeColor : '#444', 
        fontWeight: view === viewName ? 'bold' : '500', 
        background: view === viewName ? `${themeColor}15` : 'transparent' 
      }} 
      onClick={onClick || (() => { setView(viewName); setViewingUser(null); })}
      className="nav-hover"
    >
      <Icon size={24} strokeWidth={view === viewName ? 2.5 : 2} />
      <span style={s.navLabel}>{label}</span>
    </div>
  );

  return (
    <div style={{background: '#fef7ff', minHeight: '100vh', display: 'flex'}}>
      
      {/* PERFECT HOT TOASTS CONTAINER */}
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 3000 }} />

      {adminNotice && (
          <div style={s.overlay}>
              <div style={{...s.modal, borderTop: `10px solid ${themeColor}`, textAlign:'center', animation: 'pop 0.3s ease'}}>
                  <Bell size={40} color={themeColor} style={{margin:'0 auto 15px'}} />
                  <h2 style={{color: themeColor, marginBottom:'10px'}}>Notice from the admin</h2>
                  <p style={{fontSize:'16px', color:'#444', lineHeight:'1.5'}}>Your post has been deleted. Please follow the community guidelines.</p>
                  <button style={{...dynamicBtn, marginTop:'20px', width:'100%'}} onClick={closeNotice}>I Understand</button>
              </div>
          </div>
      )}

      <nav style={s.sideNav}>
        <div className="brand-container" style={{ background: themeColor, borderRadius: btnRadius, padding: '12px 24px', display: 'inline-flex', alignItems: 'center', gap: '15px' }}>
    <div className="brand-logo" style={{ 
        width: '40px',          // Bigger logo size
        height: '40px', 
        borderRadius: '16px',   // Rounded but not a circle
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        border: '2px solid #fff' // Optional: adds a white border to define the square
    }}>
      <span className="logo-c" style={{ color: '#fff', fontWeight: 'bold', fontSize: '22px' }}>C</span>
    </div>
    <h2 className="brand-text" style={{ color: '#fff', margin: 0, textTransform: 'lowercase', fontSize: '1.6rem' }}>chitty</h2> 
</div>
        <div style={s.navLinksGroup}>
          <NavItem icon={Home} label="Home" viewName="feed" />
          <NavItem icon={Search} label="Search" viewName="search" />
          <NavItem icon={MessageSquare} label="Messages" viewName="friends" onClick={() => {setView('friends'); setActiveChatUser(null);}} />
          <NavItem icon={User} label="Profile" viewName="profile" />
          <NavItem icon={Heart} label="Favorites" viewName="favorites" />
          <NavItem icon={PlusSquare} label="Create" onClick={() => setIsModalOpen(true)} />
        </div>
        <div style={{marginTop: 'auto', paddingBottom: '20px'}}>
          <NavItem icon={Palette} label="Theme" onClick={() => setIsThemeOpen(true)} />
          <NavItem icon={Settings} label="Settings" viewName="settings" />
          <NavItem icon={LogOut} label="Log Out" onClick={handleLogout} />
        </div>
      </nav>

      <main style={{...s.mainWrapper, paddingBottom: isOwner ? '80px' : '0'}}>
        <div style={s.contentContainer}>
          
          {view === 'profile' ? (
            <Profile themeColor={themeColor} onUpdate={refreshUserData} />
          ) : view === 'user_preview' && viewingUser ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} className="fade-in">
              <DefaultAvatar size={120} src={viewingUser.profilePic} borderColor={themeColor} />
              <h2 style={{marginTop: '15px', marginBottom: '5px'}}>{viewingUser.name}</h2>
              <p style={{color: '#888', fontSize: '14px', marginBottom: '25px'}}>@{viewingUser.name.toLowerCase().replace(/\s/g, '')}</p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '30px', padding: '15px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{posts.filter(p => p.username === viewingUser.name).length}</div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Grid size={12}/> Posts</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{viewingUser.friends?.length || 0}</div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12}/> Friends</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{viewingUser.followers?.length || 0}</div>
                  <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}><UserCheck size={12}/> Followers</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '350px', margin: '0 auto' }}>
                <button 
                  style={{...dynamicBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} 
                  onClick={() => handleSocialAction(viewingUser.name, 'friends')}
                >
                  <UserPlus size={18}/> {viewingUser.friends?.includes(user.name) ? "Unfriend" : "Add"}
                </button>
                <button 
                  style={{...s.btnPrimary, background: '#f0f0f0', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} 
                  onClick={() => handleSocialAction(viewingUser.name, 'followers')}
                >
                  <UserCheck size={18}/> {viewingUser.followers?.includes(user.name) ? "Unfollow" : "Follow"}
                </button>
                <button style={{...s.btnPrimary, background: '#f0f0f0', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} onClick={() => handleGoToChat(viewingUser)}>
                  <MessageSquare size={18}/> Message
                </button>
                <button style={{...s.btnPrimary, background: '#fff0f0', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}} onClick={() => setView('feed')}>
                  <X size={18}/> Close
                </button>
              </div>
            </div>
          ) : view === 'friends' ? (
            <ChittyFriends currentUser={user} directory={directory} forcedUser={activeChatUser} onTeleport={handleTeleport} />
          ) : view === 'feed' ? (
            <>
              <div style={s.discovery}>
                <p style={s.label}>Global Discovery</p>
                <div style={s.nodeScroll}>
                  {otherUsers.map(node => (
                    <div key={node.name} style={s.node} onClick={() => handleViewProfile(node)}>
                      <DefaultAvatar size={64} src={node.profilePic} borderColor={themeColor} />
                      <span style={{fontSize:'12px', display: 'block', marginTop: '8px', fontWeight:'600'}}>{node.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {posts.map(p => {
                const isExpanded = expandedPosts[p.id];
                const repliesToShow = (p.replies || []).slice(0, isExpanded ? p.replies.length : 3);
                const hasMore = p.replies?.length > 3;

                const displayName = p.username === (JSON.parse(localStorage.getItem('chitty_user_db'))?.oldName || user.name) ? user.name : p.username;
                const displayPic = p.username === user.name ? user.profilePic : directory.find(u => u.name === p.username)?.profilePic;

                return (
                  <div key={p.id} id={`post-${p.id}`} style={{...s.card, borderRadius: btnRadius}} className="post-card">
                    <div style={{...s.cardHead, justifyContent: 'space-between'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                        <div onClick={() => handleViewProfile(directory.find(u => u.name === p.username) || {name: p.username, profilePic: displayPic})} style={{cursor: 'pointer'}}>
                           <DefaultAvatar size={40} src={displayPic} borderColor={p.username.toLowerCase() === "yousef jo" ? "#ffd700" : "transparent"} />
                        </div>
                        <span style={{fontWeight:'700', fontSize: '15px', cursor: 'pointer'}} onClick={() => handleViewProfile(directory.find(u => u.name === p.username) || {name: p.username, profilePic: displayPic})}>{displayName}</span>
                      </div>
                      
                      {/* Fixed Delete Button logic */}
                      {(p.username === user.name || isOwner) && 
                        <Trash2 size={20} color="#ff4d4d" style={{cursor:'pointer', opacity: 0.7}} onClick={() => handleDeletePost(p)} />
                      }
                    </div>

                    {p.video ? (
                      <video src={p.video} controls style={{...s.cardImg, backgroundColor:'#000'}} />
                    ) : (
                      p.image && <img src={p.image} style={s.cardImg} alt="" />
                    )}

                    <div style={{padding:'16px'}}>
                      <p style={{fontSize: '15px', lineHeight: '1.4'}}><strong>{displayName}</strong> {p.caption}</p>
                      
                      <div style={{display:'flex', gap:'20px', marginTop:'16px', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '12px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'}} onClick={() => handleLike(p.id)}>
                          <Heart size={24} fill={p.likes?.includes(user.name) ? '#ff4d4d' : 'none'} color={p.likes?.includes(user.name) ? '#ff4d4d' : '#444'} />
                          <span style={{fontSize: '14px', fontWeight: 'bold'}}>{p.likes?.length || 0}</span>
                        </div>
                        <MessageSquare size={24} color="#444" style={{cursor:'pointer'}} onClick={() => setReplyInput({postId: p.id, text: ''})} />
                        
                        <div 
                          style={{display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: themeColor, fontWeight: 'bold', background: `${themeColor}15`, padding: '6px 12px', borderRadius: '24px'}}
                          onClick={() => { setSharingPost(p); setIsShareModalOpen(true); }}
                        >
                          <Send size={18} />
                          <span style={{fontSize: '13px'}}>Send</span>
                        </div>

                        <Repeat size={24} color="#444" style={{cursor:'pointer'}} onClick={() => handleRemix(p)} />
                        <Share2 size={24} color="#444" style={{cursor:'pointer', marginLeft: 'auto'}} onClick={() => handleShare(p)} />
                      </div>

                      <div style={{marginTop: '16px'}}>
                        {isExpanded && hasMore && (
                            <div 
                             style={{display:'flex', alignItems:'center', gap:'5px', color:'#8e8e8e', fontSize:'12px', cursor:'pointer', marginBottom:'8px'}}
                             onClick={() => toggleExpand(p.id)}
                            >
                              <EyeOff size={14} /> Hide all replies
                            </div>
                        )}

                        {repliesToShow.map(r => (
                          <div key={r.id} style={{fontSize:'13px', marginTop:'6px', padding:'8px 12px', background:'#f5f5f5', borderRadius:'16px'}}>
                            <strong>{r.user}</strong> {r.text}
                          </div>
                        ))}

                        {hasMore && !isExpanded && (
                          <div 
                            style={{color: themeColor, fontSize:'13px', fontWeight:'600', cursor:'pointer', marginTop:'10px', display:'flex', alignItems:'center', gap:'4px'}}
                            onClick={() => toggleExpand(p.id)}
                          >
                            <ChevronDown size={16} /> Show {p.replies.length - 3} more replies
                          </div>
                        )}
                      </div>

                      <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                        <input style={{...s.input, width:'100%', borderRadius: '24px'}} placeholder="Add a comment..." 
                          value={replyInput.postId === p.id ? replyInput.text : ''} 
                          onChange={e => setReplyInput({postId: p.id, text: e.target.value})}
                          onKeyDown={e => e.key === 'Enter' && handleReplySubmit(p.id)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : view === 'search' ? (
            <SearchPage directory={directory} posts={posts} themeColor={themeColor} handleViewProfile={handleViewProfile} />
          ) : view === 'favorites' ? (
            <FavoritePage posts={posts} currentUser={user} themeColor={themeColor} handleLike={handleLike} />
          ) : view === 'settings' ? (
            <Set themeColor={themeColor} user={user} setUser={setUser} />
          ) : null}
        </div>
      </main>

      {isOwner && (
        <div style={{...s.commandBar, borderTop: `2px solid ${themeColor}`}}>
          <Terminal size={18} color={themeColor} style={{marginRight: '12px'}} />
          <form onSubmit={handleRunCommand} style={{flex: 1}}>
            <input 
              style={{...s.commandInput, color: themeColor}} 
              placeholder="root@chitty:~$ type help" 
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
            />
          </form>
        </div>
      )}

      {/* New Create Post Modal */}
      {isModalOpen && (
        <div style={s.overlay}>
          <div style={{...s.modal, animation: 'fadeIn 0.2s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>Create New Moment</h3>
              <X size={24} style={{cursor: 'pointer'}} onClick={() => setIsModalOpen(false)} />
            </div>
            <form onSubmit={createPost} style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px'}}>
              <textarea 
                placeholder="What's on your mind?" 
                style={{...s.input, minHeight: '100px', resize: 'none', borderRadius: '16px'}}
                value={postInput.caption}
                onChange={e => setPostInput({...postInput, caption: e.target.value})}
                autoFocus
              />
              <input 
                placeholder="Image URL (optional)" 
                style={s.input}
                value={postInput.img}
                onChange={e => setPostInput({...postInput, img: e.target.value})}
              />
              <button type="submit" style={dynamicBtn} className="primary-btn">Share Post</button>
            </form>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {isThemeOpen && (
        <div style={s.overlay}>
          <div style={{...s.modal, animation: 'fadeIn 0.2s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h3 style={{margin: 0}}>Appearance</h3>
              <X size={24} style={{cursor: 'pointer'}} onClick={() => setIsThemeOpen(false)} />
            </div>
            
            <p style={s.label}>Theme Color</p>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
              {['#6750A4', '#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#0f1111'].map(color => (
                <div 
                  key={color} 
                  onClick={() => setThemeColor(color)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: color, 
                    cursor: 'pointer', border: themeColor === color ? '3px solid #333' : 'none',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {themeColor === color && <Check size={20} color="#fff" />}
                </div>
              ))}
            </div>

            <p style={s.label}>Button Radius</p>
            <div style={{display: 'flex', gap: '10px'}}>
              {['8px', '16px', '24px'].map(rad => (
                <button 
                  key={rad}
                  onClick={() => setBtnRadius(rad)}
                  style={{
                    flex: 1, padding: '10px', border: btnRadius === rad ? `2px solid ${themeColor}` : '1px solid #ddd',
                    background: btnRadius === rad ? `${themeColor}15` : '#fff', borderRadius: rad, cursor: 'pointer',
                    fontWeight: 'bold', color: btnRadius === rad ? themeColor : '#555', transition: '0.2s'
                  }}
                >
                  {rad === '8px' ? 'Square' : rad === '16px' ? 'Rounded' : 'Pill'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div style={s.overlay}>
          <div style={{...s.modal, animation: 'fadeIn 0.2s ease-out'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h3 style={{margin: 0}}>Send to...</h3>
              <X size={24} style={{cursor: 'pointer'}} onClick={() => setIsShareModalOpen(false)} />
            </div>
            
            <button 
              style={{...dynamicBtn, marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'}}
              onClick={handleMassSend}
            >
              <Users size={20} /> Send to All Friends
            </button>
            
            <p style={s.label}>Or send individually:</p>
            <div style={{maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px'}}>
              {directory.filter(u => u.name !== user.name).map(friend => (
                <div key={friend.name} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#f9f9f9', borderRadius: '12px', transition: '0.2s'}} className="hover-lift">
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <DefaultAvatar size={36} src={friend.profilePic} />
                    <span style={{fontWeight: '600', color: '#333'}}>{friend.name}</span>
                  </div>
                  <button 
                    style={{background: themeColor, color: '#fff', border: 'none', padding: '6px 16px', borderRadius: btnRadius, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'}}
                    onClick={() => { handleSendToFriend(friend); setIsShareModalOpen(false); }}
                  >
                    Send
                  </button>
                </div>
              ))}
              
              {directory.filter(u => u.name !== user.name).length === 0 && (
                <p style={{textAlign: 'center', color: '#999', fontSize: '14px', marginTop: '10px'}}>No friends available to send to.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;