import { ethers } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

describe("vlQuo Minting", function () {
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
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const squo = await MockERC20.deploy();

        const VlSQuoV2 = await ethers.getContractFactory("VlSQuoV2");
        const vlSQuoV2 = await VlSQuoV2.deploy();
        await vlSQuoV2.initialize();

        const MockSwapXVoterProxy = await ethers.getContractFactory("MockSwapXVoterProxy");
        const mockSwapXVoterProxy = await MockSwapXVoterProxy.deploy();

        const VlSQuoRewardPool = await ethers.getContractFactory("VlQuoRewardPool");
        const vlSQuoRewardPool = await VlSQuoRewardPool.deploy();
        await vlSQuoRewardPool.initialize(squo.address);

        await vlSQuoV2.setParams(squo.address, treasury.address);
        await vlSQuoV2.setRewardPool(vlSQuoRewardPool.address);
        await vlSQuoRewardPool.setAccess(vlSQuoV2.address, true);

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
            vlSQuoV2,
            squo,
            mockSwapXVoterProxy
        }
    }

    it("should deploy fixture", async function () {
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
            vlSQuoV2,
            squo, 
            mockSwapXVoterProxy
        } = await deployFixture ();
        console.log('user votes', await mockSwapXVoterProxy.getCurrentVotesForUser(user1.address));
        //expect( await vlSQuoV2.getCurrentVoteForUser(user1.address)).to.be.eq(0);
    })

    it("should user lock quo successfully", async function () {
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
            vlSQuoV2,
            squo, 
            mockSwapXVoterProxy
        } = await deployFixture ();
        await squo.mint(user1.address, parseEther("100"));
        await squo.connect(user1).approve(vlSQuoV2.address, parseEther("100"));
        await vlSQuoV2.connect(user1).lock(user1.address, parseEther("100"), 2);
        expect(await vlSQuoV2.balanceOf(user1.address)).to.be.eql(parseEther("200"));
    })

    it("should user unlock quo successfully", async function () {
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
            vlSQuoV2,
            squo, 
            mockSwapXVoterProxy
        } = await deployFixture ();
        await squo.mint(user1.address, parseEther("100"));
        await squo.connect(user1).approve(vlSQuoV2.address, parseEther("100"));
        await vlSQuoV2.connect(user1).lock(user1.address, parseEther("100"), 2);
        console.log(await vlSQuoV2.getUserLocks(user1.address));
        await increase(86400*20);
        await vlSQuoV2.connect(user1).unlock(0);
        expect(await squo.balanceOf(user1.address)).to.be.eq(parseEther("100"));
        expect (await vlSQuoV2.balanceOf(user1.address)).to.be.eq(0);  
    })
})