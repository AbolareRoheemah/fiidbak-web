"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  Grid,
  List,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { abi } from "../utils/abi";
import ProductCard from "../components/ProductCard";
import ProductListItem from "../components/ProductListItem";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;

// Product type based on your contract
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
  // The following are added in processing:
  category?: string;
  tags?: string[];
  views?: number;
}

type ProductProcessed = Omit<Product, "id" | "createdAt" | "totalRating" | "ratingCount"> & {
  id: number;
  createdAt: number;
  totalRating: number;
  ratingCount: number;
  category: string;
  tags: string[];
  views: number;
  imageUrl: string;
};

const AllProducts = () => {
  const [filteredProducts, setFilteredProducts] = useState<ProductProcessed[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from contract
  const {
    data: contractProducts,
    isError,
    isLoading: isContractLoading,
    refetch,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getAllProducts",
  });

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rating", label: "Highest Rated" },
    { value: "reviews", label: "Most Reviewed" },
    { value: "name", label: "Name A-Z" },
  ];

  // Process contract data
  useEffect(() => {
    if (contractProducts && Array.isArray(contractProducts)) {
      // Convert BigInt values to numbers for easier handling
      const processedProducts: ProductProcessed[] = (contractProducts as Product[]).map((product) => ({
        ...product,
        id: Number(product.id),
        createdAt: Number(product.createdAt) * 1000, // Convert to milliseconds
        totalRating: Number(product.totalRating),
        ratingCount: Number(product.ratingCount),
        category: "DeFi",
        tags: ["blockchain"],
        views: Math.floor(Math.random() * 2000) + 100, // Mock views for now
        imageUrl: product.imageUrl,
      }));

      setFilteredProducts(processedProducts);
      setIsLoading(false);
    } else if (!isContractLoading) {
      setFilteredProducts([]);
      setIsLoading(false);
    }
  }, [contractProducts, isContractLoading]);

  // Filter and sort effect
  useEffect(() => {
    if (contractProducts && Array.isArray(contractProducts)) {
      filterAndSortProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, sortBy, ratingFilter, contractProducts]);

  const filterAndSortProducts = () => {
    if (!contractProducts || !Array.isArray(contractProducts)) return;

    let filtered: ProductProcessed[] = (contractProducts as Product[]).map((product) => ({
      ...product,
      id: Number(product.id),
      createdAt: Number(product.createdAt) * 1000,
      totalRating: Number(product.totalRating),
      ratingCount: Number(product.ratingCount),
      category: "DeFi", // Default for now
      tags: ["blockchain"],
      views: Math.floor(Math.random() * 2000) + 100,
      imageUrl: product.imageUrl
    }));

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter (skip for now since we don't have categories in contract)
    // You can enhance this later

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter((product) => {
        const avgRating =
          product.ratingCount > 0
            ? product.totalRating / product.ratingCount
            : 0;
        return avgRating >= minRating;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt - a.createdAt;
        case "oldest":
          return a.createdAt - b.createdAt;
        case "rating": {
          const avgA =
            a.ratingCount > 0 ? a.totalRating / a.ratingCount : 0;
          const avgB =
            b.ratingCount > 0 ? b.totalRating / b.ratingCount : 0;
          return avgB - avgA;
        }
        case "reviews":
          return b.ratingCount - a.ratingCount;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.createdAt - a.createdAt;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const getAverageRating = (product: { ratingCount: number; totalRating: number }) => {
    if (product.ratingCount === 0) return "0.0";
    return (product.totalRating / product.ratingCount).toFixed(1);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Loading state
  if (isContractLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Products
            </h3>
            <p className="text-gray-600">
              Fetching products from the blockchain...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Products
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to fetch products from the contract.
            </p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">All Products</h1>
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Refresh Button */}
              {/* <button
                onClick={() => refetch()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh products"
                type="button"
              >
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </button> */}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                  type="button"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600"
                  }`}
                  type="button"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="all">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {filteredProducts.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {currentProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      ...product,
                      owner: formatAddress(product.owner),
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    getAverageRating={getAverageRating as (product: any) => string | number}
                    formatTimeAgo={formatTimeAgo as (date: string | number | Date) => string}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {currentProducts.map((product) => (
                  <ProductListItem
                    key={product.id}
                    product={{
                      ...product,
                      owner: formatAddress(product.owner),
                    }}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 2
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-xl transition-colors ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                        type="button"
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return (
                      <span key={page} className="px-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  type="button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              {searchQuery || ratingFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No products have been uploaded yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProducts;