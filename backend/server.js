require('dotenv').config();
try {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore DNS override on environments that manage DNS
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

let dbConnected = false;
let memInvoices = [];
let memMenu = [];
let memCustomers = [];
let memShopSales = [];
let memShopExpenses = [];
let memStores = [];
let memStoreItems = [];

// Helper: Cloudinary Direct Upload
async function uploadToCloudinary(base64Data, folder = 'servebill_products') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials missing in .env');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

  const formData = new URLSearchParams();
  formData.append('file', base64Data);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary error: ${errText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

const formatDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id ? obj._id.toString() : obj.id;
  return obj;
};

// Monitor connection events
mongoose.connection.on('connected', () => {
  dbConnected = true;
  console.log('✅ Connected to MongoDB Atlas successfully');
});

mongoose.connection.on('error', (err) => {
  dbConnected = false;
  console.error('❌ MongoDB Atlas connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
  console.warn('⚠️ MongoDB Atlas disconnected');
});

// Connect to MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      dbConnected = true;
    })
    .catch((err) => console.error('❌ Initial MongoDB connection error:', err));
} else {
  console.warn('⚠️ No MONGO_URI provided in .env. Running in offline/memory mode.');
}

// Basic schemas and models for the billing app
const InvoiceSchema = new mongoose.Schema({
  customerName: String,
  clientName: String,
  customerPhone: String,
  clientPhone: String,
  items: { type: Array, default: [] },
  events: { type: Array, default: [] },
  subTotal: Number,
  taxAmount: Number,
  total: Number,
  grandTotal: String,
  date: { type: String },
  businessType: { type: String, default: 'CATERING' },
  amountReceived: { type: Number, default: 0 },
  transportCharge: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  extraItems: { type: Array, default: [] },
  expenses: { type: Array, default: [] }
}, { strict: false });
const Invoice = mongoose.model('Invoice', InvoiceSchema);

const MenuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  costPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  category: String,
  pricingType: { type: String, default: 'unit' },
  unit: { type: String, default: 'nos' }
}, { strict: false });
const MenuItem = mongoose.model('MenuItem', MenuSchema);

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});
const Customer = mongoose.model('Customer', CustomerSchema);

const ShopSaleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  morningSales: { type: Number, default: 0 },
  nightSales: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 }
});
const ShopSale = mongoose.model('ShopSale', ShopSaleSchema);

const ShopExpenseSchema = new mongoose.Schema({
  type: { type: String, enum: ['PURCHASE', 'OTHER'], default: 'OTHER' },
  item: String,
  category: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  notes: String
});
const ShopExpense = mongoose.model('ShopExpense', ShopExpenseSchema);

// Stores & Store-Wise Items
const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Grocery' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const Store = mongoose.model('Store', StoreSchema);

const StoreItemSchema = new mongoose.Schema({
  storeId: { type: String, required: true },
  storeName: { type: String, default: '' },
  name: { type: String, required: true },
  category: { type: String, default: 'General' },
  unit: { type: String, default: 'kg' },
  imageUrl: { type: String, default: '' },
  currentPrice: { type: Number, default: 0 },
  previousPrice: { type: Number, default: 0 },
  lastPurchasedDate: { type: Date, default: Date.now },
  priceHistory: [{
    id: String,
    price: Number,
    quantity: Number,
    total: Number,
    unit: String,
    chargeTo: { type: String, default: 'SHOP' },
    notes: String,
    date: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});
const StoreItem = mongoose.model('StoreItem', StoreItemSchema);

// Health check routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ServeBill Cloud API',
    database: dbConnected ? 'connected' : 'connecting_or_offline',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    database: dbConnected ? 'connected' : 'connecting_or_offline',
    timestamp: new Date().toISOString()
  });
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  if (!dbConnected) return res.json(memInvoices);
  try {
    const invoices = await Invoice.find().sort({ date: -1 });
    res.json(invoices.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  if (!dbConnected) {
    const newInvoice = { ...req.body, id: Date.now().toString(), date: new Date() };
    memInvoices.unshift(newInvoice);
    return res.status(201).json(newInvoice);
  }
  try {
    const newInvoice = new Invoice(req.body);
    const saved = await newInvoice.save();
    res.status(201).json(formatDoc(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  if (!dbConnected) {
    memInvoices = memInvoices.filter(i => i.id !== req.params.id);
    return res.json({ success: true });
  }
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  if (!dbConnected) {
    const idx = memInvoices.findIndex(i => i.id === req.params.id);
    if (idx !== -1) {
      memInvoices[idx] = { ...memInvoices[idx], ...req.body };
      return res.json(memInvoices[idx]);
    }
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Menu Items
app.get('/api/menu', async (req, res) => {
  if (!dbConnected) return res.json(memMenu);
  try {
    const menu = await MenuItem.find();
    res.json(menu.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/menu', async (req, res) => {
  if (!dbConnected) {
    const newItem = { ...req.body, id: Date.now().toString() };
    memMenu.push(newItem);
    return res.status(201).json(newItem);
  }
  try {
    const newItem = new MenuItem(req.body);
    const saved = await newItem.save();
    res.status(201).json(formatDoc(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/menu/:id', async (req, res) => {
  if (!dbConnected) {
    const idx = memMenu.findIndex(m => m.id === req.params.id);
    if (idx !== -1) {
      memMenu[idx] = { ...memMenu[idx], ...req.body };
      return res.json(memMenu[idx]);
    }
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  if (!dbConnected) {
    memMenu = memMenu.filter(m => m.id !== req.params.id);
    return res.json({ success: true });
  }
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customers
app.get('/api/customers', async (req, res) => {
  if (!dbConnected) return res.json(memCustomers);
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  if (!dbConnected) {
    const newCustomer = { ...req.body, id: Date.now().toString(), createdAt: new Date() };
    memCustomers.unshift(newCustomer);
    return res.status(201).json(newCustomer);
  }
  try {
    const newCustomer = new Customer(req.body);
    const saved = await newCustomer.save();
    res.status(201).json(formatDoc(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  if (!dbConnected) {
    memCustomers = memCustomers.filter(c => c.id !== req.params.id);
    return res.json({ success: true });
  }
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shop Sales
app.get('/api/shopsales', async (req, res) => {
  if (!dbConnected) return res.json(memShopSales);
  try {
    const sales = await ShopSale.find().sort({ date: -1 });
    res.json(sales.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shopsales', async (req, res) => {
  if (!dbConnected) {
    const newSale = { ...req.body, id: Date.now().toString() };
    memShopSales.unshift(newSale);
    return res.status(201).json(newSale);
  }
  try {
    const newSale = new ShopSale(req.body);
    const saved = await newSale.save();
    res.status(201).json(formatDoc(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/shopsales/:id', async (req, res) => {
  if (!dbConnected) {
    const idx = memShopSales.findIndex(s => s.id === req.params.id);
    if (idx !== -1) {
      memShopSales[idx] = { ...memShopSales[idx], ...req.body };
      return res.json(memShopSales[idx]);
    }
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const updated = await ShopSale.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(formatDoc(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Shop Expenses
app.get('/api/shopexpenses', async (req, res) => {
  if (!dbConnected) return res.json(memShopExpenses);
  try {
    const expenses = await ShopExpense.find().sort({ date: -1 });
    res.json(expenses.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shopexpenses', async (req, res) => {
  if (!dbConnected) {
    const newExp = { ...req.body, id: Date.now().toString() };
    memShopExpenses.unshift(newExp);
    return res.status(201).json(newExp);
  }
  try {
    const newExp = new ShopExpense(req.body);
    const saved = await newExp.save();
    res.status(201).json(formatDoc(saved));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// STORE-WISE TRACKER & CLOUDINARY API ROUTES
// ==========================================

// 1. Cloudinary Direct Upload
app.post('/api/upload', async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }
    const url = await uploadToCloudinary(image, folder || 'servebill_products');
    res.json({ url });
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. Stores List
app.get('/api/stores', async (req, res) => {
  if (!dbConnected) {
    return res.json(memStores);
  }
  try {
    const stores = await Store.find().sort({ name: 1 });
    const items = await StoreItem.find({}, 'storeId');
    const counts = {};
    items.forEach(i => {
      counts[i.storeId] = (counts[i.storeId] || 0) + 1;
    });
    const result = stores.map(s => {
      const formatted = formatDoc(s);
      formatted.itemCount = counts[formatted.id] || 0;
      return formatted;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create Store
app.post('/api/stores', async (req, res) => {
  const { name, category, phone, address } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Store name is required' });
  }
  if (!dbConnected) {
    const newStore = { 
      id: Date.now().toString(), 
      name: name.trim(), 
      category: category || 'Grocery', 
      phone: phone || '', 
      address: address || '', 
      itemCount: 0, 
      createdAt: new Date() 
    };
    memStores.push(newStore);
    return res.status(201).json(newStore);
  }
  try {
    const newStore = new Store({ 
      name: name.trim(), 
      category: category || 'Grocery', 
      phone: phone || '', 
      address: address || '' 
    });
    const saved = await newStore.save();
    const formatted = formatDoc(saved);
    formatted.itemCount = 0;
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete Store & Its Items
app.delete('/api/stores/:id', async (req, res) => {
  if (!dbConnected) {
    memStores = memStores.filter(s => s.id !== req.params.id);
    memStoreItems = memStoreItems.filter(i => i.storeId !== req.params.id);
    return res.json({ success: true });
  }
  try {
    await Store.findByIdAndDelete(req.params.id);
    await StoreItem.deleteMany({ storeId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Store Items List
app.get('/api/stores/:id/items', async (req, res) => {
  if (!dbConnected) {
    return res.json(memStoreItems.filter(i => i.storeId === req.params.id));
  }
  try {
    const items = await StoreItem.find({ storeId: req.params.id }).sort({ lastPurchasedDate: -1, name: 1 });
    res.json(items.map(formatDoc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Log Purchase / Add Item in a Store
app.post('/api/stores/:id/items', async (req, res) => {
  const storeId = req.params.id;
  const { name, category, unit, price, quantity, total, chargeTo, notes, imageUrl, date } = req.body;

  if (!name || !name.trim() || price === undefined) {
    return res.status(400).json({ error: 'Item name and price are required' });
  }

  const purchaseDate = date ? new Date(date) : new Date();
  const parsedPrice = parseFloat(price) || 0;
  const parsedQty = parseFloat(quantity) || 1;
  const parsedTotal = total !== undefined ? parseFloat(total) : (parsedPrice * parsedQty);
  const targetCharge = (chargeTo || 'SHOP').toUpperCase(); // 'CATERING' or 'SHOP'

  const purchaseRecord = {
    id: Date.now().toString(),
    price: parsedPrice,
    quantity: parsedQty,
    total: parsedTotal,
    unit: unit || 'kg',
    chargeTo: targetCharge,
    notes: notes || '',
    date: purchaseDate
  };

  // Automatically record in Business Ledger
  if (dbConnected) {
    try {
      if (targetCharge === 'SHOP') {
        const exp = new ShopExpense({
          type: 'PURCHASE',
          item: `${name.trim()} (${parsedQty} ${unit || 'kg'} @ ₹${parsedPrice})`,
          category: category || 'Store Inventory',
          amount: parsedTotal,
          date: purchaseDate,
          notes: notes ? `${notes} (Store: ${req.body.storeName || 'Shop'})` : `Store: ${req.body.storeName || 'Shop'}`
        });
        await exp.save();
      }
    } catch (e) {
      console.warn('Expense auto-sync warning:', e.message);
    }
  }

  if (!dbConnected) {
    let item = memStoreItems.find(i => i.storeId === storeId && i.name.toLowerCase() === name.trim().toLowerCase());
    if (item) {
      item.previousPrice = item.currentPrice;
      item.currentPrice = parsedPrice;
      item.lastPurchasedDate = purchaseDate;
      if (imageUrl) item.imageUrl = imageUrl;
      if (unit) item.unit = unit;
      item.priceHistory.unshift(purchaseRecord);
    } else {
      item = {
        id: Date.now().toString(),
        storeId,
        storeName: req.body.storeName || '',
        name: name.trim(),
        category: category || 'General',
        unit: unit || 'kg',
        imageUrl: imageUrl || '',
        currentPrice: parsedPrice,
        previousPrice: parsedPrice,
        lastPurchasedDate: purchaseDate,
        priceHistory: [purchaseRecord],
        createdAt: new Date()
      };
      memStoreItems.push(item);
    }
    return res.status(201).json(item);
  }

  try {
    let item = await StoreItem.findOne({ storeId, name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (item) {
      item.previousPrice = item.currentPrice;
      item.currentPrice = parsedPrice;
      item.lastPurchasedDate = purchaseDate;
      if (imageUrl) item.imageUrl = imageUrl;
      if (unit) item.unit = unit;
      item.priceHistory.unshift(purchaseRecord);
      await item.save();
    } else {
      item = new StoreItem({
        storeId,
        storeName: req.body.storeName || '',
        name: name.trim(),
        category: category || 'General',
        unit: unit || 'kg',
        imageUrl: imageUrl || '',
        currentPrice: parsedPrice,
        previousPrice: parsedPrice,
        lastPurchasedDate: purchaseDate,
        priceHistory: [purchaseRecord]
      });
      await item.save();
    }
    res.status(201).json(formatDoc(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Item
app.delete('/api/store-items/:id', async (req, res) => {
  if (!dbConnected) {
    memStoreItems = memStoreItems.filter(i => i.id !== req.params.id);
    return res.json({ success: true });
  }
  try {
    await StoreItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Cross-Store Price Comparison
app.get('/api/stores-compare', async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let items = [];
  if (!dbConnected) {
    items = memStoreItems.filter(i => !q || i.name.toLowerCase().includes(q));
  } else {
    try {
      const filter = q ? { name: { $regex: new RegExp(q, 'i') } } : {};
      items = await StoreItem.find(filter).sort({ currentPrice: 1 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const groups = {};
  items.forEach(doc => {
    const item = formatDoc(doc);
    const key = item.name.toLowerCase().trim();
    if (!groups[key]) {
      groups[key] = {
        name: item.name,
        unit: item.unit || 'kg',
        imageUrl: item.imageUrl,
        stores: []
      };
    }
    groups[key].stores.push({
      storeId: item.storeId,
      storeName: item.storeName || 'Store',
      currentPrice: item.currentPrice,
      previousPrice: item.previousPrice,
      lastPurchasedDate: item.lastPurchasedDate,
    });
  });

  const result = Object.values(groups).map(g => {
    g.stores.sort((a, b) => a.currentPrice - b.currentPrice);
    return g;
  });

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
