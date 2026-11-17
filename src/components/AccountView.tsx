import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Headphones,
  Info,
  MapPin,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react';
import { CustomerProfile } from '../types';

interface AccountViewProps {
  profile: CustomerProfile;
  ordersCount: number;
  wishlistCount: number;
  unreadAdminOrders: number;
  onBack: () => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
  onOpenMyOrders: () => void;
  onOpenAddresses: () => void;
  onOpenWallet: () => void;
  onOpenSupport: () => void;
  onOpenAbout: () => void;
  onOpenAdmin: () => void;
  onLogOut: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  profile,
  ordersCount,
  unreadAdminOrders,
  onBack,
  onOpenSettings,
  onEditProfile,
  onOpenMyOrders,
  onOpenAddresses,
  onOpenWallet,
  onOpenSupport,
  onOpenAbout,
  onOpenAdmin,
  onLogOut,
}) => {
  const menuItems = [
    {
      label: 'My Orders',
      icon: ClipboardList,
      onClick: onOpenMyOrders,
      badge: ordersCount > 0 ? String(ordersCount) : undefined,
    },
    {
      label: 'My Addresses',
      icon: MapPin,
      onClick: onOpenAddresses,
    },
    {
      label: 'My Wallet',
      icon: Wallet,
      onClick: onOpenWallet,
    },
    {
      label: 'Customer Support',
      icon: Headphones,
      onClick: onOpenSupport,
    },
    {
      label: 'About Us',
      icon: Info,
      onClick: onOpenAbout,
    },
    {
      label: 'Setting',
      icon: Settings,
      onClick: onOpenSettings,
    },
  ];

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Red App Bar Matching Screen 5 */}
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
            </button>
            <h1 className="text-[18px] font-bold">My Account</h1>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pt-5 pb-28 flex flex-col">
        {/* Profile Header Row Matching Screen 5 */}
        <button
          type="button"
          onClick={onEditProfile}
          className="flex items-center justify-between pb-5 border-b border-slate-200 text-left group"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-full bg-[#D9D9DF] flex items-center justify-center text-white shrink-0">
              <User className="w-9 h-9 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[20px] font-bold text-slate-900 truncate">
                {profile.name || 'Runx Bd'}
              </h2>
              <p className="text-[14px] text-slate-500 truncate">
                {profile.phone ? profile.phone : 'runxbd.com'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 shrink-0" />
        </button>

        {/* Menu List Matching Screen 5 */}
        <div className="divide-y divide-slate-100">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="w-full py-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition group"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-slate-700 stroke-[1.9]" />
                  <span className="text-[15.5px] font-medium text-slate-900">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#EB001B] text-white text-[11px] font-bold tabular-nums">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700" />
                </div>
              </button>
            );
          })}

          {/* Store Owner Admin Dashboard Entry */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="w-full py-4 flex items-center justify-between text-left hover:bg-red-50/50 transition group"
          >
            <div className="flex items-center gap-3.5">
              <ShieldCheck className="w-5 h-5 text-[#EB001B] stroke-[2]" />
              <div>
                <span className="text-[15.5px] font-bold text-[#EB001B] block leading-tight">
                  Admin Panel & Order Dashboard
                </span>
                <span className="text-[11.5px] text-slate-500">
                  Manage orders, live notifications & payment gateways
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadAdminOrders > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#EB001B] text-white text-[11px] font-bold tabular-nums">
                  {unreadAdminOrders} New
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-[#EB001B]" />
            </div>
          </button>
        </div>

        {/* Log Out Outlined Button Matching Screen 5 */}
        <button
          type="button"
          onClick={onLogOut}
          className="mt-6 w-full h-11 rounded-xl border border-[#EB001B] text-[#EB001B] font-semibold text-[15px] hover:bg-red-50 active:scale-[0.99] transition"
        >
          Log Out
        </button>
      </main>
    </div>
  );
};
