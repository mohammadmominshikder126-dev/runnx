import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  ShoppingCart,
  Star,
  Zap,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Product } from '../types';
import { formatBDT } from '../utils/sound';

interface ProductDetailViewProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onBack: () => void;
  onAddToCart: (product: Product, color: string, size: string, image: string) => void;
  onBuyNow: (product: Product, color: string, size: string, image: string) => void;
  onShare: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onBack,
  onAddToCart,
  onBuyNow,
  onShare,
}) => {
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState(
    product.sizes.includes('40') ? '40' : product.sizes[0] || '40'
  );
  const [galleryIdx, setGalleryIdx] = useState(0);

  const selectedColor = product.colors[selectedColorIdx] || {
    name: 'Default',
    hex: '#18181B',
    image: product.image,
  };

  const galleryImages =
    product.gallery.length > 0 ? product.gallery : [product.image];
  const activeImage =
    galleryIdx === 0 && selectedColor.image ? selectedColor.image : galleryImages[galleryIdx] || product.image;

  const savings = Math.max(0, product.originalPrice - product.price);

  const handleSelectColor = (idx: number) => {
    setSelectedColorIdx(idx);
    setGalleryIdx(0);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-24 lg:pb-10">
      {/* Red App Bar Matching Screen 3 */}
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
            </button>
            <h1 className="text-[18px] font-bold truncate">Product Details</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onShare(product)}
              aria-label="Share product"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <Heart
                className={`w-5 h-5 transition ${
                  isWishlisted ? 'fill-white text-white scale-110' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content (Single column mobile matching Screen 3, 2-column desktop) */}
      <div className="max-w-6xl w-full mx-auto lg:px-6 lg:py-8 lg:grid lg:grid-cols-12 lg:gap-10 items-start">
        {/* Left: Product Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-20">
          <div className="relative aspect-[1/0.92] sm:aspect-square w-full bg-[#F3F4F6] lg:rounded-2xl overflow-hidden">
            <img
              src={activeImage}
              alt={`${product.title} - ${selectedColor.name}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />

            {/* Top-left Discount Pill (-16%) */}
            {product.discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-[#EB001B] text-white text-[13px] font-bold px-3 py-1 rounded-full shadow-xs tabular-nums">
                -{product.discountPercent}%
              </span>
            )}

            {/* Gallery Prev/Next arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() =>
                    setGalleryIdx((prev) =>
                      prev === 0 ? galleryImages.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() =>
                    setGalleryIdx((prev) => (prev + 1) % galleryImages.length)
                  }
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-xs transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Bottom-right Counter Pill (1/5) */}
            <span className="absolute bottom-3 right-3 bg-black/55 text-white text-[12px] font-semibold px-2.5 py-0.5 rounded-full tabular-nums">
              {galleryIdx + 1}/{galleryImages.length}
            </span>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 px-4 pt-4 pb-6 lg:p-0 flex flex-col gap-4">
          {/* Title & Rating */}
          <div>
            <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-900 leading-snug">
              {product.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center text-[#F59E0B]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(product.rating)
                        ? 'fill-[#F59E0B] text-[#F59E0B]'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[13px] font-semibold text-slate-800 tabular-nums">
                {product.rating}
              </span>
              <span className="text-[13px] text-slate-500 tabular-nums">
                ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>
          </div>

          {/* Price Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[28px] sm:text-[32px] font-extrabold text-[#EB001B] tabular-nums leading-none">
              {formatBDT(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[16px] text-slate-400 line-through tabular-nums">
                {formatBDT(product.originalPrice)}
              </span>
            )}
            {savings > 0 && (
              <span className="bg-[#FFE5E8] text-[#EB001B] text-[12px] font-bold px-2.5 py-1 rounded-full tabular-nums">
                Save {formatBDT(savings)}
              </span>
            )}
          </div>

          {/* Color Selector Matching Screen 3 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[14px] font-semibold text-slate-800 w-12 shrink-0">
              Color:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {product.colors.map((col, idx) => {
                const isSelected = idx === selectedColorIdx;
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => handleSelectColor(idx)}
                    title={col.name}
                    className={`w-12 h-12 rounded-lg overflow-hidden bg-[#F3F4F6] border-2 transition ${
                      isSelected
                        ? 'border-[#EB001B] ring-1 ring-[#EB001B]/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={col.image}
                      alt={col.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector Matching Screen 3 */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[14px] font-semibold text-slate-800 w-12 shrink-0">
              Size:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {product.sizes.map((size) => {
                const isSelected = size === selectedSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[44px] h-9 px-3 rounded-lg text-[14px] font-semibold border transition tabular-nums ${
                      isSelected
                        ? 'border-[#EB001B] text-[#EB001B] bg-[#EB001B]/5'
                        : 'border-slate-200 text-slate-800 bg-white hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery & Trust Info */}
          <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2 text-[13px] text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#10A352] shrink-0" />
              <span>
                {product.freeShipping
                  ? 'Free Shipping across Bangladesh · 24–72h Express Delivery'
                  : 'Standard Delivery: Inside Dhaka ৳60 · Outside Dhaka ৳120'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#EB001B] shrink-0" />
              <span>Cash on Delivery, bKash, Nagad, Rocket & Card accepted</span>
            </div>
          </div>

          {/* Description */}
          <div className="pt-2">
            <h3 className="text-[14px] font-bold text-slate-900 mb-1">
              Product Details
            </h3>
            <p className="text-[13.5px] text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                onAddToCart(product, selectedColor.name, selectedSize, selectedColor.image)
              }
              className="flex-1 h-12 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-[15px] flex items-center justify-center gap-2 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() =>
                onBuyNow(product, selectedColor.name, selectedSize, selectedColor.image)
              }
              className="flex-1 h-12 rounded-full bg-[#EB001B] hover:bg-[#D10018] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Zap className="w-5 h-5 fill-white" />
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar Matching Screen 3 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-2.5 flex items-center gap-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() =>
            onAddToCart(product, selectedColor.name, selectedSize, selectedColor.image)
          }
          className="flex-1 h-11 rounded-full border border-slate-300 bg-white active:scale-[0.98] text-slate-900 font-bold text-[14px] flex items-center justify-center gap-1.5 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
        <button
          type="button"
          onClick={() =>
            onBuyNow(product, selectedColor.name, selectedSize, selectedColor.image)
          }
          className="flex-1 h-11 rounded-full bg-[#EB001B] active:scale-[0.98] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Zap className="w-4 h-4 fill-white" />
          Buy Now
        </button>
      </div>
    </div>
  );
};
