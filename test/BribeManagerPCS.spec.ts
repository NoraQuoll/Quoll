// import { ethers, network } from "hardhat";

// import { assert } from "console";
// import * as ethersI from "ethers";

// import { currentTime, increase, increaseTo } from "./utils/time";

// import { expect } from "chai";

// import {
//   BribeManagerPCS__factory,
//   IERC20__factory,
//   IGaugeVoting__factory,
//   NativeZapper__factory,
//   QuollToken__factory,
//   VlQuoV2__factory,
//   WombatBooster__factory,
//   WomDepositor__factory,
// } from "../typechain-types";
// import { IMasterChefV2__factory } from "../typechain-types/factories/contracts/Interfaces/Pancake";

// describe("BribeManagerPCS", function () {
//   async function deployFixture() {
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0xF977814e90dA44bFA03b6295A0616a897441aceC"],
//     });

//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0x8894e0a0c962cb723c1976a4421c95949be2d4e3"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0xf89d7b9c864f589bbf53a82105107622b35eaa40"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0x42Ed232DC3E65b3534DbB42d07A3f67A618f66a3"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0x28B2a59343bc503C98c3E807A282c2345082d7aa"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0xeC52ef632dB94C99fE523170d5aeEfFA4c92E384"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0x59cDaf8578aa76a5aa800c8f2d8F93f022bF803c"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0xA10270de26FA6f8CE38be80d338dB231f02a5C09"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0x54F01F0Bb7021C62405d0BaBe1F8d70eb9458cDE"],
//     });
//     await network.provider.request({
//       method: "hardhat_impersonateAccount",
//       params: ["0xcB0Fd804a913ee4cB4e8CCe26dD5CC8012359B79"],
//     });

//     const [treasury] = await ethers.getSigners(); // Get the first signer (default account)

//     const owner = await ethers.getSigner(
//       "0xF977814e90dA44bFA03b6295A0616a897441aceC"
//     );
//     const user1 = await ethers.getSigner(
//       "0x8894e0a0c962cb723c1976a4421c95949be2d4e3"
//     );
//     const user2 = await ethers.getSigner(
//       "0xf89d7b9c864f589bbf53a82105107622b35eaa40"
//     );
//     const user3 = await ethers.getSigner(
//       "0x42Ed232DC3E65b3534DbB42d07A3f67A618f66a3"
//     );
//     const user4 = await ethers.getSigner(
//       "0x28B2a59343bc503C98c3E807A282c2345082d7aa"
//     );
//     const user5 = await ethers.getSigner(
//       "0xeC52ef632dB94C99fE523170d5aeEfFA4c92E384"
//     );

//     const user6 = await ethers.getSigner(
//       "0x59cDaf8578aa76a5aa800c8f2d8F93f022bF803c"
//     );

//     const user7 = await ethers.getSigner(
//       "0xA10270de26FA6f8CE38be80d338dB231f02a5C09"
//     );

//     const user1HolderVlquo = await ethers.getSigner(
//       "0x54F01F0Bb7021C62405d0BaBe1F8d70eb9458cDE"
//     );

//     const user2HolderVlquo = await ethers.getSigner(
//       "0xcB0Fd804a913ee4cB4e8CCe26dD5CC8012359B79"
//     );

//     await treasury.sendTransaction({
//       to: owner.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });

//     await treasury.sendTransaction({
//       to: user1.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user2.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user3.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user4.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user5.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user6.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user7.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user1HolderVlquo.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });
//     await treasury.sendTransaction({
//       to: user2HolderVlquo.address,
//       value: ethers.utils.parseEther("1"), // Amount of ETH to send
//     });

//     const veCake = IERC20__factory.connect(
//       "0x5692DB8177a81A6c6afc8084C2976C9933EC1bAB",
//       owner
//     );

//     const cake = IERC20__factory.connect(
//       "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
//       owner
//     );

//     const gaugeVoting = IGaugeVoting__factory.connect(
//       "0xf81953dC234cdEf1D6D0d3ef61b232C6bCbF9aeF",
//       owner
//     );

//     const vlQuoV2 = VlQuoV2__factory.connect(
//       "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60",
//       owner
//     );

//     const nativeZapper = NativeZapper__factory.connect(
//       "0x61C855f3a9A1B3FeFD065DbE53c9DAf630F29Df8",
//       owner
//     );

//     const masterChef = IMasterChefV2__factory.connect(
//       "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
//       owner
//     );

//     const booster = WombatBooster__factory.connect(
//       "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a",
//       owner
//     );

//     const depositor = WomDepositor__factory.connect(
//       "0xDFd69E83d4A5d2E15D5Dcf2F4f52CDdC44CB93Fc",
//       owner
//     );

//     const quo = QuollToken__factory.connect(
//       "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF",
//       owner
//     );

//     // deploy bribe manager
//     const bribeManager = await ethers.getContractFactory("BribeManagerPCS");
//     const bribeManagerInstance = await bribeManager.deploy();
//     await bribeManagerInstance.initialize();

//     const voterProxy = await ethers.getContractFactory("PCSVoterProxy");
//     const voterProxyInstance = await voterProxy.deploy();
//     await voterProxyInstance.initialize();

//     await voterProxyInstance.setParams(
//       masterChef.address,
//       cake.address,
//       veCake.address,
//       booster.address,
//       depositor.address
//     );

//     const delegatePool = await ethers.getContractFactory("DelegateVotePCSPool");
//     const delegatePoolInstance = await delegatePool.deploy();
//     await delegatePoolInstance.initialize();

//     const virtualBalanceRewardPool = await ethers.getContractFactory(
//       "VirtualBalanceRewardPool"
//     );
//     const delegatePoolVirtualBalanceRewardPoolInstance =
//       await virtualBalanceRewardPool.deploy();
//     await delegatePoolVirtualBalanceRewardPoolInstance.initialize(
//       delegatePoolInstance.address
//     );

//     await delegatePoolInstance.setParams(
//       quo.address,
//       bribeManagerInstance.address,
//       delegatePoolVirtualBalanceRewardPoolInstance.address,
//       nativeZapper.address,
//       owner.address
//     );

//     await bribeManagerInstance.setParams(
//       gaugeVoting.address,
//       veCake.address,
//       voterProxyInstance.address,
//       vlQuoV2.address,
//       nativeZapper.address,
//       delegatePoolInstance.address
//     );

//     const firstGauge = await gaugeVoting.gauges(0);
//     const secondGauge = await gaugeVoting.gauges(1);
//     const thirdGauge = await gaugeVoting.gauges(2);

//     const firstVirtualBalanceRewardPool =
//       await virtualBalanceRewardPool.deploy();
//     await firstVirtualBalanceRewardPool.initialize(
//       bribeManagerInstance.address
//     );

//     const secondVirtualBalanceRewardPool =
//       await virtualBalanceRewardPool.deploy();
//     await secondVirtualBalanceRewardPool.initialize(
//       bribeManagerInstance.address
//     );

//     const thirdVirtualBalanceRewardPool =
//       await virtualBalanceRewardPool.deploy();
//     await thirdVirtualBalanceRewardPool.initialize(
//       bribeManagerInstance.address
//     );

//     // add gauge to bribe manager
//     await bribeManagerInstance.addPool(
//       firstGauge.pairAddress,
//       firstGauge.chainId,
//       firstVirtualBalanceRewardPool.address
//     );
//     await bribeManagerInstance.addPool(
//       secondGauge.pairAddress,
//       secondGauge.chainId,
//       secondVirtualBalanceRewardPool.address
//     );
//     await bribeManagerInstance.addPool(
//       thirdGauge.pairAddress,
//       thirdGauge.chainId,
//       thirdVirtualBalanceRewardPool.address
//     );

//     return {
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       user1HolderVlquo,
//       user2HolderVlquo,
//       veCake,
//       cake,
//       gaugeVoting,
//       bribeManagerInstance,
//       delegatePoolInstance,
//       firstVirtualBalanceRewardPool,
//       secondVirtualBalanceRewardPool,
//       thirdVirtualBalanceRewardPool,
//       firstGauge,
//       secondGauge,
//       thirdGauge,
//     };
//   }

//   it("deploy attach success", async () => {
//     await deployFixture();
//   });

//   it("Vote for gauge1, and gauge2", async () => {
//     const {
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       user1HolderVlquo,
//       user2HolderVlquo,
//       veCake,
//       cake,
//       gaugeVoting,
//       bribeManagerInstance,
//       delegatePoolInstance,
//       firstVirtualBalanceRewardPool,
//       secondVirtualBalanceRewardPool,
//       thirdVirtualBalanceRewardPool,
//       firstGauge,
//       secondGauge,
//       thirdGauge,
//     } = await deployFixture();

//     // const getBalance = user1HolderVlquo.

//     await bribeManagerInstance
//       .connect(user1HolderVlquo)
//       .vote(
//         [firstGauge.pairAddress, secondGauge.pairAddress],
//         [firstGauge.chainId, secondGauge.chainId],
//         [100, 100]
//       );

//     const balanceVirtual = await firstVirtualBalanceRewardPool.balanceOf(
//       user1HolderVlquo.address
//     );
//     console.log({ balanceVirtual });

//     const balanceVirtual2 = await secondVirtualBalanceRewardPool.balanceOf(
//       user1HolderVlquo.address
//     );
//     console.log({ balanceVirtual2 });

//     const balanceVirtual3 = await thirdVirtualBalanceRewardPool.balanceOf(
//       user1HolderVlquo.address
//     );
//     console.log({ balanceVirtual3 });
//   });
// });
