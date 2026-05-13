import { useState, useEffect } from 'react';
import { AdminPage } from './pages/AdminPage';
import { CustomerPage } from './pages/CustomerPage';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Simple router
  const renderView = () => {
    if (path === '/admin') {
      return <AdminPage />;
    }
    return <CustomerPage />;
  };

  return (
    <ThemeProvider>
      <CartProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-text)',
              borderRadius: '16px',
              border: '1px solid var(--toast-border)',
              fontSize: '14px',
              fontWeight: 'bold'
            },
          }}
        />
        {renderView()}
      </CartProvider>
    </ThemeProvider>
  );
}

