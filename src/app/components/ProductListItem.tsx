import React from 'react'
import { Star, Eye, MessageCircle, ExternalLink, Heart } from 'lucide-react';

interface Product {
    name: string;
    imageUrl: string;
    category: string;
    description: string;
    owner: string;
    ratingCount: number;
    totalRating: number;
    views: number;
    createdAt: number;
    productUrl: string;
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getAverageRating = (product: { ratingCount: number; totalRating: number; }) => {
    if (product.ratingCount === 0) return 0;
    return (product.totalRating / product.ratingCount).toFixed(1);
  };

const ProductListItem: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex gap-6">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-24 h-24 rounded-xl object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {product.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{getAverageRating(product)}</span>
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Heart className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>By {product.owner}</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{product.ratingCount} reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{product.views} views</span>
              </div>
              <span>{formatTimeAgo(product.createdAt)}</span>
            </div>
            
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                View Details
              </button>
              <a 
                href={product.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  export default ProductListItem;
