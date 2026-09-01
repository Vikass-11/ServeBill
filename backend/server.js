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
  date: { type: Date, default: Date.now }
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
