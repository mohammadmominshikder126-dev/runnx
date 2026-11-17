import React, { useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface SearchViewProps {
  products: Product[];
  query: string;
  onQueryChange: (q: string) => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

const POPULAR_TAGS = [
  "Men's Running Shoes",
  'Free Shipping',
  'Sneakers',
  'Flyknit',
  'Outdoor',
  'Under ৳1,200',
];

export const SearchView: React.FC<SearchViewProps> = ({
  products,
  query,
  onQueryChange,
  onBack,
  onSelectProduct,
}) => {
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);

  const filtered = products.filter((p) => {
    if (freeShippingOnly && !p.freeShipping) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (q === 'under ৳1,200' || q === 'under 1200') return p.price <= 1200;
    if (q === 'free shipping') return p.freeShipping;
    return (
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-[#EB001B] text-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full hover:bg-white/15 transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
          </button>

          <div className="flex-1 flex items-center bg-white rounded-full px-3.5 h-10 shadow-xs">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search shoes, category, color..."
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-[14px] outline-none min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                aria-label="Clear search"
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 pb-24">
        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3">
          <button
            type="button"
            onClick={() => setFreeShippingOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap shrink-0 ${
              freeShippingOnly
                ? 'bg-[#10A352] text-white border-[#10A352]'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            }`}
          >
            Free Shipping Only
          </button>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onQueryChange(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap shrink-0 ${
                query.toLowerCase() === tag.toLowerCase()
                  ? 'bg-[#EB001B] text-white border-[#EB001B]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 font-medium mb-2.5">
          {filtered.length} {filtered.length === 1 ? 'shoe' : 'shoes'} found
        </p>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-xs">
            <p className="text-sm font-semibold text-slate-700">
              No matching shoes found.
            </p>
            <button
              type="button"
              onClick={() => {
                onQueryChange('');
                setFreeShippingOnly(false);
              }}
              className="mt-3 px-4 py-2 rounded-full bg-[#EB001B] text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
