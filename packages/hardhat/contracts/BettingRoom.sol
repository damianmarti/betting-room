//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// import "hardhat/console.sol";

interface IGameResult {
	function winners(address roomHash) external view returns (address[] memory);
}

contract BettingRoom is ReentrancyGuard {
	// Holds the room data
	struct RoomStruct {
		bool initialized;
		uint8 membersCount;
		uint256 betDeadline;
		uint256 resultDeadline;
		uint256 winnersCount;
		address creator;
		uint256 betValue;
		bool winnersFetched;
		uint256 balance;
		address resultContractAddress;
		mapping(address => bool) members;
		mapping(address => bool) winners;
		mapping(address => bool) claimed;
	}

	// 1% pot tip to result fetcher
	uint256 public constant fetchResultTipDiv = 100;

	// Maps Room address => Room data
	mapping(address => RoomStruct) public rooms;

	event RoomCreate(
		address indexed roomHash,
		address indexed creator,
		address indexed resultContractAddress,
		uint256 betValue,
		uint256 betDeadline,
		uint256 resultDeadline
	);
	event RoomJoin(address indexed roomHash, address indexed member);
	event WinnersFetch(
		address indexed roomHash,
		address indexed fetcher,
		uint256 tip,
		address[] winners
	);
	event ClaimPrize(
		address indexed roomHash,
		address indexed member,
		uint256 prize
	);
	event ClaimRefund(
		address indexed roomHash,
		address indexed member,
		uint256 refund
	);

	/**
	 * @notice Creates a new room, generating a room hash and setting the sender as the owner
	 */
	function createRoom(
		address resultContractAddress,
		uint256 betValue,
		uint256 betDeadline,
		uint256 resultDeadline
	) public returns (address) {
		address roomHash = generateRoomHash();
		require(
			!rooms[roomHash].initialized,
			"Room code already exists, please try again"
		);

		rooms[roomHash].initialized = true;
		rooms[roomHash].betDeadline = betDeadline;
		rooms[roomHash].resultDeadline = resultDeadline;
		rooms[roomHash].resultContractAddress = resultContractAddress;
		rooms[roomHash].creator = msg.sender;
		rooms[roomHash].betValue = betValue;

		emit RoomCreate(
			roomHash,
			msg.sender,
			resultContractAddress,
			betValue,
			betDeadline,
			resultDeadline
		);

		// Return the room hash so it can be shared
		return roomHash;
	}

	/**
	 * @notice Function to join a room with the room address
	 * @param roomHash - room address shared by room creator
	 */
	function joinRoom(address roomHash) public payable {
		// Check that the room exists
		require(
			rooms[roomHash].initialized == true,
			"Room code does not exist"
		);
		// check bet
		require(msg.value >= rooms[roomHash].betValue, "Not enough!");
		// Check address is not among members
		require(
			!rooms[roomHash].members[msg.sender],
			"Address already in this room"
		);
		// Check that bet deadline is not reached
		require(
			block.number <= rooms[roomHash].betDeadline,
			"Bet deadline reached"
		);

		rooms[roomHash].members[msg.sender] = true;
		rooms[roomHash].membersCount++;
		rooms[roomHash].balance += msg.value;

		emit RoomJoin(roomHash, msg.sender);
	}

	/**
	 * @notice Function to create a room and join it
	 * @param resultContractAddress - address of the result contract
	 * @param betValue - bet value
	 * @param betDeadline - bet deadline
	 * @param resultDeadline - result deadline
	 */
	function createRoomAndJoin(
		address resultContractAddress,
		uint256 betValue,
		uint256 betDeadline,
		uint256 resultDeadline
	) external payable returns (address) {
		address roomHash = createRoom(
			resultContractAddress,
			betValue,
			betDeadline,
			resultDeadline
		);
		joinRoom(roomHash);

		return roomHash;
	}

	/**
	 * @notice Function to fetch winners
	 * @param roomHash - room address
	 */
	function fetchWinners(address roomHash) external nonReentrant {
		require(
			rooms[roomHash].initialized == true,
			"Room code does not exist"
		);
		require(
			block.number > rooms[roomHash].betDeadline,
			"Bet deadline not reached"
		);
		require(
			block.number <= rooms[roomHash].resultDeadline,
			"Result deadline reached"
		);
		require(!rooms[roomHash].winnersFetched, "Already fetched");

		IGameResult gameResult = IGameResult(
			rooms[roomHash].resultContractAddress
		);
		address[] memory winners = gameResult.winners(roomHash);
		for (uint256 i = 0; i < winners.length; i++) {
			// Check that the winner is among the members
			if (!rooms[roomHash].members[winners[i]]) {
				continue;
			}
			// Check that the winner is not already a winner
			if (rooms[roomHash].winners[winners[i]]) {
				continue;
			}
			rooms[roomHash].winners[winners[i]] = true;
			rooms[roomHash].winnersCount++;
		}
		rooms[roomHash].winnersFetched = true;

		uint256 tip = (rooms[roomHash].betValue *
			rooms[roomHash].membersCount) / fetchResultTipDiv;

		if (tip > rooms[roomHash].balance) {
			tip = rooms[roomHash].balance;
		}

		require(tip > 0, "Room with no balance");

		(bool success, ) = address(msg.sender).call{ value: tip }("");

		require(success, "Failed to send tip");

		rooms[roomHash].balance -= tip;

		emit WinnersFetch(roomHash, msg.sender, tip, winners);
	}

	/**
	 * @notice Function to claim prize
	 * @param roomHash - room address
	 */
	function claimPrize(address roomHash) external nonReentrant {
		// Check that the room exists
		require(
			rooms[roomHash].initialized == true,
			"Room code does not exist"
		);
		// Check that the bet deadline is reached
		require(
			block.number > rooms[roomHash].betDeadline,
			"Bet deadline not reached"
		);
		// Check that the result deadline not is reached
		require(
			block.number <= rooms[roomHash].resultDeadline,
			"Result deadline reached"
		);
		// Check that the winners are fetched
		require(rooms[roomHash].winnersFetched, "Winners not fetched");

		// Check that the sender is among the winners
		require(rooms[roomHash].winners[msg.sender], "Not a winner!");

		// Check that the sender has not already claimed
		require(!rooms[roomHash].claimed[msg.sender], "Already claimed!");

		uint256 tip = (rooms[roomHash].betValue *
			rooms[roomHash].membersCount) / fetchResultTipDiv;

		uint256 pot = (rooms[roomHash].betValue *
			rooms[roomHash].membersCount) - tip;

		uint256 prize = pot / rooms[roomHash].winnersCount;

		if (prize > rooms[roomHash].balance) {
			prize = rooms[roomHash].balance;
		}

		require(prize > 0, "Room with no balance");

		(bool success, ) = address(msg.sender).call{ value: prize }("");

		require(success, "Failed to send prize");

		rooms[roomHash].claimed[msg.sender] = true;
		rooms[roomHash].balance -= prize;

		emit ClaimPrize(roomHash, msg.sender, prize);
	}

	/**
	 * @notice Function to withdraw bet after the result deadline
	 * @param roomHash - room address
	 */
	function refundBet(address roomHash) external nonReentrant {
		// Check that the room exists
		require(
			rooms[roomHash].initialized == true,
			"Room code does not exist"
		);
		// Check that the result deadline is reached
		require(
			block.number > rooms[roomHash].resultDeadline,
			"Result deadline not reached"
		);
		// Check that the sender is among the members
		require(rooms[roomHash].members[msg.sender], "Not a winner!");

		// Check that the sender has not already claimed
		require(!rooms[roomHash].claimed[msg.sender], "Already claimed!");

		uint256 betRefund = rooms[roomHash].betValue;

		if (rooms[roomHash].winnersFetched) {
			betRefund -= (rooms[roomHash].betValue / fetchResultTipDiv);
		}

		if (betRefund > rooms[roomHash].balance) {
			betRefund = rooms[roomHash].balance;
		}

		require(betRefund > 0, "Room with no balance");

		(bool success, ) = address(msg.sender).call{ value: betRefund }("");

		require(success, "Failed to send refund");

		rooms[roomHash].claimed[msg.sender] = true;
		rooms[roomHash].balance -= betRefund;

		emit ClaimRefund(roomHash, msg.sender, betRefund);
	}

	/**
	 * @notice Function to generate a pseudo-random room hash
	 */
	function generateRoomHash() internal view returns (address) {
		bytes32 prevHash = blockhash(block.number - 1);
		// Room hash is a pseudo-randomly generated address from last blockhash + sender address
		return
			address(bytes20(keccak256(abi.encodePacked(prevHash, msg.sender))));
	}
}
