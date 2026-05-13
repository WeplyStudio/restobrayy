import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MenuItem, Category } from '../types';
import { Search, Plus, Info, Tag, Utensils } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function Catalog() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setItems(itemsData);
    });

    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const catsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(catsData);
    });

    return () => {
      unsubItems();
      unsubCats();
    };
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && item.isActive;
  });

  const handleAddToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast.error('Stok habis!');
      return;
    }
    addItem({ id: item.id, name: item.name, price: item.price, quantity: 1 });
    toast.success(`${item.name} ditambah ke keranjang`);
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari makanan atau minuman..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === 'all' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-orange-200 transition-all"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Utensils size={48} />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-orange-600 shadow-sm">
                    Rp {item.price.toLocaleString()}
                  </span>
                </div>
                {item.stock < 10 && (
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      Stok Sisa: {item.stock}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{item.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button 
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white py-2 rounded-xl text-sm font-bold hover:bg-orange-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:scale-100 transition-all shadow-md shadow-orange-100"
                  >
                    <Plus size={18} />
                    Pesan
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Menu tidak ditemukan</h3>
          <p className="text-slate-500">Coba kata kunci lain atau pilih kategori berbeda</p>
        </div>
      )}
    </div>
  );
}
