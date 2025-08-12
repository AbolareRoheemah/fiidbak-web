"use client"
import React, { useState, useRef } from 'react'
import { Upload, Link, Image, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useWalletClient } from 'wagmi';
import { parseEther } from 'viem';
import type { Address } from 'viem';
import { toast } from 'sonner';
import { abi } from '../utils/abi';
import { getUploadedFile, uploadFileToPinata } from '../utils/pinata';
import { CampModal, useAuth } from '@campnetwork/origin/react';
import { assignImage } from '../utils/assignImage';

const contractAddress = process.env.NEXT_PUBLIC_CAMP_CONTRACT_ADDRESS as `0x${string}`;

export default function UploadProduct() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productUrl: '',
    imageUrl: '',
    category: '',
    tags: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintedImageId, setMintedImageId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'waitingTx' | 'minting' | 'done'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { walletAddress, origin, jwt } = useAuth();
  const { data: walletClient } = useWalletClient()

  // Direct wagmi hooks
  const { isConnected } = useAccount();
  const { 
    data: hash, 
    writeContract, 
    isPending: isWritePending, 
    error: writeError 
  } = useWriteContract();
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  });

  const categories = [
    'DeFi', 'NFT', 'Gaming', 'Social', 'Productivity', 'Analytics', 'Developer Tools', 'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setFilePreview(URL.createObjectURL(droppedFile));
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const uploadImageAndGetUrl = async (): Promise<string> => {
    if (!file) return '';
    const cid = await uploadFileToPinata(file);
    if (!cid) throw new Error('Image upload failed');
    const url = await getUploadedFile(cid);
    if (!url) throw new Error('Image upload failed');
    return url;
  };

  type LicenseTerms = {
    price: bigint;
    duration: number;
    royaltyBps: number;
    paymentToken: Address;
  };

  // Mint NFT logic
  const handleMint = async () => {
    setMintError(null);
    setMintSuccess(false);
    setIsMinting(true);
    setCurrentStep('minting');

    try {
      if (!origin || !jwt) throw new Error("User not authenticated");
      if (!file) throw new Error("No file selected for minting");

      const imageUrl = await uploadImageAndGetUrl();

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a new File object with proper naming
      const mintFile = new File([blob], file.name || 'product-file.png', { 
        type: file.type || 'image/png'
      });

      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) { // 10MB limit
        toast.error("File too large for minting.", {
          description: `File size is ${fileSizeMB.toFixed(2)}MB. Maximum allowed is 10MB.`,
          duration: 5000,
        });
        setIsMinting(false);
        setCurrentStep('done');
        return;
      }

      const licence = {
        price: BigInt(0),
        duration: 2629800, // 30 days in seconds
        royaltyBps: 0,
        paymentToken: "0x0000000000000000000000000000000000000000" as Address,
      } as LicenseTerms;

      // Prepare meta for minting
      const metadata = {
        name: formData.name || "unnamed",
        description: formData.description || "no description provided",
        external_url: formData.productUrl,
        image: imageUrl,
        attributes: [
          {
            trait_type: "Category",
            value: formData.category || "Unknown",
          },
          {
            trait_type: "Platform",
            value: "Fiidbak",
          },
        ],
      };

      // Mint NFT
      await origin.mintFile(mintFile, metadata, licence);
      toast.success(`Minting successful! Your IP NFT is now live.`, {
        duration: 5000,
      });
      setMintSuccess(true);
      setCurrentStep('done');
    } catch (error) {
      console.error("Minting failed:", error);
      
      let errorMessage = "Minting failed. Please try again later.";
      let errorDescription = error instanceof Error ? error.message : "An error occurred";
      
      if (errorDescription.includes("signature") || errorDescription.includes("Failed to get signature")) {
        errorMessage = "Transaction signature failed.";
        errorDescription = "Please check your wallet connection and approve the transaction when prompted.";
      } else if (errorDescription.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
        errorDescription = "Make sure you're connected to the correct network.";
      } else if (errorDescription.includes("gas")) {
        errorMessage = "Insufficient gas fees.";
        errorDescription = "Please ensure you have enough gas for the transaction.";
      } else if (errorDescription.includes("user rejected") || errorDescription.includes("User rejected")) {
        errorMessage = "Transaction was rejected.";
        errorDescription = "You declined the transaction. Please try again and approve when prompted.";
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
      
      setMintError(errorMessage);
      setCurrentStep('done');
    } finally {
      setIsMinting(false);
    }
  };

  // Automatically start minting after upload is confirmed
  React.useEffect(() => {
    if (isConfirmed) {
      setIsUploading(false);
      setUploadSuccess(true);
      setCurrentStep('minting');
      toast.success('Product created successfully!');
      // Start minting automatically
      handleMint();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed]);

  React.useEffect(() => {
    if (writeError) {
      setIsUploading(false);
      setCurrentStep('upload');
      toast.error('Failed to create product. Please try again.');
    }
    if (confirmError) {
      setIsUploading(false);
      setCurrentStep('upload');
      toast.error('Transaction failed. Please try again.');
    }
  }, [writeError, confirmError]);

  // Reset form after everything is done
  React.useEffect(() => {
    if (mintSuccess) {
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          productUrl: '',
          imageUrl: '',
          category: '',
          tags: []
        });
        setFile(null);
        setFilePreview(null);
        setUploadSuccess(false);
        setMintSuccess(false);
        setMintedImageId(null);
        setCurrentStep('upload');
      }, 3000);
    }
  }, [mintSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!contractAddress) {
      toast.error('Contract address not configured');
      return;
    }

    setIsUploading(true);
    setCurrentStep('waitingTx');

    try {
      let imageUrl = formData.imageUrl;
      if (file) {
        imageUrl = await uploadImageAndGetUrl();
        setFormData(prev => ({ ...prev, imageUrl })); // update for minting
      }

      // Direct contract call
      writeContract({
        address: contractAddress,
        abi: abi,
        functionName: 'createProduct',
        args: [
          formData.name,
          formData.description,
          imageUrl,
          formData.productUrl
        ],
        value: parseEther('0.001'), // 0.001 ETH fee
      });

    } catch (error) {
      setIsUploading(false);
      setCurrentStep('upload');
      toast.error('An error occurred. Please try again.');
    }
  };

  const isFormValid = formData.name && formData.description && formData.productUrl && formData.category;
  const isLoading = isWritePending || isConfirming || isUploading || isMinting;

  // Helper for status message
  function getStatusMessage() {
    if (isUploading || isWritePending) {
      return "Uploading your project and submitting transaction...";
    }
    if (isConfirming) {
      return "Waiting for transaction confirmation...";
    }
    if (isMinting) {
      return "Minting your NFT. Please approve the wallet prompts...";
    }
    if (mintSuccess) {
      return "NFT minted successfully!";
    }
    if (mintError) {
      return "Minting failed. Please try again.";
    }
    return null;
  }

  // Check wallet connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to upload a product.</p>
          <div className="flex items-center justify-center">
            <CampModal  wcProjectId="c60cf518020ddd5ecf81cdd353410df2" />
          </div>
        </div>
      </div>
    );
  }

  // Show loading overlay with status message if loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Wait</h2>
          <p className="text-gray-600 mb-6">{getStatusMessage()}</p>
          {hash && (
            <p className="text-sm text-gray-500 mb-2">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
          {mintError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
              <p className="text-red-800 font-medium text-sm">Minting Failed</p>
              <p className="text-red-700 text-sm mt-1">{mintError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show success after everything is done
  if (mintSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Uploaded & NFT Minted!</h2>
          <p className="text-gray-600 mb-6">Your project has been successfully added and your NFT is live.</p>
          <div className="space-y-3">
            {hash && (
              <p className="text-sm text-gray-500">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
            <button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 w-full"
              onClick={() => router.push('/products')}
            >
              View Project
            </button>
            {mintedImageId && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                <p className="text-green-800 font-medium text-sm">NFT Minted!</p>
                <p className="text-green-700 text-sm mt-1">
                  Image ID: {mintedImageId}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Upload Project</h1>
            </div>
            {/* RainbowKit ConnectButton in header for convenience */}
            <div className="hidden sm:block">
              <button
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                disabled
                style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                title={walletAddress || ""}
              >
                {walletAddress ? (
                  <>
                    <span className="truncate">
                    Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </>
                ) : (
                  <span>Not Connected</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Project</h2>
              <p className="text-gray-600">Upload your project to get valuable feedback from the community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your project name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your project and its key features"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Project URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project URL *
                </label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    name="productUrl"
                    value={formData.productUrl}
                    onChange={handleInputChange}
                    placeholder="https://yourproduct.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Image/Logo
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-24 h-24 object-contain mx-auto mb-4 rounded-xl"
                    />
                  ) : (
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  )}
                  <p className="text-gray-600 mb-2">
                    Drag & drop your image here, or{' '}
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                      onClick={e => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                      disabled={isLoading}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="mt-3">
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="Or paste image URL"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  onKeyDown={handleTagInput}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Fee Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium text-sm">Upload Fee Required</p>
                  <p className="text-amber-700 text-sm mt-1">
                    A small fee of 0.001 ETH is required to upload your project to prevent spam and maintain quality.
                  </p>
                </div>
              </div>

              {/* Transaction Status */}
              {hash && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 font-medium text-sm">Transaction Submitted</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
                  </p>
                  <p className="text-blue-700 text-sm mt-1 underline cursor-pointer" onClick={() => router.push("products")}>
                    See All Products
                  </p>
                  {isConfirming && (
                    <p className="text-blue-600 text-sm mt-1">Waiting for confirmation...</p>
                  )}
                </div>
              )}

              {/* Error Display */}
              {(writeError || confirmError) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-medium text-sm">Transaction Failed</p>
                  <p className="text-red-700 text-sm mt-1">
                    {writeError?.message || confirmError?.message || 'An error occurred'}
                  </p>
                </div>
              )}

              {/* Mint NFT Button - REMOVED, now handled automatically */}

              {mintError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
                  <p className="text-red-800 font-medium text-sm">Minting Failed</p>
                  <p className="text-red-700 text-sm mt-1">{mintError}</p>
                </div>
              )}
              {mintSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-2">
                  <p className="text-green-800 font-medium text-sm">NFT Minted!</p>
                  {mintedImageId && (
                    <p className="text-green-700 text-sm mt-1">
                      Image ID: {mintedImageId}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={!isFormValid || isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWritePending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Confirming Transaction...
                    </>
                  ) : isConfirming ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Waiting for Confirmation...
                    </>
                  ) : isUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Project (0.001 ETH)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}