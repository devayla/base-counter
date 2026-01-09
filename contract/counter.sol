// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Counter is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /* ------------------------------------------------------------ */
    /*                          STATE                               */
    /* ------------------------------------------------------------ */

    uint256 public counter;
    address public serverSigner;

    // Signature replay protection
    mapping(bytes => bool) public usedSignatures;

    // user => dayId => rewarded count
    mapping(address => mapping(uint256 => uint256)) public dailyRewardCount;

    // user => indexes where they incremented
    mapping(address => uint256[]) public userIncrementIndexes;

    // user => total number of times they incremented
    mapping(address => uint256) public userIncrementCount;

    /* ------------------------------------------------------------ */
    /*                        STRUCTS                               */
    /* ------------------------------------------------------------ */

    struct IncrementInfo {
        address user;
        uint256 fid;
        string username;
        string imageUrl;
        uint256 timestamp;
        uint256 userTotalIncrements;
    }

    IncrementInfo[] public increments;

    /* ------------------------------------------------------------ */
    /*                         EVENTS                               */
    /* ------------------------------------------------------------ */

    event CounterIncremented(
        address indexed user,
        uint256 indexed index,
        uint256 counterValue
    );

    event TokenRewarded(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    event ServerSignerUpdated(address indexed newSigner);
    event TokenWithdrawn(address indexed token, uint256 amount);

    /* ------------------------------------------------------------ */
    /*                        CONSTRUCTOR                           */
    /* ------------------------------------------------------------ */

    constructor(address _serverSigner) Ownable(msg.sender) {
        require(_serverSigner != address(0), "Invalid signer");
        serverSigner = _serverSigner;
    }

    /* ------------------------------------------------------------ */
    /*                    ADMIN FUNCTIONS                           */
    /* ------------------------------------------------------------ */

    function updateServerSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer");
        serverSigner = _newSigner;
        emit ServerSignerUpdated(_newSigner);
    }

    function withdrawToken(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "No balance");
        IERC20(token).transfer(owner(), bal);
        emit TokenWithdrawn(token, bal);
    }

    /* ------------------------------------------------------------ */
    /*                   CORE INCREMENT LOGIC                       */
    /* ------------------------------------------------------------ */

    /**
     * @notice Increment counter and optionally receive reward
     * @dev Reward failure NEVER reverts the increment
     * @dev If user already has increments, updates their latest entry instead of creating new one
     */
    function incrementCounter(
        uint256 fid,
        string calldata username,
        string calldata imageUrl,
        address rewardToken,
        uint256 rewardAmount,
        bytes calldata signature
    ) external {
        // 1️⃣ Increment global counter
        counter += 1;

        // 2️⃣ Increment user's personal counter
        userIncrementCount[msg.sender] += 1;

        // 3️⃣ Store or update increment info
        uint256[] storage userIndexes = userIncrementIndexes[msg.sender];
        
        if (userIndexes.length > 0) {
            // User already has increments - update their latest entry
            uint256 latestIndex = userIndexes[userIndexes.length - 1];
            increments[latestIndex].fid = fid;
            increments[latestIndex].username = username;
            increments[latestIndex].imageUrl = imageUrl;
            increments[latestIndex].timestamp = block.timestamp;
            increments[latestIndex].userTotalIncrements = userIncrementCount[msg.sender];
            // Keep the same index, just update the data
            
            emit CounterIncremented(msg.sender, latestIndex, counter);
        } else {
            // First increment for this user - create new entry
            increments.push(
                IncrementInfo({
                    user: msg.sender,
                    fid: fid,
                    username: username,
                    imageUrl: imageUrl,
                    timestamp: block.timestamp,
                    userTotalIncrements: userIncrementCount[msg.sender]
                })
            );

            uint256 index = increments.length - 1;
            userIndexes.push(index);

            emit CounterIncremented(msg.sender, index, counter);
        }

        // 4️⃣ Attempt reward (best-effort)
        _tryReward(
            msg.sender,
            rewardToken,
            rewardAmount,
            signature
        );
    }

    /* ------------------------------------------------------------ */
    /*                   REWARD INTERNAL LOGIC                      */
    /* ------------------------------------------------------------ */

    function _tryReward(
        address user,
        address token,
        uint256 amount,
        bytes calldata signature
    ) internal {
        uint256 dayId = block.timestamp / 1 days;

        // Daily limit check
        if (dailyRewardCount[user][dayId] >= 10) {
            return;
        }

        // Signature replay check
        if (usedSignatures[signature]) {
            return;
        }

        // Signature validation
        if (!_verifySignature(user, token, amount, signature)) {
            return;
        }

        // Attempt transfer (NO revert)
        try IERC20(token).transfer(user, amount) returns (bool success) {
            if (!success) return;
        } catch {
            return;
        }

        // Mark used only if success
        usedSignatures[signature] = true;
        dailyRewardCount[user][dayId] += 1;

        emit TokenRewarded(user, token, amount);
    }

    function _verifySignature(
        address user,
        address token,
        uint256 amount,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, token, amount)
        );

        bytes32 ethHash = hash.toEthSignedMessageHash();
        return ethHash.recover(signature) == serverSigner;
    }

    /* ------------------------------------------------------------ */
    /*                   VIEW / PAGINATION                          */
    /* ------------------------------------------------------------ */

    /**
     * @notice Returns a slice of increments around user's latest increment
     */
    function getIncrementsAroundMe(
        address user,
        uint256 lower,
        uint256 upper
    ) external view returns (IncrementInfo[] memory) {
        uint256[] storage indexes = userIncrementIndexes[user];
        require(indexes.length > 0, "User has no increments");

        uint256 myIndex = indexes[indexes.length - 1];

        uint256 start = myIndex > lower ? myIndex - lower : 0;
        uint256 end = myIndex + upper;

        if (end >= increments.length) {
            end = increments.length - 1;
        }

        uint256 size = end - start + 1;
        IncrementInfo[] memory result = new IncrementInfo[](size);

        for (uint256 i = 0; i < size; i++) {
            result[i] = increments[start + i];
        }

        return result;
    }

    /**
     * @notice Total increments count
     */
    function totalIncrements() external view returns (uint256) {
        return increments.length;
    }
}
