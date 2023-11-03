//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

// import "hardhat/console.sol";

contract Game {
	mapping(address => address[]) public gamesMembers;

	event GameJoin(address indexed roomHash, address indexed member);

	/**
	 * @notice Function to join a game with the game address
	 * @param gameHash - game address
	 */
	function joinGame(address gameHash) public {
		gamesMembers[gameHash].push(msg.sender);

		emit GameJoin(gameHash, msg.sender);
	}

	function winners(
		address roomHash
	) external view returns (address[] memory) {
		return gamesMembers[roomHash];
	}
}
