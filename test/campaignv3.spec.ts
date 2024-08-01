import { ethers } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";
import { expect } from "chai";

describe("", function () {
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

    // deploy campaign
    const CampaignRewardPoolV3 = await ethers.getContractFactory(
      "CampaignRewardPoolV3"
    );
    const campaignRewardPoolV3 = await CampaignRewardPoolV3.deploy();

    await campaignRewardPoolV3.initialize();

    // deploy THE
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const the = await MockERC20.deploy();

    // deploy qThe
    const QuollExternalToken = await ethers.getContractFactory(
      "QuollExternalToken"
    );
    const qThe = await QuollExternalToken.deploy();

    await qThe.initialize("qTHE", "qTHE");

    // theDepositor
    const ThenaDepositor = await ethers.getContractFactory("ThenaDepositor");
    const thenaDepositor = await ThenaDepositor.deploy();

    await thenaDepositor.initialize(the.address, qThe.address);

    // referral
    const Referral = await ethers.getContractFactory("Referral");
    const referral = await Referral.deploy();

    await referral.initialize();

    // ReferralCampaignLens

    const ReferralCampaignLens = await ethers.getContractFactory(
      "ReferralCampaignLens"
    );
    const referralCampaignLens = await ReferralCampaignLens.deploy();

    await referralCampaignLens.initialize();

    // ReferralCampaignLens

    const QMilesPts = await ethers.getContractFactory("QMilesPts");
    const qMilesPts = await QMilesPts.deploy();

    await qMilesPts.initialize();

    await qThe.setOperator(thenaDepositor.address);
    await referralCampaignLens.setAccess(campaignRewardPoolV3.address, true);
    await qMilesPts.setAccess(referralCampaignLens.address, true);
    await referral.setAccess(referralCampaignLens.address, true);

    return {
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
      campaignRewardPoolV3,
      the,
      qThe,
      thenaDepositor,
      referral,
      referralCampaignLens,
      qMilesPts,
    };
  }

  it("deploy should success", async () => {
    await deployFixture();
  });

  it("should setup data correctly", async () => {
    const {
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
      campaignRewardPoolV3,
      the,
      qThe,
      thenaDepositor,
      referral,
      referralCampaignLens,
      qMilesPts,
    } = await deployFixture();

    await referralCampaignLens.setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral.address,
      qMilesPts.address,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "1000000000000000000",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
      ],
      [
        "1000000000000000000",
        "1250000000000000000",
        "1500000000000000000",
        "3000000000000000000",
        "4000000000000000000",
        "5000000000000000000",
      ]
    );

    await campaignRewardPoolV3.setParams(
      qThe.address,
      the.address,
      thenaDepositor.address,
      referralCampaignLens.address
    );

    await campaignRewardPoolV3.initPool(
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 2592000
    );
  });

  it("should convert >= 1000  to get link successful", async () => {
    const {
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
      campaignRewardPoolV3,
      the,
      qThe,
      thenaDepositor,
      referral,
      referralCampaignLens,
      qMilesPts,
    } = await deployFixture();

    await referralCampaignLens.setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral.address,
      qMilesPts.address,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "1000000000000000000",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
      ],
      [
        "1000000000000000000",
        "1250000000000000000",
        "1500000000000000000",
        "3000000000000000000",
        "4000000000000000000",
        "5000000000000000000",
      ]
    );

    await campaignRewardPoolV3.setParams(
      qThe.address,
      the.address,
      thenaDepositor.address,
      referralCampaignLens.address
    );

    await campaignRewardPoolV3.initPool(
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 2592000
    );

    await the.mint(user1.address, "1100000000000000000000");

    await the
      .connect(user1)
      .approve(campaignRewardPoolV3.address, "1100000000000000000000");

    await campaignRewardPoolV3
      .connect(user1)
      .convert("1100000000000000000000", "", "newLink");

    // get user link
    const data = await referral.referralLinkFromUser(user1.address);
    console.log(data);

    const qTheAmount = await qThe.balanceOf(user1.address);
    console.log({ qTheAmount });

    const mileAmount = await qMilesPts.balanceOf(user1.address);
    console.log({ mileAmount });
  });

  it("should convert < 1000 successful", async () => {
    const {
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
      campaignRewardPoolV3,
      the,
      qThe,
      thenaDepositor,
      referral,
      referralCampaignLens,
      qMilesPts,
    } = await deployFixture();

    await referralCampaignLens.setParams(
      "1000000000000000000000",
      "500000000000000000000",
      "200000000000000000000",
      referral.address,
      qMilesPts.address,
      ["1", "11", "51"],
      ["100", "200", "300"],
      [
        "1000000000000000000",
        "1000000000000000000001",
        "5000000000000000000001",
        "10000000000000000000001",
        "50000000000000000000001",
        "100000000000000000000001",
      ],
      [
        "1000000000000000000",
        "1250000000000000000",
        "1500000000000000000",
        "3000000000000000000",
        "4000000000000000000",
        "5000000000000000000",
      ]
    );

    await campaignRewardPoolV3.setParams(
      qThe.address,
      the.address,
      thenaDepositor.address,
      referralCampaignLens.address
    );

    await campaignRewardPoolV3.initPool(
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 2592000
    );

    await the.mint(user1.address, "1000000000000000000000");

    await the
      .connect(user1)
      .approve(campaignRewardPoolV3.address, "1000000000000000000000");

    await campaignRewardPoolV3
      .connect(user1)
      .convert("100000000000000000000", "", "newLink");

    // get user link
    const data = await referral.referralLinkFromUser(user1.address);
    console.log(data);
  });

  it("", async () => {});
});
