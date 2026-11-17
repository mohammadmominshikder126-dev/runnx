import React from 'react';
import {
  Camera,
  Headphones,
  Menu,
  Search,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { HomeFilterTab, Product } from '../types';
import { ProductCard } from './ProductCard';

interface HomeViewProps {
  products: Product[];
  activeTab: HomeFilterTab;
  onTabChange: (tab: HomeFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  onSelectProduct: (product: Product) => void;
  onOpenMenu: () => void;
  onOpenDealsModal: () => void;
  onOpenSupportModal: () => void;
  onOpenVisualSearch: () => void;
  onOpenAdmin: () => void;
  unreadAdminOrders: number;
}

const HOME_TABS: HomeFilterTab[] = ['Explore', 'Shoes Picks', 'Best Deals', 'Fashion'];

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectProduct,
  onOpenMenu,
  onOpenDealsModal,
  onOpenSupportModal,
  onOpenVisualSearch,
  onOpenAdmin,
  unreadAdminOrders,
}) => {
  const filteredProducts = products.filter((p) => {
    const matchesTab = activeTab === 'Explore' || p.tabGroups.includes(activeTab);
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  return (
    <div className="min-h-full flex flex-col">
      {/* Vivid Red Top Header Matching Screenshot */}
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2.5 pb-0">
          {/* Top Bar Row */}
          <div className="flex items-center justify-between gap-2 pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onOpenMenu}
                aria-label="Open menu"
                className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition"
              >
                <Menu className="w-6 h-6 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onTabChange('Explore');
                  onSearchChange('');
                }}
                className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-white whitespace-nowrap leading-none"
              >
                runxbd.com
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Target / Flash Deals Icon matching screenshot */}
              <button
                type="button"
                onClick={onOpenDealsModal}
                aria-label="Flash Deals & Coupons"
                title="Flash Deals & Promo Codes"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition"
              >
                <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF5E7E] via-[#FF8A5B] to-[#FFD166] flex items-center justify-center shadow-xs ring-1 ring-white/40">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] ring-2 ring-white" />
                </span>
              </button>

              {/* Notification / Quick Admin Button */}
              <button
                type="button"
                onClick={onOpenAdmin}
                aria-label="Admin Orders & Notifications"
                title="Admin Dashboard & Order Notifications"
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition"
              >
                <Bell className="w-5 h-5 stroke-[2.2]" />
                {unreadAdminOrders > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-300 text-[#EB001B] text-[10px] font-extrabold flex items-center justify-center tabular-nums shadow-xs">
                    {unreadAdminOrders > 9 ? '9+' : unreadAdminOrders}
                  </span>
                )}
              </button>

              {/* Headset Support Icon matching screenshot */}
              <button
                type="button"
                onClick={onOpenSupportModal}
                aria-label="Customer Support"
                title="Customer Support"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-95 transition"
              >
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Desktop Admin Pill Shortcut */}
              <button
                type="button"
                onClick={onOpenAdmin}
                className="hidden md:inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-full bg-white text-[#EB001B] text-xs font-bold hover:bg-red-50 transition whitespace-nowrap shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
                {unreadAdminOrders > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-[#EB001B] text-white rounded-full text-[10px] tabular-nums">
                    {unreadAdminOrders}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Pill Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit();
            }}
            className="flex items-center bg-white rounded-full p-1 pl-4 shadow-xs mb-2.5"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search shoes..."
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-[14px] outline-none min-w-0"
            />
            <button
              type="button"
              onClick={onOpenVisualSearch}
              aria-label="Filter shoes by color or style"
              title="Color & Style Filter"
              className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 transition shrink-0"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="submit"
              aria-label="Search"
              className="bg-[#EB001B] hover:bg-[#D10018] text-white rounded-full px-3.5 py-1.5 flex items-center justify-center transition shrink-0 ml-1"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Horizontal Tab Bar inside Red Header */}
          <nav className="flex items-center justify-between sm:justify-start sm:gap-8 overflow-x-auto no-scrollbar">
            {HOME_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`relative pb-2.5 pt-0.5 text-[13.5px] sm:text-[14px] whitespace-nowrap shrink-0 transition-opacity ${
                    isActive ? 'font-bold text-white' : 'font-medium text-white/85 hover:text-white'
                  }`}
                >
                  {tab}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Product Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 pt-3 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center my-6 shadow-xs">
            <p className="text-slate-700 font-semibold text-base">
              No shoes matched "{searchQuery}"
            </p>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onTabChange('Explore');
              }}
              className="mt-3 px-4 py-2 rounded-full bg-[#EB001B] text-white text-sm font-semibold"
            >
              Show All Shoes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
