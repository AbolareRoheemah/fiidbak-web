"use client";
import React, { useState, useEffect } from 'react';
import { Star, Plus, TrendingUp, Users, MessageCircle, ArrowRight } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import ProductCard from "./components/ProductCard";
import StatCard from "./components/StatCard";
import { useRouter } from "next/navigation";
import { abi } from './utils/abi';

const contractAddress = process.env.NEXT_PUBLIC_CAMP_CONTRACT_ADDRESS as `0x${string}`;

interface Product {
  id: bigint;
  owner: string;
  name: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  createdAt: bigint;
  totalRating: bigint;
  ratingCount: bigint;
  isActive: boolean;
}

interface ProcessedProduct {
  id: number;
  owner: string;
  name: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  createdAt: number;
  totalRating: number;
  ratingCount: number;
  isActive: boolean;
}

export default function Home() {
  const { } = useAccount();
  const [products, setProducts] = useState<ProcessedProduct[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalFeedback: 0,
    averageRating: 0,
    activeUsers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch all products from contract
  const {
    data: contractProducts,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getAllProducts',
  });
  
  // Process contract data
  useEffect(() => {
    if (contractProducts) {
      // Convert BigInt values and process data
      const processedProducts: ProcessedProduct[] = (contractProducts as Product[]).map(product => ({
        id: Number(product.id),
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000000000)}?w=300&h=200&fit=crop`,
        productUrl: product.productUrl,
        owner: `${product.owner.slice(0, 6)}...${product.owner.slice(-4)}`,
        totalRating: Number(product.totalRating),
        ratingCount: Number(product.ratingCount),
        createdAt: Number(product.createdAt) * 1000, // Convert to milliseconds
        isActive: product.isActive,
      }));

      // Sort by creation date (newest first) and take first 6 for featured
      const sortedProducts = processedProducts
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 6);

      setProducts(sortedProducts);

      // Calculate stats
      const totalFeedback = processedProducts.reduce((sum, p) => sum + p.ratingCount, 0);
      const totalRatingSum = processedProducts.reduce((sum, p) => sum + p.totalRating, 0);
      const averageRating = totalFeedback > 0 ? (totalRatingSum / totalFeedback) : 0;
      
      setStats({
        totalProducts: processedProducts.length,
        totalFeedback,
        averageRating: Number(averageRating.toFixed(1)),
        activeUsers: Math.max(processedProducts.length * 3, 50) // Estimated active users
      });

      setIsLoading(false);
    } else if (!isProductsLoading) {
      // No products found or error
      setProducts([]);
      setStats({
        totalProducts: 0,
        totalFeedback: 0,
        averageRating: 0,
        activeUsers: 0
      });
      setIsLoading(false);
    }
  }, [contractProducts, isProductsLoading]);

  const getAverageRating = (product: ProcessedProduct) => {
    if (product.ratingCount === 0) return '0.0';
    return (product.totalRating / product.ratingCount).toFixed(1);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
            <p className="text-gray-600">Fetching latest data from the blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {isProductsError && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Data</h3>
            <p className="text-gray-600 mb-4">There was an error loading products from the blockchain.</p>
            <button
              onClick={() => refetchProducts()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !isProductsError && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={TrendingUp} 
                title="Total Projects" 
                value={stats.totalProducts} 
                subtitle="Active listings" 
                color="blue" 
              />
              <StatCard 
                icon={MessageCircle} 
                title="Total Feedback" 
                value={stats.totalFeedback} 
                subtitle="Reviews received" 
                color="green" 
              />
              <StatCard 
                icon={Star} 
                title="Average Rating" 
                value={stats.averageRating} 
                subtitle="Out of 5.0" 
                color="yellow" 
              />
              <StatCard 
                icon={Users} 
                title="Active Users" 
                value={stats.activeUsers} 
                subtitle="Estimated" 
                color="purple" 
              />
            </div>

            {/* How it works */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How to Earn Rewards</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Browse Products</h3>
                    <p className="text-gray-600 text-sm">Explore products shared by the community</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 font-bold">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Try & Review</h3>
                    <p className="text-gray-600 text-sm">Test products and share honest feedback</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                    <p className="text-gray-600 text-sm">Get 0.0001 ETH for each approved review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Featured Projects</h2>
              <p className="text-gray-600 mb-6">
                {products.length > 0 
                  ? "Discover and review the latest projects from the community"
                  : "Be the first to share your project with the community!"
                }
              </p>
              
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id}
                        product={product}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        getAverageRating={getAverageRating as (product: any) => string | number}
                        formatTimeAgo={formatTimeAgo as (date: string | number | Date) => string}
                      />
                    ))}
                  </div>
                  <div className="text-center mt-14 flex justify-center">
                    <button 
                      onClick={() => router.push("/products")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                      View All {stats.totalProducts} Products
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                  <p className="text-gray-600 mb-6">Be the first to upload a product and start earning from feedback!</p>
                  <button
                    onClick={() => router.push('/upload')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    Upload First Product
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
