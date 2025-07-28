"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Star,
  MessageCircle,
  TrendingUp,
  Plus,
  Award,
  BarChart3,
} from "lucide-react";
import {
  // useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
// import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import ProductCard from "../components/ProductCard";
import StatCard from "../components/StatCard";
import FeedbackManagement from "../components/FeedbackManagement";
import { abi } from "../utils/abi";
import { toast } from "sonner";
import { CampModal, useAuth } from "@campnetwork/origin/react";

const contractAddress = process.env
  .NEXT_PUBLIC_CAMP_CONTRACT_ADDRESS as `0x${string}`;

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
}

interface Feedback {
  id: bigint;
  productId: bigint;
  reviewer: string;
  comment: string;
  rating: number;
  createdAt: bigint;
  isVerified: boolean;
}

interface UserStats {
  totalFeedback: number;
  averageRating: number;
  pendingRewards: number;
}

export default function UserProfile() {
  // const { address, isConnected } = useAccount();
  const {isAuthenticated, walletAddress} = useAuth()
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "products" | "reviews" | "feedback-management" | "rewards"
  >("products");
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalFeedback: 0,
    averageRating: 0,
    pendingRewards: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's products
  const {
    data: contractProducts,
    isLoading: isProductsLoading,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getUserProducts",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  // Fetch user's pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getPendingRewards",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  // Fetch pending feedbacks for management
  const { data: pendingFeedbacks } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getPendingFeedbacks",
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  const {
    data: claimHash,
    writeContract: claimRewards,
    isPending: isClaimPending,
    error: claimError,
  } = useWriteContract();

  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } =
    useWaitForTransactionReceipt({
      hash: claimHash,
    });

  const handleClaimRewards = () => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (userStats.pendingRewards <= 0) {
      toast.error("No rewards to claim");
      return;
    }

    claimRewards({
      address: contractAddress,
      abi: abi,
      functionName: "claimRewards",
      args: [],
    });
  };

  // Add effect to handle claim success
  useEffect(() => {
    if (isClaimConfirmed) {
      toast.success("Rewards claimed successfully!");
      refetchRewards();
      setUserStats((prev) => ({
        ...prev,
        pendingRewards: 0,
      }));
    }
  }, [isClaimConfirmed, refetchRewards]);

  useEffect(() => {
    if (claimError) {
      toast.error("Failed to claim rewards. Please try again.");
    }
  }, [claimError]);

  // Process contract data
  useEffect(() => {
    if (contractProducts && walletAddress) {
      // Convert BigInt values to numbers for easier handling
      const processedProducts = (contractProducts as Product[]).map(
        (product) => ({
          id: Number(product.id),
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          productUrl: product.productUrl,
          owner: product.owner,
          totalRating: Number(product.totalRating),
          ratingCount: Number(product.ratingCount),
          createdAt: Number(product.createdAt) * 1000, // Convert to milliseconds
          isActive: product.isActive,
          category: "DeFi", // Default category for now
        })
      );

      // Fix: Cast processedProducts to Product[] to satisfy the expected type
      setUserProducts(processedProducts as unknown as Product[]);

      const totalFeedback = processedProducts.reduce(
        (sum, p) => sum + p.ratingCount,
        0
      );
      const averageRating =
        processedProducts.length > 0
          ? processedProducts.reduce((sum, p) => {
              const rating = p.ratingCount > 0 ? p.totalRating / p.ratingCount : 0;
              return sum + rating;
            }, 0) / processedProducts.length
          : 0;

      setUserStats({
        totalFeedback,
        averageRating,
        pendingRewards: pendingRewards ? Number(pendingRewards) : 0,
      });

      setIsLoading(false);
    } else if (!isProductsLoading && walletAddress) {
      setUserProducts([]);
      setUserStats({
        totalFeedback: 0,
        averageRating: 0,
        pendingRewards: pendingRewards ? Number(pendingRewards) : 0,
      });
      setIsLoading(false);
    }
  }, [contractProducts, walletAddress, isProductsLoading, pendingRewards]);

  const formatAddress = (addr: string) => {
    if (!addr || typeof addr !== "string" || addr.length < 10) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  const getAverageRating = (product: {
    totalRating: number;
    ratingCount: number;
  }): string => {
    if (product.ratingCount === 0) return "0.0";
    return (product.totalRating / product.ratingCount).toFixed(1);
  };

  const formatEther = (wei: bigint | number) => {
    const value = typeof wei === "bigint" ? Number(wei) : wei;
    return (value / 1e18).toFixed(4);
  };

  // Get user join date (mock for now, could be enhanced)
  const getUserJoinDate = () => {
    if (userProducts.length > 0) {
      const oldestProduct = userProducts.reduce((oldest, product) =>
        product.createdAt < oldest.createdAt ? product : oldest
      );
      return oldestProduct.createdAt;
    }
    return Date.now() - 86400000 * 30; // Default to 30 days ago
  };

  // Check if user is not connected
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to view your profile.
          </p>
          {/* <ConnectButton /> */}
          <CampModal 
          wcProjectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""}
          onlyWagmi
          />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || isProductsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Profile
            </h3>
            <p className="text-gray-600">
              Fetching your data from the blockchain...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pendingFeedbackCount = pendingFeedbacks
    ? (pendingFeedbacks as Feedback[]).length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
            {/* Profile Picture with fun ring effect */}
            <div className="relative mb-4 sm:mb-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-blue-200">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
              {/* Decorative badge */}
              <span className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-full p-1 shadow-md flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
            </div>
            {/* Info and stats */}
            <div className="flex-1 w-full flex flex-col gap-2 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 break-all flex flex-col sm:flex-row items-center sm:items-baseline gap-2 sm:gap-2 justify-center sm:justify-start">
                {formatAddress(walletAddress || "")}
              </h2>
              <p className="text-gray-600 mb-2 text-sm sm:text-base flex items-center gap-1 justify-center sm:justify-start">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Member since {formatTimeAgo(Number(getUserJoinDate()))}
              </p>
              <div className="flex flex-col xs:flex-row items-center sm:items-start gap-2 xs:gap-6 justify-center sm:justify-start">
                <div className="flex items-center gap-2 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {userStats.averageRating?.toFixed(1) || "0.0"}{" "}
                    <span className="hidden xs:inline">Average Rating</span>
                  </span>
                </div>
                {/* Show pending rewards */}
                {userStats.pendingRewards > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Claim Your Rewards
                    </h4>
                    <p className="text-gray-600 mb-4">
                      You have {formatEther(userStats.pendingRewards)} ETH
                      waiting to be claimed from approved feedback.
                    </p>
                    <button
                      onClick={handleClaimRewards}
                      disabled={isClaimPending || isClaimConfirming}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isClaimPending || isClaimConfirming ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {isClaimPending ? "Submitting..." : "Confirming..."}
                        </>
                      ) : (
                        "Claim Rewards"
                      )}
                    </button>
                    {claimHash && (
                      <p className="text-sm text-gray-500 mt-2">
                        Transaction: {claimHash.slice(0, 10)}...
                        {claimHash.slice(-8)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Add Product Button */}
            <div className="w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0 flex justify-center sm:justify-end">
              <button
                onClick={() => router.push("/upload")}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden xs:inline">Add Product</span>
                <span className="inline xs:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BarChart3}
            title="Total Products"
            value={userProducts.length}
            subtitle="Active listings"
            color="blue"
          />
          <StatCard
            icon={MessageCircle}
            title="Total Reviews"
            value={userStats.totalFeedback || 0}
            subtitle="Community feedback"
            color="green"
          />
          <StatCard
            icon={Star}
            title="Pending Rewards"
            value={Number(formatEther(userStats.pendingRewards || 0))}
            subtitle="Ready to claim"
            color="yellow"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "products"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Products ({userProducts.length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "reviews"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Reviews Received
              </button>
              <button
                onClick={() => setActiveTab("feedback-management")}
                className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "feedback-management"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Manage Feedback ({pendingFeedbackCount})
              </button>
              <button
                onClick={() => setActiveTab("rewards")}
                className={`px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "rewards"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Rewards
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Your Products
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Manage and track your product listings
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>All Products</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Sort by Date</option>
                      <option>Sort by Rating</option>
                    </select>
                  </div>
                </div>

                {userProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userProducts.map((product) => (
                      <div key={String(product.id)} className="relative">
                        <ProductCard
                          product={{
                            ...product,
                            id: String(product.id),
                            owner: formatAddress(product.owner),
                            createdAt: String(product.createdAt),
                            ratingCount: Number(product.ratingCount),
                          }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          getAverageRating={getAverageRating as (product: any) => string | number}
                          formatTimeAgo={formatTimeAgo as (date: string | number | Date) => string}
                        />
                        {/* Owner actions overlay */}
                        <div className="absolute top-4 right-4 flex gap-2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No products yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start by uploading your first product to get feedback from
                      the community
                    </p>
                    <button
                      onClick={() => router.push("/upload")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      Upload Your First Product
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Reviews Received
                </h3>
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No Reviews Yet
                  </h4>
                  <p className="text-gray-600">
                    Reviews will appear here as users interact with your
                    products.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Management Tab */}
            {activeTab === "feedback-management" && <FeedbackManagement />}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  My Rewards
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 rounded-2xl p-6 text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {formatEther(userStats.pendingRewards || 0)} ETH
                    </p>
                    <p className="text-sm text-gray-600">Pending Rewards</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-6 text-center">
                    <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      {userStats.totalFeedback || 0}
                    </p>
                    <p className="text-sm text-gray-600">Reviews Given</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">
                      0.0000 ETH
                    </p>
                    <p className="text-sm text-gray-600">Total Earned</p>
                  </div>
                </div>

                {userStats.pendingRewards > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Claim Your Rewards
                    </h4>
                    <p className="text-gray-600 mb-4">
                      You have {formatEther(userStats.pendingRewards)} ETH
                      waiting to be claimed from approved feedback.
                    </p>
                    <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
                      Claim Rewards
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      No Rewards Yet
                    </h4>
                    <p className="text-gray-600">
                      Submit quality feedback to earn rewards!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}