// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin-contracts/contracts/access/Ownable.sol";
import "@openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Fiidbak is Ownable, ReentrancyGuard {
    struct Product {
        uint256 id;
        address owner;
        string name;
        string description;
        string imageUrl;
        string productUrl;
        uint256 createdAt;
        uint256 totalRating;
        uint256 ratingCount;
        bool isActive;
    }

    struct Feedback {
        uint256 id;
        uint256 productId;
        address reviewer;
        string comment;
        uint8 rating; // 1-5 stars
        uint256 createdAt;
        bool isVerified;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => Feedback) public feedbacks;
    mapping(uint256 => uint256[]) public productFeedbacks; // productId => feedbackIds
    mapping(address => uint256[]) public userProducts; // user => productIds
    mapping(address => mapping(uint256 => bool)) public hasReviewed; // user => productId => bool
    mapping(uint256 => bool) public feedbackApproved; // feedbackId => approved status
    mapping(address => uint256) public pendingRewards; // User claimable rewards (you already have this)
    mapping(uint256 => bool) public feedbackRejected; // feedbackId => rejected status

    uint256 public nextProductId = 1;
    uint256 public nextFeedbackId = 1;
    uint256 public productCreationFee = 0.001 ether;
    uint256 public feedbackReward = 0.0001 ether; // Reward per feedback
    uint256 public rewardPool; // Total available rewards
    mapping(uint256 => bool) public feedbackRewarded; // Track if feedback was rewarded

    event ProductCreated(
        uint256 indexed productId,
        address indexed owner,
        string name,
        string productUrl
    );

    event FeedbackSubmitted(
        uint256 indexed feedbackId,
        uint256 indexed productId,
        address indexed reviewer,
        uint8 rating
    );

    event ProductDeactivated(uint256 indexed productId);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardPoolFunded(uint256 amount);
    event FeedbackRewarded(address indexed reviewer, uint256 amount);
    event FeedbackApproved(
        uint256 indexed feedbackId,
        address indexed reviewer,
        uint256 reward
    );
    event FeedbackRejected(
        uint256 indexed feedbackId,
        address indexed reviewer,
        string reason
    );

    constructor() Ownable(msg.sender) {}

    function createProduct(
        string memory _name,
        string memory _description,
        string memory _imageUrl,
        string memory _productUrl
    ) external payable nonReentrant {
        require(msg.value >= productCreationFee, "Insufficient fee");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_productUrl).length > 0, "Product URL required");

        uint256 productId = nextProductId++;

        products[productId] = Product({
            id: productId,
            owner: msg.sender,
            name: _name,
            description: _description,
            imageUrl: _imageUrl,
            productUrl: _productUrl,
            createdAt: block.timestamp,
            totalRating: 0,
            ratingCount: 0,
            isActive: true
        });

        userProducts[msg.sender].push(productId);

        emit ProductCreated(productId, msg.sender, _name, _productUrl);
    }

    function submitFeedback(
        uint256 _productId,
        string memory _comment,
        uint8 _rating
    ) external nonReentrant {
        require(products[_productId].isActive, "Product not active");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(!hasReviewed[msg.sender][_productId], "Already reviewed");
        require(
            products[_productId].owner != msg.sender,
            "Cannot review own product"
        );

        uint256 feedbackId = nextFeedbackId++;

        feedbacks[feedbackId] = Feedback({
            id: feedbackId,
            productId: _productId,
            reviewer: msg.sender,
            comment: _comment,
            rating: _rating,
            createdAt: block.timestamp,
            isVerified: false
        });

        productFeedbacks[_productId].push(feedbackId);
        hasReviewed[msg.sender][_productId] = true;

        // Update product rating
        products[_productId].totalRating += _rating;
        products[_productId].ratingCount++;

        emit FeedbackSubmitted(feedbackId, _productId, msg.sender, _rating);
    }

    function getProduct(
        uint256 _productId
    ) external view returns (Product memory) {
        return products[_productId];
    }

    function getProductFeedbacks(
        uint256 _productId
    ) external view returns (Feedback[] memory) {
        uint256[] memory feedbackIds = productFeedbacks[_productId];
        Feedback[] memory productFeedbackList = new Feedback[](
            feedbackIds.length
        );

        for (uint256 i = 0; i < feedbackIds.length; i++) {
            productFeedbackList[i] = feedbacks[feedbackIds[i]];
        }

        return productFeedbackList;
    }

    function getUserProducts(
        address _user
    ) external view returns (Product[] memory) {
        uint256[] memory productIds = userProducts[_user];
        Product[] memory userProductList = new Product[](productIds.length);

        for (uint256 i = 0; i < productIds.length; i++) {
            userProductList[i] = products[productIds[i]];
        }

        return userProductList;
    }

    function getAllProducts() external view returns (Product[] memory) {
        uint256 activeCount = 0;

        // Count active products
        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].isActive) {
                activeCount++;
            }
        }

        Product[] memory allProducts = new Product[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i < nextProductId; i++) {
            if (products[i].isActive) {
                allProducts[index] = products[i];
                index++;
            }
        }

        return allProducts;
    }

    function getProductRating(
        uint256 _productId
    ) external view returns (uint256 averageRating, uint256 totalReviews) {
        Product memory product = products[_productId];
        if (product.ratingCount == 0) {
            return (0, 0);
        }
        return (product.totalRating / product.ratingCount, product.ratingCount);
    }

    function deactivateProduct(uint256 _productId) external {
        require(
            products[_productId].owner == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        products[_productId].isActive = false;
        emit ProductDeactivated(_productId);
    }

    function setProductCreationFee(uint256 _fee) external onlyOwner {
        productCreationFee = _fee;
    }

    function claimRewards() external nonReentrant {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);

        emit RewardClaimed(msg.sender, reward);
    }

    function fundRewardPool() external payable {
        rewardPool += msg.value;
        emit RewardPoolFunded(msg.value);
    }

    function setFeedbackReward(uint256 _reward) external onlyOwner {
        feedbackReward = _reward;
    }

    function approveFeedback(uint256 _feedbackId) external nonReentrant {
        Feedback memory feedback = feedbacks[_feedbackId];
        require(feedback.id != 0, "Feedback does not exist");
        require(
            products[feedback.productId].owner == msg.sender,
            "Not product owner"
        );
        require(!feedbackApproved[_feedbackId], "Already approved");
        require(!feedbackRejected[_feedbackId], "Feedback was rejected");

        feedbackApproved[_feedbackId] = true;

        // Only reward if pool has sufficient funds
        if (rewardPool >= feedbackReward) {
            pendingRewards[feedback.reviewer] += feedbackReward;
            rewardPool -= feedbackReward;
            feedbackRewarded[_feedbackId] = true;

            emit FeedbackRewarded(feedback.reviewer, feedbackReward);
            emit FeedbackApproved(
                _feedbackId,
                feedback.reviewer,
                feedbackReward
            );
        } else {
            // Approve but no reward due to insufficient pool
            emit FeedbackApproved(_feedbackId, feedback.reviewer, 0);
        }
    }

    function rejectFeedback(
        uint256 _feedbackId,
        string memory _reason
    ) external nonReentrant {
        Feedback memory feedback = feedbacks[_feedbackId];
        require(feedback.id != 0, "Feedback does not exist");
        require(
            products[feedback.productId].owner == msg.sender,
            "Not product owner"
        );
        require(!feedbackApproved[_feedbackId], "Already approved");
        require(!feedbackRejected[_feedbackId], "Already rejected");

        feedbackRejected[_feedbackId] = true;

        // Remove rating from product totals
        products[feedback.productId].totalRating -= feedback.rating;
        products[feedback.productId].ratingCount--;

        emit FeedbackRejected(_feedbackId, feedback.reviewer, _reason);
    }

    function getPendingFeedbacks(
        address _productOwner
    ) external view returns (Feedback[] memory) {
        uint256[] memory ownerProductIds = userProducts[_productOwner];
        uint256 pendingCount = 0;

        // Count pending feedbacks across all owner's products
        for (uint256 i = 0; i < ownerProductIds.length; i++) {
            uint256[] memory feedbackIds = productFeedbacks[ownerProductIds[i]];
            for (uint256 j = 0; j < feedbackIds.length; j++) {
                uint256 feedbackId = feedbackIds[j];
                if (
                    !feedbackApproved[feedbackId] &&
                    !feedbackRejected[feedbackId]
                ) {
                    pendingCount++;
                }
            }
        }

        Feedback[] memory pendingFeedbacks = new Feedback[](pendingCount);
        uint256 index = 0;

        // Collect pending feedbacks
        for (uint256 i = 0; i < ownerProductIds.length; i++) {
            uint256[] memory feedbackIds = productFeedbacks[ownerProductIds[i]];
            for (uint256 j = 0; j < feedbackIds.length; j++) {
                uint256 feedbackId = feedbackIds[j];
                if (
                    !feedbackApproved[feedbackId] &&
                    !feedbackRejected[feedbackId]
                ) {
                    pendingFeedbacks[index] = feedbacks[feedbackId];
                    index++;
                }
            }
        }

        return pendingFeedbacks;
    }

    function getFeedbackStatus(
        uint256 _feedbackId
    ) external view returns (string memory) {
        if (feedbackApproved[_feedbackId]) return "approved";
        if (feedbackRejected[_feedbackId]) return "rejected";
        return "pending";
    }

    // Get reward pool status
    function getRewardPoolStatus()
        external
        view
        returns (
            uint256 currentPool,
            uint256 rewardPerFeedback,
            uint256 remainingRewards
        )
    {
        uint256 remaining = rewardPool > 0 ? rewardPool / feedbackReward : 0;
        return (rewardPool, feedbackReward, remaining);
    }

    // Get user's pending rewards
    function getPendingRewards(address _user) external view returns (uint256) {
        return pendingRewards[_user];
    }

    // Emergency function to adjust reward if pool is low
    function adjustRewardAmount(uint256 _newReward) external onlyOwner {
        require(_newReward > 0, "Reward must be positive");
        feedbackReward = _newReward;
    }

    // Get total number of products (for pagination)
    function getTotalProductCount() external view returns (uint256) {
        return nextProductId - 1;
    }

    // Get products with pagination
    function getProductsPaginated(
        uint256 _offset,
        uint256 _limit
    ) external view returns (Product[] memory) {
        require(_limit > 0 && _limit <= 50, "Invalid limit");

        uint256 totalProducts = nextProductId - 1;
        if (_offset >= totalProducts) {
            return new Product[](0);
        }

        uint256 end = _offset + _limit;
        if (end > totalProducts) {
            end = totalProducts;
        }

        uint256 activeCount = 0;
        for (uint256 i = _offset + 1; i <= end; i++) {
            if (products[i].isActive) {
                activeCount++;
            }
        }

        Product[] memory result = new Product[](activeCount);
        uint256 index = 0;

        for (uint256 i = _offset + 1; i <= end; i++) {
            if (products[i].isActive) {
                result[index] = products[i];
                index++;
            }
        }

        return result;
    }

    function withdrawFees() external onlyOwner {
        uint256 fees = address(this).balance - rewardPool;
        require(fees > 0, "No fees to withdraw");
        payable(owner()).transfer(fees);
    }

    receive() external payable {}
}
