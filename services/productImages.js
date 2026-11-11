// Smart Product Image Lookup for Indian Groceries, Vegetables & Provisions
// Provides crisp, high-resolution visuals automatically without manual search

const PRODUCT_IMAGE_MAP = {
  // Vegetables
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=500&q=80',
  beans: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=500&q=80',
  brinjal: 'https://images.unsplash.com/photo-1628773822503-930a84d94d35?auto=format&fit=crop&w=500&q=80',
  eggplant: 'https://images.unsplash.com/photo-1628773822503-930a84d94d35?auto=format&fit=crop&w=500&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=500&q=80',
  garlic: 'https://images.unsplash.com/photo-1615477032219-bc188f7495b7?auto=format&fit=crop&w=500&q=80',
  ginger: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
  lemon: 'https://images.unsplash.com/photo-1533082831833-2a99a8c62b4c?auto=format&fit=crop&w=500&q=80',
  coriander: 'https://images.unsplash.com/photo-1599818816934-8c8d8b67116e?auto=format&fit=crop&w=500&q=80',
  mint: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?auto=format&fit=crop&w=500&q=80',
  cucumber: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=80',
  curry_leaves: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=500&q=80',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=80',
  beetroot: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=500&q=80',
  drumstick: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80',
  ladies_finger: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=500&q=80',
  okra: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=500&q=80',

  // Grains, Dals & Rice
  rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  basmati_rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
  atta: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
  maida: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80',
  rava: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
  sooji: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
  toor_dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=500&q=80',
  urad_dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=500&q=80',
  moong_dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=500&q=80',
  chana_dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=500&q=80',
  dal: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=500&q=80',

  // Oils & Ghee
  oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  cooking_oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  sunflower_oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  coconut_oil: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80',
  gingelly_oil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
  ghee: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',

  // Dairy
  milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  curd: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
  yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=80',
  butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80',

  // Spices & Condiments
  mustard: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  cumin: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
  jeera: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=500&q=80',
  pepper: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=500&q=80',
  cardamom: 'https://images.unsplash.com/photo-1599818816934-8c8d8b67116e?auto=format&fit=crop&w=500&q=80',
  clove: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=500&q=80',
  cinnamon: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=500&q=80',
  turmeric: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  salt: 'https://images.unsplash.com/photo-1518110903416-09252c78a05e?auto=format&fit=crop&w=500&q=80',
  sugar: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
  jaggery: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=500&q=80',
  tamarind: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
  cashew: 'https://images.unsplash.com/photo-1536591375315-1b83681498b7?auto=format&fit=crop&w=500&q=80',
  dry_grapes: 'https://images.unsplash.com/photo-1536591375315-1b83681498b7?auto=format&fit=crop&w=500&q=80',
  raisins: 'https://images.unsplash.com/photo-1536591375315-1b83681498b7?auto=format&fit=crop&w=500&q=80',

  // Packaging & Misc
  banana_leaves: 'https://images.unsplash.com/photo-1588628566587-dbd176de94b4?auto=format&fit=crop&w=500&q=80',
  leaves: 'https://images.unsplash.com/photo-1588628566587-dbd176de94b4?auto=format&fit=crop&w=500&q=80',
  cup: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
  tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
  coffee: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
  coffee_powder: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80',
};

const DEFAULT_GROCERY_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80';

export function getAutoProductImage(productName) {
  if (!productName || typeof productName !== 'string') {
    return DEFAULT_GROCERY_IMAGE;
  }

  const clean = productName.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const tokens = clean.split(/\s+/);

  // 1. Direct match on full clean string
  const snakeName = tokens.join('_');
  if (PRODUCT_IMAGE_MAP[snakeName]) {
    return PRODUCT_IMAGE_MAP[snakeName];
  }

  // 2. Token match (e.g. "Country Tomato" matches "tomato", "Sunland Sunflower Oil" matches "sunflower_oil" or "oil")
  for (let key in PRODUCT_IMAGE_MAP) {
    const keyWords = key.split('_');
    if (keyWords.every(w => clean.includes(w))) {
      return PRODUCT_IMAGE_MAP[key];
    }
  }

  for (let token of tokens) {
    if (PRODUCT_IMAGE_MAP[token]) {
      return PRODUCT_IMAGE_MAP[token];
    }
  }

  // 3. Fallback generic high quality food grocery photo
  return DEFAULT_GROCERY_IMAGE;
}

