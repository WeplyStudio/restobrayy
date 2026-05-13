import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, X, Plus, Minus, ArrowRight, Star, Clock, MapPin, BadgeCheck, Tag, Ticket, History, Eye, ChefHat, Menu as MenuIcon, User, Send, CheckCircle2, Sun, Moon } from 'lucide-react';
import { MenuItem, Category, Order } from '../types';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id as indo } from 'date-fns/locale';

const formatIDR = (number: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const TAG_STYLES: Record<string, string> = {
  'Chef\'s Pick': 'bg-[#c9a96e] text-black border-[#c9a96e]',
  'New': 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--border-primary)]',
  'Premium': 'bg-[#c9a96e] text-black border-[#c9a96e]',
  'Bestseller': 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--border-primary)]',
};

const NoiseBg = () => (
  <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.035, pointerEvents: 'none', zIndex: 0 }}>
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noise)" />
  </svg>
);

export function CustomerPage() {
  const { theme, toggleTheme } = useTheme();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  
  // New States for Tracking & Queue
  const [showStatus, setShowStatus] = useState<'none' | 'tracking' | 'queue'>('none');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentQueue, setCurrentQueue] = useState(0);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  const { items: cart, addItem, removeItem, updateQuantity, total, clearCart } = useCart();

  const activeOrder = useMemo(() => {
    return myOrders.find(o => ['pending', 'paid', 'preparing', 'ready'].includes(o.status));
  }, [myOrders]);

  const [viewMode, setViewMode] = useState<'menu' | 'active'>('menu');

  useEffect(() => {
    if (activeOrder && viewMode === 'menu' && !localStorage.getItem('dismissed_active_order')) {
      setViewMode('active');
    }
  }, [activeOrder]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, catsData, queueData] = await Promise.all([
          api.getMenuItems(),
          api.getCategories(),
          api.getQueueStatus()
        ]);
        setItems(itemsData);
        setCategories(catsData);
        setCurrentQueue(queueData.currentNumber || 0);
      } catch (err) {
        console.error("Failed to fetch menu data:", err);
      }
    };

    fetchData();

    // Poll for queue status every 10 seconds
    const interval = setInterval(async () => {
      const queueData = await api.getQueueStatus();
      setCurrentQueue(queueData.currentNumber || 0);
    }, 10000);

    const savedIds = JSON.parse(localStorage.getItem('restoflow_orders') || '[]');
    if (savedIds.length > 0) {
      const fetchMyOrders = async () => {
        try {
          const orders = await api.getOrders();
          setMyOrders(orders.filter((o: any) => savedIds.includes(o._id || o.id)));
        } catch (err) {
          console.error("Failed to fetch my orders:", err);
        }
      };
      fetchMyOrders();
      const orderInterval = setInterval(fetchMyOrders, 15000); // Poll orders
      return () => { clearInterval(interval); clearInterval(orderInterval); };
    }

    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (activeCategory === 'All') return items;
    return items.filter(p => p.categoryId === activeCategory);
  }, [items, activeCategory]);

  const applyPromo = async () => {
    try {
      const promos = await api.getPromoCodes();
      const promo = promos.find((p: any) => p.code === promoCodeInput && p.isActive);
      
      if (!promo) {
        toast.error('Promo tidak valid'); return;
      }
      if (total < (promo.minPurchase || 0)) {
        toast.error(`Min purchase Rp ${promo.minPurchase.toLocaleString()}`); return;
      }
      let discount = promo.type === 'percent' ? (total * promo.value) / 100 : promo.value;
      setAppliedPromo({ code: promo.code, discount });
      toast.success('Promo terpasang!');
    } catch (err: any) { 
      toast.error('Gagal memproses promo'); 
    }
  };

  const handleCheckout = async () => {
    if (!customerName) { toast.error('Nama diperlukan'); return; }
    setIsCheckingOut(true);
    try {
      const finalTotal = Math.max(0, total - (appliedPromo?.discount || 0));
      const orderData = {
        customerName,
        items: cart,
        total,
        promoCode: appliedPromo?.code || null,
        discount: appliedPromo?.discount || 0,
        finalTotal,
        status: 'pending',
        paymentMethod: 'qris'
      };

      const result = await api.createOrder(orderData);
      
      const saved = JSON.parse(localStorage.getItem('restoflow_orders') || '[]');
      localStorage.setItem('restoflow_orders', JSON.stringify([...saved, result._id || result.id]));
      
      toast.success('Pesanan dibuat!');
      setIsCartOpen(false); clearCart(); setAppliedPromo(null); setCustomerName(''); setPromoCodeInput('');
      setShowStatus('tracking');
    } catch (err: any) { 
      toast.error(err.message || 'Checkout gagal'); 
    }
    finally { setIsCheckingOut(false); }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--text-primary)] selection:text-[var(--bg-primary)]">
      <NoiseBg />

      <div className="relative w-full h-[30vh] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=1800" className={`w-full h-full object-cover ${theme === 'dark' ? 'brightness-[0.3]' : 'brightness-[0.9]'}`} alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
        
        {/* Minimal Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)] transition-colors">
                 <ChefHat size={18} />
              </div>
              <span className="font-serif text-lg italic font-bold">RestoFlow</span>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme} 
                className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 border border-[var(--border-primary)] backdrop-blur flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsMenuOpen(true)} className="w-10 h-10 rounded-full bg-[var(--text-primary)]/5 border border-[var(--border-primary)] backdrop-blur flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--text-primary)]/10 transition-colors">
                 <MenuIcon size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 -mt-16 pb-40">
        
        {/* Conditionally Render Active Order Ticket or Menu */}
        <AnimatePresence mode="wait">
          {viewMode === 'active' && activeOrder ? (
            <motion.div 
               key="active-order"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="mb-12"
            >
               <div className="relative bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-[32px] overflow-hidden shadow-2xl shadow-[var(--border-primary)]">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <Ticket size={120} strokeWidth={1} />
                  </div>
                  
                  <div className="p-8 md:p-12 relative">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-secondary)] mb-2">Live Order Status</p>
                           <h2 className="text-4xl md:text-6xl font-black tabular-nums">#{activeOrder.queueNumber.toString().padStart(3, '0')}</h2>
                        </div>
                        <div className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 rounded-2xl flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
                           <div className="w-2 h-2 rounded-full bg-[var(--bg-primary)] animate-pulse" />
                           {activeOrder.status}
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8 items-end">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <User size={18} className="text-[var(--text-secondary)]" />
                              <p className="text-xl font-bold">{activeOrder.customerName}</p>
                           </div>
                           <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                              <MapPin size={18} />
                              <p className="text-sm font-medium">Table 01 · Indoor Section</p>
                           </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-4">
                           <button onClick={() => { localStorage.setItem('dismissed_active_order', 'true'); setViewMode('menu'); }} className="text-[10px] font-mono uppercase tracking-widest border-b border-[var(--border-primary)] pb-1 hover:text-[var(--text-primary)] transition-colors">Continue Browsing Menu</button>
                        </div>
                     </div>
                  </div>

                  {/* Perforated edge effect */}
                  <div className="h-4 w-full bg-[var(--bg-primary)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 98% 80%, 96% 100%, 94% 80%, 92% 100%, 90% 80%, 88% 100%, 86% 80%, 84% 100%, 82% 80%, 80% 100%, 78% 80%, 76% 100%, 74% 80%, 72% 100%, 70% 80%, 68% 100%, 66% 80%, 64% 100%, 62% 80%, 60% 100%, 58% 80%, 56% 100%, 54% 80%, 52% 100%, 50% 80%, 48% 100%, 46% 80%, 44% 100%, 42% 80%, 40% 100%, 38% 80%, 36% 100%, 34% 80%, 32% 100%, 30% 80%, 28% 100%, 26% 80%, 24% 100%, 22% 80%, 20% 100%, 18% 80%, 16% 100%, 14% 80%, 12% 100%, 10% 80%, 8% 100%, 6% 80%, 4% 100%, 2% 80%, 0 100%)' }} />
               </div>

               <div className="mt-8 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-[24px]">
                     <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">Estimated Ready</h4>
                     <div className="flex items-center gap-4">
                        <Clock size={24} className="text-[var(--text-primary)]" />
                        <span className="text-2xl font-bold">15 - 20 Mins</span>
                     </div>
                  </div>
                  <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-[24px]">
                     <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-4">Item Count</h4>
                     <div className="flex items-center gap-4">
                        <ChefHat size={24} className="text-[var(--text-primary)]" />
                        <span className="text-2xl font-bold">{activeOrder.items.reduce((a: any, b: any) => a + b.quantity, 0)} Items</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          ) : (
            <motion.div 
               key="main-menu"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
            >
              {/* Profile Card Minimal */}
              <section className="bg-[var(--bg-secondary)] backdrop-blur-3xl border border-[var(--border-primary)] rounded-[32px] p-8 md:p-10 shadow-2xl mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-center md:text-left">
                    <h1 className="font-serif text-3xl md:text-5xl font-semibold leading-tight">
                      <span>RestoFlow</span> <span className="font-light italic text-[var(--text-secondary)]">Gourmet</span>
                    </h1>
                    <div className="flex justify-center md:justify-start gap-3 mt-4">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--text-primary)]/5 rounded-full text-[10px] font-mono tracking-widest border border-[var(--border-primary)] text-[var(--text-secondary)]">
                        <Star size={10} className={`fill-[var(--text-primary)] text-[var(--text-primary)]`} /> 4.9
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--text-primary)]/5 rounded-full text-[10px] font-mono tracking-widest border border-[var(--border-primary)] text-[var(--text-secondary)]">
                        <Clock size={10} /> 25 MIN
                      </div>
                    </div>
                  </div>

                  {activeOrder && (
                     <button onClick={() => setViewMode('active')} className="bg-[var(--text-primary)] text-[var(--bg-primary)] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                        <Ticket size={14} /> View Live Ticket
                     </button>
                  )}

                  {!activeOrder && (
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-4 rounded-2xl flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-mono text-[var(--text-secondary)] mb-1">Live Queue</p>
                        <p className="text-xl font-bold text-[var(--text-primary)] tabular-nums leading-none">#{currentQueue.toString().padStart(3, '0')}</p>
                      </div>
                      <div className="w-[1px] h-8 bg-[var(--border-primary)]" />
                      <Ticket size={24} className="text-[var(--text-secondary)]" />
                    </div>
                  )}
                </div>
              </section>

              {/* Categories Section */}
              <div className="mb-8">
                 <span className="font-mono text-[10px] text-[var(--text-primary)] uppercase tracking-[0.3em] mb-2 block">Menu Categories</span>
                 <h2 className="font-serif text-3xl md:text-5xl font-medium italic">Today's Selection</h2>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredItems.map((item, idx) => (
                  <motion.div 
                    key={item.id} 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className={`group relative overflow-hidden rounded-[32px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] h-[340px] md:h-[400px] cursor-pointer shadow-lg`}
                    onClick={() => { if(item.stock > 0) { addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 }); toast.success(`${item.name} ditambahkan`); } else { toast.error('Stok habis'); } }}
                  >
                    <div className="absolute inset-0">
                      <img src={item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/20 to-transparent" />
                    </div>

                    <div className="absolute top-4 left-4">
                      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border bg-[var(--bg-primary)]/60 backdrop-blur-md ${item.stock < 10 ? 'text-red-400 border-red-500/30' : 'text-[var(--text-primary)] border-[var(--border-primary)]'}`}>
                        {item.stock < 10 ? `Only ${item.stock} left` : 'Ready'}
                      </span>
                    </div>

                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-[var(--text-primary)] text-[10px] font-mono uppercase tracking-[0.2em] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">Select Item</p>
                        <h3 className="text-xl md:text-2xl font-serif italic font-medium tracking-tight mb-2">{item.name}</h3>
                        <div className="flex justify-between items-center">
                          <p className="text-lg font-black text-[var(--text-primary)]/90">{formatIDR(item.price)}</p>
                          <div className="w-10 h-10 bg-[var(--text-primary)]/10 backdrop-blur-md rounded-full flex items-center justify-center border border-[var(--border-primary)] group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all">
                             <Plus size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimalism Footer */}
      <footer className="relative z-10 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-2">
               <div className="w-6 h-6 rounded bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)]">
                 <ChefHat size={14} />
               </div>
               <span className="font-serif text-lg italic font-bold">Restoflow</span>
            </div>
            <p className="text-[var(--text-secondary)] text-xs font-mono tracking-widest max-w-sm">Crafting premium culinary experiences since 2024. Elevating the art of dining with modern technology.</p>
          </div>
          
          <div className="flex gap-12 text-center md:text-right">
             <div className="space-y-4 font-mono text-[10px] tracking-widest text-[var(--text-secondary)] uppercase">
                <p className="text-[var(--text-secondary)]">Navigation</p>
                <div className="flex flex-col gap-2">
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Digital Menu</a>
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Daily Specials</a>
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Reservations</a>
                </div>
             </div>
             <div className="space-y-4 font-mono text-[10px] tracking-widest text-[var(--text-secondary)] uppercase">
                <p className="text-[var(--text-secondary)]">Support</p>
                <div className="flex flex-col gap-2">
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Tracking</a>
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Help Center</a>
                   <a href="#" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
                </div>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">
           <p>© 2024 Restoflow Systems. All Rights Reserved.</p>
           <p>Designed for Excellence.</p>
        </div>
      </footer>

      {/* Floating Category Filter (Minimalist) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-fit">
        <div className="bg-[var(--bg-primary)]/80 backdrop-blur-3xl border border-[var(--border-primary)] p-1.5 rounded-full shadow-2xl flex items-center gap-1">
          <button onClick={() => setActiveCategory('All')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'All' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} 
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat.id ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              {cat.name}
            </button>
          ))}
          <div className="w-[1px] h-4 bg-[var(--border-primary)] mx-2" />
          <button onClick={() => setIsCartOpen(true)} className={`relative flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${cart.length > 0 ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            <ShoppingCart size={12} />
            {cart.length > 0 && <span>{cart.reduce((a,c) => a + c.quantity,0)} ITEMS</span>}
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--bg-primary)]" />}
          </button>
        </div>
      </div>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} 
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[110] w-full md:w-[400px] bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col p-12"
            >
               <div className="flex justify-between items-center mb-16">
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--text-secondary)]">Menu Navigation</span>
                  <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 flex items-center justify-center bg-[var(--text-primary)]/5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 space-y-12">
                  <div className="space-y-6">
                     <p className="font-serif text-3xl italic text-[var(--text-secondary)]">Personal</p>
                     <nav className="flex flex-col gap-6">
                        <button className="flex items-center gap-4 text-xl font-bold group">
                           <div className="w-12 h-12 bg-[var(--text-primary)]/5 rounded-2xl flex items-center justify-center group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all"><User size={20}/></div>
                           <span>Your Profile</span>
                        </button>
                        <button onClick={() => { setIsMenuOpen(false); setShowStatus('tracking'); }} className="flex items-center gap-4 text-xl font-bold group">
                           <div className="w-12 h-12 bg-[var(--text-primary)]/5 rounded-2xl flex items-center justify-center group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all"><History size={20}/></div>
                           <span>Order History</span>
                        </button>
                        {activeOrder && (
                          <button onClick={() => { setIsMenuOpen(false); setViewMode('active'); }} className="flex items-center gap-4 text-xl font-bold group">
                             <div className="w-12 h-12 bg-[var(--text-primary)] rounded-2xl flex items-center justify-center text-[var(--bg-primary)] transition-all"><Ticket size={20}/></div>
                             <span>Active Ticket</span>
                          </button>
                        )}
                     </nav>
                  </div>

                  <div className="pt-12 border-t border-[var(--border-primary)]">
                     <div className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] p-8 rounded-[32px] border border-[var(--border-primary)]">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2">Need Assistance?</p>
                        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">Our concierge is ready to help you with your dining experience.</p>
                        <button className="w-full flex items-center justify-center gap-2 bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                           <Send size={14} /> Contact Concierge
                        </button>
                     </div>
                  </div>
               </div>
               
               <div className="mt-auto pt-12 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center font-mono text-[10px] font-black">RF</div>
                  <div>
                    <p className="text-xs font-bold">Restoflow v2.4.0</p>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase">Premium Build</p>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer Overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} 
              className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[80] w-full md:w-[480px] bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${theme === 'dark' ? 'bg-white' : 'bg-black'}`} />
              <div className="p-8 border-b border-[var(--border-primary)] flex items-center justify-between">
                <div>
                   <p className="text-[var(--text-secondary)] font-mono text-[10px] uppercase tracking-widest mb-1">My Selections</p>
                   <h2 className="font-serif text-3xl italic">Order Tray</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-[var(--text-primary)]/5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                 {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                      <ShoppingCart size={64} className="text-[var(--text-secondary)]" />
                      <p className="font-serif text-2xl italic tracking-tight">Your tray is empty</p>
                   </div>
                 ) : (
                   cart.map(item => (
                     <div key={item.id} className="flex gap-4 items-center group">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] overflow-hidden flex items-center justify-center">
                           <ChefHat size={20} className="text-[var(--text-secondary)]" />
                        </div>
                        <div className="flex-1">
                           <p className="font-bold text-[var(--text-primary)] leading-tight mb-1">{item.name}</p>
                           <p className="text-[var(--text-secondary)] font-mono text-xs">{formatIDR(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--bg-primary)] border border-[var(--border-primary)] p-1 rounded-full">
                           <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-full hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"><Minus size={12}/></button>
                           <span className="text-xs font-black tabular-nums">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-full hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"><Plus size={12}/></button>
                        </div>
                     </div>
                   ))
                 )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] space-y-6">
                   <div className="space-y-4">
                      <input type="text" placeholder="Gunakan Kode Promo" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value)} 
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl px-5 py-3 text-sm focus:border-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-secondary)]" />
                      <button onClick={applyPromo} className="w-full py-2 bg-[var(--text-primary)]/10 hover:bg-[var(--text-primary)]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] transition-all">Apply Promotion</button>
                      <input type="text" placeholder="Nama Pemesan" value={customerName} onChange={e => setCustomerName(e.target.value)} 
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl px-5 py-4 font-bold text-lg focus:border-[var(--text-primary)] outline-none transition-all" />
                   </div>

                   <div className="space-y-2 pt-2">
                       <div className="flex justify-between text-xs text-[var(--text-secondary)] uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span>{formatIDR(total)}</span>
                       </div>
                       {appliedPromo && (
                         <div className="flex justify-between text-xs text-green-400 uppercase tracking-widest">
                            <span>Promotion Applied</span>
                            <span>-{formatIDR(appliedPromo.discount)}</span>
                         </div>
                       )}
                       <div className="flex justify-between items-end pt-4 border-t border-[var(--border-primary)]">
                          <span className="font-mono text-[10px] uppercase text-[var(--text-secondary)]">Order Total</span>
                          <span className="font-serif text-4xl font-bold tracking-tighter">{formatIDR(Math.max(0, total - (appliedPromo?.discount || 0)))}</span>
                       </div>
                   </div>

                   <button 
                     disabled={isCheckingOut} onClick={handleCheckout}
                     className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/5 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                     {isCheckingOut ? 'Processing...' : 'PAY & PLACE ORDER'}
                     {!isCheckingOut && <ArrowRight size={16} />}
                   </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ icon, label, sub }: { icon: any, label: string, sub?: string }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--text-primary)]/5 border border-[var(--border-primary)] px-4 py-2 rounded-full">
      {icon}
      <span className="font-bold text-xs">{label}</span>
      {sub && <span className="text-[10px] text-[var(--text-secondary)] font-medium">{sub}</span>}
    </div>
  );
}
