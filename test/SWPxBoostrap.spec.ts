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
        const MockERC20 = await ethers.getContractFactory("SWPx");
        const swpx = await MockERC20.deploy();

        //deploy qCAKE
        const QuollExternalToken = await ethers.getContractFactory(
            "QuollExternalToken"
        );
        const qSWPx = await QuollExternalToken.deploy();
        await qSWPx.initialize("Quoll SWPx", "qSWPx");

        //deploy QMilePTS
        const QMilesPts = await ethers.getContractFactory("QMilesPts");
        const qMilesPts = await QMilesPts.deploy();
        await qMilesPts.initialize();

        //deploy voterProxy
        const voterProxy = await ethers.getContractFactory("SWPxVoterProxy");
        const voterProxyInstance = await voterProxy.deploy();
        await voterProxyInstance.initialize();

        const baseRewardPoolV1 = await ethers.getContractFactory(
            "BaseRewardPoolV1"
        );
        const qSWPxRewardPool = await baseRewardPoolV1.deploy();

        //deploy SWPxDepositor
        const SWPxDepositor = await ethers.getContractFactory("SWPxDepositor");
        const swpxDepositor = await SWPxDepositor.deploy();
        await swpxDepositor.initialize();

        await qSWPxRewardPool.initialize(swpxDepositor.address);

        //deploy referral
        const Referral = await ethers.getContractFactory("Referral");
        const referral = await Referral.deploy();
        await referral.initialize();

        //deploy SWPxReferralCampaignLens
        const SWPxReferralCampaignLens = await ethers.getContractFactory(
            "PCSReferralCampaignLens"
        );
        const referralCampaignLens = await SWPxReferralCampaignLens.deploy();
        await referralCampaignLens.initialize();

        //deploy camppaign
        const BootstrapSWPx = await ethers.getContractFactory("SWPxBoostrap");
        const bootstrapSWPx = await BootstrapSWPx.deploy();
        await bootstrapSWPx.initialize();

        //set up
        await qSWPx.setOperator(swpxDepositor.address, true);
        await referralCampaignLens.setAccess(bootstrapSWPx.address, true);
        await qMilesPts.setAccess(referralCampaignLens.address, true);
        await referral.setAccess(referralCampaignLens.address, true);

        //set up campagin
        await bootstrapSWPx.initPool(
            Math.floor(Date.now() / 1000),
            Math.floor(Date.now() / 1000) + 2592000
        );
        await bootstrapSWPx.setParams(
            qSWPx.address,
            swpx.address,
            swpxDepositor.address,
            referralCampaignLens.address
        );

        await swpxDepositor.setParams(
            swpx.address,
            voterProxyInstance.address,
            qSWPx.address,
            qSWPxRewardPool.address
        );

        // await referralCampaignLens.setParams(
        //   "1000000000000000000000",
        //   "500000000000000000000",
        //   "200000000000000000000",
        //   referral.address,
        //   qMilesPts.address,
        //   squad.address,
        //   ["1", "11", "51"],
        //   ["100", "200", "300"],
        //   [
        //     "0",
        //     "1000000000000000000001",
        //     "5000000000000000000001",
        //     "10000000000000000000001",
        //     "50000000000000000000001",
        //     "100000000000000000000001",
        //   ],
        //   [
        //     "1000000000000000000",
        //     "1200000000000000000",
        //     "1500000000000000000",
        //     "2000000000000000000",
        //     "2500000000000000000",
        //     "3000000000000000000",
        //   ]
        // );
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
            voterProxyInstance,
            swpx,
            qSWPx,
            qMilesPts,
            referral,
            referralCampaignLens,
            bootstrapSWPx,
        };
    }
    it("deploy attach success", async () => {
        await deployFixture();
    });

    it("should convert swpx to qSWPx at 1:1 ratio", async () => {
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
            swpx,
            qSWPx,
            voterProxyInstance,
            qMilesPts,
            referral,
            referralCampaignLens,
            bootstrapSWPx,
        } = await deployFixture();

        const amount =  "1100000000000000000000";
        await swpx.mint(user1.address, amount);
        await swpx.connect(user1).approve(bootstrapSWPx.address, amount);
        increase(86400*10);
        await bootstrapSWPx.connect(user1).convert(amount, "", "newLink");
        expect(await qSWPx.balanceOf(user1.address)).to.eq(amount);
        console.log(await swpx.balanceOf(voterProxyInstance.address))
    })
});