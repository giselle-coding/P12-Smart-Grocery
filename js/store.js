/**
 * Smart Grocery & Budget Safety Tracker
 * Module: Store (State Management, Historical Benchmark & LocalStorage)
 */

const STORAGE_KEYS = {
  CART: 'smart_grocery_cart_v1',
  HISTORY: 'smart_grocery_history_v1',
  BENCHMARKS: 'smart_grocery_benchmarks_v1',
  SETTINGS: 'smart_grocery_settings_v1'
};

// Data benchmark awal (Bulan Lalu) khusus anak rantau
const DEFAULT_BENCHMARKS = [
  { name: 'Beras Ramos 5kg', category: 'Sembako', unit: 'pack', lastPrice: 72000, lastDate: '2026-09-10' },
  { name: 'Minyak Goreng 2L', category: 'Sembako', unit: 'liter', lastPrice: 34500, lastDate: '2026-09-10' },
  { name: 'Telur Ayam 1kg', category: 'Daging & Telur', unit: 'kg', lastPrice: 28000, lastDate: '2026-09-10' },
  { name: 'Indomie Goreng (Pack isi 5)', category: 'Sembako', unit: 'pack', lastPrice: 15500, lastDate: '2026-09-10' },
  { name: 'Kecap Manis Bango 550ml', category: 'Bumbu & Dapur', unit: 'botol', lastPrice: 24000, lastDate: '2026-09-10' },
  { name: 'Sabun Mandi Refill 450ml', category: 'Perlengkapan Mandi', unit: 'pack', lastPrice: 22500, lastDate: '2026-09-10' },
  { name: 'Pasta Gigi Herbal 190g', category: 'Perlengkapan Mandi', unit: 'pcs', lastPrice: 16000, lastDate: '2026-09-10' },
  { name: 'Deterjen Cair 750ml', category: 'Perlengkapan Mandi', unit: 'pack', lastPrice: 19500, lastDate: '2026-09-10' },
  { name: 'Susu UHT Full Cream 1L', category: 'Minuman', unit: 'liter', lastPrice: 19000, lastDate: '2026-09-10' },
  { name: 'Nugget Ayam 500g', category: 'Daging & Telur', unit: 'pack', lastPrice: 43000, lastDate: '2026-09-10' },
  { name: 'Bawang Merah 250g', category: 'Bumbu & Dapur', unit: 'pack', lastPrice: 12000, lastDate: '2026-09-10' },
  { name: 'Bawang Putih 250g', category: 'Bumbu & Dapur', unit: 'pack', lastPrice: 11000, lastDate: '2026-09-10' }
];

// Contoh riwayat bulan lalu siap pakai
const DEFAULT_HISTORY = [
  {
    id: 'trip-september-2026',
    date: '10 September 2026',
    title: 'Belanja Bulanan Kos - September',
    budgetCap: 600000,
    totalSpent: 485000,
    totalSavings: 42500,
    itemsCount: 8,
    items: [
      { name: 'Beras Ramos 5kg', qty: 1, unit: 'pack', unitPrice: 72000, netTotal: 72000, category: 'Sembako' },
      { name: 'Minyak Goreng 2L', qty: 1, unit: 'liter', unitPrice: 34500, netTotal: 34500, category: 'Sembako' },
      { name: 'Telur Ayam 1kg', qty: 2, unit: 'kg', unitPrice: 28000, netTotal: 56000, category: 'Daging & Telur' },
      { name: 'Indomie Goreng (Pack isi 5)', qty: 4, unit: 'pack', unitPrice: 15500, netTotal: 62000, category: 'Sembako' },
      { name: 'Sabun Mandi Refill 450ml', qty: 2, unit: 'pack', unitPrice: 22500, netTotal: 45000, category: 'Perlengkapan Mandi' },
      { name: 'Deterjen Cair 750ml', qty: 2, unit: 'pack', unitPrice: 19500, netTotal: 39000, category: 'Perlengkapan Mandi' },
      { name: 'Nugget Ayam 500g', qty: 2, unit: 'pack', unitPrice: 43000, netTotal: 86000, category: 'Daging & Telur' },
      { name: 'Susu UHT Full Cream 1L', qty: 4, unit: 'liter', unitPrice: 19000, netTotal: 76000, category: 'Minuman' }
    ]
  }
];

export const Store = {
  // Inisialisasi awal
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.BENCHMARKS)) {
      localStorage.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(DEFAULT_BENCHMARKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(DEFAULT_HISTORY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
        budgetCap: 600000, // Budget bulanan tipikal anak kos/rantau
        soundEnabled: true,
        hapticEnabled: true
      }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
      // Mulai dengan 2 item contoh di troli
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([
        {
          id: 'item-demo-1',
          name: 'Minyak Goreng 2L',
          category: 'Sembako',
          unit: 'liter',
          qty: 1,
          unitPrice: 32000, // Bulan lalu 34.500 (Turun!)
          discountInput: '10',
          grossTotal: 32000,
          netTotal: 28800,
          totalSavings: 3200,
          effectiveDiscountPercent: 10,
          lastMonthPrice: 34500
        },
        {
          id: 'item-demo-2',
          name: 'Telur Ayam 1kg',
          category: 'Daging & Telur',
          unit: 'kg',
          qty: 1.5,
          unitPrice: 30000, // Bulan lalu 28.000 (Naik!)
          discountInput: '',
          grossTotal: 45000,
          netTotal: 45000,
          totalSavings: 0,
          effectiveDiscountPercent: 0,
          lastMonthPrice: 28000
        }
      ]));
    }
  },

  // Operasi Troli (Cart)
  getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CART)) || [];
    } catch {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  },

  addItem(item) {
    const cart = this.getCart();
    const newItem = {
      ...item,
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    };
    cart.unshift(newItem); // Tambah di paling atas agar terlihat langsung
    this.saveCart(cart);
    return newItem;
  },

  updateItem(id, updatedFields) {
    const cart = this.getCart();
    const index = cart.findIndex(i => i.id === id);
    if (index !== -1) {
      cart[index] = { ...cart[index], ...updatedFields };
      this.saveCart(cart);
      return cart[index];
    }
    return null;
  },

  deleteItem(id) {
    const cart = this.getCart().filter(i => i.id !== id);
    this.saveCart(cart);
    return cart;
  },

  clearCart() {
    this.saveCart([]);
  },

  // Settings & Budget Cap
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { budgetCap: 600000 };
    } catch {
      return { budgetCap: 600000 };
    }
  },

  updateSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // F-04: Lookup Harga Bulan Lalu (Benchmark)
  getBenchmarks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BENCHMARKS)) || [];
    } catch {
      return [];
    }
  },

  findBenchmark(productName) {
    if (!productName || !productName.trim()) return null;
    const benchmarks = this.getBenchmarks();
    const cleanSearch = productName.trim().toLowerCase();

    // 1. Exact match
    const exact = benchmarks.find(b => b.name.toLowerCase() === cleanSearch);
    if (exact) return exact;

    // 2. Contains match (e.g. "minyak" matches "Minyak Goreng 2L")
    const partial = benchmarks.find(b => 
      b.name.toLowerCase().includes(cleanSearch) || 
      cleanSearch.includes(b.name.toLowerCase())
    );
    return partial || null;
  },

  saveBenchmark(name, category, unit, price) {
    const benchmarks = this.getBenchmarks();
    const cleanName = name.trim();
    const index = benchmarks.findIndex(b => b.name.toLowerCase() === cleanName.toLowerCase());
    const entry = {
      name: cleanName,
      category,
      unit,
      lastPrice: price,
      lastDate: new Date().toISOString().split('T')[0]
    };

    if (index >= 0) {
      benchmarks[index] = entry;
    } else {
      benchmarks.push(entry);
    }
    localStorage.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(benchmarks));
  },

  // F-06: Checkout & Riwayat Belanja
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY)) || [];
    } catch {
      return [];
    }
  },

  checkoutCart(tripTitle = '') {
    const cart = this.getCart();
    if (cart.length === 0) return null;

    const settings = this.getSettings();
    const totalSpent = cart.reduce((acc, item) => acc + item.netTotal, 0);
    const totalSavings = cart.reduce((acc, item) => acc + (item.totalSavings || 0), 0);

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const newTrip = {
      id: 'trip_' + Date.now(),
      date: dateStr,
      timestamp: now.getTime(),
      title: tripTitle || `Belanja Bulanan (${dateStr})`,
      budgetCap: settings.budgetCap,
      totalSpent,
      totalSavings,
      itemsCount: cart.length,
      items: [...cart]
    };

    // Update benchmarks untuk komparasi bulan selanjutnya! (F-06 -> basis data pembanding)
    cart.forEach(item => {
      this.saveBenchmark(item.name, item.category, item.unit, item.unitPrice);
    });

    // Simpan ke riwayat transaksi
    const history = this.getHistory();
    history.unshift(newTrip);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

    // Kosongkan keranjang aktif
    this.clearCart();

    return newTrip;
  },

  deleteHistoryTrip(tripId) {
    const history = this.getHistory().filter(t => t.id !== tripId);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return history;
  },

  // Reset data ke template default
  resetData() {
    localStorage.removeItem(STORAGE_KEYS.CART);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BENCHMARKS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.init();
  }
};
