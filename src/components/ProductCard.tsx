import React from 'react';
import { Product } from '../types';
import { formatBDT } from '../utils/sound';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="group text-left bg-white rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-all duration-150 flex flex-col w-full focus-visible:outline-2 focus-visible:outline-[#EB001B]"
    >
      {/* Image Stage */}
      <div className="relative aspect-[1/1.02] w-full bg-[#F3F4F6] overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-200"
        />

        {/* Exact screenshot split-callout styling for the top-left Summer 54 featured shoe */}
        {product.isSplitFeatureCard && (
          <div className="absolute inset-x-0 top-0 pointer-events-none p-2 flex flex-col gap-1">
            <div className="bg-white/90 backdrop-blur-[2px] rounded px-1.5 py-0.5 self-start max-w-[85%] shadow-xs">
              <p className="text-[9px] leading-tight font-bold text-[#EB001B]">
                Summer Hollow-Out Shoes,
                <br />
                Spring/Autumn Flyknit
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-[2px] rounded px-1.5 py-0.5 self-start max-w-[75%] shadow-xs">
              <p className="text-[9px] leading-tight font-bold text-slate-900">
                Winter
                <br />
                Fleece-Lined
                <br />
                Cotton Shoes
              </p>
            </div>
          </div>
        )}

        {/* Green Free Shipping Badge (bottom-left of image, matching screenshot) */}
        {product.freeShipping && (
          <span className="absolute bottom-2 left-2 bg-[#10A352] text-white text-[10px] font-bold px-2 py-0.5 rounded-[4px] leading-tight shadow-xs">
            Free Shipping
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 flex flex-col gap-1 flex-1 justify-between">
        <h3 className="text-[12.5px] sm:text-[13px] font-medium text-slate-900 leading-snug line-clamp-1">
          {product.shortTitle || product.title}
        </h3>

        <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
          <span className="text-[#EB001B] font-extrabold text-[15px] sm:text-[16px] tabular-nums leading-none">
            {formatBDT(product.price)}
          </span>
          {product.discountPercent > 0 && (
            <span className="text-[#EB001B] text-[10.5px] font-semibold bg-[#EB001B]/8 px-1 py-0.5 rounded leading-none tabular-nums">
              -{product.discountPercent}%
            </span>
          )}
          <span className="text-[11px] text-slate-500 ml-auto tabular-nums">
            {product.soldLabel}
          </span>
        </div>
      </div>
    </button>
  );
};
