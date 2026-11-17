import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { CATEGORIES, SHOE_IMAGES } from '../data/catalog';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryViewProps {
  products: Product[];
  onBack: () => void;
  onOpenSearch: () => void;
  onSelectProduct: (product: Product) => void;
  initialCategory?: string | null;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  products,
  onBack,
  onOpenSearch,
  onSelectProduct,
  initialCategory = null,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  const categoryProducts = selectedCategory
    ? products.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase())
    : [];

  return (
    <div className="min-h-full flex flex-col">
      {/* Red App Bar */}
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (selectedCategory) {
                  setSelectedCategory(null);
                } else {
                  onBack();
                }
              }}
              aria-label="Go back"
              className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 transition"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
            </button>
            <h1 className="text-[18px] font-bold truncate">
              {selectedCategory ? selectedCategory : 'Category'}
            </h1>
          </div>

          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search shoes"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 transition"
          >
            <Search className="w-5 h-5 stroke-[2.3]" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 pb-24">
        {!selectedCategory ? (
          <>
            {/* Top Pink Gradient Promo Banner Matching Screen 2 */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#FFF0F3] via-[#FFDCE2] to-[#FFC2CE] p-4 sm:p-6 mb-4 flex items-center justify-between shadow-xs min-h-[124px]">
              <div className="relative z-10 flex flex-col items-start gap-1 max-w-[58%]">
                <span className="text-[20px] sm:text-[26px] font-extrabold tracking-tight text-slate-900 leading-none">
                  runxbd.com
                </span>
                <p className="text-[13px] sm:text-[15px] text-slate-700 font-medium">
                  Find what you need
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Men's Running Shoes")}
                  className="mt-2 inline-flex items-center gap-1.5 bg-[#EB001B] hover:bg-[#D10018] text-white text-[12.5px] font-bold px-4 py-1.5 rounded-full shadow-sm active:scale-95 transition"
                >
                  Shop Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-[42%] sm:w-[220px] flex justify-end items-center">
                <img
                  src={SHOE_IMAGES.blackMesh}
                  alt="Runx.bd Featured Running Shoe"
                  referrerPolicy="no-referrer"
                  className="w-32 h-24 sm:w-44 sm:h-32 object-contain mix-blend-multiply drop-shadow-md -rotate-6"
                />
              </div>
            </div>

            {/* 3x3 Category Grid Matching Screen 2 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className="bg-white rounded-xl p-2 sm:p-3 flex flex-col items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md active:scale-[0.98] transition text-center"
                >
                  <div className="w-full aspect-square bg-[#F5F5F7] rounded-lg overflow-hidden flex items-center justify-center mb-2">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11.5px] sm:text-[13px] font-semibold text-slate-900 leading-tight line-clamp-2 min-h-[28px] flex items-center justify-center">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing {categoryProducts.length > 0 ? categoryProducts.length : products.length} styles in{' '}
                <span className="text-slate-900 font-semibold">{selectedCategory}</span>
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-semibold text-[#EB001B] hover:underline"
              >
                All Categories
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
              {(categoryProducts.length > 0 ? categoryProducts : products).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
