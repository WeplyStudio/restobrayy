import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  TrendingUp, 
  ShoppingBag, 
  Coffee, 
  Ticket as PromoIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X as XIcon,
  Filter,
  BarChart4
} from 'lucide-react';
import { Category, MenuItem, Order, PromoCode } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type AdminTab = 'orders' | 'menu' | 'promos' | 'reports';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5">
        <TabButton id="orders" label="Pesanan" icon={ShoppingBag} active={activeTab === 'orders'} onClick={setActiveTab} />
        <TabButton id="menu" label="Menu" icon={Coffee} active={activeTab === 'menu'} onClick={setActiveTab} />
        <TabButton id="promos" label="Promo" icon={PromoIcon} active={activeTab === 'promos'} onClick={setActiveTab} />
        <TabButton id="reports" label="Laporan" icon={BarChart4} active={activeTab === 'reports'} onClick={setActiveTab} />
      </div>

      <div className="bg-[#0c0c0c] rounded-[32px] border border-white/5 shadow-2xl overflow-hidden min-h-[600px]">
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'menu' && <AdminMenu />}
        {activeTab === 'promos' && <AdminPromos />}
        {activeTab === 'reports' && <AdminReports />}
      </div>
    </div>
  );
}

function TabButton({ id, label, icon: Icon, active, onClick }: { id: any, label: string, icon: any, active: boolean, onClick: (id: any) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// --- SUB COMPONENTS ---

function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateOrderStatus(id, status);
      toast.success('Status pesanan diperbarui');
      // Refresh local state
      setOrders(prev => prev.map(o => (o._id || o.id) === id ? { ...o, status } : o));
    } catch (err) {
      toast.error('Gagal memperbarui status');
    }
  };

  const filteredOrders = Array.isArray(orders) ? orders.filter(o => filter === 'all' || o.status === filter) : [];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Operations</p>
           <h3 className="text-2xl font-bold">Recent Orders</h3>
        </div>
        <select 
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-white transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all" className="bg-black">All Status</option>
          <option value="pending" className="bg-black">Pending</option>
          <option value="paid" className="bg-black">Paid</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-zinc-600 text-[10px] uppercase font-mono tracking-[0.2em] border-b border-white/5">
              <th className="pb-6 font-medium">Queue</th>
              <th className="pb-6 font-medium">Customer</th>
              <th className="pb-6 font-medium">Total</th>
              <th className="pb-6 font-medium">Status</th>
              <th className="pb-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredOrders.map(order => (
              <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="py-6 font-black text-white tabular-nums">#{order.queueNumber?.toString().padStart(3, '0') || '000'}</td>
                <td className="py-6">
                  <p className="font-bold text-white mb-1">{order.customerName}</p>
                  <div className="flex flex-wrap gap-2">
                     {order.items?.map((i, idx) => (
                        <span key={idx} className="text-[9px] font-mono tracking-tighter bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                           {i.quantity}x {i.name}
                        </span>
                     ))}
                  </div>
                </td>
                <td className="py-6 font-black text-white">Rp {order.finalTotal?.toLocaleString() || '0'}</td>
                <td className="py-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 ${
                    order.status === 'completed' ? 'bg-white text-black' :
                    order.status === 'paid' ? 'bg-zinc-800 text-white' :
                    order.status === 'preparing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                    order.status === 'ready' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    order.status === 'cancelled' ? 'bg-zinc-900 text-zinc-500' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-6">
                  <div className="flex gap-2 justify-end">
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order._id || order.id, 'paid')} className="w-10 h-10 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center"><Check size={16} /></button>
                    )}
                    {(order.status === 'paid') && (
                      <button onClick={() => updateStatus(order._id || order.id, 'preparing')} className="w-10 h-10 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center" title="Start Preparing"><Coffee size={16} /></button>
                    )}
                    {(order.status === 'preparing') && (
                      <button onClick={() => updateStatus(order._id || order.id, 'ready')} className="w-10 h-10 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center justify-center" title="Mark as Ready"><Check size={16} /></button>
                    )}
                    {(order.status === 'ready') && (
                      <button onClick={() => updateStatus(order._id || order.id, 'completed')} className="w-10 h-10 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center" title="Complete Order"><ShoppingBag size={16} /></button>
                    )}
                    {(order.status === 'completed') && (
                      <div className="w-10 h-10 flex items-center justify-center text-zinc-600"><Check size={16}/></div>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button onClick={() => updateStatus(order._id || order.id, 'cancelled')} className="w-10 h-10 bg-white/5 text-zinc-500 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center"><XIcon size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsData, catsData] = await Promise.all([api.getMenuItems(), api.getCategories()]);
        setItems(itemsData);
        setCategories(catsData);
      } catch (err) {
        console.error("Failed to fetch menu items/categories:", err);
      }
    };
    fetchData();
  }, []);

  const saveItem = async (e: any) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const itemData = {
      name: data.get('name') as string,
      description: data.get('description') as string,
      price: Number(data.get('price')),
      stock: Number(data.get('stock')),
      categoryId: data.get('categoryId') as string,
      imageUrl: data.get('imageUrl') as string,
      isActive: true,
    };

    try {
      if (editingItem?._id || editingItem?.id) {
        await api.updateMenuItem(editingItem._id || editingItem.id, itemData);
        toast.success('Item diperbarui');
      } else {
        await api.createMenuItem(itemData);
        toast.success('Item ditambahkan');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      // Refresh items
      const itemsData = await api.getMenuItems();
      setItems(itemsData);
    } catch (err) {
      toast.error('Gagal menyimpan item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Hapus item ini?')) return;
    try {
      await api.deleteMenuItem(id);
      setItems(prev => prev.filter(i => (i._id || i.id) !== id));
      toast.success('Item dihapus');
    } catch (err) {
      toast.error('Gagal menghapus item');
    }
  };

  const addCategory = async () => {
    const name = prompt('Nama Kategori Baru:');
    if (!name) return;
    try {
      await api.createCategory(name);
      const catsData = await api.getCategories();
      setCategories(catsData);
      toast.success('Kategori ditambahkan');
    } catch (err) {
      toast.error('Gagal menambahkan kategori');
    }
  };

  return (
    <div className="p-8 space-y-8">
       <div className="flex justify-between items-center">
        <div>
           <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Catalog</p>
           <h3 className="text-2xl font-bold">Menu Inventory</h3>
        </div>
        <div className="flex gap-3">
          <button onClick={addCategory} className="bg-white/5 border border-white/10 text-zinc-400 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Categories
          </button>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/5 transition-all">
            New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4 group hover:border-white/20 transition-all">
             <div className="flex justify-between items-start">
               <div className="flex-1">
                 <h4 className="font-bold text-white text-lg leading-tight mb-1">{item.name}</h4>
                 <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{categories.find(c => c.id === item.categoryId)?.name}</p>
               </div>
               <p className="font-black text-white">Rp {item.price.toLocaleString()}</p>
             </div>
             <div className="flex justify-between items-center">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.stock > 10 ? 'bg-white/5 text-zinc-400 border-white/5' : 'bg-white text-black border-white'}`}>
                  Stock: {item.stock}
                </span>
                <div className="flex gap-2">
                   <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"><Edit3 size={14}/></button>
                   <button onClick={() => deleteItem(item.id)} className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all"><Trash2 size={14}/></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <form onSubmit={saveItem} className="bg-[#0c0c0c] border border-white/10 rounded-[40px] p-10 w-full max-w-xl space-y-8 shadow-2xl relative">
              <button type="button" onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
                 <XIcon size={24} />
              </button>
              
              <div>
                 <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2">Item Configuration</p>
                 <h3 className="text-3xl font-serif italic text-white">{editingItem ? 'Refine Item' : 'New Selection'}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 block">Name</label>
                  <input name="name" defaultValue={editingItem?.name} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none transition-all" />
                </div>
                <div>
                   <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 block">Price (IDR)</label>
                   <input name="price" type="number" defaultValue={editingItem?.price} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none transition-all" />
                </div>
                <div>
                   <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 block">Stock Count</label>
                   <input name="stock" type="number" defaultValue={editingItem?.stock} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none transition-all" />
                </div>
                <div className="col-span-2">
                   <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 block">Category Selection</label>
                   <select name="categoryId" defaultValue={editingItem?.categoryId} required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none transition-all appearance-none">
                      {categories.map(c => <option key={c.id} value={c.id} className="bg-black text-white">{c.name}</option>)}
                   </select>
                </div>
                <div className="col-span-2">
                   <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 block">Image URL</label>
                   <input name="imageUrl" defaultValue={editingItem?.imageUrl} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white/5 border border-white/10 text-zinc-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5">Complete Item</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}

function AdminPromos() {
  const [promos, setPromos] = useState<PromoCode[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getPromoCodes();
        setPromos(data);
      } catch (err) {
        console.error("Failed to fetch promos:", err);
      }
    };
    fetchData();
  }, []);

  const addPromo = async () => {
    const code = prompt('Kode Promo:');
    if (!code) return;
    const value = Number(prompt('Nilai Diskon:'));
    const type = prompt('Tipe (percent/fixed):') as any;
    
    try {
      await api.createPromoCode({
        code, value, type, isActive: true, minPurchase: 0
      });
      const data = await api.getPromoCodes();
      setPromos(data);
      toast.success('Promo ditambahkan');
    } catch (err) {
      toast.error('Gagal menambahkan promo');
    }
  };

  const togglePromo = async (id: string, active: boolean) => {
    try {
      await fetch(`/api/promo_codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !active })
      });
      setPromos(prev => prev.map(p => (p._id || p.id) === id ? { ...p, isActive: !active } : p));
      toast.success('Status promo diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui promo');
    }
  };

  const deletePromo = async (id: string) => {
    if (confirm('Hapus promo?')) {
      try {
        await fetch(`/api/promo_codes/${id}`, { method: 'DELETE' });
        setPromos(prev => prev.filter(p => (p._id || p.id) !== id));
        toast.success('Promo dihapus');
      } catch (err) {
        toast.error('Gagal menghapus promo');
      }
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
           <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Marketing</p>
           <h3 className="text-2xl font-bold">Incentive Codes</h3>
        </div>
        <button onClick={addPromo} className="bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-white/5 hover:bg-zinc-200 transition-all">
          New Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos.map(p => (
          <div key={p.id} className="flex justify-between items-center p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-white/10 transition-all">
             <div className="flex items-center gap-5">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-white">
                   <PromoIcon size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-white text-lg tracking-tight mb-0.5">{p.code}</h4>
                   <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">{p.type === 'percent' ? `${p.value}%` : `Rp ${p.value.toLocaleString()}`} INCENTIVE</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => togglePromo(p.id, p.isActive)} className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${p.isActive ? 'bg-white text-black border-white' : 'bg-white/5 text-zinc-600 border-white/5'}`}>
                   {p.isActive ? <Check size={18}/> : <XIcon size={18}/>}
                </button>
                <button onClick={() => deletePromo(p.id)} className="w-10 h-10 bg-white/5 text-zinc-500 rounded-xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center"><Trash2 size={18}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminReports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await api.getOrders();
        setOrders(ordersData);

        // Simple aggregation by date
        const agg: Record<string, number> = {};
        if (Array.isArray(ordersData)) {
          ordersData.filter((o: any) => (o.status === 'completed' || o.status === 'paid') && o.createdAt).forEach((o: any) => {
            try {
              const date = format(new Date(o.createdAt), 'dd MMM');
              agg[date] = (agg[date] || 0) + o.finalTotal;
            } catch (e) {
              console.warn("Invalid date in order:", o.createdAt);
            }
          });
        }

        setReportData(Object.entries(agg).map(([date, total]) => ({ date, total })));
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };
    fetchOrders();
  }, []);

  const totalSales = orders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((acc, current) => acc + current.finalTotal, 0);

  return (
    <div className="p-8 space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[32px] text-black shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={120} />
           </div>
           <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-4">Gross Revenue</h4>
           <p className="text-4xl font-black tabular-nums tracking-tighter">Rp {totalSales.toLocaleString()}</p>
           <div className="mt-6 flex items-center gap-2 text-[10px] font-mono bg-black/5 w-fit px-3 py-1.5 rounded-full border border-black/5 text-zinc-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Real-time Monitoring</span>
           </div>
        </div>
        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 flex flex-col justify-between">
           <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-1">Volumetric Throughput</h4>
           <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{orders.filter(o => o.status === 'completed').length}</p>
           <p className="text-[10px] font-mono text-zinc-600 mt-4 uppercase">Completed Transactions</p>
        </div>
        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 flex flex-col justify-between">
           <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500 mb-1">Unit Velocity</h4>
           <p className="text-4xl font-black text-white tabular-nums tracking-tighter">
             {orders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0), 0)}
           </p>
           <p className="text-[10px] font-mono text-zinc-600 mt-4 uppercase">Individual Items Served</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-end">
           <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2 underline decoration-white/10 underline-offset-8">Analytics Interface</p>
              <h4 className="text-2xl font-bold flex items-center gap-3">
                 Performance Cycles
              </h4>
           </div>
        </div>
        
        <div className="h-[400px] w-full bg-black/40 rounded-[32px] border border-white/5 p-8 shadow-inner">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportData}>
                <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#52525b' }} hide />
              <Tooltip 
                contentStyle={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)', padding: '16px' }}
                cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
