"use client"
import React, { useState, useRef } from 'react'
import { Upload, Link, Image, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
// import { CustomConnectButton } from '../components/ConnectButton';
import { toast } from 'sonner';
import { abi } from '../utils/abi';
import { getUploadedFile, uploadFileToPinata } from '../utils/pinata';
// RainbowKit ConnectButton
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CampModal, useAuth } from '@campnetwork/origin/react';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {walletAddress} = useAuth();

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

  // Handle success/error with useEffect
  React.useEffect(() => {
    if (isConfirmed) {
      console.log('Transaction confirmed!');
      setIsUploading(false);
      setUploadSuccess(true);
      toast.success('Product created successfully!');
      
      // Reset form after success
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
      }, 3000);
    }
  }, [isConfirmed]);

  React.useEffect(() => {
    if (writeError) {
      console.error('Write error:', writeError);
      setIsUploading(false);
      toast.error('Failed to create product. Please try again.');
    }
    if (confirmError) {
      console.error('Confirm error:', confirmError);
      setIsUploading(false);
      toast.error('Transaction failed. Please try again.');
    }
  }, [writeError, confirmError]);

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

    console.log('Form submitted with data:', formData);
    setIsUploading(true);

    try {
      let imageUrl = formData.imageUrl;
      if (file) {
        console.log('Uploading file...');
        imageUrl = await uploadImageAndGetUrl();
        console.log('File uploaded, URL:', imageUrl);
      }

      console.log('Creating product with params:', {
        name: formData.name,
        description: formData.description,
        imageUrl,
        productUrl: formData.productUrl,
        fee: "0.001"
      });

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
      console.error('Error in handleSubmit:', error);
      setIsUploading(false);
      toast.error('An error occurred. Please try again.');
    }
  };

  const isFormValid = formData.name && formData.description && formData.productUrl && formData.category;
  const isLoading = isWritePending || isConfirming || isUploading;

  // Check wallet connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to upload a product.</p>
          <div className="flex items-center justify-center">
            {/* <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            /> */}
            <CampModal 
              wcProjectId={process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""}
              onlyWagmi
              />
          </div>
        </div>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Uploaded!</h2>
          <p className="text-gray-600 mb-6">Your project has been successfully added to the marketplace.</p>
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
              {/* <ConnectButton
                showBalance={false}
                chainStatus="icon"
                accountStatus="address"
              /> */}
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