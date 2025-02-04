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

// describe("qMiles Pool", function () {
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
//     const QMilesPts = await ethers.getContractFactory("QMilesPts");
//     const qMilesPts = await QMilesPts.deploy();

//     await qMilesPts.initialize();

//     const QMilesPool = await ethers.getContractFactory("QMilesPool");
//     const qMilesPool = await QMilesPool.deploy();

//     await qMilesPool.initialize(qMilesPts.address);

//     await qMilesPts.mint(user1.address, 10000);
//     await qMilesPts.connect(user1).approve(qMilesPool.address, 10000);

//     await qMilesPts.setAccess(qMilesPool.address, true);

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
//       qMilesPts,
//       qMilesPool,
//     };
//   }

//   it("deploy should success", async () => {
//     await deployFixture();
//   });

//   it("user 1 deposit", async () => {
//     const {
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
//       qMilesPts,
//       qMilesPool,
//     } = await deployFixture();

//     await qMilesPool.connect(user1).deposit(100);

//     // get data
//     let dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);

//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);
//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);

//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);

//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);
//   });

//   it("user 1 deposit", async () => {
//     const {
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
//       qMilesPts,
//       qMilesPool,
//     } = await deployFixture();

//     await qMilesPool.connect(user1).deposit(100);

//     // get data
//     let dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     await qMilesPool.connect(user1).deposit(100);

//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);
//   });

//   it("withdraw ", async () => {
//     const {
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
//       qMilesPts,
//       qMilesPool,
//     } = await deployFixture();

//     await qMilesPool.connect(user1).deposit(100);

//     // get data
//     let dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     await increase(604800);
//     await qMilesPool.connect(user1).deposit(100);

//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);

//     await qMilesPool.connect(user1).withdraw([1, 0]);
//     dataBefore = await qMilesPool.getStakingData(user1.address);
//     console.log(dataBefore);
//   });
// });
