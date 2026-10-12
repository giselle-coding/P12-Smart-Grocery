/**
 * Smart Grocery & Budget Safety Tracker
 * Module: Recipe Engine (Ide Resep Masakan dari Bahan Makanan Belanjaan)
 * Khusus MAKANAN — Memfilter & Mengabaikan Barang Non-Makanan (Perlengkapan Mandi, Deterjen, dll)
 */

export const RECIPES_DATA = [
  {
    id: 'resep-nasgor',
    title: 'Nasi Goreng Telur Spesial',
    subtitle: 'Menu andalan anak rantau paling lezat & cepat dibuat.',
    category: 'Sarapan / Makan Malam',
    prepTime: '10 menit',
    costEstimate: 'Hemat (< Rp 15.000)',
    tags: ['Cepat', 'Wajan', 'Favorit'],
    ingredients: [
      { name: 'Beras / Nasi', keywords: ['beras', 'nasi'], required: true },
      { name: 'Telur Ayam', keywords: ['telur'], required: true },
      { name: 'Bawang (Merah/Putih)', keywords: ['bawang'], required: true },
      { name: 'Minyak Goreng / Margarin', keywords: ['minyak', 'margarin'], required: true },
      { name: 'Kecap Manis', keywords: ['kecap'], required: false },
      { name: 'Cabai (Opsional)', keywords: ['cabai', 'cabe'], required: false },
      { name: 'Sosis / Bakso (Pelengkap)', keywords: ['sosis', 'bakso', 'nugget'], required: false }
    ],
    steps: [
      'Iris tipis bawang merah, bawang putih, dan cabai (jika suka pedas).',
      'Panaskan 1-2 sendok minyak goreng di wajan.',
      'Orak-arik telur ayam hingga setengah matang, lalu pinggirkan sebentar.',
      'Tumis irisan bawang hingga harum di wajan yang sama.',
      'Masukkan nasi dingin, aduk rata bersama telur dan tumisan bawang.',
      'Tambahkan kecap manis, garam, dan penyedap secukupnya. Aduk dengan api sedang hingga matang merata.',
      'Sajikan hangat di piring kosan!'
    ]
  },
  {
    id: 'resep-mie-nyemek',
    title: 'Mie Nyemek Kuah Kental Spesial',
    subtitle: 'Naik level indomie kosan dengan telur dan kuah nyemek gurih.',
    category: 'Makan Malam / Hujan',
    prepTime: '8 menit',
    costEstimate: 'Hemat (< Rp 12.000)',
    tags: ['Super Cepat', 'Indomie', 'Hangat'],
    ingredients: [
      { name: 'Indomie / Mie Instan', keywords: ['indomie', 'mie'], required: true },
      { name: 'Telur Ayam', keywords: ['telur'], required: true },
      { name: 'Bawang Merah / Putih', keywords: ['bawang'], required: false },
      { name: 'Cabai Rawit', keywords: ['cabai', 'cabe'], required: false },
      { name: 'Sayuran (Sawi / Kol / Tomat)', keywords: ['sawi', 'kol', 'kubis', 'tomat', 'caisim'], required: false },
      { name: 'Minyak Goreng', keywords: ['minyak'], required: false }
    ],
    steps: [
      'Tumis irisan bawang dan cabai rawit dengan sedikit minyak sampai wangi.',
      'Tuangkan air sekitar 1 gelas (jangan terlalu banyak agar kuahnya nyemek kental).',
      'Masukkan mie instan saat air mulai mendidih.',
      'Pecahkan 1 butir telur langsung ke dalam kuah, aduk perlahan agar kuah mengental gurih.',
      'Masukkan potongan sayur (sawi/kol/tomat) dan bumbu mie.',
      'Aduk sebentar hingga kuah menyusut menjadi nyemek, lalu angkat dan santap selagi hangat!'
    ]
  },
  {
    id: 'resep-omelet-sayur-sosis',
    title: 'Omelet Telur Sayur & Sosis',
    subtitle: 'Padat gizi, kaya serat dan protein untuk sarapan sebelum kuliah.',
    category: 'Sarapan Sehat',
    prepTime: '7 menit',
    costEstimate: 'Hemat (< Rp 14.000)',
    tags: ['Tinggi Protein', 'Cepat'],
    ingredients: [
      { name: 'Telur Ayam', keywords: ['telur'], required: true },
      { name: 'Minyak Goreng / Margarin', keywords: ['minyak', 'margarin'], required: true },
      { name: 'Sosis / Bakso', keywords: ['sosis', 'bakso'], required: false },
      { name: 'Wortel / Daun Bawang / Kol', keywords: ['wortel', 'daun bawang', 'kol', 'bayam'], required: false },
      { name: 'Bawang Merah / Putih', keywords: ['bawang'], required: false }
    ],
    steps: [
      'Kocok 1-2 butir telur di mangkuk.',
      'Potong dadu kecil sosis/bakso dan iris halus sayuran (wortel/daun bawang).',
      'Campurkan irisan sayur dan sosis ke dalam kocokan telur, beri garam dan merica secukupnya.',
      'Panaskan minyak di teflon dengan api kecil.',
      'Tuang adonan telur dan ratakan. Balik perlahan saat sisi bawah sudah kecokelatan.',
      'Angkat saat kedua sisi matang sempurna. Sangat cocok dimakan dengan nasi hangat!'
    ]
  },
  {
    id: 'resep-tumis-kangkung',
    title: 'Tumis Kangkung Saus Tiram',
    subtitle: 'Sayuran segar renyah gurih penambah stamina anak rantau.',
    category: 'Makan Siang',
    prepTime: '7 menit',
    costEstimate: 'Super Murah (< Rp 10.000)',
    tags: ['Sayuran', 'Segar', 'Sehat'],
    ingredients: [
      { name: 'Kangkung Segar', keywords: ['kangkung'], required: true },
      { name: 'Bawang Merah / Putih', keywords: ['bawang'], required: true },
      { name: 'Minyak Goreng', keywords: ['minyak'], required: true },
      { name: 'Cabai Rawit / Merah', keywords: ['cabai', 'cabe'], required: false },
      { name: 'Saus Tiram', keywords: ['saus tiram', 'saori'], required: false },
      { name: 'Tomat Sayur', keywords: ['tomat'], required: false }
    ],
    steps: [
      'Petik dan cuci bersih kangkung.',
      'Iris bawang merah, bawang putih, cabai, dan tomat.',
      'Panaskan 2 sendok minyak, tumis bawang dan cabai hingga harum.',
      'Masukkan kangkung, gunakan api besar agar warna kangkung tetap hijau segar.',
      'Beri 1 sendok saus tiram, sedikit garam dan air (2 sendok makan).',
      'Aduk cepat selama 2-3 menit hingga agak layu tapi tetap renyah, angkat segera!'
    ]
  },
  {
    id: 'resep-tahu-tempe-goreng',
    title: 'Tahu & Tempe Goreng Gurih Bawang',
    subtitle: 'Lauk legendaris anak kos yang murah meriah dan kaya protein.',
    category: 'Lauk Harian',
    prepTime: '12 menit',
    costEstimate: 'Super Murah (< Rp 8.000)',
    tags: ['Lauk Murah', 'Protein Nabati'],
    ingredients: [
      { name: 'Tempe / Tahu', keywords: ['tempe', 'tahu'], required: true },
      { name: 'Minyak Goreng', keywords: ['minyak'], required: true },
      { name: 'Bawang Putih', keywords: ['bawang'], required: false },
      { name: 'Garam Dapur', keywords: ['garam'], required: false }
    ],
    steps: [
      'Potong tempe dan tahu sesuai selera (beri goresan kecil agar bumbu meresap).',
      'Rendam tempe dan tahu sebentar di air yang sudah diberi garam dan ulekan bawang putih.',
      'Panaskan minyak goreng dalam jumlah cukup.',
      'Goreng tempe dan tahu hingga berwarna kuning keemasan dan luarnya garing.',
      'Tiriskan dan sajikan dengan cabai rawit hijau atau kecap manis!'
    ]
  },
  {
    id: 'resep-sarden-pedas',
    title: 'Sarden Tumis Tomat & Cabai',
    subtitle: 'Sarden kaleng dimasak ulang dengan bumbu iris segar berlipat ganda lezatnya.',
    category: 'Makan Siang / Malam',
    prepTime: '10 menit',
    costEstimate: 'Sedang (< Rp 25.000)',
    tags: ['Praktis', 'Ikan', 'Pedas'],
    ingredients: [
      { name: 'Sarden Kaleng', keywords: ['sarden'], required: true },
      { name: 'Bawang Merah / Putih', keywords: ['bawang'], required: true },
      { name: 'Cabai Rawit / Merah', keywords: ['cabai', 'cabe'], required: false },
      { name: 'Tomat Sayur', keywords: ['tomat'], required: false },
      { name: 'Minyak Goreng', keywords: ['minyak'], required: true }
    ],
    steps: [
      'Iris bawang merah, bawang putih, cabai, dan potong-potong tomat.',
      'Tumis irisan bumbu dengan sedikit minyak hingga layu dan harum.',
      'Tuangkan sarden kaleng beserta sausnya ke dalam wajan.',
      'Tambahkan sedikit air, gula, dan garam bila perlu koreksi rasa.',
      'Masak dengan api sedang hingga kuah mengental dan meresap ke ikan.',
      'Sajikan bersama nasi putih panas!'
    ]
  },
  {
    id: 'resep-sup-ayam-wortel',
    title: 'Sup Bening Ayam Wortel & Kentang',
    subtitle: 'Kuah bening segar bernutrisi saat badan lelah atau butuh yang hangat-hangat.',
    category: 'Makan Siang / Sehat',
    prepTime: '20 menit',
    costEstimate: 'Sedang (< Rp 30.000)',
    tags: ['Kuah Segar', 'Nutrisi Lengkap'],
    ingredients: [
      { name: 'Daging Ayam / Fillet', keywords: ['ayam'], required: true },
      { name: 'Wortel & Kentang', keywords: ['wortel', 'kentang'], required: true },
      { name: 'Bawang Putih', keywords: ['bawang'], required: true },
      { name: 'Daun Bawang / Seledri', keywords: ['daun bawang', 'seledri'], required: false },
      { name: 'Garam / Merica / Royco', keywords: ['garam', 'merica', 'royco', 'masako'], required: false }
    ],
    steps: [
      'Rebus potongan ayam dalam panci berisi air hingga mendidih dan buang buih kotorannya.',
      'Tumis geprekan bawang putih hingga harum, lalu masukkan ke dalam kuah kaldu rebusan ayam.',
      'Masukkan potongan kentang dan wortel, rebus hingga empuk.',
      'Beri garam, gula, dan merica bubuk secukupnya. Cicipi kuahnya.',
      'Terakhir, masukkan irisan daun bawang dan seledri sebelum kompor dimatikan.',
      'Sup ayam hangat siap dinikmati!'
    ]
  },
  {
    id: 'resep-ayam-kecap',
    title: 'Ayam Kecap Manis Gurih',
    subtitle: 'Potongan ayam dengan saus kecap kental manis gurih meresap sampai ke tulang.',
    category: 'Lauk Istimewa',
    prepTime: '20 menit',
    costEstimate: 'Sedang (< Rp 35.000)',
    tags: ['Ayam', 'Meresap', 'Favorit'],
    ingredients: [
      { name: 'Daging Ayam', keywords: ['ayam'], required: true },
      { name: 'Kecap Manis', keywords: ['kecap'], required: true },
      { name: 'Bawang Merah / Putih', keywords: ['bawang'], required: true },
      { name: 'Minyak / Margarin', keywords: ['minyak', 'margarin'], required: true },
      { name: 'Cabai (Opsional)', keywords: ['cabai', 'cabe'], required: false }
    ],
    steps: [
      'Goreng potongan ayam sebentar hingga setengah matang/berkulit, lalu tiriskan.',
      'Tumis irisan bawang merah dan bawang putih hingga harum kecokelatan.',
      'Masukkan ayam yang sudah digoreng ke dalam wajan.',
      'Tambahkan kecap manis, sedikit saus tiram (jika ada), garam, dan sedikit air.',
      'Ungkep dengan api kecil hingga air menyusut dan saus kecap mengental meresap ke dalam ayam.',
      'Sajikan ayam kecap lezat dengan nasi hangat!'
    ]
  },
  {
    id: 'resep-nugget-sambal-korek',
    title: 'Nugget Goreng Sambal Bawang Pedas',
    subtitle: 'Nugget renyah dipadukan sambal bawang siram minyak panas khas kosan.',
    category: 'Makan Malam Cepat',
    prepTime: '6 menit',
    costEstimate: 'Hemat (< Rp 18.000)',
    tags: ['Pedas Nendang', 'Super Cepat'],
    ingredients: [
      { name: 'Nugget Ayam', keywords: ['nugget'], required: true },
      { name: 'Cabai Rawit', keywords: ['cabai', 'cabe'], required: true },
      { name: 'Bawang Putih', keywords: ['bawang'], required: true },
      { name: 'Minyak Goreng', keywords: ['minyak'], required: true },
      { name: 'Garam Dapur', keywords: ['garam'], required: false }
    ],
    steps: [
      'Goreng nugget ayam dalam minyak panas hingga berwarna cokelat keemasan dan renyah.',
      'Ulek kasar cabai rawit, bawang putih, dan sedikit garam di cobek/piring.',
      'Ambil 2 sendok minyak sisa menggoreng nugget yang masih panas mendidih, siramkan ke atas ulekan sambal.',
      'Penyet nugget di atas sambal bawang.',
      'Santap segera dengan nasi hangat, dijamin nambah porsi!'
    ]
  }
];

// Helper: Filter barang KHUSUS MAKANAN saja (Mengabaikan barang mandi/pembersih)
export function isFoodItem(item) {
  if (!item || !item.name) return false;

  // Cek Kategori non-makanan
  const nonFoodCategories = ['perlengkapan mandi', 'pembersih', 'alat mandi', 'deterjen'];
  if (item.category && nonFoodCategories.includes(item.category.toLowerCase().trim())) {
    return false;
  }

  // Blacklist kata kunci non-makanan (sabun, shampoo, sikat gigi, deterjen, dll)
  const nonFoodKeywords = [
    'sabun', 'shampoo', 'shampo', 'deterjen', 'pepsodent', 'sikat', 'pasta gigi',
    'sunlight', 'parfum', 'tissue', 'tisu', 'rinso', 'lifebuoy', 'baygon',
    'pewangi', 'downy', 'molto', 'pembersih', 'spons', 'pel', 'kapur barus'
  ];

  const lowerName = item.name.toLowerCase();
  for (const badWord of nonFoodKeywords) {
    if (lowerName.includes(badWord)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluasi daftar resep berdasarkan bahan makanan yang dimiliki di troli/riwayat belanja
 * @param {Array} itemList - Daftar item belanjaan
 * @returns {Array} Daftar resep dengan persentase kecocokan & status ketersediaan bahan
 */
export function matchRecipesWithItems(itemList) {
  // Hanya ambil barang makanan
  const foodItems = (itemList || []).filter(isFoodItem);
  const foodNames = foodItems.map(item => item.name.toLowerCase());

  return RECIPES_DATA.map(recipe => {
    let matchedRequiredCount = 0;
    let totalRequiredCount = 0;
    const owned = [];
    const missing = [];

    recipe.ingredients.forEach(ing => {
      if (ing.required) {
        totalRequiredCount++;
      }

      // Cek apakah ada barang belanjaan makanan yang cocok dengan keyword bahan
      const hasMatch = ing.keywords.some(kw => 
        foodNames.some(name => name.includes(kw))
      );

      if (hasMatch) {
        owned.push(ing.name);
        if (ing.required) {
          matchedRequiredCount++;
        }
      } else {
        missing.push(ing.name + (ing.required ? ' (Wajib)' : ' (Opsional)'));
      }
    });

    const isReady = totalRequiredCount > 0 && matchedRequiredCount >= totalRequiredCount;
    const matchPercent = totalRequiredCount > 0 
      ? Math.round((matchedRequiredCount / totalRequiredCount) * 100)
      : 0;

    return {
      ...recipe,
      isReady,
      matchPercent,
      owned,
      missing,
      matchedFoodCount: owned.length
    };
  }).sort((a, b) => {
    // Prioritaskan yang siap masak (100%), lalu yang persentase kecocokan bahan tertingginya
    if (a.isReady && !b.isReady) return -1;
    if (!a.isReady && b.isReady) return 1;
    return b.matchPercent - a.matchPercent;
  });
}
