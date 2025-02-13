// import { ethers } from "hardhat";

// import { assert } from "console";
// import * as ethersI from "ethers";

// import { currentTime, increase, increaseTo } from "./utils/time";
// import { expect } from "chai";
// import {
//   bufferToBytes32,
//   getProofandRoot,
//   hashUserAndAmount,
// } from "../scripts/utils";
// import { MerkleTree } from "merkletreejs";

// const SHA256 = require("crypto-js/sha256");

// describe("vlQuo Minting", function () {
//   async function deployFixture() {
//     const [
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       user8,
//       treasury,
//     ] = await ethers.getSigners();
//     const VlQuoV2 = await ethers.getContractFactory("VlQuoV2");
//     const vlQuoV2 = await VlQuoV2.deploy();

//     vlQuoV2.initialize();

//     const MockERC20 = await ethers.getContractFactory("MockERC20");
//     const quo = await MockERC20.deploy();

//     const reward1 = await MockERC20.deploy();
//     const reward2 = await MockERC20.deploy();
//     const reward3 = await MockERC20.deploy();

//     await reward1.mint(owner.address, "100000000000000000000000");
//     await reward2.mint(owner.address, "100000000000000000000000");
//     await reward3.mint(owner.address, "100000000000000000000000");

//     const BribeManager = await ethers.getContractFactory("BribeManager");
//     const bribeManager = await BribeManager.deploy();
//     bribeManager.initialize();

//     await vlQuoV2.setParams(
//       quo.address,
//       bribeManager.address,
//       treasury.address
//     );

//     const VlQuoRewardPool = await ethers.getContractFactory("VlQuoRewardPool");
//     const vlQuoRewardPool = await VlQuoRewardPool.deploy();
//     await vlQuoRewardPool.initialize(vlQuoV2.address);
//     await vlQuoRewardPool.setAccess(vlQuoV2.address, true);
//     await vlQuoRewardPool.setAccess(owner.address, true);

//     await vlQuoRewardPool.addRewardToken(reward1.address);
//     await vlQuoRewardPool.addRewardToken(reward2.address);
//     await vlQuoRewardPool.addRewardToken(reward3.address);

//     await vlQuoRewardPool.setVlQuo(vlQuoV2.address);

//     await vlQuoV2.setRewardPool(vlQuoRewardPool.address);

//     await reward1.approve(vlQuoRewardPool.address, "100000000000000000000000");
//     await reward2.approve(vlQuoRewardPool.address, "100000000000000000000000");
//     await reward3.approve(vlQuoRewardPool.address, "100000000000000000000000");

//     return {
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       user8,
//       treasury,
//       vlQuoV2,
//       quo,
//       vlQuoRewardPool,
//       reward1,
//       reward2,
//       reward3,
//     };
//   }
//   it("deploy should success", async () => {
//     await deployFixture();
//   });

//   it("should deposit Quo success", async () => {
//     const mintAmount = ethersI.ethers.utils.parseEther("1");
//     const mintAmount2 = ethersI.ethers.utils.parseEther("10");
//     const {
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       treasury,
//       vlQuoV2,
//       quo,
//       vlQuoRewardPool,
//     } = await deployFixture();

//     await quo.mint(user1.address, mintAmount);

//     // user 1 deposit quo
//     await quo.connect(user1).approve(vlQuoV2.address, mintAmount);
//     await vlQuoV2.connect(user1).lock(user1.address, mintAmount, 1);

//     assert("0" == (await quo.balanceOf(user1.address)).toString());
//     assert(
//       "1000000000000000000" ==
//         (await vlQuoV2.balanceOf(user1.address)).toString()
//     );

//     // user 2 deposit quo
//     await quo.mint(user2.address, mintAmount2);
//     await quo.connect(user2).approve(vlQuoV2.address, mintAmount2);
//     await vlQuoV2.connect(user2).lock(user2.address, mintAmount2, 2);

//     assert("0" == (await quo.balanceOf(user2.address)).toString());
//     assert(
//       "20000000000000000000" ==
//         (await vlQuoV2.balanceOf(user2.address)).toString()
//     );
//   });

//   it("should queu new reward success", async () => {
//     const mintAmount = ethersI.ethers.utils.parseEther("1");
//     const mintAmount2 = ethersI.ethers.utils.parseEther("10");
//     const {
//       owner,
//       user1,
//       user2,
//       user3,
//       user4,
//       user5,
//       user6,
//       user7,
//       treasury,
//       vlQuoV2,
//       quo,
//       vlQuoRewardPool,
//       reward1,
//     } = await deployFixture();

//     await quo.mint(user1.address, mintAmount);

//     // user 1 deposit quo
//     await quo.connect(user1).approve(vlQuoV2.address, mintAmount);
//     await vlQuoV2.connect(user1).lock(user1.address, mintAmount, 1);

//     assert("0" == (await quo.balanceOf(user1.address)).toString());
//     assert(
//       "1000000000000000000" ==
//         (await vlQuoV2.balanceOf(user1.address)).toString()
//     );

//     // user 2 deposit quo
//     await quo.mint(user2.address, mintAmount2);
//     await quo.connect(user2).approve(vlQuoV2.address, mintAmount2);
//     await vlQuoV2.connect(user2).lock(user2.address, mintAmount2, 2);

//     assert("0" == (await quo.balanceOf(user2.address)).toString());
//     assert(
//       "20000000000000000000" ==
//         (await vlQuoV2.balanceOf(user2.address)).toString()
//     );

//     await vlQuoRewardPool.queueNewReward(
//       reward1.address,
//       "1000000000000000",
//       Math.floor(Date.now() / 1000) + 86400
//     );

//     const rewardInfo = await vlQuoRewardPool.rewardInfos(reward1.address);
//     console.log(rewardInfo);
//     await increase(100);

//     await vlQuoRewardPool.connect(user1).getReward();

//     console.log(await reward1.balanceOf(user1.address));

//     await quo.mint(user1.address, mintAmount2);

//     // user 1 deposit quo
//     await quo.connect(user1).approve(vlQuoV2.address, mintAmount2);
//     await vlQuoV2.connect(user1).lock(user1.address, mintAmount2, 3);

//     assert("0" == (await quo.balanceOf(user1.address)).toString());

//     assert(
//       "31000000000000000000" ==
//         (await vlQuoV2.balanceOf(user1.address)).toString()
//     );

//     await increase(100);

//     await vlQuoRewardPool.connect(user1).getReward();
//     await vlQuoRewardPool.connect(user2).getReward();

//     console.log(await reward1.balanceOf(user1.address));
//     console.log(await reward1.balanceOf(user2.address));
//   });
// });
