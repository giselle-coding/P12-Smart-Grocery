/**
 * Smart Grocery & Budget Safety Tracker
 * Main Controller: UI Rendering, Interactions, Modals, PWA & Realtime Cloud Sync
 */

import { Store } from './store.js';
import { Calculator } from './calculator.js';
import { RECIPES_DATA, matchRecipesWithItems, isFoodItem } from './recipes.js';
import { 
  getAuthUser, 
  loginUser, 
  logoutUser, 
  subscribeActiveSessionRealtime, 
  pushSessionToFirestore 
} from './firebase-config.js';

// Sound & Haptic FX via Web Audio API
class AudioFeedback {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playTone(freq = 600, type = 'sine', duration = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio might be blocked before user gesture
    }
  }

  playCashRegister() {
    this.playTone(523.25, 'triangle', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.1), 80); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2), 160); // G5
  }

  playWarning() {
    this.playTone(250, 'sawtooth', 0.18);
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 60, 100]);
    }
  }

  playClick() {
    this.playTone(800, 'sine', 0.04);
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  }
}

const sound = new AudioFeedback();

// Application State
let activeCategoryFilter = 'ALL';
let currentEditingItemId = null;
let realtimeUnsubscribe = null;

// DOM Elements Cache
const DOM = {
  // Tabs
  tabButtons: document.querySelectorAll('.nav-tab-btn'),
  tabPages: document.querySelectorAll('.tab-page'),
  navCartBadge: document.getElementById('navCartBadge'),
  btnSoundToggle: document.getElementById('btnSoundToggle'),

  // Realtime Status Bar & Sesi Belanja
  realtimeStatusBar: document.getElementById('realtimeStatusBar'),
  syncPulsePing: document.getElementById('syncPulsePing'),
  syncStatusDot: document.getElementById('syncStatusDot'),
  syncStatusText: document.getElementById('syncStatusText'),
  activeUserBadge: document.getElementById('activeUserBadge'),
  inputStoreLocation: document.getElementById('inputStoreLocation'),
  inputShoppingDate: document.getElementById('inputShoppingDate'),

  // Budget Card Elements
  budgetSafetyCard: document.getElementById('budgetSafetyCard'),
  displayBudgetCap: document.getElementById('displayBudgetCap'),
  displayCurrentTotal: document.getElementById('displayCurrentTotal'),
  displayBudgetRemaining: document.getElementById('displayBudgetRemaining'),
  budgetProgressFill: document.getElementById('budgetProgressFill'),
  budgetHealthBadge: document.getElementById('budgetHealthBadge'),
  budgetAlertBanner: document.getElementById('budgetAlertBanner'),
  budgetAlertText: document.getElementById('budgetAlertText'),
  btnEditBudget: document.getElementById('btnEditBudget'),

  // Cart Views
  cartItemsList: document.getElementById('cartItemsList'),
  emptyCartView: document.getElementById('emptyCartView'),
  cartCountLabel: document.getElementById('cartCountLabel'),
  cartTotalSavingsBadge: document.getElementById('cartTotalSavingsBadge'),
  stripTotalPay: document.getElementById('stripTotalPay'),
  checkoutStickyStrip: document.getElementById('checkoutStickyStrip'),
  categoryFilters: document.querySelectorAll('.filter-chip'),

  // Modals
  itemModalOverlay: document.getElementById('itemModalOverlay'),
  btnOpenAddModal: document.getElementById('btnOpenAddModal'),
  btnQuickAddHeader: document.getElementById('btnQuickAddHeader'),
  btnEmptyAdd: document.getElementById('btnEmptyAdd'),
  btnCloseItemModal: document.getElementById('btnCloseItemModal'),
  itemForm: document.getElementById('itemForm'),
  modalItemTitle: document.getElementById('modalItemTitle'),
  editItemId: document.getElementById('editItemId'),
  inputItemName: document.getElementById('inputItemName'),
  inputItemCategory: document.getElementById('inputItemCategory'),
  inputItemUnit: document.getElementById('inputItemUnit'),
  inputItemQty: document.getElementById('inputItemQty'),
  inputItemPrice: document.getElementById('inputItemPrice'),
  inputItemDiscount: document.getElementById('inputItemDiscount'),
  btnModalQtyMinus: document.getElementById('btnModalQtyMinus'),
  btnModalQtyPlus: document.getElementById('btnModalQtyPlus'),
  modalSubtotalPreview: document.getElementById('modalSubtotalPreview'),
  modalSavingsPreview: document.getElementById('modalSavingsPreview'),
  formCompareBadge: document.getElementById('formCompareBadge'),
  btnSubmitItemLabel: document.getElementById('btnSubmitItemLabel'),
  benchmarkDatalist: document.getElementById('benchmarkDatalist'),

  // Checkout Modal
  checkoutModalOverlay: document.getElementById('checkoutModalOverlay'),
  btnOpenCheckoutModal: document.getElementById('btnOpenCheckoutModal'),
  btnCloseCheckoutModal: document.getElementById('btnCloseCheckoutModal'),
  chkModalStore: document.getElementById('chkModalStore'),
  chkModalBudget: document.getElementById('chkModalBudget'),
  chkModalTotal: document.getElementById('chkModalTotal'),
  chkModalSavings: document.getElementById('chkModalSavings'),
  chkModalRemaining: document.getElementById('chkModalRemaining'),
  inputCheckoutTitle: document.getElementById('inputCheckoutTitle'),
  btnConfirmCheckout: document.getElementById('btnConfirmCheckout'),

  // Budget Modal
  budgetModalOverlay: document.getElementById('budgetModalOverlay'),
  btnCloseBudgetModal: document.getElementById('btnCloseBudgetModal'),
  modalBudgetInput: document.getElementById('modalBudgetInput'),
  btnSaveBudgetModal: document.getElementById('btnSaveBudgetModal'),

  // History Tab Elements
  subtabBtnTrips: document.getElementById('subtabBtnTrips'),
  subtabBtnDatabase: document.getElementById('subtabBtnDatabase'),
  viewTripsContainer: document.getElementById('viewTripsContainer'),
  viewDatabaseContainer: document.getElementById('viewDatabaseContainer'),
  benchmarkList: document.getElementById('benchmarkList'),
  inputSearchBenchmark: document.getElementById('inputSearchBenchmark'),

  // Anggaran Settings Elements
  inputSettingBudget: document.getElementById('inputSettingBudget'),
  btnSaveSettingBudget: document.getElementById('btnSaveSettingBudget'),
  btnResetAllData: document.getElementById('btnResetAllData'),

  // Akun & Multi-Device Card Elements
  tabAccountStatusBadge: document.getElementById('tabAccountStatusBadge'),
  displayAuthUsername: document.getElementById('displayAuthUsername'),
  btnLogout: document.getElementById('btnLogout'),
  btnManualSync: document.getElementById('btnManualSync'),

  // Simulator Elements
  simPrice: document.getElementById('simPrice'),
  simDiscount: document.getElementById('simDiscount'),
  simGrossResult: document.getElementById('simGrossResult'),
  simSavedResult: document.getElementById('simSavedResult'),
  simNetResult: document.getElementById('simNetResult'),

  // Recipe Ideas Elements
  btnOpenRecipesModal: document.getElementById('btnOpenRecipesModal'),
  recipesModalOverlay: document.getElementById('recipesModalOverlay'),
  btnCloseRecipesModal: document.getElementById('btnCloseRecipesModal'),
  recipeReadyCountBadge: document.getElementById('recipeReadyCountBadge'),
  recipeBannerDesc: document.getElementById('recipeBannerDesc'),
  recipeSourceCart: document.getElementById('recipeSourceCart'),
  recipeSourceAll: document.getElementById('recipeSourceAll'),
  detectedFoodStrip: document.getElementById('detectedFoodStrip'),
  recipesListContainer: document.getElementById('recipesListContainer'),

  // Login Modal
  loginOverlay: document.getElementById('loginOverlay'),
  loginForm: document.getElementById('loginForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),

  toastContainer: document.getElementById('toastContainer')
};

// ================= Toast Notification =================
function showToast(message, icon = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 text-emerald-400 shrink-0"></i><span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);
  lucide.createIcons({ root: toast });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

// ================= Refresh Lucide Icons =================
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// ================= Tab Navigation =================
function setupTabs() {
  DOM.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      const targetTabId = btn.getAttribute('data-tab');

      // Update Tab Buttons
      DOM.tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update Pages
      DOM.tabPages.forEach(page => {
        if (page.id === targetTabId) {
          page.classList.remove('hidden');
          page.classList.add('block');
        } else {
          page.classList.add('hidden');
          page.classList.remove('block');
        }
      });

      if (targetTabId === 'tab-riwayat') {
        renderHistory();
      }
      refreshIcons();
    });
  });

  // Subtabs in Riwayat
  DOM.subtabBtnTrips.addEventListener('click', () => {
    sound.playClick();
    DOM.subtabBtnTrips.className = 'py-2 text-xs font-bold rounded-xl bg-slate-800 text-emerald-400 shadow transition';
    DOM.subtabBtnDatabase.className = 'py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-slate-200 transition';
    DOM.viewTripsContainer.classList.remove('hidden');
    DOM.viewDatabaseContainer.classList.add('hidden');
  });

  DOM.subtabBtnDatabase.addEventListener('click', () => {
    sound.playClick();
    DOM.subtabBtnDatabase.className = 'py-2 text-xs font-bold rounded-xl bg-slate-800 text-emerald-400 shadow transition';
    DOM.subtabBtnTrips.className = 'py-2 text-xs font-bold rounded-xl text-slate-400 hover:text-slate-200 transition';
    DOM.viewDatabaseContainer.classList.remove('hidden');
    DOM.viewTripsContainer.classList.add('hidden');
    renderBenchmarks();
  });
}

// ================= Sinkronisasi Status Visual Koneksi Cloud =================
function updateConnectionUI(status, message) {
  if (!DOM.syncStatusDot || !DOM.syncStatusText) return;

  if (status === 'online') {
    DOM.syncStatusDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500';
    if (DOM.syncPulsePing) DOM.syncPulsePing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
    DOM.syncStatusText.className = 'font-bold text-emerald-400';
    DOM.syncStatusText.textContent = 'Realtime HP ⇆ PC Aktif';
    if (DOM.tabAccountStatusBadge) {
      DOM.tabAccountStatusBadge.className = 'text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30';
      DOM.tabAccountStatusBadge.textContent = 'Terhubung Realtime';
    }
  } else if (status === 'syncing') {
    DOM.syncStatusDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400';
    if (DOM.syncPulsePing) DOM.syncPulsePing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75';
    DOM.syncStatusText.className = 'font-bold text-amber-400';
    DOM.syncStatusText.textContent = 'Menyimpan ke Cloud...';
  } else {
    // Offline / fallback LocalStorage
    DOM.syncStatusDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500';
    if (DOM.syncPulsePing) DOM.syncPulsePing.className = 'hidden';
    DOM.syncStatusText.className = 'font-semibold text-slate-400';
    DOM.syncStatusText.textContent = 'Mode Lokal (Tersimpan di HP)';
    if (DOM.tabAccountStatusBadge) {
      DOM.tabAccountStatusBadge.className = 'text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-slate-700';
      DOM.tabAccountStatusBadge.textContent = 'Offline (LocalStorage)';
    }
  }
}

// ================= Render Cart & Budget Safety (F-01 to F-05) =================
function renderCart() {
  const cart = Store.getCart();
  const settings = Store.getSettings();

  // Sinkronkan input sesi belanja jika tidak sedang aktif diketik pengguna
  if (DOM.inputStoreLocation && document.activeElement !== DOM.inputStoreLocation) {
    DOM.inputStoreLocation.value = Store.getStoreLocation();
  }
  if (DOM.inputShoppingDate && document.activeElement !== DOM.inputShoppingDate) {
    DOM.inputShoppingDate.value = Store.getShoppingDate();
  }

  // Filter items by category
  const filteredCart = activeCategoryFilter === 'ALL'
    ? cart
    : cart.filter(item => item.category === activeCategoryFilter);

  // Compute Totals
  const totalSpent = cart.reduce((sum, item) => sum + (Number(item.netTotal) || 0), 0);
  const totalSavings = cart.reduce((sum, item) => sum + (Number(item.totalSavings) || 0), 0);

  // Nav badge & counts
  DOM.navCartBadge.textContent = cart.length;
  DOM.cartCountLabel.textContent = `${cart.length} Barang di Troli`;
  DOM.stripTotalPay.textContent = Calculator.formatRupiah(totalSpent);

  if (totalSavings > 0) {
    DOM.cartTotalSavingsBadge.classList.remove('hidden');
    DOM.cartTotalSavingsBadge.innerHTML = `<i data-lucide="tag" class="w-3 h-3"></i><span>Hemat ${Calculator.formatRupiah(totalSavings)}</span>`;
  } else {
    DOM.cartTotalSavingsBadge.classList.add('hidden');
  }

  // F-05: Evaluate Budget Safety Cap
  const budgetEval = Calculator.evaluateBudget(totalSpent, settings.budgetCap);
  DOM.displayBudgetCap.textContent = Calculator.formatRupiah(settings.budgetCap);
  DOM.displayCurrentTotal.textContent = Calculator.formatRupiah(totalSpent);
  DOM.displayBudgetRemaining.textContent = budgetEval.status === 'OVER'
    ? `Defisit: ${Calculator.formatRupiah(Math.abs(budgetEval.remaining))}`
    : `Sisa: ${Calculator.formatRupiah(budgetEval.remaining)}`;

  // Update Progress Bar
  DOM.budgetProgressFill.style.width = `${budgetEval.percent}%`;
  DOM.budgetProgressFill.className = `progress-bar-fill ${budgetEval.theme}`;

  // Update Card Theme & Alert Banner
  DOM.budgetSafetyCard.className = `budget-card status-${budgetEval.status.toLowerCase()}`;
  
  if (budgetEval.status === 'OVER' || budgetEval.status === 'DANGER') {
    DOM.budgetHealthBadge.className = 'px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30';
    DOM.budgetHealthBadge.textContent = budgetEval.status === 'OVER' ? 'OVER BUDGET' : 'KRITIS';
    DOM.budgetAlertBanner.classList.remove('hidden');
    DOM.budgetAlertText.textContent = budgetEval.message;
    DOM.displayBudgetRemaining.className = 'font-bold text-rose-400';
  } else if (budgetEval.status === 'WARNING') {
    DOM.budgetHealthBadge.className = 'px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30';
    DOM.budgetHealthBadge.textContent = 'SIAGA';
    DOM.budgetAlertBanner.classList.remove('hidden');
    DOM.budgetAlertText.textContent = budgetEval.message;
    DOM.displayBudgetRemaining.className = 'font-bold text-amber-400';
  } else {
    DOM.budgetHealthBadge.className = 'px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    DOM.budgetHealthBadge.textContent = 'AMAN';
    DOM.budgetAlertBanner.classList.add('hidden');
    DOM.displayBudgetRemaining.className = 'font-bold text-emerald-400';
  }

  // Render Items List
  if (cart.length === 0) {
    DOM.cartItemsList.innerHTML = '';
    DOM.emptyCartView.classList.remove('hidden');
    DOM.checkoutStickyStrip.classList.add('hidden');
  } else {
    DOM.emptyCartView.classList.add('hidden');
    DOM.checkoutStickyStrip.classList.remove('hidden');

    DOM.cartItemsList.innerHTML = filteredCart.map(item => {
      // F-04: Komparator Harga vs Bulan Lalu
      const comparison = Calculator.comparePrice(item.unitPrice, item.lastMonthPrice);

      let compIconName = 'sparkles';
      if (comparison.status === 'UP') compIconName = 'arrow-up-right';
      if (comparison.status === 'DOWN') compIconName = 'arrow-down-right';
      if (comparison.status === 'EQUAL') compIconName = 'equal';

      const discountBadgeHtml = item.discountInput
        ? `<span class="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-md">
             Disc ${item.discountInput}% (${Calculator.formatRupiah(item.totalSavings)})
           </span>`
        : '';

      return `
        <div class="grocery-item-card" data-id="${item.id}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 cursor-pointer btn-edit-item" data-id="${item.id}" title="Klik untuk edit barang">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  ${item.category}
                </span>
                <h3 class="text-sm font-extrabold text-white tracking-tight leading-snug">
                  ${item.name}
                </h3>
              </div>
              
              <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>${Calculator.formatRupiah(item.unitPrice)} / ${item.unit}</span>
                ${discountBadgeHtml}
              </div>
            </div>

            <div class="text-right">
              <span class="text-[11px] text-slate-400 block font-medium">Subtotal</span>
              <span class="text-base font-black text-emerald-400 block">
                ${Calculator.formatRupiah(item.netTotal)}
              </span>
            </div>
          </div>

          <!-- F-04: Komparasi Harga Tag -->
          <div class="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div class="price-comparator-badge ${comparison.badgeClass}">
              <i data-lucide="${compIconName}" class="w-3.5 h-3.5"></i>
              <span>${comparison.label} (${comparison.diffPercent > 0 ? comparison.diffPercent + '%' : (comparison.status === 'EQUAL' ? '=' : 'Baru')})</span>
            </div>

            <!-- Stepper Kuantitas (+ / -) Ergonomis Ramah Jempol -->
            <div class="flex items-center gap-2">
              <div class="qty-stepper">
                <button class="stepper-btn btn-cart-minus" data-id="${item.id}" title="Kurang Qty">-</button>
                <span class="stepper-val text-white">${item.qty} ${item.unit}</span>
                <button class="stepper-btn btn-cart-plus" data-id="${item.id}" title="Tambah Qty">+</button>
              </div>

              <!-- Delete Button -->
              <button class="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition btn-cart-delete" data-id="${item.id}" title="Hapus">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Bind interactive actions
  bindCartEvents();
  updateRecipeBadge();
  refreshIcons();
}

// Bind Qty Buttons & Actions on Cart Items
function bindCartEvents() {
  document.querySelectorAll('.btn-cart-plus').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      const id = btn.getAttribute('data-id');
      const cart = Store.getCart();
      const item = cart.find(i => i.id === id);
      if (item) {
        const isWeight = item.unit === 'kg' || item.unit === 'liter';
        const step = isWeight ? 0.5 : 1;
        const newQty = isWeight ? +(item.qty + step).toFixed(2) : Math.round(item.qty + step);
        const math = Calculator.calculateItemTotal(item.unitPrice, newQty, item.discountInput);
        Store.updateItem(id, {
          qty: newQty,
          grossTotal: math.grossTotal,
          netTotal: math.netTotal,
          totalSavings: math.totalSavings
        });
        renderCart();
      }
    };
  });

  document.querySelectorAll('.btn-cart-minus').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      const id = btn.getAttribute('data-id');
      const cart = Store.getCart();
      const item = cart.find(i => i.id === id);
      if (item) {
        const isWeight = item.unit === 'kg' || item.unit === 'liter';
        const step = isWeight ? 0.5 : 1;
        const newQty = isWeight ? +(item.qty - step).toFixed(2) : Math.round(item.qty - step);
        if (newQty <= 0) {
          if (confirm(`Hapus ${item.name} dari troli?`)) {
            Store.deleteItem(id);
            showToast(`${item.name} dihapus`, 'trash-2');
            renderCart();
          }
        } else {
          const math = Calculator.calculateItemTotal(item.unitPrice, newQty, item.discountInput);
          Store.updateItem(id, {
            qty: newQty,
            grossTotal: math.grossTotal,
            netTotal: math.netTotal,
            totalSavings: math.totalSavings
          });
          renderCart();
        }
      }
    };
  });

  document.querySelectorAll('.btn-cart-delete').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      const id = btn.getAttribute('data-id');
      const cart = Store.getCart();
      const item = cart.find(i => i.id === id);
      if (item && confirm(`Hapus ${item.name} dari troli?`)) {
        Store.deleteItem(id);
        showToast(`${item.name} dihapus dari troli`, 'trash-2');
        renderCart();
      }
    };
  });

  // Edit item upon clicking card
  document.querySelectorAll('.btn-edit-item').forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute('data-id');
      const cart = Store.getCart();
      const item = cart.find(i => i.id === id);
      if (item) {
        openItemModal(item);
      }
    };
  });
}

// ================= Live Modal Form Calculations (F-01, F-02, F-03, F-04) =================
function updateModalCalculations() {
  const price = parseFloat(DOM.inputItemPrice.value) || 0;
  const qty = parseFloat(DOM.inputItemQty.value) || 0;
  const discStr = DOM.inputItemDiscount.value;
  const productName = DOM.inputItemName.value;

  // F-02 & F-03: Subtotal & Tiered Discount
  const math = Calculator.calculateItemTotal(price, qty, discStr);
  DOM.modalSubtotalPreview.textContent = Calculator.formatRupiah(math.netTotal);

  if (math.totalSavings > 0) {
    DOM.modalSavingsPreview.innerHTML = `<span class="text-emerald-400 font-bold">Hemat ${Calculator.formatRupiah(math.totalSavings)}</span> (${math.effectiveDiscountPercent}%)`;
  } else {
    DOM.modalSavingsPreview.textContent = 'Tanpa potongan diskon';
  }

  // F-04: Live Comparator Preview vs Benchmark Bulan Lalu
  const benchmark = Store.findBenchmark(productName);
  const comparison = Calculator.comparePrice(price, benchmark ? benchmark.lastPrice : null);

  let iconName = 'sparkles';
  if (comparison.status === 'UP') iconName = 'arrow-up-right';
  if (comparison.status === 'DOWN') iconName = 'arrow-down-right';
  if (comparison.status === 'EQUAL') iconName = 'equal';

  DOM.formCompareBadge.className = `price-comparator-badge ${comparison.badgeClass}`;
  DOM.formCompareBadge.innerHTML = `<i data-lucide="${iconName}" class="w-3.5 h-3.5"></i><span>${comparison.message}</span>`;
  refreshIcons();
}

// Populate datalist for autocomplete with previous month's items
function populateBenchmarkDatalist() {
  const benchmarks = Store.getBenchmarks();
  DOM.benchmarkDatalist.innerHTML = benchmarks.map(b => `<option value="${b.name}">`).join('');
}

// Open Add Item Modal
function openItemModal(itemToEdit = null) {
  sound.playClick();
  populateBenchmarkDatalist();

  if (itemToEdit) {
    currentEditingItemId = itemToEdit.id;
    DOM.modalItemTitle.textContent = 'Edit Item Belanja';
    DOM.btnSubmitItemLabel.textContent = 'Perbarui Item';
    DOM.editItemId.value = itemToEdit.id;
    DOM.inputItemName.value = itemToEdit.name;
    DOM.inputItemCategory.value = itemToEdit.category;
    DOM.inputItemUnit.value = itemToEdit.unit;
    DOM.inputItemQty.value = itemToEdit.qty;
    DOM.inputItemPrice.value = itemToEdit.unitPrice;
    DOM.inputItemDiscount.value = itemToEdit.discountInput || '';
  } else {
    currentEditingItemId = null;
    DOM.modalItemTitle.textContent = 'Tambah Item Belanja';
    DOM.btnSubmitItemLabel.textContent = 'Tambahkan ke Troli';
    DOM.editItemId.value = '';
    DOM.itemForm.reset();
    DOM.inputItemQty.value = 1;
    DOM.inputItemUnit.value = 'pcs';
    DOM.inputItemCategory.value = 'Sembako';
  }

  updateModalChips();
  updateModalCalculations();
  DOM.itemModalOverlay.classList.add('active');
  setTimeout(() => DOM.inputItemName.focus(), 150);
}

function closeItemModal() {
  DOM.itemModalOverlay.classList.remove('active');
}

function updateModalChips() {
  const activeCat = DOM.inputItemCategory.value;
  document.querySelectorAll('.cat-pick').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-cat') === activeCat);
  });

  const activeUnit = DOM.inputItemUnit.value;
  document.querySelectorAll('.unit-pick').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-unit') === activeUnit);
  });
}

// Setup Form Listeners
function setupFormListeners() {
  DOM.inputItemName.addEventListener('input', () => {
    const val = DOM.inputItemName.value;
    const match = Store.findBenchmark(val);
    if (match && !DOM.inputItemPrice.value) {
      DOM.inputItemCategory.value = match.category;
      DOM.inputItemUnit.value = match.unit;
      DOM.inputItemPrice.value = match.lastPrice;
      updateModalChips();
    }
    updateModalCalculations();
  });

  DOM.inputItemPrice.addEventListener('input', updateModalCalculations);
  DOM.inputItemQty.addEventListener('input', updateModalCalculations);
  DOM.inputItemDiscount.addEventListener('input', updateModalCalculations);

  DOM.btnModalQtyPlus.onclick = () => {
    sound.playClick();
    const cur = parseFloat(DOM.inputItemQty.value) || 0;
    const isWeight = DOM.inputItemUnit.value === 'kg' || DOM.inputItemUnit.value === 'liter';
    const step = isWeight ? 0.5 : 1;
    const nextVal = +(cur + step).toFixed(2);
    DOM.inputItemQty.value = nextVal;
    updateModalCalculations();
  };

  DOM.btnModalQtyMinus.onclick = () => {
    sound.playClick();
    const cur = parseFloat(DOM.inputItemQty.value) || 0;
    const isWeight = DOM.inputItemUnit.value === 'kg' || DOM.inputItemUnit.value === 'liter';
    const step = isWeight ? 0.5 : 1;
    const minVal = isWeight ? 0.5 : 1;
    if (cur > minVal) {
      const nextVal = +(cur - step).toFixed(2);
      DOM.inputItemQty.value = nextVal >= minVal ? nextVal : minVal;
      updateModalCalculations();
    } else {
      DOM.inputItemQty.value = minVal;
      updateModalCalculations();
    }
  };

  document.querySelectorAll('.cat-pick').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      DOM.inputItemCategory.value = btn.getAttribute('data-cat');
      updateModalChips();
    };
  });

  document.querySelectorAll('.unit-pick').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      const newUnit = btn.getAttribute('data-unit');
      DOM.inputItemUnit.value = newUnit;
      updateModalChips();

      const isWeight = newUnit === 'kg' || newUnit === 'liter';
      const cur = parseFloat(DOM.inputItemQty.value) || 1;
      if (!isWeight) {
        DOM.inputItemQty.value = Math.max(1, Math.round(cur));
      }
      updateModalCalculations();
    };
  });

  document.querySelectorAll('.btn-item-disc-preset').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      DOM.inputItemDiscount.value = btn.getAttribute('data-disc');
      updateModalCalculations();
    };
  });

  DOM.itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = DOM.inputItemName.value.trim();
    const category = DOM.inputItemCategory.value;
    const unit = DOM.inputItemUnit.value;
    const qty = parseFloat(DOM.inputItemQty.value) || 1;
    const unitPrice = parseFloat(DOM.inputItemPrice.value) || 0;
    const discountInput = DOM.inputItemDiscount.value.trim();

    if (!name || unitPrice <= 0) {
      alert('Mohon isi nama produk dan harga satuan!');
      return;
    }

    const math = Calculator.calculateItemTotal(unitPrice, qty, discountInput);
    const benchmark = Store.findBenchmark(name);

    const itemData = {
      name,
      category,
      unit,
      qty,
      unitPrice,
      discountInput,
      grossTotal: math.grossTotal,
      netTotal: math.netTotal,
      totalSavings: math.totalSavings,
      effectiveDiscountPercent: math.effectiveDiscountPercent,
      lastMonthPrice: benchmark ? benchmark.lastPrice : null
    };

    if (currentEditingItemId) {
      Store.updateItem(currentEditingItemId, itemData);
      showToast(`"${name}" berhasil diubah!`, 'check');
    } else {
      Store.addItem(itemData);
      showToast(`"${name}" masuk ke troli!`, 'shopping-cart');
      sound.playClick();
    }

    closeItemModal();
    renderCart();

    const settings = Store.getSettings();
    const totalSpent = Store.getCart().reduce((sum, i) => sum + i.netTotal, 0);
    if (totalSpent > settings.budgetCap) {
      sound.playWarning();
      showToast('PERINGATAN: Belanja melebihi Safety Cap!', 'alert-triangle');
    }
  });

  DOM.btnOpenAddModal.onclick = () => openItemModal();
  DOM.btnQuickAddHeader.onclick = () => openItemModal();
  DOM.btnEmptyAdd.onclick = () => openItemModal();
  DOM.btnCloseItemModal.onclick = closeItemModal;

  // Listeners untuk Sesi Belanja: storeLocation & shoppingDate
  if (DOM.inputStoreLocation) {
    DOM.inputStoreLocation.addEventListener('change', () => {
      const loc = DOM.inputStoreLocation.value.trim() || 'Supermarket Utama';
      Store.setStoreLocation(loc);
      showToast(`Lokasi toko: "${loc}" disinkronkan`, 'map-pin');
    });
  }

  if (DOM.inputShoppingDate) {
    DOM.inputShoppingDate.addEventListener('change', () => {
      const dt = DOM.inputShoppingDate.value;
      Store.setShoppingDate(dt);
      showToast(`Tanggal belanja disinkronkan`, 'calendar');
    });
  }
}

// ================= Checkout Modal (F-06 Selesaikan Belanja) =================
function setupCheckoutModal() {
  DOM.btnOpenCheckoutModal.onclick = () => {
    sound.playClick();
    const cart = Store.getCart();
    if (cart.length === 0) return;

    const session = Store.getSessionData();
    const settings = Store.getSettings();
    const totalSpent = session.totalSpent;
    const totalSavings = session.totalSavings;
    const remaining = settings.budgetCap - totalSpent;

    if (DOM.chkModalStore) {
      DOM.chkModalStore.textContent = session.storeLocation;
    }
    DOM.chkModalBudget.textContent = Calculator.formatRupiah(settings.budgetCap);
    DOM.chkModalTotal.textContent = Calculator.formatRupiah(totalSpent);
    DOM.chkModalSavings.textContent = `Hemat ${Calculator.formatRupiah(totalSavings)}`;
    DOM.chkModalRemaining.textContent = remaining >= 0
      ? `Sisa: ${Calculator.formatRupiah(remaining)}`
      : `Defisit: ${Calculator.formatRupiah(Math.abs(remaining))}`;
    DOM.chkModalRemaining.className = remaining >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black';

    const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    DOM.inputCheckoutTitle.value = `Belanja di ${session.storeLocation} - ${monthName}`;

    DOM.checkoutModalOverlay.classList.add('active');
  };

  DOM.btnCloseCheckoutModal.onclick = () => {
    DOM.checkoutModalOverlay.classList.remove('active');
  };

  DOM.btnConfirmCheckout.onclick = () => {
    const title = DOM.inputCheckoutTitle.value.trim();
    const trip = Store.checkoutCart(title);
    if (trip) {
      sound.playCashRegister();
      DOM.checkoutModalOverlay.classList.remove('active');
      showToast('Belanja selesai & tersimpan di Riwayat!', 'check-circle');
      renderCart();

      const riwayatTabBtn = document.querySelector('[data-tab="tab-riwayat"]');
      if (riwayatTabBtn) riwayatTabBtn.click();
    }
  };
}

// ================= Budget Modal & Settings =================
function setupBudgetControls() {
  DOM.btnEditBudget.onclick = () => {
    sound.playClick();
    const settings = Store.getSettings();
    DOM.modalBudgetInput.value = settings.budgetCap;
    DOM.budgetModalOverlay.classList.add('active');
  };

  DOM.btnCloseBudgetModal.onclick = () => {
    DOM.budgetModalOverlay.classList.remove('active');
  };

  document.querySelectorAll('.modal-preset-cap').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      DOM.modalBudgetInput.value = btn.getAttribute('data-val');
    };
  });

  DOM.btnSaveBudgetModal.onclick = () => {
    const val = parseFloat(DOM.modalBudgetInput.value);
    if (val > 0) {
      Store.updateSettings({ budgetCap: val });
      DOM.budgetModalOverlay.classList.remove('active');
      showToast('Batas Safety Cap berhasil diperbarui!', 'shield-check');
      renderCart();
    }
  };

  const settings = Store.getSettings();
  DOM.inputSettingBudget.value = settings.budgetCap;

  DOM.btnSaveSettingBudget.onclick = () => {
    const val = parseFloat(DOM.inputSettingBudget.value);
    if (val > 0) {
      Store.updateSettings({ budgetCap: val });
      showToast('Safety Cap tersimpan!', 'check');
      renderCart();
    }
  };

  document.querySelectorAll('.btn-preset-cap').forEach(btn => {
    btn.onclick = () => {
      DOM.inputSettingBudget.value = btn.getAttribute('data-val');
    };
  });

  DOM.btnSoundToggle.onclick = () => {
    sound.enabled = !sound.enabled;
    if (sound.enabled) {
      sound.playTone(880, 'sine', 0.1);
      DOM.btnSoundToggle.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i>';
      showToast('Suara & Haptik aktif');
    } else {
      DOM.btnSoundToggle.innerHTML = '<i data-lucide="volume-x" class="w-4 h-4 text-slate-500"></i>';
      showToast('Suara dinonaktifkan');
    }
    refreshIcons();
  };

  DOM.btnResetAllData.onclick = () => {
    if (confirm('Kembalikan semua data ke setelan awal demo?')) {
      Store.resetData();
      showToast('Data berhasil di-reset!', 'refresh-cw');
      renderCart();
      renderHistory();
      renderBenchmarks();
    }
  };

  // Manual Cloud Sync button
  if (DOM.btnManualSync) {
    DOM.btnManualSync.onclick = () => {
      sound.playClick();
      Store.syncToCloud();
      showToast('Sinkronisasi paksa ke Cloud terkirim!', 'refresh-cw');
    };
  }
}

// ================= Render History & Benchmarks (F-06) =================
function renderHistory() {
  const history = Store.getHistory();
  if (history.length === 0) {
    DOM.viewTripsContainer.innerHTML = `
      <div class="text-center py-10 text-slate-500 text-xs">
        <i data-lucide="calendar" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
        Belum ada riwayat belanja kasir yang tersimpan.
      </div>
    `;
  } else {
    DOM.viewTripsContainer.innerHTML = history.map(trip => {
      return `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition">
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="text-[10px] text-slate-400 font-semibold block">${trip.date} • ${trip.storeLocation || 'Supermarket'}</span>
              <h4 class="text-sm font-bold text-white">${trip.title}</h4>
            </div>
            <span class="text-xs font-black text-emerald-400 bg-emerald-950/70 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              ${Calculator.formatRupiah(trip.totalSpent)}
            </span>
          </div>

          <div class="flex justify-between text-xs text-slate-400 my-2 pt-2 border-t border-slate-800">
            <span>${trip.itemsCount} Barang</span>
            <span class="text-emerald-400 font-semibold">Hemat ${Calculator.formatRupiah(trip.totalSavings)}</span>
          </div>

          <!-- Item list breakdown toggle -->
          <details class="text-xs text-slate-400 mt-2">
            <summary class="cursor-pointer text-emerald-400 font-semibold py-1">Lihat Rincian Barang (${trip.items.length})</summary>
            <div class="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-700">
              ${trip.items.map(item => `
                <div class="flex justify-between py-0.5">
                  <span class="text-slate-300 font-medium">${item.name} (${item.qty} ${item.unit})</span>
                  <span class="text-slate-400 font-semibold">${Calculator.formatRupiah(item.netTotal)}</span>
                </div>
              `).join('')}
            </div>
          </details>

          <div class="mt-3 flex justify-end">
            <button class="btn-del-trip text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1" data-id="${trip.id}">
              <i data-lucide="trash" class="w-3 h-3"></i> Hapus Riwayat
            </button>
          </div>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.btn-del-trip').forEach(btn => {
      btn.onclick = () => {
        const tripId = btn.getAttribute('data-id');
        if (confirm('Hapus transaksi ini dari riwayat?')) {
          Store.deleteHistoryTrip(tripId);
          showToast('Riwayat dihapus', 'trash-2');
          renderHistory();
        }
      };
    });
  }
  refreshIcons();
}

function renderBenchmarks() {
  const benchmarks = Store.getBenchmarks();
  const search = (DOM.inputSearchBenchmark.value || '').toLowerCase();
  const filtered = search
    ? benchmarks.filter(b => b.name.toLowerCase().includes(search) || b.category.toLowerCase().includes(search))
    : benchmarks;

  if (filtered.length === 0) {
    DOM.benchmarkList.innerHTML = '<p class="text-xs text-slate-500 text-center py-6">Tidak ada acuan harga yang cocok.</p>';
  } else {
    DOM.benchmarkList.innerHTML = filtered.map(b => `
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
        <div>
          <span class="text-[10px] text-emerald-400 font-bold block">${b.category}</span>
          <strong class="text-white text-sm">${b.name}</strong>
          <span class="text-[11px] text-slate-400 block">Acuan: ${Calculator.formatRupiah(b.lastPrice)} / ${b.unit}</span>
        </div>
        <div class="text-right">
          <span class="text-[10px] text-slate-500 block">Tercatat:</span>
          <span class="text-[11px] text-slate-400 font-medium">${b.lastDate || 'Bulan Lalu'}</span>
        </div>
      </div>
    `).join('');
  }
}

DOM.inputSearchBenchmark.addEventListener('input', renderBenchmarks);

// ================= F-03 Simulator Tab Interactivity =================
function setupSimulator() {
  function updateSim() {
    const price = parseFloat(DOM.simPrice.value) || 0;
    const formula = DOM.simDiscount.value;
    const math = Calculator.calculateItemTotal(price, 1, formula);

    DOM.simGrossResult.textContent = Calculator.formatRupiah(math.grossTotal);
    DOM.simSavedResult.textContent = `Hemat ${Calculator.formatRupiah(math.totalSavings)} (${math.effectiveDiscountPercent}%)`;
    DOM.simNetResult.textContent = Calculator.formatRupiah(math.netTotal);
  }

  DOM.simPrice.addEventListener('input', updateSim);
  DOM.simDiscount.addEventListener('input', updateSim);

  document.querySelectorAll('.btn-sim-preset').forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      DOM.simDiscount.value = btn.getAttribute('data-formula');
      updateSim();
    };
  });

  updateSim();
}

// Setup Category Filter Chips in Cart
DOM.categoryFilters.forEach(btn => {
  btn.onclick = () => {
    sound.playClick();
    DOM.categoryFilters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategoryFilter = btn.getAttribute('data-category');
    renderCart();
  };
});

// ================= Ide Resep Makanan Cerdas (Khusus Bahan Makanan) =================
let currentRecipeSource = 'CART';

function updateRecipeBadge() {
  const cart = Store.getCart();
  const recipes = matchRecipesWithItems(cart);
  const readyCount = recipes.filter(r => r.isReady).length;

  if (DOM.recipeReadyCountBadge) {
    if (readyCount > 0) {
      DOM.recipeReadyCountBadge.textContent = `${readyCount} Siap Masak`;
      DOM.recipeReadyCountBadge.className = 'bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm';
      if (DOM.recipeBannerDesc) {
        DOM.recipeBannerDesc.textContent = `${readyCount} resep bisa langsung dimasak dari bahan makanan di troli!`;
      }
    } else {
      DOM.recipeReadyCountBadge.textContent = 'Cek Resep';
      DOM.recipeReadyCountBadge.className = 'bg-amber-500/30 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full';
      if (DOM.recipeBannerDesc) {
        DOM.recipeBannerDesc.textContent = 'Lihat ide masakan kosan & bahan yang perlu ditambah';
      }
    }
  }
}

function renderRecipes() {
  let sourceItems = [];
  if (currentRecipeSource === 'CART') {
    sourceItems = Store.getCart();
  } else {
    const cart = Store.getCart();
    const history = Store.getHistory();
    const historyItems = history.flatMap(trip => trip.items || []);
    sourceItems = [...cart, ...historyItems];
  }

  const foodItems = sourceItems.filter(isFoodItem);
  const distinctFoodNames = Array.from(new Set(foodItems.map(i => i.name.trim())));

  if (!DOM.detectedFoodStrip) return;

  if (distinctFoodNames.length === 0) {
    DOM.detectedFoodStrip.innerHTML = `
      <div class="text-slate-400 text-center py-2">
        <span class="block text-slate-400 font-medium mb-1">Belum ada bahan makanan terdeteksi.</span>
        <span class="text-[11px] text-slate-500">Masukkan telur, beras, mie, bumbu, sayur, atau lauk ke troli!</span>
      </div>
    `;
  } else {
    DOM.detectedFoodStrip.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-slate-300 font-bold flex items-center gap-1">
          <span>🥕 Bahan Makanan Terdeteksi (${distinctFoodNames.length}):</span>
        </span>
        <span class="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
          Non-Mandi Tersaring ✓
        </span>
      </div>
      <div class="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        ${distinctFoodNames.map(name => `
          <span class="bg-slate-900 border border-slate-700/80 text-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
            ${name}
          </span>
        `).join('')}
      </div>
    `;
  }

  const matched = matchRecipesWithItems(sourceItems);

  if (!DOM.recipesListContainer) return;

  DOM.recipesListContainer.innerHTML = matched.map(recipe => {
    const isReadyBadge = recipe.isReady
      ? `<span class="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm shadow-emerald-500/30">
           <i data-lucide="check-circle" class="w-3 h-3"></i> Siap Dimasak!
         </span>`
      : `<span class="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
           <i data-lucide="clock" class="w-3 h-3"></i> ${recipe.matchPercent}% Cocok
         </span>`;

    return `
      <div class="bg-slate-900 border ${recipe.isReady ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-slate-800'} rounded-2xl p-3.5 space-y-2.5 transition">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span class="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">
                ${recipe.category}
              </span>
              <span class="text-[10px] text-slate-400 flex items-center gap-0.5">
                <i data-lucide="clock" class="w-3 h-3"></i> ${recipe.prepTime}
              </span>
            </div>
            <h4 class="text-sm font-extrabold text-white">${recipe.title}</h4>
            <p class="text-xs text-slate-400">${recipe.subtitle}</p>
          </div>
          <div class="shrink-0">
            ${isReadyBadge}
          </div>
        </div>

        <!-- Progress Bahan -->
        <div class="space-y-1">
          <div class="flex justify-between text-[11px]">
            <span class="text-slate-400">Kesiapan Bahan:</span>
            <span class="${recipe.isReady ? 'text-emerald-400 font-bold' : 'text-slate-300 font-semibold'}">
              ${recipe.owned.length} dari ${recipe.ingredients.length} bahan
            </span>
          </div>
          <div class="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
            <div class="h-full rounded-full ${recipe.isReady ? 'bg-emerald-400' : 'bg-amber-400'}" style="width: ${recipe.matchPercent}%"></div>
          </div>
        </div>

        <!-- Checklist Bahan (Tersedia vs Perlu Beli) -->
        <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs">
          ${recipe.owned.length > 0 ? `
            <div>
              <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                ✓ Ada di Belanjaan:
              </span>
              <div class="flex flex-wrap gap-1">
                ${recipe.owned.map(ing => `
                  <span class="text-[11px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                    ${ing}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${recipe.missing.length > 0 ? `
            <div class="${recipe.owned.length > 0 ? 'pt-1.5 border-t border-slate-800/80' : ''}">
              <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                + Belum Ada (Bisa Ditambah ke Troli):
              </span>
              <div class="flex flex-wrap gap-1">
                ${recipe.missing.map(ing => `
                  <span class="text-[11px] bg-slate-900 border border-amber-500/20 text-slate-400 px-2 py-0.5 rounded-md font-medium">
                    ${ing}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Accordion Langkah Memasak -->
        <details class="text-xs text-slate-300">
          <summary class="cursor-pointer font-bold text-emerald-400 py-1 hover:underline flex items-center justify-between">
            <span>📖 Cara Masak Cepat (${recipe.steps.length} Langkah)</span>
          </summary>
          <ol class="mt-2 space-y-1.5 pl-4 list-decimal text-slate-300 border-l-2 border-emerald-500/30 ml-1 py-1">
            ${recipe.steps.map(step => `
              <li class="leading-relaxed pl-1">${step}</li>
            `).join('')}
          </ol>
        </details>
      </div>
    `;
  }).join('');

  refreshIcons();
}

function setupRecipesModule() {
  if (DOM.btnOpenRecipesModal) {
    DOM.btnOpenRecipesModal.onclick = () => {
      sound.playClick();
      renderRecipes();
      DOM.recipesModalOverlay.classList.add('active');
    };
  }

  if (DOM.btnCloseRecipesModal) {
    DOM.btnCloseRecipesModal.onclick = () => {
      DOM.recipesModalOverlay.classList.remove('active');
    };
  }

  if (DOM.recipeSourceCart) {
    DOM.recipeSourceCart.onclick = () => {
      sound.playClick();
      currentRecipeSource = 'CART';
      DOM.recipeSourceCart.className = 'py-2 rounded-lg bg-slate-800 text-emerald-400 shadow transition font-bold';
      DOM.recipeSourceAll.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition font-bold';
      renderRecipes();
    };
  }

  if (DOM.recipeSourceAll) {
    DOM.recipeSourceAll.onclick = () => {
      sound.playClick();
      currentRecipeSource = 'ALL';
      DOM.recipeSourceAll.className = 'py-2 rounded-lg bg-slate-800 text-emerald-400 shadow transition font-bold';
      DOM.recipeSourceCart.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition font-bold';
      renderRecipes();
    };
  }
}

// ================= Realtime Multi-Device Sync (PENTING: onSnapshot Listener) =================
function startRealtimeSync() {
  updateConnectionUI('syncing', 'Menghubungkan ke Cloud Firestore...');

  // PENTING: Gunakan onSnapshot realtime listener, BUKAN getDoc/getDocs sekali baca
  realtimeUnsubscribe = subscribeActiveSessionRealtime(
    (remoteData, meta) => {
      if (remoteData) {
        // Terapkan data dari server ke Store & LocalStorage
        Store.applyRemoteSession(remoteData);
        // Render ulang keranjang & perhitungan
        renderCart();
      } else if (meta?.isInitial) {
        // Belum ada sesi di cloud, inisialisasi awal dari lokal
        Store.syncToCloud();
      }
    },
    (status, msg) => {
      updateConnectionUI(status, msg);
    }
  );
}

// ================= Login 1 Akun untuk Semua Akses (Realtime Base, Tanpa Refresh) =================
function setupAuth() {
  const user = getAuthUser();

  if (user) {
    // Pengguna sudah login sebelumnya (tersimpan di LocalStorage)
    DOM.loginOverlay.classList.add('hidden');
    if (DOM.activeUserBadge) DOM.activeUserBadge.textContent = `Akun: ${user.username}`;
    if (DOM.displayAuthUsername) DOM.displayAuthUsername.textContent = user.username;
    startRealtimeSync();
  } else {
    // Tampilkan modal login tanpa reload
    DOM.loginOverlay.classList.remove('hidden');
  }

  // Handle Submit Login (Realtime Base, Tidak Refresh / e.preventDefault)
  DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = DOM.loginUsername.value.trim() || 'admin';
    const password = DOM.loginPassword.value.trim();

    // Simpan 1 akun bersama untuk semua akses
    const session = loginUser(username, password);

    // Hilangkan overlay login tanpa refresh
    DOM.loginOverlay.classList.add('hidden');
    sound.playCashRegister();
    showToast(`Selamat datang, ${session.username}! Terhubung Realtime 🚀`, 'check-circle');

    if (DOM.activeUserBadge) DOM.activeUserBadge.textContent = `Akun: ${session.username}`;
    if (DOM.displayAuthUsername) DOM.displayAuthUsername.textContent = session.username;

    // Aktifkan realtime listener Firestore
    startRealtimeSync();
    renderCart();
    refreshIcons();
  });

  // Handle Logout
  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', () => {
      if (confirm('Keluar dari akun bersama ini?')) {
        logoutUser();
        updateConnectionUI('offline', 'Telah keluar');
        DOM.loginOverlay.classList.remove('hidden');
        showToast('Anda telah keluar dari akun.', 'log-out');
        refreshIcons();
      }
    });
  }
}

// ================= PWA Service Worker Registration =================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('PWA ServiceWorker registered with scope:', reg.scope))
        .catch(err => console.log('ServiceWorker registration error:', err));
    });
  }
}

// ================= Application Initialization =================
function initApp() {
  Store.init();
  setupTabs();
  setupFormListeners();
  setupCheckoutModal();
  setupBudgetControls();
  setupSimulator();
  setupRecipesModule();
  
  // Daftarkan listener observer perubahan Store ke UI
  Store.subscribe(() => {
    renderCart();
  });

  renderCart();
  setupAuth();
  registerServiceWorker();
  refreshIcons();
}

document.addEventListener('DOMContentLoaded', initApp);
