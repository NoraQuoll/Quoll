import { ethers } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime } from "./utils/time";
import { expect } from "chai";
describe("vlQuo Minting", function () {
  async function deployFixture() {
    const [owner, user1, user2, user3, user4, user5, user6, user7, treasury] =
      await ethers.getSigners();
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

    await expect(vlQuoV2Lens.claimTokenWom()).to.revertedWith("");
  });
});
