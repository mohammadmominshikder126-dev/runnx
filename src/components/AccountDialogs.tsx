import React, { useState } from 'react';
import {
  Check,
  Copy,
  Headphones,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wallet,
  X,
} from 'lucide-react';
import { CustomerProfile, Order, Product, StoreSettings } from '../types';
import { formatBDT } from '../utils/sound';

interface ModalWrapperProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-lg max-h-[88vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-pop">
      <div className="bg-[#EB001B] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
        <h3 className="text-[16px] font-bold">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const MyOrdersModal: React.FC<{
  orders: Order[];
  defaultPhone: string;
  onClose: () => void;
}> = ({ orders: localOrders, defaultPhone, onClose }) => {
  const [searchTerm, setSearchTerm] = useState(defaultPhone);
  const [tracked, setTracked] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const isOrd = searchTerm.trim().toUpperCase().startsWith('RX-');
      const url = isOrd
        ? `/api/orders/track?orderNumber=${encodeURIComponent(searchTerm.trim())}`
        : `/api/orders/track?phone=${encodeURIComponent(searchTerm.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      setTracked(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const displayOrders = tracked !== null ? tracked : localOrders;

  return (
    <ModalWrapper title="My Orders & Live Tracking" onClose={onClose}>
      <form onSubmit={handleTrack} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Phone (017...) or Order # (RX-1002)"
          className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 h-10 rounded-xl bg-[#EB001B] text-white text-xs font-bold shrink-0"
        >
          {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {displayOrders.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">
          No orders found yet. Place an order or enter your phone number to track!
        </p>
      ) : (
        <div className="space-y-3">
          {displayOrders.map((ord) => (
            <div key={ord.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900 tabular-nums">
                  #{ord.orderNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#EB001B] text-[11px] font-bold uppercase">
                  {ord.status}
                </span>
              </div>
              <div className="text-xs text-slate-600">
                {ord.items.map((i) => `${i.title} (${i.size}) ×${i.quantity}`).join(', ')}
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 uppercase">{ord.paymentMethod}</span>
                <span className="font-extrabold text-[#EB001B] text-sm tabular-nums">
                  {formatBDT(ord.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalWrapper>
  );
};

export const ProfileAddressModal: React.FC<{
  profile: CustomerProfile;
  onSave: (next: CustomerProfile) => void;
  onClose: () => void;
}> = ({ profile, onSave, onClose }) => {
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...profile, name: name.trim() || 'Runx Bd', phone: phone.trim(), address: address.trim() });
    onClose();
  };

  return (
    <ModalWrapper title="Profile & Delivery Address" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Saved Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="House, Road, Area, District"
            className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B] resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full h-11 rounded-full bg-[#EB001B] text-white font-bold text-sm"
        >
          Save Information
        </button>
      </form>
    </ModalWrapper>
  );
};

export const WalletModal: React.FC<{
  profile: CustomerProfile;
  settings: Omit<StoreSettings, 'adminPin'>;
  onClose: () => void;
}> = ({ profile, settings, onClose }) => {
  const [copied, setCopied] = useState('');
  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };
  return (
    <ModalWrapper title="My Wallet & Payment Methods" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#EB001B] to-[#B80015] text-white p-4">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Wallet className="w-4 h-4" /> Runx.bd Cashback Balance
          </div>
          <p className="text-3xl font-extrabold mt-1 tabular-nums">
            {formatBDT(profile.walletBalance)}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase">Active Promo Coupons</h4>
          {[
            { code: 'RUNX10', desc: '10% Instant Discount on any order' },
            { code: 'SAVE100', desc: '৳100 Off on orders above ৳500' },
            { code: 'FREESHIP', desc: 'Free Delivery across Bangladesh' },
          ].map((c) => (
            <div
              key={c.code}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200"
            >
              <div>
                <p className="text-sm font-extrabold text-[#EB001B]">{c.code}</p>
                <p className="text-xs text-slate-600">{c.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => copyCode(c.code)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-bold text-slate-800 flex items-center gap-1"
              >
                {copied === c.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === c.code ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-[#F5F5F7] text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Accepted Payment Gateways:</p>
          <p>bKash: {settings.bkashNumber} · Nagad: {settings.nagadNumber}</p>
          <p>Rocket: {settings.rocketNumber} · Cash on Delivery · Visa/Mastercard</p>
        </div>
      </div>
    </ModalWrapper>
  );
};

export const SupportModal: React.FC<{
  settings: Omit<StoreSettings, 'adminPin'>;
  onClose: () => void;
}> = ({ settings, onClose }) => (
  <ModalWrapper title="Runx.bd Customer Support" onClose={onClose}>
    <div className="space-y-3 text-sm">
      <div className="p-4 rounded-xl bg-red-50/60 border border-red-100 flex items-center gap-3">
        <Headphones className="w-7 h-7 text-[#EB001B] shrink-0" />
        <div>
          <p className="font-bold text-slate-900">24/7 Order & Size Helpdesk</p>
          <p className="text-xs text-slate-600">Call or WhatsApp for quick delivery updates</p>
        </div>
      </div>
      <a
        href={`tel:${settings.supportPhone}`}
        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2.5">
          <Phone className="w-4 h-4 text-[#EB001B]" />
          <span className="font-semibold text-slate-800">Hotline: {settings.supportPhone}</span>
        </div>
        <span className="text-xs font-bold text-[#EB001B]">Call Now</span>
      </a>
      <div className="p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-600">
        <p className="font-bold text-slate-900">Email: {settings.supportEmail}</p>
        <p>7-Day Easy Size Exchange & 100% Cash on Delivery inspection guaranteed.</p>
      </div>
    </div>
  </ModalWrapper>
);

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <ModalWrapper title="About Runx.bd" onClose={onClose}>
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      <p className="font-bold text-lg text-[#EB001B]">runxbd.com — Runx.bd</p>
      <p>
        Runx.bd is Bangladesh's dedicated online footwear store offering lightweight running shoes,
        breathable flyknit sneakers, trail outdoor shoes, and everyday casual footwear at unbeatable
        direct-to-customer prices.
      </p>
      <p className="text-xs text-slate-500">
        Fast delivery across all 64 districts · Inside Dhaka 24–48h · bKash, Nagad, Rocket, Card &
        Cash on Delivery supported.
      </p>
    </div>
  </ModalWrapper>
);

export const SettingsModal: React.FC<{
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}> = ({ soundEnabled, onToggleSound, onClose }) => (
  <ModalWrapper title="App Settings" onClose={onClose}>
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2.5">
          <Volume2 className="w-5 h-5 text-[#EB001B]" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Order Alert Sound</p>
            <p className="text-xs text-slate-500">Play chime on new admin order notifications</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSound}
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            soundEnabled ? 'bg-[#10A352] text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {soundEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  </ModalWrapper>
);

export const DealsModal: React.FC<{
  onApplyAndShop: () => void;
  onClose: () => void;
}> = ({ onApplyAndShop, onClose }) => (
  <ModalWrapper title="Runx.bd Flash Deals & Coupons" onClose={onClose}>
    <div className="space-y-3">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF0F3] to-[#FFE0E6] border border-red-200">
        <div className="flex items-center gap-2 text-[#EB001B] font-extrabold text-sm">
          <Sparkles className="w-4 h-4" /> Today's Exclusive Coupon
        </div>
        <p className="text-2xl font-extrabold text-slate-900 mt-1">RUNX10</p>
        <p className="text-xs text-slate-600 mt-0.5">
          Apply at Cart/Checkout for an instant 10% discount on any shoe order!
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          onApplyAndShop();
          onClose();
        }}
        className="w-full h-11 rounded-full bg-[#EB001B] text-white font-bold text-sm"
      >
        Shop Best Deals Now
      </button>
    </div>
  </ModalWrapper>
);

export const VisualFilterModal: React.FC<{
  products: Product[];
  onSelectColorQuery: (color: string) => void;
  onClose: () => void;
}> = ({ onSelectColorQuery, onClose }) => {
  const colors = ['Black', 'Navy', 'Blue', 'White', 'Gray', 'Sand', 'Cream'];
  return (
    <ModalWrapper title="Quick Style & Color Finder" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">
        Tap a shoe color below to instantly find matching styles:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              onSelectColorQuery(c);
              onClose();
            }}
            className="p-3 rounded-xl border border-slate-200 hover:border-[#EB001B] text-sm font-bold text-slate-800"
          >
            {c} Shoes
          </button>
        ))}
      </div>
    </ModalWrapper>
  );
};

export const SideDrawerMenu: React.FC<{
  wishlistCount: number;
  unreadAdminOrders: number;
  onNavigate: (tab: 'home' | 'category' | 'search' | 'cart' | 'account') => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
  onClose: () => void;
}> = ({
  wishlistCount,
  unreadAdminOrders,
  onNavigate,
  onOpenWishlist,
  onOpenOrders,
  onOpenAdmin,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex">
    <div className="w-72 max-w-[82vw] bg-white h-full flex flex-col shadow-2xl">
      <div className="bg-[#EB001B] text-white p-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-extrabold leading-tight">Runx.bd</p>
          <p className="text-xs text-white/85">runxbd.com</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 text-sm font-semibold text-slate-800">
        <button
          type="button"
          onClick={() => {
            onNavigate('home');
            onClose();
          }}
          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3"
        >
          <Home className="w-4 h-4 text-[#EB001B]" /> Home
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate('category');
            onClose();
          }}
          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3"
        >
          <LayoutGrid className="w-4 h-4 text-[#EB001B]" /> Categories
        </button>
        <button
          type="button"
          onClick={() => {
            onNavigate('search');
            onClose();
          }}
          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3"
        >
          <Search className="w-4 h-4 text-[#EB001B]" /> Search Shoes
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenWishlist();
            onClose();
          }}
          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center justify-between"
        >
          <span className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-[#EB001B]" /> Wishlist
          </span>
          {wishlistCount > 0 && (
            <span className="text-xs font-bold text-[#EB001B] tabular-nums">{wishlistCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenOrders();
            onClose();
          }}
          className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 flex items-center gap-3"
        >
          <Package className="w-4 h-4 text-[#EB001B]" /> Track My Orders
        </button>

        <div className="pt-3 mt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onOpenAdmin();
              onClose();
            }}
            className="w-full px-3 py-2.5 rounded-xl bg-red-50 text-[#EB001B] font-bold flex items-center justify-between"
          >
            <span className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" /> Admin Panel
            </span>
            {unreadAdminOrders > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#EB001B] text-white text-[10px] tabular-nums">
                {unreadAdminOrders}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
    <div className="flex-1" onClick={onClose} />
  </div>
);

export const WishlistModal: React.FC<{
  products: Product[];
  wishlistIds: string[];
  onSelectProduct: (p: Product) => void;
  onRemoveWishlist: (id: string) => void;
  onClose: () => void;
}> = ({ products, wishlistIds, onSelectProduct, onRemoveWishlist, onClose }) => {
  const items = products.filter((p) => wishlistIds.includes(p.id));
  return (
    <ModalWrapper title={`Saved Wishlist (${items.length})`} onClose={onClose}>
      {items.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">
          Tap the heart icon on any shoe to save it here.
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200"
            >
              <img
                src={item.image}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover bg-[#F3F4F6]"
              />
              <button
                type="button"
                onClick={() => {
                  onSelectProduct(item);
                  onClose();
                }}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                <p className="text-xs font-extrabold text-[#EB001B] tabular-nums">
                  {formatBDT(item.price)}
                </p>
              </button>
              <button
                type="button"
                onClick={() => onRemoveWishlist(item.id)}
                className="text-xs text-slate-400 hover:text-[#EB001B] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ModalWrapper>
  );
};
