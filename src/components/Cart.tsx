import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag, X, Plus, Minus, Ticket, CreditCard, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, runTransaction, Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string, discount: number } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  const totalWithDiscount = total - (appliedPromo?.discount || 0);

  const applyPromo = async () => {
    try {
      const promoRef = doc(db, 'promo_codes', promoCode);
      const promoSnap = await getDoc(promoRef);
      
      if (!promoSnap.exists() || !promoSnap.data().isActive) {
        toast.error('Kode promo tidak valid atau sudah tidak aktif');
        return;
      }

      const data = promoSnap.data();
      if (total < (data.minPurchase || 0)) {
        toast.error(`Min purchase Rp ${data.minPurchase.toLocaleString()}`);
        return;
      }

      let discount = 0;
      if (data.type === 'percent') {
        discount = (total * data.value) / 100;
      } else {
        discount = data.value;
      }

      setAppliedPromo({ code: data.code, discount });
      toast.success('Promo berhasil digunakan!');
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'promo_codes');
    }
  };

  const handleCheckout = async () => {
    if (!customerName) {
      toast.error('Masukkan nama pemesan');
      return;
    }
    
    setIsCheckingOut(true);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get queue setting
        const queueRef = doc(db, 'settings', 'queue');
        const queueSnap = await transaction.get(queueRef);
        
        if (!queueSnap.exists()) {
          throw new Error('Queue settings not found');
        }

        const queueData = queueSnap.data();
        const today = new Date().toISOString().split('T')[0];
        let nextNumber = queueData.currentNumber + 1;
        
        if (queueData.lastResetDate !== today) {
          nextNumber = 1;
        }

        // 2. Check stock for each item
        for (const item of items) {
          const itemRef = doc(db, 'menu_items', item.id);
          const itemSnap = await transaction.get(itemRef);
          if (!itemSnap.exists()) throw new Error(`Item ${item.name} not found`);
          const currentStock = itemSnap.data().stock;
          if (currentStock < item.quantity) {
            throw new Error(`Stok ${item.name} tidak mencukupi`);
          }
          transaction.update(itemRef, { stock: currentStock - item.quantity });
        }

        // 3. Create order
        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, {
          customerName,
          items,
          total,
          promoCode: appliedPromo?.code || null,
          discount: appliedPromo?.discount || 0,
          finalTotal: Math.max(0, totalWithDiscount),
          status: 'pending',
          queueNumber: nextNumber,
          createdAt: Timestamp.now(),
          paymentMethod: 'qris'
        });

        // Add to localStorage for tracking
        const saved = JSON.parse(localStorage.getItem('restoflow_orders') || '[]');
        localStorage.setItem('restoflow_orders', JSON.stringify([...saved, orderRef.id]));

        // 4. Update queue
        transaction.update(queueRef, {
          currentNumber: nextNumber,
          lastResetDate: today
        });

        return nextNumber;
      });

      toast.success('Pesanan berhasil dibuat!');
      setIsOpen(false);
      clearCart();
      setAppliedPromo(null);
      setPromoCode('');
      setCustomerName('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal membuat pesanan');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-orange-500 text-white p-4 rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-600 transition-all group scale-100 active:scale-95"
      >
        <div className="relative">
          <ShoppingBag size={24} />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                    <ShoppingBag size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Keranjang Saya</h2>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="bg-slate-50 p-6 rounded-full text-slate-200">
                      <ShoppingBag size={64} />
                    </div>
                    <p className="text-slate-500 font-medium tracking-tight">Keranjang Anda masih kosong</p>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="text-orange-500 font-bold hover:underline"
                    >
                      Mulai Pesan Sekarang
                    </button>
                  </div>
                ) : (
                  items.map((item) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-orange-100 bg-white transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                        <p className="text-sm font-bold text-orange-500">Rp {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-2">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-slate-900 transition-colors">
                          <Plus size={16} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-6">
                  {/* Promo Input */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Kode Promo"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                      <button 
                        onClick={applyPromo}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                      >
                        Gunakan
                      </button>
                    </div>
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-xs px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
                        <span className="font-medium">Kode "{appliedPromo.code}" Terpasang</span>
                        <span>-Rp {appliedPromo.discount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                     <input
                        type="text"
                        placeholder="Nama Pemesan"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                      />
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-slate-500 text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium">Rp {total.toLocaleString()}</span>
                    </div>
                    {appliedPromo && (
                      <div className="flex justify-between text-green-600 text-sm">
                        <span>Diskon Promo</span>
                        <span className="font-medium">-Rp {appliedPromo.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-black text-xl pt-2 border-t border-slate-200">
                      <span>Total Biaya</span>
                      <span className="text-orange-500">Rp {Math.max(0, totalWithDiscount).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-2 flex items-center justify-center gap-3">
                       <CreditCard className="text-orange-500" size={20} />
                       <span className="text-sm font-bold text-slate-700">Bayar via QRIS Pakasir</span>
                    </div>
                    
                    <button 
                      onClick={handleCheckout}
                      disabled={isCheckingOut || items.length === 0}
                      className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-orange-100 disabled:bg-slate-200 disabled:shadow-none animate-in"
                    >
                      {isCheckingOut ? (
                        <>Sedang diproses...</>
                      ) : (
                        <>
                          Pesan Sekarang
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
