"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  ExternalLink,
  MessageCircle,
  Share2,
  User,
  Award,
  X,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  // useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { abi } from "../../utils/abi";
import { useAuth } from "@campnetwork/origin/react";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

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

// Modal component
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full relative mx-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  // const { address, isConnected } = useAccount();
  const {isAuthenticated, walletAddress} = useAuth()

  const productIdRaw = (params && params["project_id"]) || 1;
  const productId =
    typeof productIdRaw === "string"
      ? Number(productIdRaw)
      : Array.isArray(productIdRaw)
      ? Number(productIdRaw[0])
      : Number(productIdRaw);

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    comment: "",
  });
  const [filterRating, setFilterRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);
  const errorToastId = useRef<string | number | null>(null);

  // Fetch product data
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getProduct",
    args: [BigInt(productId)],
  });

  // Fetch product feedbacks
  const {
    data: contractFeedbacks,
    isLoading: isFeedbacksLoading,
    refetch: refetchFeedbacks,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "getProductFeedbacks",
    args: [BigInt(productId)],
  });

  const handleShare = async () => {
    if (
      navigator.share &&
      product &&
      typeof product === "object" &&
      "name" in product &&
      "description" in product
    ) {
      await navigator.share({
        title: String((product as { name: unknown }).name),
        text: String((product as { description: unknown }).description),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  // Check if user has already reviewed
  const {
    data: hasReviewed,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: "hasReviewed",
    args: walletAddress ? [walletAddress, BigInt(productId)] : undefined,
    query: {
      enabled: !!walletAddress,
    },
  });

  // Submit feedback transaction
  const {
    data: hash,
    writeContract,
    isPending: isSubmitPending,
    error: submitError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle successful feedback submission
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      setNewFeedback({ rating: 0, comment: "" });
      setShowFeedbackForm(false);
      refetchFeedbacks();
      refetchProduct();
      setSubmitErrorMsg(null);
      if (errorToastId.current) {
        toast.dismiss(errorToastId.current);
        errorToastId.current = null;
      }
      toast.success("Feedback submitted successfully!");
    }
  }, [isConfirmed, refetchFeedbacks, refetchProduct]);

  // Handle submission errors (from wagmi error)
  useEffect(() => {
    if (submitError) {
      let message = "Failed to submit feedback. Please try again.";
      // Try to extract a more specific error message
      if (typeof submitError === "object" && submitError !== null) {
        // wagmi v1 error shape
        if ("shortMessage" in submitError && typeof submitError.shortMessage === "string") {
          message = submitError.shortMessage;
        } else if ("message" in submitError && typeof submitError.message === "string") {
          message = submitError.message;
        }
      }
      setSubmitErrorMsg(message);
      // Show toast and keep reference to dismiss if needed
      if (!errorToastId.current) {
        errorToastId.current = toast.error(message);
      }
    } else {
      setSubmitErrorMsg(null);
      if (errorToastId.current) {
        toast.dismiss(errorToastId.current);
        errorToastId.current = null;
      }
    }
  }, [submitError]);

  // Handle errors from writeContract promise (user rejection, contract revert, etc)
  const handleFeedbackSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (hasReviewed) {
      toast.error("You have already reviewed this product");
      return;
    }

    if (newFeedback.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (newFeedback.comment.trim().length < 10) {
      toast.error("Please provide a comment with at least 10 characters");
      return;
    }

    // Submit feedback to contract
    try {
      await writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "submitFeedback",
        args: [BigInt(productId), newFeedback.comment.trim(), newFeedback.rating],
      });
      // If successful, error toast will be cleared by useEffect above
    } catch (err) {
      let message = "Failed to submit feedback. Please try again.";
      if (err && typeof err === "object") {
        if ("shortMessage" in err && typeof (err as { shortMessage?: string }).shortMessage === "string") {
          message = (err as { shortMessage: string }).shortMessage;
        } else if ("message" in err && typeof (err as { message?: string }).message === "string") {
          message = (err as { message: string }).message;
        }
      }
      setSubmitErrorMsg(message);
      if (!errorToastId.current) {
        errorToastId.current = toast.error(message);
      }
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
  };

  const formatTimeAgo = (timestamp: bigint | number): string => {
    const now = Date.now();
    const createdTime =
      typeof timestamp === "bigint"
        ? Number(timestamp) * 1000
        : Number(timestamp) * 1000;
    const diff = now - createdTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatAddress = (addr: string): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getAverageRating = (): string => {
    if (
      !product ||
      typeof (product as Partial<Product>).ratingCount === "undefined" ||
      Number((product as Partial<Product>).ratingCount) === 0 ||
      typeof (product as Partial<Product>).totalRating === "undefined"
    ) {
      return "0.0";
    }
    return (
      Number((product as Partial<Product>).totalRating) /
      Number((product as Partial<Product>).ratingCount)
    ).toFixed(1);
  };

  const getRatingDistribution = (): { [key: number]: number } => {
    const distribution: { [key: number]: number } = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    if (contractFeedbacks) {
      (contractFeedbacks as Feedback[]).forEach((feedback) => {
        if (
          typeof feedback.rating === "number" &&
          feedback.rating >= 1 &&
          feedback.rating <= 5
        ) {
          distribution[feedback.rating]++;
        }
      });
    }
    return distribution;
  };

  // Process and filter feedbacks
  type ProcessedFeedback = Omit<Feedback, "id" | "productId" | "createdAt"> & {
    id: number;
    productId: number;
    createdAt: number;
    helpful: number;
  };

  const processedFeedbacks: ProcessedFeedback[] =
    contractFeedbacks && Array.isArray(contractFeedbacks)
      ? (contractFeedbacks as Feedback[]).map((feedback) => ({
          ...feedback,
          id: Number(feedback.id),
          productId: Number(feedback.productId),
          createdAt: Number(feedback.createdAt),
          helpful: Math.floor(Math.random() * 20), // Mock helpful count
        }))
      : [];

  const filteredFeedbacks = processedFeedbacks.filter((feedback) => {
    if (filterRating === "all") return true;
    return feedback.rating === parseInt(filterRating);
  });

  // Don't mutate original array with .sort()!
  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    if (sortBy === "newest") return b.createdAt - a.createdAt;
    if (sortBy === "oldest") return a.createdAt - b.createdAt;
    if (sortBy === "helpful") return b.helpful - a.helpful;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  // Loading state
  if (isProductLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Product
          </h3>
          <p className="text-gray-600">
            Fetching product details from the blockchain...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (isProductError || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Product Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Success modal
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Feedback Submitted!
          </h3>
          <p className="text-gray-600 mb-4">
            Thank you for your valuable feedback.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Pending Approval</span>
            </div>
            <p className="text-amber-600 text-sm mt-1">
              You&apos;ll earn 0.0001 ETH once the product owner approves your
              feedback
            </p>
          </div>

          {hash && (
            <p className="text-sm text-gray-500 mb-4">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}

          <button
            onClick={handleSuccessClose}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Exploring
          </button>
        </div>
      </div>
    );
  }

  // Defensive: product fields may be undefined if contract returns empty
  const processedProduct = {
    id: Number((product as Partial<Product>)?.id ?? 0),
    name: (product as Partial<Product>)?.name ?? "",
    description: (product as Partial<Product>)?.description ?? "",
    imageUrl: (product as Partial<Product>)?.imageUrl ?? "/placeholder-image.jpg",
    productUrl: (product as Partial<Product>)?.productUrl ?? "#",
    owner: (product as Partial<Product>)?.owner ?? "",
    totalRating: Number((product as Partial<Product>)?.totalRating ?? 0),
    ratingCount: Number((product as Partial<Product>)?.ratingCount ?? 0),
    createdAt: Number((product as Partial<Product>)?.createdAt ?? 0) * 1000,
    isActive: (product as Partial<Product>)?.isActive ?? false,
    category: "DeFi", // Default category for now
    tags: ["blockchain", "crypto"], // Default tags
    features: [
      "Blockchain-powered",
      "Community-reviewed",
      "Decentralized feedback",
      "Reward system",
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        {/* Product Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="lg:flex">
            <div className="lg:w-1/2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedProduct.imageUrl}
                alt={processedProduct.name}
                className="w-full h-96 lg:h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/placeholder-image.jpg";
                }}
              />
            </div>
            <div className="lg:w-1/2 p-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {processedProduct.category}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mt-3">
                    {processedProduct.name}
                  </h1>
                  <p className="text-gray-600 text-sm mt-2">
                    By {formatAddress(processedProduct.owner)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" onClick={() => handleShare()}>
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {processedProduct.description}
              </p>

              {/* Rating Overview */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(Number(getAverageRating()))
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {getAverageRating()}
                  </span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">
                    {processedProduct.ratingCount}
                  </span>{" "}
                  reviews
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {processedProduct.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <a
                  href={processedProduct.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  Visit Product
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please connect your wallet first");
                      return;
                    }
                    if (hasReviewed) {
                      toast.error("You have already reviewed this product");
                      return;
                    }
                    if (
                      walletAddress &&
                      processedProduct.owner &&
                      walletAddress.toLowerCase() ===
                        processedProduct.owner.toLowerCase()
                    ) {
                      toast.error("You cannot review your own product");
                      return;
                    }
                    setShowFeedbackForm(true);
                  }}
                  disabled={
                    !isAuthenticated ||
                    !!hasReviewed ||
                    (
                      walletAddress &&
                      processedProduct.owner &&
                      walletAddress.toLowerCase() ===
                        processedProduct.owner.toLowerCase()
                    ) === true
                  }
                  className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-5 h-5" />
                  {hasReviewed ? "Already Reviewed" : "Leave Feedback"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {processedProduct.features.map(
              (feature: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Community Feedback
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="helpful">Most Helpful</option>
                <option value="rating">Highest Rating</option>
              </select>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rating Distribution
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = getRatingDistribution()[rating];
                const percentage =
                  processedFeedbacks.length > 0
                    ? (count / processedFeedbacks.length) * 100
                    : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Form Modal */}
          <Modal
            open={showFeedbackForm}
            onClose={() => setShowFeedbackForm(false)}
          >
            <form onSubmit={handleFeedbackSubmit}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Leave Your Feedback
              </h3>

              {/* Reward notice */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">Earn 0.0001 ETH</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Submit quality feedback and earn rewards once approved by the
                  product owner
                </p>
              </div>

              {submitErrorMsg && (
                <div className="mb-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{submitErrorMsg}</span>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setNewFeedback({ ...newFeedback, rating: star })
                        }
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newFeedback.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 hover:text-yellow-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {newFeedback.rating > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {newFeedback.rating === 1
                        ? "Poor"
                        : newFeedback.rating === 2
                        ? "Fair"
                        : newFeedback.rating === 3
                        ? "Good"
                        : newFeedback.rating === 4
                        ? "Very Good"
                        : "Excellent"}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={newFeedback.comment}
                    onChange={(e) =>
                      setNewFeedback({
                        ...newFeedback,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Share your experience with this product... (minimum 10 characters)"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    required
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {newFeedback.comment.length}/500 characters
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    disabled={isSubmitPending || isConfirming}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      newFeedback.rating === 0 ||
                      newFeedback.comment.trim().length < 10 ||
                      isSubmitPending ||
                      isConfirming
                    }
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitPending || isConfirming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isSubmitPending ? "Submitting..." : "Confirming..."}
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </Modal>

          {/* Feedback List */}
          <div className="space-y-6">
            {isFeedbacksLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-600">Loading feedback...</p>
              </div>
            ) : sortedFeedbacks.length > 0 ? (
              sortedFeedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border-b border-gray-100 pb-6 last:border-b-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {formatAddress(feedback.reviewer)}
                        </span>
                        {feedback.isVerified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Verified
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          {formatTimeAgo(feedback.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= feedback.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          ({feedback.rating}/5)
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{feedback.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  No Feedback Yet
                </h4>
                <p className="text-gray-600">
                  Be the first to share your experience with this product!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}