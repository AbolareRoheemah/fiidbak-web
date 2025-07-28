import React from 'react'
import { Star, MessageCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Product {
  id: number | string;
  name: string;
  imageUrl: string;
  productUrl: string;
  description: string;
  owner?: string;
  createdAt: number | string | Date;
  ratingCount: number;
  // Add other fields if needed
}

interface ProductCardProps {
  product: Product;
  getAverageRating: (product: Product) => number | string;
  formatTimeAgo: (date: number | string | Date) => string;
}

export default function ProductCard({ product, getAverageRating, formatTimeAgo }: ProductCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => router.push(`/project_detail/${product.id}`)}>
      <div className="relative">
        <img 
          src={product.imageUrl || "/placeholder-image.jpg"} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{getAverageRating(product)}</span>
        </div>
      </div>
      <div className="bg-blue-50 border-b border-blue-200 p-3">
        <div className="flex items-center gap-2 text-blue-800">
          <Star className="w-4 h-4" />
          <span className="text-sm font-medium">Click to review & earn 0.0001 ETH!</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <a 
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>
            By {product.owner && typeof product.owner === 'string' && product.owner.length >= 10
              ? `${product.owner.slice(0, 6)}...${product.owner.slice(-4)}`
              : 'Unknown'}
          </span>
          <span>{formatTimeAgo(product.createdAt)}</span>
        </div>
        
        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{product.ratingCount} reviews</span>
          </div>
          {/* <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{Math.floor(Math.random() * 100) + 50} views</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Heart className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{Math.floor(Math.random() * 20) + 5}</span>
          </div> */}
        </div>
      </div>
    </div>
  )
}
