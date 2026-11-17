import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatBDT } from '../utils/sound';

interface CartViewProps {
  items: CartItem[];
  shippingRate: number;
  onBack: () => void;
  onUpdateQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: (promoCode: string) => void;
  onBrowseShoes: () => void;
}

export const CartView: React.FC<CartViewProps> = ({
  items,
  shippingRate,
  onBack,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onBrowseShoes,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoMsg, setPromoMsg] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const allFreeShipping = items.length > 0 && items.every((i) => i.freeShipping);

  let discount = 0;
  if (appliedPromo === 'RUNX10') {
    discount = Math.round(subtotal * 0.1);
  } else if (appliedPromo === 'SAVE100' && subtotal >= 500) {
    discount = 100;
  }

  const shippingCharge =
    items.length === 0 ? 0 : allFreeShipping || appliedPromo === 'FREESHIP' ? 0 : shippingRate;
  const total = Math.max(0, subtotal - discount + shippingCharge);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === 'RUNX10') {
      setAppliedPromo(code);
      setPromoMsg('RUNX10 applied: 10% discount!');
    } else if (code === 'FREESHIP') {
      setAppliedPromo(code);
      setPromoMsg('FREESHIP applied: Free delivery!');
    } else if (code === 'SAVE100') {
      setAppliedPromo(code);
      setPromoMsg('SAVE100 applied: ৳100 off!');
    } else {
      setPromoMsg('Try RUNX10, SAVE100, or FREESHIP');
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Red App Bar Matching Screen 4 */}
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
            <h1 className="text-[18px] font-bold">Cart</h1>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              aria-label="Clear cart"
              title="Clear all items"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-3 pb-28">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center mt-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-red-50 text-[#EB001B] flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
            <p className="text-sm text-slate-500 mt-1">
              Add your favorite running shoes or sneakers to get started.
            </p>
            <button
              type="button"
              onClick={onBrowseShoes}
              className="mt-5 px-6 py-2.5 rounded-full bg-[#EB001B] text-white text-sm font-bold hover:bg-[#D10018] transition"
            >
              Browse Shoes
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
            {/* Cart Items List Matching Screen 4 */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.key}
                  className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F3F4F6] overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-[12px] text-slate-500 mt-0.5">
                      Color: {item.color} · Size: {item.size}
                    </p>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[16px] font-extrabold text-[#EB001B] tabular-nums">
                        {formatBDT(item.price)}
                      </span>
                      {item.originalPrice > item.price && (
                        <span className="text-[12.5px] text-slate-400 line-through tabular-nums">
                          {formatBDT(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Stepper Matching Screen 4 */}
                    <div className="inline-flex items-center border border-slate-200 rounded-lg mt-2 overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, -1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-[13px] font-bold text-slate-900 tabular-nums border-x border-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.key, 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.key)}
                    aria-label="Remove item"
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-[#EB001B] rounded-full hover:bg-red-50 transition shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary Card Matching Screen 4 */}
            <div className="lg:col-span-5 mt-4 lg:mt-0 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <form onSubmit={handleApplyPromo} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Promo code (e.g. RUNX10)"
                  className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#EB001B]"
                />
                <button
                  type="submit"
                  className="px-3.5 h-9 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shrink-0"
                >
                  Apply
                </button>
              </form>
              {promoMsg && (
                <p className="text-xs font-medium text-[#10A352] mb-3">{promoMsg}</p>
              )}

              <div className="space-y-2 text-[14.5px]">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {formatBDT(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Shipping Charge:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {shippingCharge === 0 ? 'Free (৳0)' : formatBDT(shippingCharge)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-[#10A352]">
                    <span>Discount ({appliedPromo}):</span>
                    <span className="font-bold tabular-nums">-{formatBDT(discount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[17px] font-extrabold text-slate-900">Total:</span>
                  <span className="text-[20px] font-extrabold text-[#EB001B] tabular-nums">
                    {formatBDT(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onProceedToCheckout(appliedPromo)}
                className="w-full mt-4 h-12 rounded-full bg-[#EB001B] hover:bg-[#D10018] active:scale-[0.99] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
