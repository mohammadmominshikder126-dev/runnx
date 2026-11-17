import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  Home,
  LayoutGrid,
  Search,
  ShoppingCart,
  User,
} from 'lucide-react';
import {
  AboutModal,
  DealsModal,
  MyOrdersModal,
  ProfileAddressModal,
  SettingsModal,
  SideDrawerMenu,
  SupportModal,
  VisualFilterModal,
  WalletModal,
  WishlistModal,
} from './components/AccountDialogs';
import { AccountView } from './components/AccountView';
import { AdminDashboard } from './components/AdminDashboard';
import { CartView } from './components/CartView';
import { CategoryView } from './components/CategoryView';
import { CheckoutModal } from './components/CheckoutModal';
import { HomeView } from './components/HomeView';
import { ProductDetailView } from './components/ProductDetailView';
import { SearchView } from './components/SearchView';
import { DEFAULT_STORE_SETTINGS, INITIAL_PRODUCTS, SHOE_IMAGES } from './data/catalog';
import {
  CartItem,
  CustomerProfile,
  HomeFilterTab,
  Order,
  Product,
  StoreSettings,
} from './types';
import { formatBDT, playOrderNotificationSound } from './utils/sound';

type MainTab = 'home' | 'category' | 'search' | 'cart' | 'account';
type ActiveDialog =
  | null
  | 'menu'
  | 'deals'
  | 'support'
  | 'visualFilter'
  | 'myOrders'
  | 'profileAddress'
  | 'wallet'
  | 'about'
  | 'settings'
  | 'wishlist';

const INITIAL_CART_SEED: CartItem[] = [
  {
    key: 'prod-mens-running__Black__40',
    productId: 'prod-mens-running',
    title: "Men's Running Shoes",
    price: 550,
    originalPrice: 655,
    image: SHOE_IMAGES.blackMesh,
    color: 'Black',
    size: '40',
    quantity: 1,
    freeShipping: true,
  },
  {
    key: 'prod-summer-54__Navy__42',
    productId: 'prod-summer-54',
    title: 'Summer 54 Extra Large Size Flyknit Running Shoes',
    price: 1190,
    originalPrice: 1399,
    image: SHOE_IMAGES.navyFlyknit,
    color: 'Navy',
    size: '42',
    quantity: 1,
    freeShipping: true,
  },
];

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Omit<StoreSettings, 'adminPin'>>(() => {
    const { adminPin: _pin, ...pub } = DEFAULT_STORE_SETTINGS;
    return pub;
  });

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [homeFilterTab, setHomeFilterTab] = useState<HomeFilterTab>('Explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
    return sessionStorage.getItem('runx_admin_unlocked') === '1';
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const initialized = localStorage.getItem('runx_cart_initialized');
      const saved = localStorage.getItem('runx_cart');
      if (initialized && saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem('runx_cart_initialized', '1');
      return INITIAL_CART_SEED;
    } catch {
      return INITIAL_CART_SEED;
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('runx_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customerOrderIds, setCustomerOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('runx_my_order_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [profile, setProfile] = useState<CustomerProfile>(() => {
    try {
      const saved = localStorage.getItem('runx_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      name: 'Runx Bd',
      phone: '',
      address: '',
      deliveryZone: 'inside_dhaka',
      walletBalance: 0,
    };
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [checkoutState, setCheckoutState] = useState<{
    items: CartItem[];
    promoCode: string;
    isBuyNow: boolean;
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [liveOrderAlert, setLiveOrderAlert] = useState<Order | null>(null);

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  // Persist local client state
  useEffect(() => {
    localStorage.setItem('runx_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('runx_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem('runx_my_order_ids', JSON.stringify(customerOrderIds));
  }, [customerOrderIds]);

  useEffect(() => {
    localStorage.setItem('runx_profile', JSON.stringify(profile));
  }, [profile]);

  // Load initial data from backend API
  const fetchInitialData = useCallback(async () => {
    try {
      const [prodRes, ordRes, setRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/settings'),
      ]);
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (Array.isArray(d.products) && d.products.length > 0) setProducts(d.products);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        if (Array.isArray(d.orders)) setOrders(d.orders);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        if (d.settings) setSettings(d.settings);
      }
    } catch {
      // Fallback to initial seeded state if offline
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Real-Time WebSocket for Instant Order Notifications
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'order:created' && payload.order) {
            const incoming: Order = payload.order;
            setOrders((prev) => {
              if (prev.some((o) => o.id === incoming.id)) return prev;
              return [incoming, ...prev];
            });
            setLiveOrderAlert(incoming);
            if (soundEnabledRef.current) {
              playOrderNotificationSound();
            }
          } else if (payload.type === 'order:updated' && payload.order) {
            const updated: Order = payload.order;
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          } else if (payload.type === 'order:deleted' && payload.orderId) {
            setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
          } else if (payload.type === 'orders:read') {
            setOrders((prev) => prev.map((o) => ({ ...o, isReadByAdmin: true })));
          } else if (payload.type === 'product:updated' && Array.isArray(payload.products)) {
            setProducts(payload.products);
          }
        } catch {
          // ignore invalid frame
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!isDisposed) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // Cart Handlers
  const handleAddToCart = (
    product: Product,
    color: string,
    size: string,
    image: string
  ) => {
    const key = `${product.id}__${color}__${size}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          title: product.title,
          price: product.price,
          originalPrice: product.originalPrice,
          image,
          color,
          size,
          quantity: 1,
          freeShipping: product.freeShipping,
        },
      ];
    });
    showToast(`Added "${product.shortTitle || product.title}" (Size ${size}) to Cart`);
  };

  const handleBuyNow = (
    product: Product,
    color: string,
    size: string,
    image: string
  ) => {
    const singleItem: CartItem = {
      key: `${product.id}__${color}__${size}`,
      productId: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image,
      color,
      size,
      quantity: 1,
      freeShipping: product.freeShipping,
    };
    setCheckoutState({ items: [singleItem], promoCode: '', isBuyNow: true });
  };

  const handleUpdateCartQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      showToast(exists ? 'Removed from Wishlist' : 'Saved to Wishlist');
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const handleShareProduct = (product: Product) => {
    const shareText = `${product.title} — ${formatBDT(product.price)} at Runx.bd (runxbd.com)`;
    if (navigator.share) {
      navigator.share({ title: product.title, text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shareText).catch(() => {});
      showToast('Product link copied!');
    }
  };

  // Admin API Mutations
  const handleUpdateOrder = async (
    orderId: string,
    patch: Partial<Pick<Order, 'status' | 'paymentStatus' | 'isReadByAdmin'>>
  ) => {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order deleted');
    }
  };

  const handleMarkAllRead = async () => {
    await fetch('/api/orders/mark-all-read', { method: 'POST' });
    setOrders((prev) => prev.map((o) => ({ ...o, isReadByAdmin: true })));
  };

  const handleAddProduct = async (payload: {
    title: string;
    category: string;
    price: number;
    originalPrice: number;
    freeShipping: boolean;
    image: string;
  }) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => [data.product, ...prev]);
      showToast('New shoe added to catalog!');
    }
  };

  const handleUpdateProduct = async (id: string, patch: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === id ? data.product : p)));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast('Product removed');
    }
  };

  const handleSaveSettings = async (patch: Partial<StoreSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  };

  const unreadAdminOrders = orders.filter((o) => !o.isReadByAdmin).length;
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const myOrders = orders.filter(
    (o) =>
      customerOrderIds.includes(o.id) ||
      (profile.phone &&
        o.customerPhone.replace(/\D/g, '').endsWith(profile.phone.replace(/\D/g, '').slice(-8)))
  );

  // Full-screen Admin Dashboard Mode
  if (isAdminView) {
    return (
      <>
        <AdminDashboard
          orders={orders}
          products={products}
          settings={settings}
          unreadCount={unreadAdminOrders}
          wsConnected={wsConnected}
          soundEnabled={soundEnabled}
          isUnlocked={isAdminUnlocked}
          onUnlock={() => {
            setIsAdminUnlocked(true);
            sessionStorage.setItem('runx_admin_unlocked', '1');
          }}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onBackToStore={() => setIsAdminView(false)}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          onMarkAllRead={handleMarkAllRead}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onSaveSettings={handleSaveSettings}
        />

        {/* Real-time Incoming Order Notification Banner inside Admin */}
        {liveOrderAlert && (
          <div className="fixed top-16 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-white/10 flex items-start gap-3 animate-pop">
            <div className="w-9 h-9 rounded-full bg-[#EB001B] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-amber-300">
                New Order #{liveOrderAlert.orderNumber}
              </p>
              <p className="text-xs text-white/90 truncate mt-0.5">
                {liveOrderAlert.customerName} · {formatBDT(liveOrderAlert.total)} (
                {liveOrderAlert.paymentMethod.toUpperCase()})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLiveOrderAlert(null)}
              className="text-xs font-bold text-white/60 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F6] flex flex-col">
      {/* Main Screen Switcher */}
      <div className="flex-1">
        {selectedProduct ? (
          <ProductDetailView
            product={selectedProduct}
            isWishlisted={wishlistIds.includes(selectedProduct.id)}
            onToggleWishlist={handleToggleWishlist}
            onBack={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onShare={handleShareProduct}
          />
        ) : activeTab === 'home' ? (
          <HomeView
            products={products}
            activeTab={homeFilterTab}
            onTabChange={setHomeFilterTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => setActiveTab('search')}
            onSelectProduct={setSelectedProduct}
            onOpenMenu={() => setActiveDialog('menu')}
            onOpenDealsModal={() => setActiveDialog('deals')}
            onOpenSupportModal={() => setActiveDialog('support')}
            onOpenVisualSearch={() => setActiveDialog('visualFilter')}
            onOpenAdmin={() => {
              setLiveOrderAlert(null);
              setIsAdminView(true);
            }}
            unreadAdminOrders={unreadAdminOrders}
          />
        ) : activeTab === 'category' ? (
          <CategoryView
            products={products}
            onBack={() => setActiveTab('home')}
            onOpenSearch={() => setActiveTab('search')}
            onSelectProduct={setSelectedProduct}
          />
        ) : activeTab === 'search' ? (
          <SearchView
            products={products}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onBack={() => setActiveTab('home')}
            onSelectProduct={setSelectedProduct}
          />
        ) : activeTab === 'cart' ? (
          <CartView
            items={cart}
            shippingRate={settings.insideDhakaShipping}
            onBack={() => setActiveTab('home')}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={() => {
              setCart([]);
              showToast('Cart cleared');
            }}
            onProceedToCheckout={(promoCode) =>
              setCheckoutState({ items: cart, promoCode, isBuyNow: false })
            }
            onBrowseShoes={() => setActiveTab('home')}
          />
        ) : (
          <AccountView
            profile={profile}
            ordersCount={myOrders.length}
            wishlistCount={wishlistIds.length}
            unreadAdminOrders={unreadAdminOrders}
            onBack={() => setActiveTab('home')}
            onOpenSettings={() => setActiveDialog('settings')}
            onEditProfile={() => setActiveDialog('profileAddress')}
            onOpenMyOrders={() => setActiveDialog('myOrders')}
            onOpenAddresses={() => setActiveDialog('profileAddress')}
            onOpenWallet={() => setActiveDialog('wallet')}
            onOpenSupport={() => setActiveDialog('support')}
            onOpenAbout={() => setActiveDialog('about')}
            onOpenAdmin={() => {
              setLiveOrderAlert(null);
              setIsAdminView(true);
            }}
            onLogOut={() => {
              setProfile({
                name: 'Runx Bd',
                phone: '',
                address: '',
                deliveryZone: 'inside_dhaka',
                walletBalance: 0,
              });
              setIsAdminUnlocked(false);
              sessionStorage.removeItem('runx_admin_unlocked');
              showToast('Logged out cleanly');
            }}
          />
        )}
      </div>

      {/* Fixed 5-Tab Bottom Navigation Bar Matching All 5 Reference Screens */}
      {!selectedProduct && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
          <div className="max-w-3xl mx-auto grid grid-cols-5 h-16">
            {(
              [
                { id: 'home', label: 'Home', icon: Home },
                { id: 'category', label: 'Category', icon: LayoutGrid },
                { id: 'search', label: 'Search', icon: Search },
                { id: 'cart', label: 'Cart', icon: ShoppingCart },
                { id: 'account', label: 'Account', icon: User },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive ? 'text-[#EB001B]' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive && (tab.id === 'home' || tab.id === 'account')
                          ? 'fill-[#EB001B] text-[#EB001B]'
                          : ''
                      } stroke-[2]`}
                    />
                    {tab.id === 'cart' && cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#EB001B] text-white text-[10px] font-extrabold flex items-center justify-center tabular-nums ring-2 ring-white">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] leading-none mt-0.5 ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Checkout & Payment Gateway Modal */}
      {checkoutState && (
        <CheckoutModal
          items={checkoutState.items}
          initialPromoCode={checkoutState.promoCode}
          profile={profile}
          settings={settings}
          onClose={() => setCheckoutState(null)}
          onOrderCreated={(newOrder, savedProfile) => {
            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
            setCustomerOrderIds((prev) => [newOrder.id, ...prev]);
            setProfile((prev) => ({
              ...prev,
              ...savedProfile,
            }));
            if (!checkoutState.isBuyNow) {
              setCart([]);
            }
          }}
          onTrackOrders={() => {
            setCheckoutState(null);
            setSelectedProduct(null);
            setActiveTab('account');
            setActiveDialog('myOrders');
          }}
        />
      )}

      {/* Live New Order Floating Notification Banner (Even while browsing Store!) */}
      {liveOrderAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl border border-white/10 flex items-center gap-3 animate-pop">
          <div className="w-9 h-9 rounded-full bg-[#EB001B] flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-amber-300">
              New Order #{liveOrderAlert.orderNumber}
            </p>
            <p className="text-xs text-white/90 truncate">
              {liveOrderAlert.customerName} · {formatBDT(liveOrderAlert.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLiveOrderAlert(null);
              setIsAdminView(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#EB001B] text-white text-[11px] font-bold shrink-0"
          >
            Open Admin
          </button>
        </div>
      )}

      {/* Subtle Bottom/Top Toast */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg whitespace-nowrap animate-pop">
          {toastMsg}
        </div>
      )}

      {/* All Working Interactive Dialogs */}
      {activeDialog === 'menu' && (
        <SideDrawerMenu
          wishlistCount={wishlistIds.length}
          unreadAdminOrders={unreadAdminOrders}
          onNavigate={(tab) => {
            setSelectedProduct(null);
            setActiveTab(tab);
          }}
          onOpenWishlist={() => setActiveDialog('wishlist')}
          onOpenOrders={() => setActiveDialog('myOrders')}
          onOpenAdmin={() => setIsAdminView(true)}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'deals' && (
        <DealsModal
          onApplyAndShop={() => {
            setSelectedProduct(null);
            setActiveTab('home');
            setHomeFilterTab('Best Deals');
          }}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'support' && (
        <SupportModal settings={settings} onClose={() => setActiveDialog(null)} />
      )}

      {activeDialog === 'visualFilter' && (
        <VisualFilterModal
          products={products}
          onSelectColorQuery={(color) => {
            setSearchQuery(color);
            setActiveTab('search');
          }}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'myOrders' && (
        <MyOrdersModal
          orders={myOrders}
          defaultPhone={profile.phone}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'profileAddress' && (
        <ProfileAddressModal
          profile={profile}
          onSave={(next) => {
            setProfile(next);
            showToast('Profile & address saved');
          }}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'wallet' && (
        <WalletModal
          profile={profile}
          settings={settings}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'about' && <AboutModal onClose={() => setActiveDialog(null)} />}

      {activeDialog === 'settings' && (
        <SettingsModal
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onClose={() => setActiveDialog(null)}
        />
      )}

      {activeDialog === 'wishlist' && (
        <WishlistModal
          products={products}
          wishlistIds={wishlistIds}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onRemoveWishlist={handleToggleWishlist}
          onClose={() => setActiveDialog(null)}
        />
      )}
    </div>
  );
}
