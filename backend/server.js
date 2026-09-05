require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

let dbConnected = false;
let memInvoices = [];
let memMenu = [];
let memCustomers = [];
let memShopSales = [];
let memShopExpenses = [];

const formatDoc = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id ? obj._id.toString() : obj.id;
  return obj;
};

// Connect to MongoDB
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
      dbConnected = true;
    })
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️ No MONGO_URI provided in .env. Running without database connection.');
}

// Basic schemas and models for the billing app
const InvoiceSchema = new mongoose.Schema({
  customerName: String,
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now },
  businessType: { type: String, default: 'CATERING' },
  amountReceived: { type: Number, default: 0 },
  expenses: { type: Array, default: [] }
});
const Invoice = mongoose.model('Invoice', InvoiceSchema);

const MenuSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String
});
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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
