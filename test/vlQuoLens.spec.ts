import { ethers } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";
import { expect } from "chai";
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
    const VlQuoV2 = await ethers.getContractFactory("VlQuoV2");
    const vlQuoV2 = await VlQuoV2.deploy();

    vlQuoV2.initialize();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const quo = await MockERC20.deploy();

    const BribeManager = await ethers.getContractFactory("BribeManager");
    const bribeManager = await BribeManager.deploy();
    bribeManager.initialize();

    await vlQuoV2.setParams(
      quo.address,
      bribeManager.address,
      treasury.address
    );

    const VlQuoV2Lens = await ethers.getContractFactory("VlQuoV2Lens");
    const vlQuoV2Lens = await VlQuoV2Lens.deploy();
    await vlQuoV2Lens.initialize();

    await vlQuoV2.setVlQuoLens(vlQuoV2Lens.address);

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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    };
  }
  it("deploy should success", async () => {
    await deployFixture();
  });

  it("should deposit Quo success", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(user1.address, mintAmount);

    assert(
      mintAmount.toString() == (await quo.balanceOf(user1.address)).toString()
    );

    await quo.connect(user1).approve(vlQuoV2.address, mintAmount);
    await vlQuoV2.connect(user1).lock(user1.address, mintAmount, 1);

    assert("0" == (await quo.balanceOf(user1.address)).toString());
    assert(
      "1000000000000000000" ==
        (await vlQuoV2.balanceOf(user1.address)).toString()
    );
  });

  it("should set up data success", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    assert(
      ethersI.ethers.utils.parseEther("1000").toString() ==
        (await quo.balanceOf(vlQuoV2Lens.address)).toString()
    );
  });

  it("should fail to claim token before 30 days", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    try {
      await vlQuoV2Lens.claimTokenWom();
    } catch (e) {
      expect(e?.toString()).to.contain("Could not claim token before 30 days");
    }
  });

  it("should getUserData fail only vlQuo can call ", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    try {
      await vlQuoV2Lens.connect(owner).getUserData(user1.address, 26);
    } catch (e) {
      expect(e?.toString()).to.contain(
        "only vlQuov2 can call to this function"
      );
    }
  });

  it("should getUserData fail not yet start time", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    try {
      await vlQuoV2.connect(user1).lockCustomForUser(26);
    } catch (e) {
      expect(e?.toString()).to.contain("Not yet start");
    }
  });

  it("should getUserData fail not yet start time", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    await increase(200 + 86400 * 30);

    try {
      await vlQuoV2.connect(user1).lockCustomForUser(26);
    } catch (e) {
      expect(e?.toString()).to.contain("Only can claim within 30 days");
    }
  });

  it("should getUserData fail week invlad", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    await increase(200);

    try {
      await vlQuoV2.connect(user1).lockCustomForUser(27);
    } catch (e) {
      expect(e?.toString()).to.contain("invalid lock week");
    }
  });

  it("should getUserData fail user invlad", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    await increase(200);

    try {
      await vlQuoV2.connect(user8).lockCustomForUser(26);
    } catch (e) {
      expect(e?.toString()).to.contain("Dont have reward for user");
    }
  });

  it("should getUserData success", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    await increase(200);

    const penalty = await vlQuoV2Lens.penalty();
    const DENOMINATOR = await vlQuoV2Lens.DENOMINATOR();

    const balanceVlquoLensBefore = await quo.balanceOf(vlQuoV2Lens.address);
    const balanceVlquoBefore = await quo.balanceOf(vlQuoV2.address);

    await vlQuoV2.connect(user1).lockCustomForUser(26);

    const balanceVlquoLensAfter = await quo.balanceOf(vlQuoV2Lens.address);
    const balanceVlquoAfter = await quo.balanceOf(vlQuoV2.address);

    expect(
      ethersI.BigNumber.from(
        (
          ((balanceVlquoAfter - balanceVlquoBefore) * DENOMINATOR) /
          penalty
        ).toString()
      )
    ).to.be.equal(ethersI.ethers.utils.parseEther("100"));

    expect(
      ethersI.BigNumber.from(
        (
          ((balanceVlquoLensBefore - balanceVlquoLensAfter) * DENOMINATOR) /
          penalty
        ).toString()
      )
    ).to.be.equal(ethersI.ethers.utils.parseEther("100"));

    const getUserLock = await vlQuoV2.getUserLocks(user1.address);

    console.log({ getUserLock });
  });

  it("should claim wom success", async () => {
    const mintAmount = ethersI.ethers.utils.parseEther("1000");
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
      vlQuoV2,
      quo,
      vlQuoV2Lens,
    } = await deployFixture();

    await quo.mint(owner.address, mintAmount);

    await quo.connect(owner).approve(vlQuoV2Lens.address, mintAmount);

    const currentTimeStamp = await currentTime();

    await vlQuoV2Lens.initUserGetReward(
      [
        user1.address,
        user2.address,
        user3.address,
        user4.address,
        user5.address,
        user6.address,
        user7.address,
      ],
      [
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("200"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("100"),
        ethersI.ethers.utils.parseEther("300"),
      ],
      currentTimeStamp + 100,
      quo.address,
      50,
      vlQuoV2.address
    );

    await increase(200);

    const penalty = await vlQuoV2Lens.penalty();
    const DENOMINATOR = await vlQuoV2Lens.DENOMINATOR();

    await vlQuoV2.connect(user1).lockCustomForUser(52);

    await increase(86400 * 30);

    const balanceVlquoLensBefore = await quo.balanceOf(vlQuoV2Lens.address);

    await vlQuoV2Lens.claimTokenWom();

    const balanceVlquoLensAfter = await quo.balanceOf(vlQuoV2Lens.address);

    expect(
      ethersI.BigNumber.from(
        (balanceVlquoLensBefore - balanceVlquoLensAfter).toString()
      )
    ).to.be.equal(ethersI.ethers.utils.parseEther("900"));
  });
});
