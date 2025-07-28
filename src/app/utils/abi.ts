export const abi = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "adjustRewardAmount",
    "inputs": [
      { "name": "_newReward", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "approveFeedback",
    "inputs": [
      { "name": "_feedbackId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimRewards",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createProduct",
    "inputs": [
      { "name": "_name", "type": "string", "internalType": "string" },
      { "name": "_description", "type": "string", "internalType": "string" },
      { "name": "_imageUrl", "type": "string", "internalType": "string" },
      { "name": "_productUrl", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "deactivateProduct",
    "inputs": [
      { "name": "_productId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "feedbackApproved",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feedbackRejected",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feedbackReward",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feedbackRewarded",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "feedbacks",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "id", "type": "uint256", "internalType": "uint256" },
      { "name": "productId", "type": "uint256", "internalType": "uint256" },
      { "name": "reviewer", "type": "address", "internalType": "address" },
      { "name": "comment", "type": "string", "internalType": "string" },
      { "name": "rating", "type": "uint8", "internalType": "uint8" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
      { "name": "isVerified", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "fundRewardPool",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getAllProducts",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Fiidbak.Product[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "name", "type": "string", "internalType": "string" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "imageUrl", "type": "string", "internalType": "string" },
          { "name": "productUrl", "type": "string", "internalType": "string" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "totalRating", "type": "uint256", "internalType": "uint256" },
          { "name": "ratingCount", "type": "uint256", "internalType": "uint256" },
          { "name": "isActive", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFeedbackStatus",
    "inputs": [
      { "name": "_feedbackId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "string", "internalType": "string" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPendingFeedbacks",
    "inputs": [
      { "name": "_productOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Fiidbak.Feedback[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "productId", "type": "uint256", "internalType": "uint256" },
          { "name": "reviewer", "type": "address", "internalType": "address" },
          { "name": "comment", "type": "string", "internalType": "string" },
          { "name": "rating", "type": "uint8", "internalType": "uint8" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "isVerified", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPendingRewards",
    "inputs": [
      { "name": "_user", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProduct",
    "inputs": [
      { "name": "_productId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct Fiidbak.Product",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "name", "type": "string", "internalType": "string" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "imageUrl", "type": "string", "internalType": "string" },
          { "name": "productUrl", "type": "string", "internalType": "string" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "totalRating", "type": "uint256", "internalType": "uint256" },
          { "name": "ratingCount", "type": "uint256", "internalType": "uint256" },
          { "name": "isActive", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProductFeedbacks",
    "inputs": [
      { "name": "_productId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Fiidbak.Feedback[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "productId", "type": "uint256", "internalType": "uint256" },
          { "name": "reviewer", "type": "address", "internalType": "address" },
          { "name": "comment", "type": "string", "internalType": "string" },
          { "name": "rating", "type": "uint8", "internalType": "uint8" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "isVerified", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProductRating",
    "inputs": [
      { "name": "_productId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "averageRating", "type": "uint256", "internalType": "uint256" },
      { "name": "totalReviews", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProductsPaginated",
    "inputs": [
      { "name": "_offset", "type": "uint256", "internalType": "uint256" },
      { "name": "_limit", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Fiidbak.Product[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "name", "type": "string", "internalType": "string" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "imageUrl", "type": "string", "internalType": "string" },
          { "name": "productUrl", "type": "string", "internalType": "string" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "totalRating", "type": "uint256", "internalType": "uint256" },
          { "name": "ratingCount", "type": "uint256", "internalType": "uint256" },
          { "name": "isActive", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getRewardPoolStatus",
    "inputs": [],
    "outputs": [
      { "name": "currentPool", "type": "uint256", "internalType": "uint256" },
      { "name": "rewardPerFeedback", "type": "uint256", "internalType": "uint256" },
      { "name": "remainingRewards", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalProductCount",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserProducts",
    "inputs": [
      { "name": "_user", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "internalType": "struct Fiidbak.Product[]",
        "components": [
          { "name": "id", "type": "uint256", "internalType": "uint256" },
          { "name": "owner", "type": "address", "internalType": "address" },
          { "name": "name", "type": "string", "internalType": "string" },
          { "name": "description", "type": "string", "internalType": "string" },
          { "name": "imageUrl", "type": "string", "internalType": "string" },
          { "name": "productUrl", "type": "string", "internalType": "string" },
          { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
          { "name": "totalRating", "type": "uint256", "internalType": "uint256" },
          { "name": "ratingCount", "type": "uint256", "internalType": "uint256" },
          { "name": "isActive", "type": "bool", "internalType": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasReviewed",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextFeedbackId",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nextProductId",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "pendingRewards",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "productCreationFee",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "productFeedbacks",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "products",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "id", "type": "uint256", "internalType": "uint256" },
      { "name": "owner", "type": "address", "internalType": "address" },
      { "name": "name", "type": "string", "internalType": "string" },
      { "name": "description", "type": "string", "internalType": "string" },
      { "name": "imageUrl", "type": "string", "internalType": "string" },
      { "name": "productUrl", "type": "string", "internalType": "string" },
      { "name": "createdAt", "type": "uint256", "internalType": "uint256" },
      { "name": "totalRating", "type": "uint256", "internalType": "uint256" },
      { "name": "ratingCount", "type": "uint256", "internalType": "uint256" },
      { "name": "isActive", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "rejectFeedback",
    "inputs": [
      { "name": "_feedbackId", "type": "uint256", "internalType": "uint256" },
      { "name": "_reason", "type": "string", "internalType": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "renounceOwnership",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "rewardPool",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setFeedbackReward",
    "inputs": [
      { "name": "_reward", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setProductCreationFee",
    "inputs": [
      { "name": "_fee", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitFeedback",
    "inputs": [
      { "name": "_productId", "type": "uint256", "internalType": "uint256" },
      { "name": "_comment", "type": "string", "internalType": "string" },
      { "name": "_rating", "type": "uint8", "internalType": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      { "name": "newOwner", "type": "address", "internalType": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "userProducts",
    "inputs": [
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "withdrawFees",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "FeedbackApproved",
    "inputs": [
      { "name": "feedbackId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "reviewer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "reward", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeedbackRejected",
    "inputs": [
      { "name": "feedbackId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "reviewer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "reason", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeedbackRewarded",
    "inputs": [
      { "name": "reviewer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "FeedbackSubmitted",
    "inputs": [
      { "name": "feedbackId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "productId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "reviewer", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "rating", "type": "uint8", "indexed": false, "internalType": "uint8" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      { "name": "previousOwner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "newOwner", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProductCreated",
    "inputs": [
      { "name": "productId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "owner", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "name", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "productUrl", "type": "string", "indexed": false, "internalType": "string" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProductDeactivated",
    "inputs": [
      { "name": "productId", "type": "uint256", "indexed": true, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardClaimed",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "RewardPoolFunded",
    "inputs": [
      { "name": "amount", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "OwnableInvalidOwner",
    "inputs": [
      { "name": "owner", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "OwnableUnauthorizedAccount",
    "inputs": [
      { "name": "account", "type": "address", "internalType": "address" }
    ]
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  }
];