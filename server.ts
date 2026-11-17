import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_STORE_SETTINGS, INITIAL_PRODUCTS, SHOE_IMAGES } from './src/data/catalog.ts';
import type { Order, OrderStatus, PaymentStatus, Product, StoreSettings } from './src/types.ts';

interface DatabaseState {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  nextOrderSeq: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createSeedDatabase(): DatabaseState {
  const now = Date.now();
  const sampleOrders: Order[] = [
    {
      id: 'ord-seed-1002',
      orderNumber: 'RX-1002',
      customerName: 'Ariful Islam',
      customerPhone: '01712345678',
      customerAddress: 'House 14, Road 6, Dhanmondi, Dhaka 1205',
      deliveryZone: 'inside_dhaka',
      note: 'Call before delivery please.',
      items: [
        {
          productId: 'prod-mens-running',
          title: "Men's Running Shoes",
          price: 550,
          image: SHOE_IMAGES.blackMesh,
          color: 'Black',
          size: '40',
          quantity: 1,
        },
        {
          productId: 'prod-summer-54',
          title: 'Summer 54 Extra Large Size Flyknit Running Shoes',
          price: 1190,
          image: SHOE_IMAGES.navyFlyknit,
          color: 'Navy',
          size: '42',
          quantity: 1,
        },
      ],
      subtotal: 1740,
      shippingCharge: 0,
      discountAmount: 0,
      total: 1740,
      paymentMethod: 'bkash',
      paymentStatus: 'paid',
      transactionId: 'BKS9X42M1P',
      senderNumber: '01712345678',
      status: 'confirmed',
      isReadByAdmin: false,
      createdAt: new Date(now - 1000 * 60 * 18).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'ord-seed-1001',
      orderNumber: 'RX-1001',
      customerName: 'Mahmudul Hasan',
      customerPhone: '01819876543',
      customerAddress: 'Agrabad C/A, Lane 3, Chattogram',
      deliveryZone: 'outside_dhaka',
      items: [
        {
          productId: 'prod-outdoor-trail',
          title: 'Summit Grip Outdoor Trail Shoes',
          price: 1680,
          image: SHOE_IMAGES.outdoorTrail,
          color: 'Sand/Black',
          size: '41',
          quantity: 1,
        },
      ],
      subtotal: 1680,
      shippingCharge: 120,
      discountAmount: 0,
      total: 1800,
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      status: 'shipped',
      isReadByAdmin: true,
      createdAt: new Date(now - 1000 * 60 * 145).toISOString(),
      updatedAt: new Date(now - 1000 * 60 * 60).toISOString(),
    },
  ];

  return {
    products: INITIAL_PRODUCTS,
    orders: sampleOrders,
    settings: DEFAULT_STORE_SETTINGS,
    nextOrderSeq: 1003,
  };
}

function loadDatabase(): DatabaseState {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return {
      products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      settings: { ...DEFAULT_STORE_SETTINGS, ...(parsed.settings || {}) },
      nextOrderSeq: typeof parsed.nextOrderSeq === 'number' ? parsed.nextOrderSeq : 1003,
    };
  } catch {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    return seeded;
  }
}

function saveDatabase(state: DatabaseState) {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  let db = loadDatabase();

  app.use(express.json({ limit: '2mb' }));

  const broadcast = (event: Record<string, unknown>) => {
    const payload = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  wss.on('connection', (ws) => {
    const unreadCount = db.orders.filter((o) => !o.isReadByAdmin).length;
    ws.send(
      JSON.stringify({
        type: 'connected',
        unreadCount,
        totalOrders: db.orders.length,
      })
    );
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, store: db.settings.storeName });
  });

  // Products API
  app.get('/api/products', (_req, res) => {
    res.json({ products: db.products });
  });

  app.post('/api/products', (req, res) => {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const price = Number(body.price);
    const originalPrice = Number(body.originalPrice || price);
    if (!title || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Valid product title and price are required.' });
    }
    const discountPercent =
      originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

    const image = String(body.image || SHOE_IMAGES.blackMesh);
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title,
      shortTitle: title.length > 26 ? `${title.slice(0, 24)}...` : title,
      category: String(body.category || "Men's Running Shoes"),
      tabGroups: Array.isArray(body.tabGroups) && body.tabGroups.length > 0 ? body.tabGroups : ['Explore', 'Shoes Picks'],
      price,
      originalPrice: originalPrice >= price ? originalPrice : price,
      discountPercent,
      rating: 4.8,
      reviewCount: 1,
      soldLabel: 'New',
      freeShipping: Boolean(body.freeShipping),
      image,
      gallery: [image],
      colors: [{ name: 'Default', hex: '#18181B', image }],
      sizes: ['39', '40', '41', '42', '43'],
      inStock: true,
      description: String(body.description || 'Quality footwear from Runx.bd.'),
    };

    db.products.unshift(newProduct);
    saveDatabase(db);
    broadcast({ type: 'product:updated', products: db.products });
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const current = db.products[idx];
    const nextPrice = req.body.price !== undefined ? Number(req.body.price) : current.price;
    const nextOriginal =
      req.body.originalPrice !== undefined ? Number(req.body.originalPrice) : current.originalPrice;
    const updated: Product = {
      ...current,
      title: req.body.title !== undefined ? String(req.body.title).trim() : current.title,
      shortTitle:
        req.body.title !== undefined
          ? String(req.body.title).trim().length > 26
            ? `${String(req.body.title).trim().slice(0, 24)}...`
            : String(req.body.title).trim()
          : current.shortTitle,
      price: Number.isFinite(nextPrice) && nextPrice > 0 ? nextPrice : current.price,
      originalPrice:
        Number.isFinite(nextOriginal) && nextOriginal >= nextPrice ? nextOriginal : nextPrice,
      discountPercent:
        nextOriginal > nextPrice ? Math.round(((nextOriginal - nextPrice) / nextOriginal) * 100) : 0,
      freeShipping:
        req.body.freeShipping !== undefined ? Boolean(req.body.freeShipping) : current.freeShipping,
      inStock: req.body.inStock !== undefined ? Boolean(req.body.inStock) : current.inStock,
    };
    db.products[idx] = updated;
    saveDatabase(db);
    broadcast({ type: 'product:updated', products: db.products });
    res.json({ product: updated });
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === before) {
      return res.status(404).json({ error: 'Product not found' });
    }
    saveDatabase(db);
    broadcast({ type: 'product:updated', products: db.products });
    res.json({ ok: true });
  });

  // Orders API
  app.get('/api/orders', (_req, res) => {
    const sorted = [...db.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unreadCount = sorted.filter((o) => !o.isReadByAdmin).length;
    res.json({ orders: sorted, unreadCount });
  });

  app.get('/api/orders/track', (req, res) => {
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    const matches = db.orders.filter((o) => {
      if (orderNumber && o.orderNumber.toUpperCase() === orderNumber) return true;
      if (phone && o.customerPhone.replace(/\D/g, '').endsWith(phone.slice(-8))) return true;
      return false;
    });
    res.json({
      orders: matches.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    });
  });

  app.post('/api/orders', (req, res) => {
    const body = req.body || {};
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const customerAddress = String(body.customerAddress || '').trim();
    const deliveryZone = body.deliveryZone === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka';
    const paymentMethod = ['cod', 'bkash', 'nagad', 'rocket', 'card'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'cod';
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName || customerName.length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit mobile number.' });
    }
    if (!customerAddress || customerAddress.length < 5) {
      return res.status(400).json({ error: 'Please enter your complete delivery address.' });
    }
    if (items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    interface SanitizedOrderItem {
      productId: string;
      title: string;
      price: number;
      image: string;
      color: string;
      size: string;
      quantity: number;
      freeShipping: boolean;
    }

    const sanitizedItems: SanitizedOrderItem[] = items.map((item: Record<string, unknown>) => {
      const product = db.products.find((p) => p.id === item.productId);
      const unitPrice = product ? product.price : Number(item.price) || 0;
      const qty = Math.max(1, Math.min(20, Math.round(Number(item.quantity) || 1)));
      return {
        productId: String(item.productId || ''),
        title: product ? product.title : String(item.title || 'Footwear Item'),
        price: unitPrice,
        image: product ? product.image : String(item.image || SHOE_IMAGES.blackMesh),
        color: String(item.color || 'Black'),
        size: String(item.size || '40'),
        quantity: qty,
        freeShipping: product ? product.freeShipping : Boolean(item.freeShipping),
      };
    });

    const subtotal = sanitizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const allFreeShipping = sanitizedItems.every((i) => i.freeShipping);
    const promoCode = String(body.promoCode || '').trim().toUpperCase();

    let discountAmount = 0;
    if (promoCode === 'RUNX10') {
      discountAmount = Math.round(subtotal * 0.1);
    } else if (promoCode === 'SAVE100' && subtotal >= 500) {
      discountAmount = 100;
    }

    const baseShipping =
      deliveryZone === 'inside_dhaka'
        ? db.settings.insideDhakaShipping
        : db.settings.outsideDhakaShipping;
    const shippingCharge = allFreeShipping || promoCode === 'FREESHIP' ? 0 : baseShipping;
    const total = Math.max(0, subtotal - discountAmount + shippingCharge);

    const paymentStatus: PaymentStatus =
      paymentMethod === 'cod'
        ? 'unpaid'
        : paymentMethod === 'card'
          ? 'paid'
          : body.transactionId
            ? 'pending_verification'
            : 'paid';

    const nowIso = new Date().toISOString();
    const orderNumber = `RX-${db.nextOrderSeq}`;
    db.nextOrderSeq += 1;

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderNumber,
      customerName,
      customerPhone,
      customerAddress,
      deliveryZone,
      note: body.note ? String(body.note).trim() : undefined,
      items: sanitizedItems.map(({ freeShipping: _fs, ...rest }) => rest),
      subtotal,
      shippingCharge,
      discountAmount,
      promoCode: promoCode || undefined,
      total,
      paymentMethod,
      paymentStatus,
      transactionId: body.transactionId ? String(body.transactionId).trim().toUpperCase() : undefined,
      senderNumber: body.senderNumber ? String(body.senderNumber).trim() : undefined,
      status: 'pending',
      isReadByAdmin: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.orders.unshift(newOrder);
    saveDatabase(db);

    const unreadCount = db.orders.filter((o) => !o.isReadByAdmin).length;
    broadcast({
      type: 'order:created',
      order: newOrder,
      unreadCount,
    });

    res.status(201).json({ order: newOrder });
  });

  app.patch('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const current = db.orders[idx];
    const allowedStatuses: OrderStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    const allowedPayStatuses: PaymentStatus[] = ['unpaid', 'pending_verification', 'paid'];

    const nextStatus = allowedStatuses.includes(req.body.status) ? req.body.status : current.status;
    const nextPayStatus = allowedPayStatuses.includes(req.body.paymentStatus)
      ? req.body.paymentStatus
      : current.paymentStatus;

    const updated: Order = {
      ...current,
      status: nextStatus,
      paymentStatus: nextPayStatus,
      isReadByAdmin:
        req.body.isReadByAdmin !== undefined ? Boolean(req.body.isReadByAdmin) : current.isReadByAdmin,
      updatedAt: new Date().toISOString(),
    };

    db.orders[idx] = updated;
    saveDatabase(db);
    const unreadCount = db.orders.filter((o) => !o.isReadByAdmin).length;
    broadcast({ type: 'order:updated', order: updated, unreadCount });
    res.json({ order: updated, unreadCount });
  });

  app.post('/api/orders/mark-all-read', (_req, res) => {
    db.orders = db.orders.map((o) => ({ ...o, isReadByAdmin: true }));
    saveDatabase(db);
    broadcast({ type: 'orders:read', unreadCount: 0 });
    res.json({ ok: true, unreadCount: 0 });
  });

  app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id);
    if (db.orders.length === before) {
      return res.status(404).json({ error: 'Order not found' });
    }
    saveDatabase(db);
    const unreadCount = db.orders.filter((o) => !o.isReadByAdmin).length;
    broadcast({ type: 'order:deleted', orderId: id, unreadCount });
    res.json({ ok: true, unreadCount });
  });

  // Store settings & Admin verification
  app.get('/api/settings', (_req, res) => {
    const { adminPin: _hiddenPin, ...publicSettings } = db.settings;
    res.json({ settings: publicSettings });
  });

  app.patch('/api/settings', (req, res) => {
    const body = req.body || {};
    db.settings = {
      ...db.settings,
      bkashNumber: body.bkashNumber ? String(body.bkashNumber).trim() : db.settings.bkashNumber,
      nagadNumber: body.nagadNumber ? String(body.nagadNumber).trim() : db.settings.nagadNumber,
      rocketNumber: body.rocketNumber ? String(body.rocketNumber).trim() : db.settings.rocketNumber,
      supportPhone: body.supportPhone ? String(body.supportPhone).trim() : db.settings.supportPhone,
      insideDhakaShipping:
        body.insideDhakaShipping !== undefined
          ? Math.max(0, Number(body.insideDhakaShipping) || 0)
          : db.settings.insideDhakaShipping,
      outsideDhakaShipping:
        body.outsideDhakaShipping !== undefined
          ? Math.max(0, Number(body.outsideDhakaShipping) || 0)
          : db.settings.outsideDhakaShipping,
      adminPin:
        body.adminPin && String(body.adminPin).trim().length >= 4
          ? String(body.adminPin).trim()
          : db.settings.adminPin,
    };
    saveDatabase(db);
    const { adminPin: _hiddenPin, ...publicSettings } = db.settings;
    res.json({ settings: publicSettings });
  });

  app.post('/api/admin/verify', (req, res) => {
    const pin = String(req.body?.pin || '').trim();
    if (pin === db.settings.adminPin) {
      return res.json({ verified: true });
    }
    return res.status(401).json({ verified: false, error: 'Incorrect Admin PIN' });
  });

  // Vite integration in dev, static dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Runx.bd full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Runx.bd server:', err);
  process.exit(1);
});
