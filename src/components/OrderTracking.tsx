import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search, Loader2, Package, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id as indo } from 'date-fns/locale';

export function OrderTracking() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('restoflow_orders');
    if (saved) {
      setTrackedIds(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (trackedIds.length === 0) return;

    const q = query(
      collection(db, 'orders'),
      where('__name__', 'in', trackedIds.slice(-10)) // Firestore limit 10 for 'in'
    );

    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });

    return () => unsub();
  }, [trackedIds]);

  const addManualTracking = () => {
    if (!orderIdInput.trim()) return;
    if (trackedIds.includes(orderIdInput)) {
      setOrderIdInput('');
      return;
    }
    const newTracked = [...trackedIds, orderIdInput];
    setTrackedIds(newTracked);
    localStorage.setItem('restoflow_orders', JSON.stringify(newTracked));
    setOrderIdInput('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" />;
      case 'paid': return <Package className="text-blue-500" />;
      case 'completed': return <CheckCircle2 className="text-green-500" />;
      case 'cancelled': return <XCircle className="text-red-500" />;
      default: return <Clock size={20} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'paid': return 'Sedang Disiapkan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Lacak Pesanan</h2>
          <p className="text-slate-500">Cek status masakan dan antrean Anda secara live.</p>
        </div>
        <div className="w-full md:w-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Masukkan Order ID..."
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
          <button 
            onClick={addManualTracking}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
          >
            Lacak
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
             <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-300 mb-4">
                <Clock size={48} />
             </div>
             <p className="text-slate-500 font-medium">Belum ada pesanan yang dilacak.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest px-2 py-0.5 bg-orange-50 rounded">
                      Antrean #{order.queueNumber.toString().padStart(3, '0')}
                    </span>
                    <span className="text-[10px] text-slate-400">ID: {order.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{order.customerName}</h3>
                  <div className="flex flex-wrap gap-1">
                    {order.items.map((it: any) => (
                      <span key={it.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {it.quantity}x {it.name}
                      </span>
                    ))}
                  </div>
              </div>

              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  {getStatusIcon(order.status)}
                  <span className={`text-sm font-black uppercase tracking-tight ${
                    order.status === 'completed' ? 'text-green-600' : 
                    order.status === 'paid' ? 'text-blue-600' : 'text-yellow-600'
                  }`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Pesanan dibuat pada {order.createdAt ? format(order.createdAt.toDate(), 'HH:mm - dd MMM', { locale: indo }) : '...'}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-black text-slate-900">Rp {order.finalTotal.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">QRIS Pakasir</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
