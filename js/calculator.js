/**
 * Smart Grocery & Budget Safety Tracker
 * Module: Calculator (Matematika Diskon & Komparasi Harga)
 */

export const Calculator = {
  /**
   * Format angka ke Rupiah standar Indonesia
   * @param {number} value
   * @returns {string}
   */
  formatRupiah(value) {
    if (isNaN(value) || value === null || value === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Math.round(value));
  },

  /**
   * Parse ekspresi diskon (misal "25", "25%", "50+20", "50% + 20%")
   * Rumus diskon bertingkat: Harga * (1 - d1/100) * (1 - d2/100) ...
   * @param {string|number} discountInput 
   * @returns {Array<number>} Array of percentage numbers [50, 20]
   */
  parseDiscounts(discountInput) {
    if (!discountInput) return [];
    const str = String(discountInput).trim();
    if (!str) return [];

    // Pisahkan tanda '+' atau koma atau spasi
    const parts = str.split(/[+,/]/);
    const discounts = [];

    for (const part of parts) {
      const cleaned = part.replace(/[^0-9.]/g, '').trim();
      const val = parseFloat(cleaned);
      if (!isNaN(val) && val > 0 && val <= 100) {
        discounts.push(val);
      }
    }
    return discounts;
  },

  /**
   * Hitung subtotal, diskon bertingkat, dan penghematan
   * F-02 & F-03
   * @param {number} unitPrice - Harga satuan
   * @param {number} qty - Kuantitas
   * @param {string|number} discountInput - Diskon (contoh: "50+20")
   */
  calculateItemTotal(unitPrice, qty, discountInput = '') {
    const validPrice = Math.max(0, parseFloat(unitPrice) || 0);
    const validQty = Math.max(0, parseFloat(qty) || 0);
    const grossTotal = validPrice * validQty;

    const discountTiers = this.parseDiscounts(discountInput);
    let netTotal = grossTotal;
    const tierSteps = [];

    // Terapkan diskon bertumpuk berurutan
    let currentStepBase = grossTotal;
    for (let i = 0; i < discountTiers.length; i++) {
      const rate = discountTiers[i];
      const cut = currentStepBase * (rate / 100);
      const afterCut = currentStepBase - cut;
      tierSteps.push({
        tier: i + 1,
        percentage: rate,
        saved: cut,
        subAfter: afterCut
      });
      currentStepBase = afterCut;
    }

    netTotal = currentStepBase;
    const totalSavings = grossTotal - netTotal;
    const effectiveDiscountPercent = grossTotal > 0 
      ? ((totalSavings / grossTotal) * 100).toFixed(1)
      : 0;

    return {
      grossTotal,
      netTotal,
      totalSavings,
      effectiveDiscountPercent: parseFloat(effectiveDiscountPercent),
      discountTiers,
      tierSteps
    };
  },

  /**
   * F-04: Komparator Harga Realtime vs Bulan Lalu
   * @param {number} currentUnitPrice - Harga satuan saat ini
   * @param {number|null} lastMonthUnitPrice - Harga satuan bulan lalu
   * @returns {Object} status komparasi: 'UP', 'DOWN', 'EQUAL', 'NEW'
   */
  comparePrice(currentUnitPrice, lastMonthUnitPrice) {
    const cur = parseFloat(currentUnitPrice) || 0;
    if (lastMonthUnitPrice === null || lastMonthUnitPrice === undefined || isNaN(lastMonthUnitPrice) || lastMonthUnitPrice <= 0) {
      return {
        status: 'NEW',
        diffAmount: 0,
        diffPercent: 0,
        label: 'Produk Baru',
        message: 'Belum ada catatan harga bulan lalu',
        icon: 'sparkles',
        badgeClass: 'badge-new'
      };
    }

    const prev = parseFloat(lastMonthUnitPrice);
    const diff = cur - prev;
    const percent = ((diff / prev) * 100);

    if (diff > 0) {
      return {
        status: 'UP',
        diffAmount: diff,
        diffPercent: Math.abs(percent).toFixed(1),
        label: 'Lebih Mahal',
        message: `↑ Naik ${this.formatRupiah(diff)} (+${Math.abs(percent).toFixed(1)}%) vs bln lalu (${this.formatRupiah(prev)})`,
        icon: 'arrow-up-right',
        badgeClass: 'badge-up'
      };
    } else if (diff < 0) {
      return {
        status: 'DOWN',
        diffAmount: Math.abs(diff),
        diffPercent: Math.abs(percent).toFixed(1),
        label: 'Lebih Murah',
        message: `↓ Hemat ${this.formatRupiah(Math.abs(diff))} (-${Math.abs(percent).toFixed(1)}%) vs bln lalu (${this.formatRupiah(prev)})`,
        icon: 'arrow-down-right',
        badgeClass: 'badge-down'
      };
    } else {
      return {
        status: 'EQUAL',
        diffAmount: 0,
        diffPercent: 0,
        label: 'Harga Stabil',
        message: `= Sama persis dengan bulan lalu (${this.formatRupiah(prev)})`,
        icon: 'equal',
        badgeClass: 'badge-equal'
      };
    }
  },

  /**
   * F-05: Evaluasi Safety Cap / Budget Health
   * @param {number} currentTotal - Total belanjaan di keranjang
   * @param {number} budgetCap - Batas anggaran
   */
  evaluateBudget(currentTotal, budgetCap) {
    const total = Math.max(0, parseFloat(currentTotal) || 0);
    const cap = Math.max(0, parseFloat(budgetCap) || 0);

    if (cap <= 0) {
      return {
        percent: 0,
        remaining: 0,
        status: 'UNSET',
        message: 'Batas anggaran belum diatur',
        theme: 'slate'
      };
    }

    const percent = Math.min(200, (total / cap) * 100);
    const remaining = cap - total;

    let status = 'SAFE'; // SAFE, WARNING, DANGER, OVER
    let message = `Sisa kuota: ${this.formatRupiah(remaining)}`;
    let theme = 'emerald'; // green

    if (total > cap) {
      status = 'OVER';
      message = `OVER BUDGET! Melebihi batas ${this.formatRupiah(Math.abs(remaining))}`;
      theme = 'rose'; // red
    } else if (percent >= 90) {
      status = 'DANGER';
      message = `Kritis! Hampir habis, sisa ${this.formatRupiah(remaining)}`;
      theme = 'rose';
    } else if (percent >= 70) {
      status = 'WARNING';
      message = `Perhatian! Sudah terpakai ${percent.toFixed(0)}%, sisa ${this.formatRupiah(remaining)}`;
      theme = 'amber'; // yellow
    } else {
      status = 'SAFE';
      message = `Aman! Kuota tersisa ${this.formatRupiah(remaining)}`;
      theme = 'emerald';
    }

    return {
      percent: Math.min(100, percent),
      rawPercent: percent,
      remaining,
      status,
      message,
      theme
    };
  }
};
