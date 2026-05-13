import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ticket, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export function QueueDisplay() {
  const [currentQueue, setCurrentQueue] = useState<number>(0);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);

  useEffect(() => {
    // Current queue info
    const unsubSettings = onSnapshot(doc(db, 'settings', 'queue'), (snap) => {
      if (snap.exists()) {
        setCurrentQueue(snap.data().currentNumber);
      }
    });

    // Recent orders that are being prepared (paid/pending)
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLatestOrders(orders);
    });

    return () => {
      unsubSettings();
      unsubOrders();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Status Antrean Hari Ini</h2>
        <p className="text-slate-500">Antrean diperbarui secara waktu nyata</p>
      </div>

      {/* Main Counter */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white rounded-3xl p-10 border-2 border-orange-500 shadow-2xl shadow-orange-100 text-center overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 text-orange-100 pointer-events-none">
           <Ticket size={120} />
        </div>
        
        <div className="relative z-10 space-y-4">
           <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nomor Antrean Terakhir</p>
           <div className="text-8xl font-black text-orange-500 tabular-nums">
              {currentQueue.toString().padStart(3, '0')}
           </div>
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-bold border border-orange-100">
              <Users size={16} />
              <span>Total Pelanggan Hari Ini</span>
           </div>
        </div>
      </motion.div>

      {/* Latest Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-blue-500" />
            <h3 className="font-bold text-slate-800">Sedang Disiapkan</h3>
          </div>
          <div className="space-y-3">
             {latestOrders.filter(o => o.status === 'paid').map(order => (
               <div key={order.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                 <span className="font-bold text-slate-700">#{order.queueNumber.toString().padStart(3, '0')}</span>
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Masak</span>
               </div>
             ))}
             {latestOrders.filter(o => o.status === 'paid').length === 0 && (
               <p className="text-sm text-slate-400 italic">Belum ada antrean aktif</p>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h3 className="font-bold text-slate-800">Siap Diambil</h3>
          </div>
          <div className="space-y-3">
             {latestOrders.filter(o => o.status === 'completed').slice(0, 3).map(order => (
               <div key={order.id} className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-100">
                 <span className="font-bold text-green-700">#{order.queueNumber.toString().padStart(3, '0')}</span>
                 <span className="text-xs font-bold text-green-600 uppercase tracking-tighter">Selesai</span>
               </div>
             ))}
              {latestOrders.filter(o => o.status === 'completed').length === 0 && (
               <p className="text-sm text-slate-400 italic">Antrean menunggu panggilan</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
