import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Copy,
  Lock,
  Package,
  Phone,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  Truck,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { SHOE_IMAGES } from '../data/catalog';
import { Order, OrderStatus, Product, StoreSettings } from '../types';
import { formatBDT } from '../utils/sound';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  settings: Omit<StoreSettings, 'adminPin'>;
  unreadCount: number;
  wsConnected: boolean;
  soundEnabled: boolean;
  isUnlocked: boolean;
  onUnlock: () => void;
  onToggleSound: () => void;
  onBackToStore: () => void;
  onUpdateOrder: (
    orderId: string,
    patch: Partial<Pick<Order, 'status' | 'paymentStatus' | 'isReadByAdmin'>>
  ) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onAddProduct: (payload: {
    title: string;
    category: string;
    price: number;
    originalPrice: number;
    freeShipping: boolean;
    image: string;
  }) => Promise<void>;
  onUpdateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onSaveSettings: (patch: Partial<StoreSettings>) => Promise<void>;
}

const STATUS_TABS: ('all' | OrderStatus)[] = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-[#EB001B] border-red-200',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  settings,
  unreadCount,
  wsConnected,
  soundEnabled,
  isUnlocked,
  onUnlock,
  onToggleSound,
  onBackToStore,
  onUpdateOrder,
  onDeleteOrder,
  onMarkAllRead,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onSaveSettings,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeSection, setActiveSection] = useState<'orders' | 'products' | 'settings'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Add Product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState("Men's Running Shoes");
  const [newPrice, setNewPrice] = useState('990');
  const [newOriginalPrice, setNewOriginalPrice] = useState('1250');
  const [newFreeShipping, setNewFreeShipping] = useState(true);
  const [newImage, setNewImage] = useState(SHOE_IMAGES.blackMesh);

  // Settings form state
  const [bkashNum, setBkashNum] = useState(settings.bkashNumber);
  const [nagadNum, setNagadNum] = useState(settings.nagadNumber);
  const [rocketNum, setRocketNum] = useState(settings.rocketNumber);
  const [supportPhone, setSupportPhone] = useState(settings.supportPhone);
  const [insideShip, setInsideShip] = useState(String(settings.insideDhakaShipping));
  const [outsideShip, setOutsideShip] = useState(String(settings.outsideDhakaShipping));
  const [newAdminPin, setNewAdminPin] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });
      if (!res.ok) {
        setPinError('Incorrect PIN. Default PIN is 1234.');
        return;
      }
      onUnlock();
    } catch {
      setPinError('Could not verify PIN.');
    } finally {
      setVerifying(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] flex flex-col">
        <header className="bg-[#EB001B] text-white px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToStore}
            className="flex items-center gap-2 font-bold text-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Runx.bd Store
          </button>
          <span className="font-extrabold text-base">Admin Panel</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <form
            onSubmit={handlePinSubmit}
            className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-sm border border-slate-200 space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#EB001B] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Runx.bd Admin Login</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter Admin PIN to manage orders & payment gateways (Default PIN:{' '}
                <span className="font-bold text-slate-800">1234</span>)
              </p>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-red-50 text-[#EB001B] text-xs font-semibold">
                {pinError}
              </div>
            )}

            <input
              type="password"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter 4-digit PIN (1234)"
              autoFocus
              className="w-full h-11 px-4 rounded-xl border border-slate-200 text-center text-lg font-bold tracking-widest outline-none focus:border-[#EB001B] tabular-nums"
            />

            <button
              type="submit"
              disabled={verifying}
              className="w-full h-11 rounded-full bg-[#EB001B] hover:bg-[#D10018] text-white font-bold text-sm transition"
            >
              {verifying ? 'Verifying...' : 'Unlock Admin Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const q = orderSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.customerAddress.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const unreadOrders = orders.filter((o) => !o.isReadByAdmin);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !Number(newPrice)) return;
    await onAddProduct({
      title: newTitle.trim(),
      category: newCategory,
      price: Number(newPrice),
      originalPrice: Number(newOriginalPrice) || Number(newPrice),
      freeShipping: newFreeShipping,
      image: newImage,
    });
    setNewTitle('');
    setShowAddProduct(false);
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      bkashNumber: bkashNum.trim(),
      nagadNumber: nagadNum.trim(),
      rocketNumber: rocketNum.trim(),
      supportPhone: supportPhone.trim(),
      insideDhakaShipping: Number(insideShip) || 60,
      outsideDhakaShipping: Number(outsideShip) || 120,
      ...(newAdminPin.trim().length >= 4 ? { adminPin: newAdminPin.trim() } : {}),
    });
    setNewAdminPin('');
    setSettingsSavedMsg('Settings saved successfully!');
    setTimeout(() => setSettingsSavedMsg(''), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 transition shrink-0"
              title="Back to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-[16px] sm:text-[18px] font-extrabold leading-tight truncate">
                Runx.bd Admin Dashboard
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-white/90">
                <span
                  className={`w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-emerald-300' : 'bg-amber-300'
                  }`}
                />
                <span>{wsConnected ? 'Live Notifications Active' : 'Connecting...'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute notification chime' : 'Enable notification chime'}
              className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown((v) => !v)}
                aria-label="Order notifications"
                className="relative w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-300 text-[#EB001B] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm">
                      New Order Alerts ({unreadOrders.length})
                    </span>
                    {unreadOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkAllRead();
                          setShowNotifDropdown(false);
                        }}
                        className="text-xs font-semibold text-[#EB001B] hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {unreadOrders.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500 text-center">
                        All orders reviewed! New incoming orders will ring & appear here instantly.
                      </p>
                    ) : (
                      unreadOrders.map((ord) => (
                        <button
                          key={ord.id}
                          type="button"
                          onClick={() => {
                            onUpdateOrder(ord.id, { isReadByAdmin: true });
                            setActiveSection('orders');
                            setShowNotifDropdown(false);
                          }}
                          className="w-full p-3 text-left hover:bg-red-50/40 transition flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              #{ord.orderNumber} · {ord.customerName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                              {ord.customerPhone} · {ord.paymentMethod.toUpperCase()}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-[#EB001B] tabular-nums">
                            {formatBDT(ord.total)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-4">
        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Total Orders</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {totalOrders}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <span className="text-xs font-semibold text-amber-700">Pending Orders</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
              {pendingOrders}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
            <p className="text-2xl font-extrabold text-[#EB001B] mt-1 tabular-nums">
              {formatBDT(totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100">
            <span className="text-xs font-semibold text-emerald-700">Delivered</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              {deliveredOrders}
            </p>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveSection('orders')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'orders'
                ? 'bg-[#EB001B] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('products')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'products'
                ? 'bg-[#EB001B] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Shoes ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('settings')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeSection === 'settings'
                ? 'bg-[#EB001B] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            Gateways & Pin
          </button>
        </div>

        {/* ORDERS TAB */}
        {activeSection === 'orders' && (
          <div className="space-y-3">
            {/* Search & Status Filters */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order #, Name, Mobile, Address..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F5F5F7] text-xs sm:text-sm outline-none focus:ring-1 focus:ring-[#EB001B]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {STATUS_TABS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 transition ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
                <p className="text-sm font-semibold text-slate-600">
                  No orders found in this view.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl p-4 border shadow-xs transition ${
                      !order.isReadByAdmin
                        ? 'border-[#EB001B] ring-1 ring-[#EB001B]/20'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">
                          #{order.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase border ${
                            STATUS_STYLES[order.status]
                          }`}
                        >
                          {order.status}
                        </span>
                        {!order.isReadByAdmin && (
                          <button
                            type="button"
                            onClick={() => onUpdateOrder(order.id, { isReadByAdmin: true })}
                            className="px-2 py-0.5 rounded-md bg-[#EB001B] text-white text-[10px] font-bold"
                          >
                            NEW · Mark Read
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 tabular-nums">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Customer & Payment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3">
                      <div className="md:col-span-5 space-y-1.5">
                        <p className="text-sm font-bold text-slate-900">{order.customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-[#EB001B]" />
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="font-semibold hover:underline tabular-nums"
                          >
                            {order.customerPhone}
                          </a>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(order.customerPhone)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy phone"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          <span className="font-semibold text-slate-800">Address:</span>{' '}
                          {order.customerAddress} (
                          {order.deliveryZone === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                        </p>
                        {order.note && (
                          <p className="text-xs text-slate-500 italic">Note: "{order.note}"</p>
                        )}
                      </div>

                      {/* Ordered Items */}
                      <div className="md:col-span-4 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2.5">
                            <img
                              src={item.image}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover bg-[#F3F4F6] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-500 tabular-nums">
                                {item.color} · Size {item.size} · Qty {item.quantity} ×{' '}
                                {formatBDT(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Payment Info & Total */}
                      <div className="md:col-span-3 flex flex-col justify-between bg-[#F8F8FA] rounded-xl p-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Method:</span>
                            <span className="font-bold uppercase text-slate-900">
                              {order.paymentMethod}
                            </span>
                          </div>
                          {order.transactionId && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">TrxID:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {order.transactionId}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Payment:</span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateOrder(order.id, {
                                  paymentStatus:
                                    order.paymentStatus === 'paid' ? 'unpaid' : 'paid',
                                })
                              }
                              className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.paymentStatus === 'paid'
                                ? 'PAID (Click to toggle)'
                                : order.paymentStatus === 'pending_verification'
                                  ? 'Verify TrxID -> Mark Paid'
                                  : 'UNPAID (Mark Paid)'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-200 flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-700">Total:</span>
                          <span className="text-lg font-extrabold text-[#EB001B] tabular-nums">
                            {formatBDT(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* One-Click Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrder(order.id, { status: 'confirmed', isReadByAdmin: true })
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrder(order.id, { status: 'shipped', isReadByAdmin: true })
                          }
                          className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Truck className="w-3.5 h-3.5" /> Ship
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrder(order.id, {
                              status: 'delivered',
                              paymentStatus: 'paid',
                              isReadByAdmin: true,
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Deliver
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateOrder(order.id, { status: 'cancelled', isReadByAdmin: true })
                          }
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#EB001B] text-xs font-bold flex items-center gap-1 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order.id)}
                        className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-[#EB001B] hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeSection === 'products' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Manage Shoe Catalog</h2>
              <button
                type="button"
                onClick={() => setShowAddProduct((v) => !v)}
                className="px-3.5 py-2 rounded-full bg-[#EB001B] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add New Shoe
              </button>
            </div>

            {showAddProduct && (
              <form
                onSubmit={handleCreateProduct}
                className="bg-white rounded-2xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Shoe Title (e.g. Air Zoom Pro)"
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                >
                  <option>Men's Running Shoes</option>
                  <option>Sports Shoes</option>
                  <option>Casual Shoes</option>
                  <option>Sneakers</option>
                  <option>Outdoor Shoes</option>
                  <option>Walking Shoes</option>
                  <option>Running Shoes</option>
                  <option>Training Shoes</option>
                  <option>Fashion Shoes</option>
                </select>
                <select
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                >
                  <option value={SHOE_IMAGES.blackMesh}>Black Mesh Runner</option>
                  <option value={SHOE_IMAGES.navyFlyknit}>Navy Flyknit</option>
                  <option value={SHOE_IMAGES.whiteCasual}>White Casual Sneaker</option>
                  <option value={SHOE_IMAGES.blueSport}>Royal Blue Sport</option>
                  <option value={SHOE_IMAGES.outdoorTrail}>Outdoor Trail</option>
                  <option value={SHOE_IMAGES.beigeFashion}>Beige Fashion</option>
                  <option value={SHOE_IMAGES.blackWhiteSport}>Black & White Sport</option>
                  <option value={SHOE_IMAGES.grayWalker}>Gray Slip-On Walker</option>
                </select>
                <input
                  type="number"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Sale Price (৳)"
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
                <input
                  type="number"
                  value={newOriginalPrice}
                  onChange={(e) => setNewOriginalPrice(e.target.value)}
                  placeholder="Original Price (৳)"
                  className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newFreeShipping}
                      onChange={(e) => setNewFreeShipping(e.target.checked)}
                    />
                    Free Shipping
                  </label>
                  <button
                    type="submit"
                    className="px-5 h-10 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Save Shoe
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 flex items-center gap-3"
                >
                  <img
                    src={prod.image}
                    alt={prod.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-[#F3F4F6] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{prod.title}</p>
                    <p className="text-xs text-slate-500">
                      {prod.category} ·{' '}
                      <span className="font-bold text-[#EB001B] tabular-nums">
                        {formatBDT(prod.price)}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProduct(prod.id, { freeShipping: !prod.freeShipping })
                        }
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          prod.freeShipping
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {prod.freeShipping ? 'Free Shipping' : 'Paid Shipping'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateProduct(prod.id, { price: prod.price + 50 })}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        +৳50
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProduct(prod.id, { price: Math.max(100, prod.price - 50) })
                        }
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold"
                      >
                        -৳50
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteProduct(prod.id)}
                    aria-label="Delete product"
                    className="p-2 text-slate-400 hover:text-[#EB001B]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS & PAYMENT GATEWAYS TAB */}
        {activeSection === 'settings' && (
          <form
            onSubmit={handleSaveStoreSettings}
            className="bg-white rounded-2xl p-5 border border-slate-200 max-w-2xl space-y-4"
          >
            <h2 className="text-base font-extrabold text-slate-900">
              Payment Gateways & Store Settings
            </h2>

            {settingsSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                {settingsSavedMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  bKash Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={bkashNum}
                  onChange={(e) => setBkashNum(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nagad Number
                </label>
                <input
                  type="text"
                  value={nagadNum}
                  onChange={(e) => setNagadNum(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rocket Number
                </label>
                <input
                  type="text"
                  value={rocketNum}
                  onChange={(e) => setRocketNum(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Support Hotline
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inside Dhaka Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  value={insideShip}
                  onChange={(e) => setInsideShip(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Outside Dhaka Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  value={outsideShip}
                  onChange={(e) => setOutsideShip(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Admin PIN (leave blank to keep current)
              </label>
              <input
                type="password"
                value={newAdminPin}
                onChange={(e) => setNewAdminPin(e.target.value)}
                placeholder="New 4+ digit PIN"
                className="w-full sm:w-64 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
              />
            </div>

            <button
              type="submit"
              className="px-6 h-10 rounded-full bg-[#EB001B] hover:bg-[#D10018] text-white text-sm font-bold transition"
            >
              Save Store Settings
            </button>
          </form>
        )}
      </main>
    </div>
  );
};
