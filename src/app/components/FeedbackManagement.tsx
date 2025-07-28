import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Star, User, MessageCircle, AlertTriangle, ThumbsUp, ThumbsDown, Loader } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { toast } from 'sonner';
import { abi } from '../utils/abi';

const contractAddress = process.env.NEXT_PUBLIC_CAMP_CONTRACT_ADDRESS as `0x${string}`;

// Update your existing interfaces to match contract data
interface Feedback {
  id: bigint;
  productId: bigint;
  reviewer: string;
  comment: string;
  rating: number;
  createdAt: bigint;
  isVerified: boolean;
}

interface Product {
  id: bigint;
  name: string;
  // Add other fields if needed
}

interface ProcessedFeedback {
  id: number;
  productId: number;
  productName: string;
  reviewer: string;
  comment: string;
  rating: number;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

const FeedbackManagement: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [pendingFeedbacks, setPendingFeedbacks] = useState<ProcessedFeedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<ProcessedFeedback | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingFeedback, setProcessingFeedback] = useState<number | null>(null);

  // Fetch pending feedbacks from contract
  const {
    data: contractPendingFeedbacks,
    isLoading: isPendingLoading,
    refetch: refetchPendingFeedbacks
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getPendingFeedbacks',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Fetch user's products to get product names
  const {
    data: userProducts,
  } = useReadContract({
    address: contractAddress,
    abi: abi,
    functionName: 'getUserProducts',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  // Approve feedback hooks
  const {
    data: approveHash,
    writeContract: approveFeedback,
    isPending: isApprovePending,
    error: approveError
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Reject feedback hooks
  const {
    data: rejectHash,
    writeContract: rejectFeedback,
    isPending: isRejectPending,
    error: rejectError
  } = useWriteContract();

  const {
    isLoading: isRejectConfirming,
    isSuccess: isRejectConfirmed
  } = useWaitForTransactionReceipt({
    hash: rejectHash,
  });

  // Process contract data
  useEffect(() => {
    if (contractPendingFeedbacks && userProducts) {
      // Specify the type for productMap and userProducts
      const productMap = new Map<number, string>();
      (userProducts as Product[]).forEach((product: Product) => {
        productMap.set(Number(product.id), product.name);
      });

      const processed = (contractPendingFeedbacks as Feedback[]).map((feedback: Feedback) => ({
        id: Number(feedback.id),
        productId: Number(feedback.productId),
        productName: productMap.get(Number(feedback.productId)) || `Product #${feedback.productId}`,
        reviewer: feedback.reviewer,
        comment: feedback.comment,
        rating: feedback.rating,
        createdAt: Number(feedback.createdAt) * 1000, // Convert to milliseconds
        status: 'pending' as const,
      }));

      setPendingFeedbacks(processed);
    }
  }, [contractPendingFeedbacks, userProducts]);

  // Handle approve success
  useEffect(() => {
    if (isApproveConfirmed) {
      toast.success("Feedback approved successfully!");
      refetchPendingFeedbacks();
      setProcessingFeedback(null);
    }
  }, [isApproveConfirmed, refetchPendingFeedbacks]);

  // Handle reject success
  useEffect(() => {
    if (isRejectConfirmed) {
      toast.success("Feedback rejected successfully!");
      refetchPendingFeedbacks();
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedFeedback(null);
      setProcessingFeedback(null);
    }
  }, [isRejectConfirmed, refetchPendingFeedbacks]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      toast.error("Failed to approve feedback. Please try again.");
      setProcessingFeedback(null);
    }
    if (rejectError) {
      toast.error("Failed to reject feedback. Please try again.");
      setProcessingFeedback(null);
    }
  }, [approveError, rejectError]);

  const handleApproveFeedback = async (feedbackId: number) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setProcessingFeedback(feedbackId);
      approveFeedback({
        address: contractAddress,
        abi: abi,
        functionName: 'approveFeedback',
        args: [BigInt(feedbackId)],
      });
    } catch (error) {
      console.error('Failed to approve feedback:', error);
      setProcessingFeedback(null);
    }
  };

  const handleRejectFeedback = async (feedbackId: number, reason: string) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setProcessingFeedback(feedbackId);
      rejectFeedback({
        address: contractAddress,
        abi: abi,
        functionName: 'rejectFeedback',
        args: [BigInt(feedbackId), reason.trim()],
      });
    } catch (error) {
      console.error('Failed to reject feedback:', error);
      setProcessingFeedback(null);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Since we only have pending feedbacks from contract, filter accordingly
  const filteredFeedbacks = filter === 'pending' || filter === 'all' ? pendingFeedbacks : [];

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h4>
        <p className="text-gray-600">Please connect your wallet to manage feedback.</p>
      </div>
    );
  }

  if (isPendingLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">Loading Feedback</h4>
        <p className="text-gray-600">Fetching pending feedback from the blockchain...</p>
      </div>
    );
  }

  const FeedbackCard: React.FC<{ feedback: ProcessedFeedback }> = ({ feedback }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{feedback.productName}</h4>
            <p className="text-sm text-gray-600">
              By {feedback.reviewer.slice(0, 6)}...{feedback.reviewer.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(feedback.status)}`}>
            {getStatusIcon(feedback.status)}
            <span className="ml-1 capitalize">{feedback.status}</span>
          </span>
          <span className="text-sm text-gray-500">{formatTimeAgo(feedback.createdAt)}</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-700">({feedback.rating}/5)</span>
      </div>

      {/* Comment */}
      <p className="text-gray-700 mb-4 line-clamp-3">{feedback.comment}</p>

      {/* Actions */}
      {feedback.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => handleApproveFeedback(feedback.id)}
            disabled={processingFeedback === feedback.id}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {processingFeedback === feedback.id && isApprovePending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
            Approve & Reward
          </button>
          <button
            onClick={() => {
              setSelectedFeedback(feedback);
              setShowRejectModal(true);
            }}
            disabled={processingFeedback === feedback.id}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {processingFeedback === feedback.id && isRejectPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsDown className="w-4 h-4" />
            )}
            Reject
          </button>
        </div>
      )}

      {/* Transaction Status */}
      {processingFeedback === feedback.id && (approveHash || rejectHash) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-blue-800 font-medium text-sm">Transaction Submitted</p>
          <p className="text-blue-700 text-sm mt-1">
            Hash: {(approveHash || rejectHash)?.slice(0, 10)}...{(approveHash || rejectHash)?.slice(-8)}
          </p>
          {(isApproveConfirming || isRejectConfirming) && (
            <p className="text-blue-600 text-sm mt-1">Waiting for confirmation...</p>
          // </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Reward Pool Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium text-sm">Reward Information</p>
          <p className="text-amber-700 text-sm">
            Approved feedback will reward reviewers 0.0001 ETH from the reward pool.
          </p>
        </div>
      </div>

      {/* Filter Tabs - Updated to show real counts */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type="button"
            >
              Pending ({pendingFeedbacks.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-4 text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              type="button"
            >
              All ({pendingFeedbacks.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Feedback List */}
      <div className="space-y-6">
        {filteredFeedbacks.length > 0 ? (
          filteredFeedbacks.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">
              No pending feedback to review at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Reject Feedback</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this feedback. This helps maintain quality standards.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Feedback is not constructive, appears to be spam, or doesn't relate to the product..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedFeedback(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                type="button"
                disabled={isRejectPending || isRejectConfirming}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedFeedback && handleRejectFeedback(selectedFeedback.id, rejectReason)}
                disabled={!rejectReason.trim() || isRejectPending || isRejectConfirming}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="button"
              >
                {isRejectPending || isRejectConfirming ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    {isRejectPending ? 'Submitting...' : 'Confirming...'}
                  </>
                ) : (
                  'Reject Feedback'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;