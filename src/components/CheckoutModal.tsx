import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
  User,
  X,
} from 'lucide-react';
import {
  CartItem,
  CustomerProfile,
  DeliveryZone,
  Order,
  PaymentMethod,
  StoreSettings,
} from '../types';
import { formatBDT } from '../utils/sound';

interface CheckoutModalProps {
  items: CartItem[];
  initialPromoCode?: string;
  profile: CustomerProfile;
  settings: Omit<StoreSettings, 'adminPin'>;
  onClose: () => void;
  onOrderCreated: (order: Order, savedProfile: Partial<CustomerProfile>) => void;
  onTrackOrders: () => void;
}

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  sub: string;
  badgeColor: string;
}[] = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    sub: 'পণ্য হাতে পেয়ে টাকা দিন',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'bkash',
    label: 'bKash Payment',
    sub: 'বিকাশ সেন্ড মানি / পেমেন্ট',
    badgeColor: 'bg-[#E2136E]',
  },
  {
    id: 'nagad',
    label: 'Nagad Payment',
    sub: 'নগদ পেমেন্ট',
    badgeColor: 'bg-[#F7941D]',
  },
  {
    id: 'rocket',
    label: 'Rocket',
    sub: 'ডাচ-বাংলা রকেট',
    badgeColor: 'bg-[#8C3494]',
  },
  {
    id: 'card',
    label: 'Card / SSLCommerz',
    sub: 'Visa, Mastercard, DBBL Nexus',
    badgeColor: 'bg-slate-800',
  },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  items,
  initialPromoCode = '',
  profile,
  settings,
  onClose,
  onOrderCreated,
  onTrackOrders,
}) => {
  const [customerName, setCustomerName] = useState(
    profile.name && profile.name !== 'Runx Bd' ? profile.name : ''
  );
  const [customerPhone, setCustomerPhone] = useState(profile.phone || '');
  const [customerAddress, setCustomerAddress] = useState(profile.address || '');
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone>(
    profile.deliveryZone || 'inside_dhaka'
  );
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedNum, setCopiedNum] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const allFreeShipping = items.length > 0 && items.every((i) => i.freeShipping);
  const shippingCharge =
    allFreeShipping || initialPromoCode === 'FREESHIP'
      ? 0
      : deliveryZone === 'inside_dhaka'
        ? settings.insideDhakaShipping
        : settings.outsideDhakaShipping;

  let discountAmount = 0;
  if (initialPromoCode === 'RUNX10') {
    discountAmount = Math.round(subtotal * 0.1);
  } else if (initialPromoCode === 'SAVE100' && subtotal >= 500) {
    discountAmount = 100;
  }

  const total = Math.max(0, subtotal - discountAmount + shippingCharge);

  const gatewayNumber =
    paymentMethod === 'bkash'
      ? settings.bkashNumber
      : paymentMethod === 'nagad'
        ? settings.nagadNumber
        : paymentMethod === 'rocket'
          ? settings.rocketNumber
          : '';

  const copyGatewayNumber = () => {
    if (!gatewayNumber) return;
    navigator.clipboard?.writeText(gatewayNumber).catch(() => {});
    setCopiedNum(true);
    setTimeout(() => setCopiedNum(false), 1800);
  };

  const handleInstantGatewayPay = () => {
    const cleanPhone = customerPhone.replace(/\D/g, '') || '01700000000';
    setSenderNumber(cleanPhone);
    const prefix =
      paymentMethod === 'bkash' ? 'BKS' : paymentMethod === 'nagad' ? 'NGD' : 'RKT';
    setTransactionId(`${prefix}${Math.random().toString(36).slice(2, 9).toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError('দয়া করে আপনার সম্পূর্ণ নাম লিখুন (Please enter your full name).');
      return;
    }
    const digits = customerPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (Enter valid 11-digit mobile number).');
      return;
    }
    if (!customerAddress.trim() || customerAddress.trim().length < 5) {
      setError('দয়া করে আপনার ডেলিভারি ঠিকানা লিখুন (Enter full delivery address).');
      return;
    }
    if (
      (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') &&
      !transactionId.trim()
    ) {
      setError(
        `Please enter your ${paymentMethod.toUpperCase()} Transaction ID or click Instant Verify Pay.`
      );
      return;
    }
    if (paymentMethod === 'card' && cardLast4.trim().length < 4) {
      setError('Please enter card number details to verify Card / SSLCommerz payment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          deliveryZone,
          note: note.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            title: i.title,
            price: i.price,
            image: i.image,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            freeShipping: i.freeShipping,
          })),
          promoCode: initialPromoCode,
          paymentMethod,
          senderNumber: senderNumber.trim() || customerPhone.trim(),
          transactionId:
            paymentMethod === 'card'
              ? `SSL${Math.random().toString(36).slice(2, 9).toUpperCase()}`
              : transactionId.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not place order.');
      }

      setCompletedOrder(data.order);
      onOrderCreated(data.order, {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim(),
        deliveryZone,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-pop">
        {/* Header */}
        <div className="bg-[#EB001B] text-white px-4 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              {completedOrder ? 'Order Confirmed!' : 'Complete Your Order'}
            </h2>
            <p className="text-[11.5px] text-white/85">
              {completedOrder
                ? `Order #${completedOrder.orderNumber} sent to Runx.bd Admin`
                : 'নাম, মোবাইল নাম্বার ও ঠিকানা দিয়ে অর্ডার করুন'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {completedOrder ? (
          <div className="p-5 sm:p-6 overflow-y-auto text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#EB001B] uppercase tracking-wide">
                Runx.bd Order Receipt
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                #{completedOrder.orderNumber}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                ধন্যবাদ, <span className="font-semibold">{completedOrder.customerName}</span>! আপনার অর্ডার সফলভাবে সাবমিট হয়েছে।
              </p>
            </div>

            <div className="bg-[#F5F5F7] rounded-xl p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {completedOrder.customerPhone}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500 shrink-0">Address:</span>
                <span className="font-medium text-slate-900 text-right">
                  {completedOrder.customerAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {completedOrder.paymentMethod}{' '}
                  {completedOrder.transactionId ? `(${completedOrder.transactionId})` : ''}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total Payable:</span>
                <span className="font-extrabold text-[#EB001B] text-base tabular-nums">
                  {formatBDT(completedOrder.total)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onTrackOrders}
                className="flex-1 h-11 rounded-full border border-slate-300 font-bold text-sm text-slate-800 hover:bg-slate-50 transition"
              >
                Track My Order
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-full bg-[#EB001B] text-white font-bold text-sm hover:bg-[#D10018] transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm font-medium text-[#EB001B]">
                {error}
              </div>
            )}

            {/* Customer Info Fields */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Delivery Information (ডেলিভারি তথ্য)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (আপনার নাম) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (মোবাইল নাম্বার) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B] tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Zone (এলাকা)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryZone('inside_dhaka')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      deliveryZone === 'inside_dhaka'
                        ? 'border-[#EB001B] bg-red-50/50 text-[#EB001B]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Inside Dhaka</div>
                    <div className="text-[11px] opacity-80 tabular-nums">
                      {allFreeShipping ? 'Free Shipping' : `${formatBDT(settings.insideDhakaShipping)} Charge`}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryZone('outside_dhaka')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      deliveryZone === 'outside_dhaka'
                        ? 'border-[#EB001B] bg-red-50/50 text-[#EB001B]'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">Outside Dhaka</div>
                    <div className="text-[11px] opacity-80 tabular-nums">
                      {allFreeShipping ? 'Free Shipping' : `${formatBDT(settings.outsideDhakaShipping)} Charge`}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Address (সম্পূর্ণ ঠিকানা) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="House, Road, Area, Thana, District..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#EB001B] resize-none"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Order Note (Optional - e.g. Call before coming)"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#EB001B]"
                />
              </div>
            </div>

            {/* Payment Gateways */}
            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Payment Gateway (পেমেন্ট মেথড)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const selected = paymentMethod === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        selected
                          ? 'border-[#EB001B] bg-red-50/40 ring-1 ring-[#EB001B]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg ${opt.badgeColor} text-white flex items-center justify-center shrink-0`}
                      >
                        {opt.id === 'cod' ? (
                          <Truck className="w-4 h-4" />
                        ) : opt.id === 'card' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {opt.label}
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate">{opt.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Banking Verification Box (bKash / Nagad / Rocket) */}
              {(paymentMethod === 'bkash' ||
                paymentMethod === 'nagad' ||
                paymentMethod === 'rocket') && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Send <span className="text-[#EB001B] font-bold">{formatBDT(total)}</span> to{' '}
                        <span className="uppercase font-bold">{paymentMethod}</span> Merchant:
                      </p>
                      <p className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5">
                        {gatewayNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyGatewayNumber}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1 hover:bg-slate-50"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedNum ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="tel"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="Your Sender Number"
                      className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs outline-none focus:border-[#EB001B] tabular-nums"
                    />
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Transaction ID (TrxID) *"
                      className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs outline-none focus:border-[#EB001B] uppercase"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleInstantGatewayPay}
                    className="w-full py-1.5 rounded-lg bg-slate-900 text-white text-[11.5px] font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Instant Pay & Auto-Fill TrxID (Gateway Sandbox)
                  </button>
                </div>
              )}

              {/* Card / SSLCommerz Panel */}
              {paymentMethod === 'card' && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-slate-200 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    SSLCommerz Secure Card Checkout ({formatBDT(total)})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      maxLength={19}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value)}
                      placeholder="Card Number (e.g. 4242...)"
                      className="col-span-2 h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs outline-none focus:border-[#EB001B] tabular-nums"
                    />
                    <input
                      type="text"
                      maxLength={5}
                      defaultValue="12/28"
                      placeholder="MM/YY"
                      className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs outline-none focus:border-[#EB001B] tabular-nums"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Total Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)}) Subtotal</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatBDT(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {shippingCharge === 0 ? 'Free (৳0)' : formatBDT(shippingCharge)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#10A352]">
                  <span>Promo Discount</span>
                  <span className="font-semibold tabular-nums">-{formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Total Payable</span>
                <span className="text-[#EB001B] tabular-nums">{formatBDT(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-full bg-[#EB001B] hover:bg-[#D10018] disabled:opacity-60 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Order...
                </>
              ) : (
                `Confirm Order · ${formatBDT(total)}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
