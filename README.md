# Betting Room

This build allows the creation of a betting room for a game. 

- The user can create a room, setting the bet value and the game contract address. 
- Share the link to the room and other users can join, betting that he will win the game.
- After the bet deadline is reached, one user can fetch the winners from the game contract and get a tip for this.
- All the winners can claim the pot (if multiple winners, the pot is split).
- After the claim prize deadline, the users can claim a bet refund, if there is any balance in the room.

The Game contract only must implement this interface:

```
interface IGameResult {
	function winners(address roomHash) external view returns (address[] memory);
}
```

## Screenshoots

![localhost_3000_rooms_0xB400a0b81345Ad4362c80A1a8d3A4700Baf6C281](https://github.com/damianmarti/betting-room/assets/466652/e6cd26d8-1c1e-42e0-95e9-52db5079739e)

![localhost_3000_rooms_0xB400a0b81345Ad4362c80A1a8d3A4700Baf6C281 (1)](https://github.com/damianmarti/betting-room/assets/466652/b56a5cda-fc5a-4431-a788-54ed45413eb0)

## BTF show off video

[![BettingRoom](https://img.youtube.com/vi/CeKLD-lhPBo/0.jpg)](https://www.youtube.com/watch?v=CeKLD-lhPBo&t=2487s)

## Future work

- Allow to bet on other players.
- Widget or something to embed the app on the game.
- Chat for users.
- Some kind of shareable game ID implemented on each game.
- Other?


# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, and Typescript.

- ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
- 🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
- 🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/1171422a-0ce4-4203-bcd4-d2d1941d198b)

## Requirements

Before you begin, you need to install the following tools:

- [Node (v18 LTS)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Clone this repo & install dependencies

```
git clone https://github.com/scaffold-eth/scaffold-eth-2.git
cd scaffold-eth-2
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit your smart contract `YourContract.sol` in `packages/hardhat/contracts`
- Edit your frontend in `packages/nextjs/pages`
- Edit your deployment scripts in `packages/hardhat/deploy`

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.
