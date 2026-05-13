import { useState, useEffect, FormEvent } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { LayoutDashboard, LogIn, Utensils, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loggedIn = localStorage.getItem('restoflow_admin_logged_in');
    if (loggedIn === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('restoflow_admin_logged_in', 'true');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('restoflow_admin_logged_in');
    window.location.reload();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <div className="w-20 h-20 bg-[var(--text-primary)] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[var(--text-primary)]/10">
              <Utensils className="text-[var(--bg-primary)]" size={32} />
            </div>
            <h1 className="text-4xl font-serif italic mb-2 tracking-tight">Restoflow</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--text-secondary)]">Concierge Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2 ml-4">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 focus:border-[var(--text-primary)] focus:bg-[var(--text-primary)]/10 outline-none transition-all font-bold"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2 ml-4">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl px-6 py-4 focus:border-[var(--text-primary)] focus:bg-[var(--text-primary)]/10 outline-none transition-all font-bold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[var(--text-primary)]/5 flex items-center justify-center gap-3"
            >
              <LogIn size={18} />
              Access Dashboard
            </button>
          </form>

          <a href="/" className="block text-center mt-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-mono tracking-tighter uppercase">Return to Catalog</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[var(--text-primary)] rounded-xl flex items-center justify-center text-[var(--bg-primary)]">
                <LayoutDashboard size={20} />
             </div>
             <h1 className="font-serif italic text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest bg-[var(--text-primary)]/5 px-6 py-3 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--text-primary)]/10 transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
