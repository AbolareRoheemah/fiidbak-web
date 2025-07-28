"use client"
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Star, User, MessageCircle, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

// Type definitions for better type safety
type FeedbackStatus = 'pending' | 'approved' | 'rejected';

interface FeedbackCategories {
  usability: number;
  design: number;
  value: number;
  innovation: number;
  [key: string]: number;
}

interface Feedback {
  id: number;
  productId: number;
  productName: string;
  reviewer: string;
  comment: string;
  rating: number;
  createdAt: number;
  status: FeedbackStatus;
  categories: FeedbackCategories;
  rejectReason?: string;
}

const FeedbackManagement: React.FC = () => {
  const [pendingFeedbacks, setPendingFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending'); // pending, approved, rejected, all

  // Mock data
  const mockFeedbacks: Feedback[] = [
    {
      id: 1,
      productId: 1,
      productName: "CryptoTracker Pro",
      reviewer: "0x8765432109876543",
      comment: "Excellent product! The interface is intuitive and the real-time tracking is spot on. Love the portfolio analytics feature. This has helped me track my investments much better.",
      rating: 5,
      createdAt: Date.now() - 3600000,
      status: 'pending',
      categories: {
        usability: 5,
        design: 4,
        value: 5,
        innovation: 4
      }
    },
    {
      id: 2,
      productId: 1,
      productName: "CryptoTracker Pro",
      reviewer: "0x9876543210987654",
      comment: "Good overall but could use more customization options for the dashboard. The alerts work perfectly though.",
      rating: 4,
      createdAt: Date.now() - 7200000,
      status: 'pending',
      categories: {
        usability: 4,
        design: 3,
        value: 4,
        innovation: 3
      }
    },
    {
      id: 3,
      productId: 2,
      productName: "NFT Analytics Dashboard",
      reviewer: "0x1357924680135792",
      comment: "Great tool for tracking DeFi investments. The multi-exchange support is a game changer!",
      rating: 5,
      createdAt: Date.now() - 10800000,
      status: 'approved',
      categories: {
        usability: 5,
        design: 5,
        value: 4,
        innovation: 5
      }
    }
  ];

  useEffect(() => {
    setPendingFeedbacks(mockFeedbacks);
  }, []);

  const handleApproveFeedback = async (feedbackId: number) => {
    try {
      // Call smart contract approveFeedback function
      console.log('Approving feedback:', feedbackId);

      // Update local state
      setPendingFeedbacks(prev =>
        prev.map(feedback =>
          feedback.id === feedbackId
            ? { ...feedback, status: 'approved' }
            : feedback
        )
      );
    } catch (error) {
      console.error('Failed to approve feedback:', error);
    }
  };

  const handleRejectFeedback = async (feedbackId: number, reason: string) => {
    try {
      // Call smart contract rejectFeedback function
      console.log('Rejecting feedback:', feedbackId, reason);

      // Update local state
      setPendingFeedbacks(prev =>
        prev.map(feedback =>
          feedback.id === feedbackId
            ? { ...feedback, status: 'rejected', rejectReason: reason }
            : feedback
        )
      );

      setShowRejectModal(false);
      setRejectReason('');
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Failed to reject feedback:', error);
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

  const getStatusColor = (status: FeedbackStatus | string): string => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: FeedbackStatus | string): React.ReactNode => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredFeedbacks = pendingFeedbacks.filter(feedback => {
    if (filter === 'all') return true;
    return feedback.status === filter;
  });

  const FeedbackCard: React.FC<{ feedback: Feedback }> = ({ feedback }) => (
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

      {/* Category Ratings */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(feedback.categories).map(([category, rating]) => (
          <div key={category} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 capitalize">{category}</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comment */}
      <p className="text-gray-700 mb-4 line-clamp-3">{feedback.comment}</p>

      {/* Actions */}
      {feedback.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => handleApproveFeedback(feedback.id)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <ThumbsUp className="w-4 h-4" />
            Approve & Reward
          </button>
          <button
            onClick={() => {
              setSelectedFeedback(feedback);
              setShowRejectModal(true);
            }}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <ThumbsDown className="w-4 h-4" />
            Reject
          </button>
        </div>
      )}

      {feedback.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Approved - Reviewer earned 0.0001 ETH</span>
        </div>
      )}

      {feedback.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">Rejected</span>
          </div>
          {feedback.rejectReason && (
            <p className="text-sm text-red-600">Reason: {feedback.rejectReason}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feedback Management</h1>
          <p className="text-gray-600">Review and approve feedback for your products</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingFeedbacks.filter(f => f.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingFeedbacks.filter(f => f.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingFeedbacks.filter(f => f.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingFeedbacks.length}</p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-6 py-4 text-sm font-medium transition-colors capitalize ${
                    filter === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  type="button"
                >
                  {tab} ({pendingFeedbacks.filter(f => tab === 'all' || f.status === tab).length})
                </button>
              ))}
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
                {filter === 'pending'
                  ? "No pending feedback to review at the moment."
                  : `No ${filter} feedback found.`
                }
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
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedFeedback && handleRejectFeedback(selectedFeedback.id, rejectReason)}
                  disabled={!rejectReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  Reject Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;