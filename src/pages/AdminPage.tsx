import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AdminDashboard } from '../components/AdminDashboard';
import { LayoutDashboard, LogIn, Utensils, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // For development, allow specific email or any logged in user as admin
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--text-primary)]"></div>
    </div>
  );

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-[var(--text-primary)]/5 rounded-full flex items-center justify-center mx-auto text-[var(--text-primary)]">
            <LayoutDashboard size={40} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">RestoFlow Admin</h1>
            <p className="text-[var(--text-secondary)] text-xs mt-2 uppercase tracking-widest font-mono">Administration Portal</p>
          </div>
          {!user ? (
            <button 
              onClick={login}
              className="w-full flex items-center justify-center gap-3 bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all shadow-xl shadow-[var(--text-primary)]/5"
            >
              <LogIn size={18} />
              Login with Google
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-[var(--text-primary)] text-[10px] font-black uppercase tracking-[0.2em] bg-[var(--text-primary)]/10 py-3 rounded-xl border border-[var(--border-primary)]">Access Denied: Not Admin</p>
              <button 
                onClick={() => auth.signOut()}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2 mx-auto text-[10px] uppercase font-mono tracking-widest"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
          <a href="/" className="block text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-mono tracking-tighter mt-4 uppercase">Return to Catalog</a>
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
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[var(--text-primary)]">{user.displayName}</p>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-mono">Operations</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => auth.signOut()} className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <AdminDashboard />
      </main>
    </div>
  );
}
