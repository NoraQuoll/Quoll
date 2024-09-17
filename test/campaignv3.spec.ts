// import { ethers } from "hardhat";

// import { assert } from "console";
// import * as ethersI from "ethers";

// import { currentTime, increase, increaseTo } from "./utils/time";

// import { expect } from "chai";

// describe("campaignV3", function () {
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

//     // deploy campaign
//     const CampaignRewardPoolV3 = await ethers.getContractFactory(
//       "CampaignRewardPoolV3"
//     );
//     const campaignRewardPoolV3 = await CampaignRewardPoolV3.deploy();

//     await campaignRewardPoolV3.initialize();

//     // deploy THE
//     const MockERC20 = await ethers.getContractFactory("MockERC20");
//     const the = await MockERC20.deploy();

//     // deploy qThe
//     const QuollExternalToken = await ethers.getContractFactory(
//       "QuollExternalToken"
//     );
//     const qThe = await QuollExternalToken.deploy();

//     await qThe.initialize("qTHE", "qTHE");

//     // theDepositor
//     const ThenaDepositor = await ethers.getContractFactory("ThenaDepositor");
//     const thenaDepositor = await ThenaDepositor.deploy();

//     await thenaDepositor.initialize(the.address, qThe.address);

//     // referral
//     const Referral = await ethers.getContractFactory("Referral");
//     const referral = await Referral.deploy();

//     await referral.initialize();

//     // ReferralCampaignLens

//     const ReferralCampaignLens = await ethers.getContractFactory(
//       "ReferralCampaignLens"
//     );
//     const referralCampaignLens = await ReferralCampaignLens.deploy();

//     await referralCampaignLens.initialize();

//     // ReferralCampaignLens

//     const QMilesPts = await ethers.getContractFactory("QMilesPts");
//     const qMilesPts = await QMilesPts.deploy();

//     await qMilesPts.initialize();

//     await qThe.setOperator(thenaDepositor.address);
//     await referralCampaignLens.setAccess(campaignRewardPoolV3.address, true);
//     await qMilesPts.setAccess(referralCampaignLens.address, true);
//     await referral.setAccess(referralCampaignLens.address, true);

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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     };
//   }

//   it("deploy should success", async () => {
//     await deployFixture();
//   });

//   it("should setup data correctly", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );
//   });

//   it("should convert >= 1000  to get link successful", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1100000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1100000000000000000000", "", "newLink");

//     // get user link
//     const data = await referral.referralLinkFromUser(user1.address);

//     const qTheAmount = await qThe.balanceOf(user1.address);
//     console.log({ qTheAmount });

//     const mileAmount = await qMilesPts.balanceOf(user1.address);
//     console.log({ mileAmount });
//   });

//   it("should convert < 1000 successful", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1000000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1000000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("100000000000000000000", "", "newLink");

//     // get user link
//     const data = await referral.referralLinkFromUser(user1.address);
//     console.log(data);
//   });

//   it("should convert after endCampaign fail", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000) - 2592000,
//       Math.floor(Date.now() / 1000) - 1
//     );

//     await the.mint(user1.address, "1100000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");
//     try {
//       await campaignRewardPoolV3
//         .connect(user1)
//         .convert("1100000000000000000000", "", "newLink");
//     } catch (e) {
//       expect(e?.toString()).to.contain("Not in campaign times");
//     }
//   });

//   it("should ref amount increase", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1100000000000000000000");
//     await the.mint(user2.address, "1100000000000000000000");
//     await the.mint(user3.address, "1100000000000000000000");
//     await the.mint(user4.address, "1100000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user2)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user3)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user4)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1100000000000000000000", "", "newLink");

//     assert(
//       "0" == (await referral.getRefAmountFromUser(user1.address)).toString()
//     );

//     await campaignRewardPoolV3
//       .connect(user2)
//       .convert("200000000000000000000", "newLink", "newLink2");

//     // ref amount of user 1 should increase by 1
//     assert(
//       "1" == (await referral.getRefAmountFromUser(user1.address)).toString()
//     );

//     await campaignRewardPoolV3
//       .connect(user3)
//       .convert("200000000000000000000", "newLink", "newLink3");
//     await campaignRewardPoolV3
//       .connect(user4)
//       .convert("200000000000000000000", "newLink", "newLink4");

//     // ref amount of user 1 should increase by 2
//     assert(
//       "3" == (await referral.getRefAmountFromUser(user1.address)).toString()
//     );
//   });

//   it("should get welcome offer with refferal", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1100000000000000000000");
//     await the.mint(user2.address, "1100000000000000000000");
//     await the.mint(user3.address, "1100000000000000000000");
//     await the.mint(user4.address, "1100000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user2)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user3)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user4)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1000000000000000000000", "", "newLink");

//     assert(
//       "1000000000000000000000" ==
//       (await qMilesPts.balanceOf(user1.address)).toString()
//     );
//     const qMilePts = await qMilesPts.balanceOf(user1.address);
//     console.log(qMilePts);

//     await campaignRewardPoolV3
//       .connect(user2)
//       .convert("1000000000000000000000", "newLink", "newLink2");

//     assert(
//       "1500000000000000000000" ==
//       (await qMilesPts.balanceOf(user2.address)).toString()
//     );
//     const qMilePts2 = await qMilesPts.balanceOf(user2.address);
//     console.log(qMilePts2);
//   });
//   ''
//   it("should find correct multiplier", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1100000000000000000000");
//     await the.mint(user2.address, "1100000000000000000000");
//     await the.mint(user3.address, "1100000000000000000000");
//     await the.mint(user4.address, "1100000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user2)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user3)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user4)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1000000000000000000000", "", "newLink");

//     assert(
//       "10000" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//     await referral.setAccess(owner.address, true);
//     await referral.referralRegister("newLink", user2.address);
//     await referral.referralRegister("newLink", user3.address);
//     await referral.referralRegister("newLink", user4.address);
//     await referral.referralRegister("newLink", user5.address);

//     const multiplier = await referralCampaignLens.findRefMultiplier(
//       user1.address
//     );

//     // 1 + 4 * 0.01 = 1.04
//     console.log(multiplier);
//     assert(
//       "10400" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//     //register 8 refferals - total: 12
//     for (let i = 0; i < 8; i++) {
//       const user = ethers.Wallet.createRandom();

//       await referral.referralRegister("newLink", user.address);
//     }
//     // 1 + 10*0.01 + 2*0.2 = 1.14 
//     console.log(await referralCampaignLens.findRefMultiplier(
//       user1.address));
//     assert(
//       "11400" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//     //register 38 refferal  - total: 50
//     for (let i = 0; i < 38; i++) {
//       const user = ethers.Wallet.createRandom();

//       await referral.referralRegister("newLink", user.address);
//     }
//     // 1 + 10*0.01 + 40*0.02 = 1.9
//     console.log(await referralCampaignLens.findRefMultiplier(
//       user1.address));
//     assert(
//       "19000" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//     //register 25 refferal  - total: 75
//     for (let i = 0; i < 25; i++) {
//       const user = ethers.Wallet.createRandom();

//       await referral.referralRegister("newLink", user.address);
//     }
//     // 1 + 10*0.01 + 40*0.02 +  25*0.03 = 2.65
//     console.log(await referralCampaignLens.findRefMultiplier(
//       user1.address));
//     assert(
//       "26500" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//     //register 30 refferal  - total: 105
//     for (let i = 0; i < 30; i++) {
//       const user = ethers.Wallet.createRandom();

//       await referral.referralRegister("newLink", user.address);
//     }
//     // 1 + 10*0.01 + 40*0.02 +  55*0.03 = 3.55
//     console.log(await referralCampaignLens.findRefMultiplier(
//       user1.address));
//     assert(
//       "35500" ==
//       (await referralCampaignLens.findRefMultiplier(user1.address)).toString()
//     );

//   });

//   it("should get correct PTS amount", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "1100000000000000000000");
//     await the.mint(user2.address, "2500000000000000000000");
//     await the.mint(user3.address, "7500000000000000000000");
//     await the.mint(user4.address, "12500000000000000000000");
//     await the.mint(user5.address, "75000000000000000000000");
//     await the.mint(user6.address, "125000000000000000000000");



//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "1100000000000000000000");

//     await the
//       .connect(user2)
//       .approve(campaignRewardPoolV3.address, "2500000000000000000000");

//     await the
//       .connect(user3)
//       .approve(campaignRewardPoolV3.address, "7500000000000000000000");

//     await the
//       .connect(user4)
//       .approve(campaignRewardPoolV3.address, "12500000000000000000000");


//     await the
//       .connect(user5)
//       .approve(campaignRewardPoolV3.address, "75000000000000000000000");

//     await the
//       .connect(user6)
//       .approve(campaignRewardPoolV3.address, "125000000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("500000000000000000000", "", "newLink");

//     assert(
//       "500000000000000000000" ==
//       (await qMilesPts.balanceOf(user1.address)).toString()
//     );
//     const qMilePts = await qMilesPts.balanceOf(user1.address);
//     console.log(qMilePts);

//     await campaignRewardPoolV3
//       .connect(user2)
//       .convert("2500000000000000000000", "", "newLink2");

//     //1000*1 + 1500*1.25 =  2875

//     const qMilePts2 = await qMilesPts.balanceOf(user2.address);
//     console.log(qMilePts2);

//     await campaignRewardPoolV3
//       .connect(user3)
//       .convert("7500000000000000000000", "", "newLink3");

//     //1000*1 + 4000*1.25 + 2500*1.5 = 9750

//     const qMilePts3 = await qMilesPts.balanceOf(user3.address);
//     console.log(qMilePts3);

//     await campaignRewardPoolV3
//       .connect(user4)
//       .convert("12500000000000000000000", "", "newLink4");

//     //1000*1 + 4000*1.25 + 5000*1.5 + 2500*3 = 21000
//     const qMilePts4 = await qMilesPts.balanceOf(user4.address);
//     console.log(qMilePts4);

//     await campaignRewardPoolV3
//       .connect(user5)
//       .convert("75000000000000000000000", "", "newLink5");

//     //1000*1 + 4000*1.25 + 5000*1.5 + 40000*3 + 25000*4 = 233500
//     const qMilePts5 = await qMilesPts.balanceOf(user5.address);
//     console.log(qMilePts5);

//     //VIP Platinum Status 
//     await campaignRewardPoolV3
//       .connect(user6)
//       .convert("125000000000000000000000", "", "newLink6");

//     //1000*1 + 4000*1.25 + 5000*1.5 + 40000*3 + 50000*4  + 25000*5 = 458500
//     const qMilePts6 = await qMilesPts.balanceOf(user6.address);
//     console.log(qMilePts6);

//   });

//   it("should convert max token successful", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "110000000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "110000000000000000000000");

//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("110000000000000000000000", "", "newLink");

//     // get user link
//     const qTheAmount = await qThe.balanceOf(user1.address);
//     console.log({ qTheAmount });

//     const mileAmount = await qMilesPts.balanceOf(user1.address);
//     console.log({ mileAmount });
//   });

//   it("should convert 2 times in the same state", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "110000000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "110000000000000000000000");

//     // convert 1100 -> 1000 + 100 * 1.25
//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1100000000000000000000", "", "newLink");

//     //  convert 1000 -> 1000  * 1.25 -> total = 2375
//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1000000000000000000000", "", "newLink");

//     // get user link
//     const qTheAmount = await qThe.balanceOf(user1.address);
//     console.log({ qTheAmount });

//     const mileAmount = await qMilesPts.balanceOf(user1.address);
//     console.log({ mileAmount });
//   });

//   it("should convert 2 times in the diff state", async () => {
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
//       campaignRewardPoolV3,
//       the,
//       qThe,
//       thenaDepositor,
//       referral,
//       referralCampaignLens,
//       qMilesPts,
//     } = await deployFixture();

//     await referralCampaignLens.setParams(
//       "1000000000000000000000",
//       "500000000000000000000",
//       "200000000000000000000",
//       referral.address,
//       qMilesPts.address,
//       ["1", "11", "51"],
//       ["100", "200", "300"],
//       [
//         "0",
//         "1000000000000000000001",
//         "5000000000000000000001",
//         "10000000000000000000001",
//         "50000000000000000000001",
//         "100000000000000000000001",
//       ],
//       [
//         "1000000000000000000",
//         "1250000000000000000",
//         "1500000000000000000",
//         "3000000000000000000",
//         "4000000000000000000",
//         "5000000000000000000",
//       ]
//     );

//     await campaignRewardPoolV3.setParams(
//       qThe.address,
//       the.address,
//       thenaDepositor.address,
//       referralCampaignLens.address
//     );

//     await campaignRewardPoolV3.initPool(
//       Math.floor(Date.now() / 1000),
//       Math.floor(Date.now() / 1000) + 2592000
//     );

//     await the.mint(user1.address, "110000000000000000000000");

//     await the
//       .connect(user1)
//       .approve(campaignRewardPoolV3.address, "110000000000000000000000");

//     // convert 1100 -> 1000 + 100 * 1.25
//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("1100000000000000000000", "", "newLink");

//     //  convert 4000 -> 3900  * 1.25 + 100 * 1.5 -> total = 6150
//     await campaignRewardPoolV3
//       .connect(user1)
//       .convert("4000000000000000000000", "", "newLink");

//     // get user link
//     const qTheAmount = await qThe.balanceOf(user1.address);
//     console.log({ qTheAmount });

//     const mileAmount = await qMilesPts.balanceOf(user1.address);
//     console.log({ mileAmount });
//   });
// });
