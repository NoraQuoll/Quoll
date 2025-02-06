import { ethers, network } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";

import { expect } from "chai";

import { MockERC20__factory, MockERC721__factory } from "../typechain-types";

describe("PCS Campaign", function () {
  async function deployFixture() {
    const [
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      treasury,
    ] = await ethers.getSigners();

    //deploy cake
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const cake = await MockERC20.deploy();

    //deploy qCAKE
    const QuollExternalToken = await ethers.getContractFactory(
      "QuollExternalToken"
    );
    const qCake = await QuollExternalToken.deploy();
    await qCake.initialize("Quoll Cake", "qCake");

    //deploy squad
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const squad = await MockERC20.deploy();

    //deploy QMilePTS
    const QMilesPts = await ethers.getContractFactory("QMilesPts");
    const qMilesPts = await QMilesPts.deploy();
    await qMilesPts.initialize();

    //deploy voterProxy
    const voterProxy = await ethers.getContractFactory("PCSVoterProxy");
    const voterProxyInstance = await voterProxy.deploy();
    await voterProxyInstance.initialize();

    const virtualBalanceRewardPool = await ethers.getContractFactory(
      "VirtualBalanceRewardPool"
    );
    const qCakeRewardPool = await virtualBalanceRewardPool.deploy();

    //deploy PCSDepositor
    const PCSDepositor = await ethers.getContractFactory("PCSDepositor");
    const pancakeDepositor = await PCSDepositor.deploy();
    await pancakeDepositor.initialize();

    await qCakeRewardPool.initialize(pancakeDepositor.address);

    //deploy referral
    const Referral = await ethers.getContractFactory("Referral");
    const referral = await Referral.deploy();
    await referral.initialize();

    //deploy PCSReferralCampaignLens
    const PCSReferralCampaignLens = await ethers.getContractFactory(
      "PCSReferralCampaignLens"
    );
    const referralCampaignLens = await PCSReferralCampaignLens.deploy();
    await referralCampaignLens.initialize();

    //deploy camppaign
    const BootstrapPCS = await ethers.getContractFactory("PCSBootstrap");
    const bootstrapPCS = await BootstrapPCS.deploy();
    await bootstrapPCS.initialize();

    //set up
    await qCake.setOperator(pancakeDepositor.address, true);
    await referralCampaignLens.setAccess(bootstrapPCS.address, true);
    await qMilesPts.setAccess(referralCampaignLens.address, true);
    await referral.setAccess(referralCampaignLens.address, true);

    //set up campagin
    await bootstrapPCS.initPool(
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 2592000
    );
    await bootstrapPCS.setParams(
      qCake.address,
      cake.address,
      pancakeDepositor.address,
      referralCampaignLens.address
    );

    await pancakeDepositor.setParams(
      cake.address,
      voterProxyInstance.address,
      qCake.address,
      qCakeRewardPool.address
    );

    await referralCampaignLens.setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral.address,
      qMilesPts.address,
      squad.address,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "0",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
      ],
      [
        "1000000000000000000",
        "1200000000000000000",
        "1500000000000000000",
        "2000000000000000000",
        "2500000000000000000",
        "3000000000000000000",
      ]
    );
    return {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    };
  }
  it("deploy attach success", async () => {
    await deployFixture();
  });


  it("should convert correctly", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "1100000000000000000000");
    //mint nft
    await squad.mint(user1.address, 1);
    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "1100000000000000000000");
    await bootstrapPCS
      .connect(user1)
      .convert("1000000000000000000000", "", "newLink");
    expect(await qCake.balanceOf(user1.address)).to.eq(
      "1000000000000000000000"
    );
  });

  //Referral program :
  // Multiplicator base : 1
  // 1 Ref —> x1.1
  // 2 Ref —> 1.11
  // So 0.01 per additional ref
  // Until 10
  // 0.02 additional ref until 50
  // 0.03 additional ref until 100
  it("should find correct multiplier", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "1100000000000000000000");
    await cake.mint(user2.address, "1100000000000000000000");
    await cake.mint(user3.address, "1100000000000000000000");
    await cake.mint(user4.address, "1100000000000000000000");

    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "1100000000000000000000");
    await cake
      .connect(user2)
      .approve(bootstrapPCS.address, "1100000000000000000000");
    await cake
      .connect(user3)
      .approve(bootstrapPCS.address, "1100000000000000000000");
    await cake
      .connect(user4)
      .approve(bootstrapPCS.address, "1100000000000000000000");

    await bootstrapPCS
      .connect(user1)
      .convert("1000000000000000000000", "", "newLink");

    await referral.setAccess(owner.address, true);
    await referral.referralRegister("newLink", user2.address);

    const multiplier = await referralCampaignLens.findRefMultiplier(
      user1.address
    );

    // 1 ref --> 1.01 (10100)
    expect(await referralCampaignLens.findRefMultiplier(user1.address)).to.eq(
      "10100"
    );

    //10 ref --> 1.01 + 9*0.01 = 1.1 (11000)
    for (let i = 0; i < 9; i++) {
      const user = ethers.Wallet.createRandom();
      await referral.referralRegister("newLink", user.address);
    }
    expect(await referralCampaignLens.findRefMultiplier(user1.address)).to.eq(
      "11000"
    );

    //12 ref --> 1.1  + 0.02*2 = 1.14 (11400)
    for (let i = 0; i < 2; i++) {
      const user = ethers.Wallet.createRandom();
      await referral.referralRegister("newLink", user.address);
    }
    expect(await referralCampaignLens.findRefMultiplier(user1.address)).to.eq(
      "11400"
    );

    //50 ref = 1.01 + 9*0.01 + 0.02 * 40 = 1.9 (19000)
    for (let i = 0; i < 38; i++) {
      const user = ethers.Wallet.createRandom();
      await referral.referralRegister("newLink", user.address);
    }
    expect(await referralCampaignLens.findRefMultiplier(user1.address)).to.eq(
      "19000"
    );
  });

  //Tiers :
  // 1-1000 CAKE —> 1 Pts/CAKE
  // 1000-5000 —> 1.2 Pts/CAKE
  // 5000-10000 —> 1.5 Pts/CAKE

  // VIP Status 10000-50000 CAKE —> 2 Pts/CAKE
  // VIP Gold Status 50000-100000 —> 2.5 Pts/CAKE
  // VIP Platinum Status >100000 —> 3 Pts/CAKE

  it("should get correct PTS amount", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "1100000000000000000000");
    await cake.mint(user2.address, "2500000000000000000000");
    await cake.mint(user3.address, "75000000000000000000000");
    await cake.mint(user4.address, "125000000000000000000000");
    await cake.mint(user5.address, "700000000000000000000000");
    await cake.mint(user6.address, "1250000000000000000000000");

    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "1100000000000000000000");
    await cake
      .connect(user2)
      .approve(bootstrapPCS.address, "2500000000000000000000");
    await cake
      .connect(user3)
      .approve(bootstrapPCS.address, "75000000000000000000000");
    await cake
      .connect(user4)
      .approve(bootstrapPCS.address, "12500000000000000000000");
    await cake
      .connect(user5)
      .approve(bootstrapPCS.address, "700000000000000000000000");
    await cake
      .connect(user6)
      .approve(bootstrapPCS.address, "1250000000000000000000000");

    await bootstrapPCS
      .connect(user1)
      .convert("1000000000000000000000", "", "newLink");

    //1-1000 CAKE —> 1 Pts/CAKE => 1000 Cake -> 1000 qMilePts
    expect(await referralCampaignLens.userUnClaimedPTS(user1.address)).to.eq(
      "1000000000000000000000"
    );

    await bootstrapPCS
      .connect(user2)
      .convert("2500000000000000000000", "", "newLink2");
    //1-1000 CAKE —> 1 Pts/CAKE => 1000 Cake -> 1000 qMilePts
    //1000-5000 —> 1.2 Pts/CAKE => 1500 Cake -> 1800 qMilePts
    //=> Sum = 1000 + 1800 = 2800
    console.log(await referralCampaignLens.userUnClaimedPTS(user2.address)); //2799999999999999999998

    await bootstrapPCS
      .connect(user3)
      .convert("7500000000000000000000", "", "newLink3");
    //1-1000 CAKE —> 1 Pts/CAKE =>  1000 Cake -> 1000 qMilePts
    //1000-5000 —> 1.2 Pts/CAKE =>  4000 Cake -> 4800 qMilePts
    //5000-10000 —> 1.5 Pts/CAKE => 2500 Cake -> 2750 qMilePts
    //Sum = 1000 + 4800 + 2750 = 9550
    console.log(await referralCampaignLens.userUnClaimedPTS(user3.address)); //9549999999999999999996

    await bootstrapPCS
      .connect(user4)
      .convert("12500000000000000000000", "", "newLink4");
    //1-1000 CAKE —> 1 Pts/CAKE =>  1000 Cake -> 1000 qMilePts
    //1000-5000 —> 1.2 Pts/CAKE =>  4000 Cake -> 4800 qMilePts
    //5000-10000 —> 1.5 Pts/CAKE => 5000 Cake -> 7500 qMilePts
    //10000-50000 -> 2 Pts/CAKE =>  2500 Cake -> 5000 qMilePts
    //Sum = 1000 + 4800 + 7500 + 5000 = 18300
    console.log(await referralCampaignLens.userUnClaimedPTS(user4.address)); //18299999999999999999994

    await bootstrapPCS
      .connect(user5)
      .convert("70000000000000000000000", "", "newLink5");
    //1-1000 CAKE —> 1 Pts/CAKE =>    1000 Cake -> 1000 qMilePts
    //1000-5000 —> 1.2 Pts/CAKE =>    4000 Cake -> 4800 qMilePts
    //5000-10000 —> 1.5 Pts/CAKE =>   5000 Cake -> 7500 qMilePts
    //10000-50000 -> 2 Pts/CAKE =>    40000 Cake ->80000 qMilePts
    //50000-100000 —> 2.5 Pts/CAKE => 20000 Cake ->50000 qMilePts

    //Sum = 1000 + 4800 + 7500 + 80000  + 50000 = 143300
    console.log(await referralCampaignLens.userUnClaimedPTS(user5.address)); //143299999999999999999991

    await bootstrapPCS
      .connect(user6)
      .convert("125000000000000000000000", "", "newLink6");
    //1-1000 CAKE —> 1 Pts/CAKE =>    1000 Cake -> 1000 qMilePts
    //1000-5000 —> 1.2 Pts/CAKE =>    4000 Cake -> 4800 qMilePts
    //5000-10000 —> 1.5 Pts/CAKE =>   5000 Cake -> 7500 qMilePts
    //10000-50000 -> 2 Pts/CAKE =>    40000 Cake ->80000 qMilePts
    //50000-100000 —> 2.5 Pts/CAKE => 50000 Cake ->125000 qMilePts
    //>100000 —> 3 Pts/CAKE ==>       25000 Cake -> 75000 qMilePts
    //Sum = 1000 + 4800 + 7500 + 80000  + 125000 + 75000 = 293300
    console.log(await referralCampaignLens.userUnClaimedPTS(user6.address)); //293299999999999999999988
  });

  it("should  convert 2 times in the same state ", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "1600000000000000000000");

    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "1600000000000000000000");

    // first convert 1100 => qMilePts = 1000 + 100*1.2 = 1120
    await bootstrapPCS
      .connect(user1)
      .convert("1100000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //1119999999999999999998

    // second convert 500 => qMilePts = 1000 + 100*1.2  + 500*1.2 = 1720
    await bootstrapPCS
      .connect(user1)
      .convert("500000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //1719999999999999999998
  });

  it("should convert 2 times in the diff state", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "1600000000000000000000");
  
    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "1600000000000000000000");

    // first convert 900 => qMilePts = 900
    await bootstrapPCS
      .connect(user1)
      .convert("900000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //900000000000000000000

    // second convert 1000 => qMilePts = 1000 +  400*1.2  = 1480
    await bootstrapPCS
      .connect(user1)
      .convert("500000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //1479999999999999999998
  });

  it("should convert 2 times in the diff state - scenario 2", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "20000000000000000000000");

    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "20000000000000000000000");

    // first convert 900 => qMilePts = 900
    await bootstrapPCS
      .connect(user1)
      .convert("900000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //900000000000000000000

    // second convert 6000 => qMilePts = 1000 +  4000*1.2 + 2000*1.5 = 8800
    await bootstrapPCS
      .connect(user1)
      .convert("6100000000000000000000", "", "newLink");
    console.log(await referralCampaignLens.userUnClaimedPTS(user1.address)); //8799999999999999999996
  });

  it("should NFT holder claim pts", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "20000000000000000000000");
    await squad.mint(user1.address, 1);
    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "20000000000000000000000");

    // first convert 1000 => qMilePts = 1000
    await bootstrapPCS
      .connect(user1)
      .convert("1000000000000000000000", "", "newLink");
    expect(await referralCampaignLens.userUnClaimedPTS(user1.address)).to.eq("1000000000000000000000");

    await referralCampaignLens.connect(user1).claimPts();
    expect(await qMilesPts.balanceOf(user1.address)).to.eq("1100000000000000000000");
  })

  it("should user wit no NFT claim pts", async () => {
    const {
      owner,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      treasury,
      cake,
      qCake,
      squad,
      qMilesPts,
      referral,
      referralCampaignLens,
      bootstrapPCS,
    } = await deployFixture();
    await cake.mint(user1.address, "20000000000000000000000");
    //await squad.mint(user1.address, 1);
    await cake
      .connect(user1)
      .approve(bootstrapPCS.address, "20000000000000000000000");

    // first convert 1000 => qMilePts = 1000
    await bootstrapPCS
      .connect(user1)
      .convert("1000000000000000000000", "", "newLink");
    expect(await referralCampaignLens.userUnClaimedPTS(user1.address)).to.eq("1000000000000000000000");

    await referralCampaignLens.connect(user1).claimPts();
    expect(await qMilesPts.balanceOf(user1.address)).to.eq("1000000000000000000000");
  })
});
