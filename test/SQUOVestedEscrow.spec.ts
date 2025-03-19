// import { ethers, network } from "hardhat";

// import { assert } from "console";
// import * as ethersI from "ethers";

// import { currentTime, increase, increaseTo } from "./utils/time";

// import { expect } from "chai";
// import { parseEther } from "ethers/lib/utils";


// // for pre-seed
// //Pre-seed have 20% unlock after 3 months cliff and the rest is linear vesting over 12 months 
// //Private sale and public sale have unlock 10% after 1 month cliff, and linear vesting for 9 months
// describe("SQUOVestedEscrow", function () {
//     describe("Preseed", function () {
//         const THREE_MONTHS = 86400 * 30 * 3;
//         const TWELVE_MONTHS = 86400 * 30 * 12;
//         const LOCK_20_PERCENT = 2000;
//         const PRICE = 0.01 * 10 ** 6;
//         const SUPPLY = parseEther("20000000");
//         const MIN_BUY = 5000 * 10 ** 6;
//         async function deployFixture() {
//             const [
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//             ] = await ethers.getSigners();

//             //deploy sQUO
//             const SQUO = await ethers.getContractFactory("SQuollToken");
//             const squo = await SQUO.deploy();
//             await squo.initialize(owner.address);

//             //deploy USD
//             const MockERC20 = await ethers.getContractFactory("MockERC20");
//             const usdt = await MockERC20.deploy();

//             //deplou ICO Vested Escrow
//             const SQUOVestedEscrow = await ethers.getContractFactory("SQUOVestedEscrow");
//             const squoVestedEscrow = await SQUOVestedEscrow.deploy();
//             await squoVestedEscrow.initialize(
//                 squo.address,
//                 await currentTime() + 86400,
//                 THREE_MONTHS, LOCK_20_PERCENT,
//                 TWELVE_MONTHS,
//                 usdt.address,
//                 PRICE,
//                 MIN_BUY,
//                 treasury.address,
//                 true,
//                 false
//             );

//             return {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             }
//         }
//         it("should deploy fixture", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             expect(await squo.balanceOf(owner.address)).to.eq(parseEther("500000000"));
//         })

//         it("should fund whitelisted user", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);
//             expect(await squoVestedEscrow.whitelist(user1.address)).to.eql(true);

//         })

//         it("should whitelisted user buy token successfully", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);

//             expect(await usdt.balanceOf(user1.address)).to.eq(0);
//             expect(await squoVestedEscrow.totalAmounts(user1.address)).to.be.eq(parseEther("1000000"));
//             expect(await squoVestedEscrow.sold()).to.eq(parseEther("1000000"));
//         })

//         it("should reject non-whitelisted user to buy token", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);

//             try {
//                 await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);
//             } catch (e) {
//                 expect(e?.toString()).to.contains('not in whitelist');
//             }

//         })

//         it("should not buy to few", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 4_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 4_000 * 10 ** 6);

//             try {
//                 await squoVestedEscrow.connect(user1).buy(4_000 * 10 ** 6);
//             } catch (e) {
//                 expect(e?.toString()).to.contains('insufficient purchase amount!');
//             }

//         })

//         it("should not buy token after start time", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);


//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);

//             await increase(86400);
//             try {
//                 await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);

//             } catch (e) {
//                 expect(e?.toString()).to.contains('can not buy this time!');
//             }
//         })

//         it("should  claim 0 token in the cliff time", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);


//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);
//             //user claim
//             await increase(86400 * 30);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.eq(0);
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.be.eq(0);
//         })

//         it("should user claim 20% unlock after cliff time", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);

//             //user claim
//             await increase(86400); // increase to pass start time
//             await increase(THREE_MONTHS); // cliff time
//             const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
//             expect(claimAmount).to.gt(parseEther("200000")); //20 % unlock
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
//         })

//         it("should linear vesting in 12 months", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);


//             //user claim 20% after 3 months cliff
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//             await increase(86400);
//             await increase(THREE_MONTHS); // cliff time
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();

//             //user vesting in 12 months
//             await increase(THREE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();

//             await increase(THREE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();

//             await increase(THREE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();

//             await increase(THREE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.lte(parseEther("200000"));
//             //zconsole.log(await squoVestedEscrow.getClaimableAmount(user1.address));
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.eq(parseEther("1000000"));
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//         })

//         it("should change vesting address", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);


//             //user claim 20% after 3 months cliff
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//             await increase(86400);
//             await increase(THREE_MONTHS); // cliff time
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gt(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();

//             //user change vesting address
//             await squoVestedEscrow.changeVestingAddr(user1.address, user2.address);
//             await increase(THREE_MONTHS); // cliff time
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//             expect(await squoVestedEscrow.getClaimableAmount(user2.address)).to.be.gt(parseEther("200000"));

//         })

//         it("should recipient receive payment", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);


//             expect(await usdt.balanceOf(treasury.address)).to.be.eq(10_000 * 10 ** 6);
//         })

//         it("should change purchase recipient", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //whitelist user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.addWhitelist([user1.address]);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //change recipient
//             await squoVestedEscrow.setRecipient(user3.address);

//             //user buy
//             await usdt.mint(user1.address, 10_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 10_000 * 10 ** 6);
//             await squoVestedEscrow.connect(user1).buy(10_000 * 10 ** 6);


//             expect(await usdt.balanceOf(user3.address)).to.be.eq(10_000 * 10 ** 6);
//         })

//     })
//     describe("Private sale", function () {
//         const ONE_MONTHS = 86400 * 30;
//         const NINE_MONTHS = 86400 * 30 * 9;
//         const LOCK_10_PERCENT = 1000;
//         const PRICE = 0.012 * 10 ** 6;
//         const SUPPLY = parseEther("50000000");
//         const MIN_BUY = 5000 * 10 ** 6;
//         async function deployFixture() {
//             const [
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//             ] = await ethers.getSigners();

//             //deploy sQUO
//             const SQUO = await ethers.getContractFactory("SQuollToken");
//             const squo = await SQUO.deploy();
//             await squo.initialize(owner.address);

//             //deploy USD
//             const MockERC20 = await ethers.getContractFactory("MockERC20");
//             const usdt = await MockERC20.deploy();

//             //deplou ICO Vested Escrow
//             const SQUOVestedEscrow = await ethers.getContractFactory("SQUOVestedEscrow");
//             const squoVestedEscrow = await SQUOVestedEscrow.deploy();
//             await squoVestedEscrow.initialize(
//                 squo.address, 
//                 await currentTime() + 86400, 
//                 ONE_MONTHS, LOCK_10_PERCENT, 
//                 NINE_MONTHS, 
//                 usdt.address, 
//                 PRICE, MIN_BUY, 
//                 treasury.address, 
//                 true, 
//                 true
//             );

//             return {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             }
//         }

//         it("should deploy fixture", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             expect(await squo.balanceOf(owner.address)).to.eq(parseEther("500000000"));

//         });

//         it("should allocate amount & whiteliste user", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             // allocate user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fund([user1.address], [parseEther("500000")]);
//             expect(await squoVestedEscrow.whitelist(user1.address)).to.eql(true);
//             expect(await squoVestedEscrow.limitAmounts(user1.address)).to.eq(parseEther("500000"));


//         });

//         it("should whitelisted user buy token", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             // allocate user
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fund([user1.address], [parseEther("500000")]);

//             //user buy
 
//             await usdt.mint(user1.address, 6_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 6_000 * 10 ** 6);

//             await squoVestedEscrow.connect(user1).buy(6_000 * 10 ** 6);
//             expect (await squoVestedEscrow.totalAmounts(user1.address)).to.be.eq(parseEther("500000"));
//         });

//         it("should reject non-whitelisted user to buy token", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             //user buy

//             await usdt.mint(user1.address, 6_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 6_000 * 10 ** 6);

//             try {
//                 await squoVestedEscrow.connect(user1).buy(6_000 * 10 ** 6);
//             }
//             catch(e){
//                 expect(e?.toString()).to.contains('not in whitelist')
//             }

//         });
        

//         it("should user claim 10% unlock after cliff time", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//            // allocate user
//            await squo.approve(squoVestedEscrow.address, SUPPLY);
//            await squoVestedEscrow.fund([user1.address], [parseEther("500000")]);

//            //user buy

//            await usdt.mint(user1.address, 6_000 * 10 ** 6);
//            await usdt.connect(user1).approve(squoVestedEscrow.address, 6_000 * 10 ** 6);
//            await squoVestedEscrow.connect(user1).buy(6_000 * 10 ** 6);
//             await increase(86400); // increase to pass start time
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.eq(0);
//             await increase(ONE_MONTHS); // cliff time
//             const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
//             expect(claimAmount).to.gt(parseEther("50000")); //10 % unlock
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.gte(claimAmount);
//         })

//         it("should linear vesting in 9 months", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fund([user1.address], [parseEther("500000")]);

//             //user buy

//             await usdt.mint(user1.address, 6_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 6_000 * 10 ** 6);

//             await squoVestedEscrow.connect(user1).buy(6_000 * 10 ** 6);

//             await increase(86400); // increase to pass start time


//             //user claim 10% unlock after cliff time
//             await increase(ONE_MONTHS); // cliff time
//             const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
//             expect(claimAmount).to.gt(parseEther("50000")); //10 % unlock

//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
//             await squoVestedEscrow.connect(user1).claim();

//             //user vesting in 9  months
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("100000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("100000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("100000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("100000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.lte(parseEther("50000"));
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.eq(parseEther("500000"));
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//         })
        
//     })
//     describe("Public sale", function () {
//         const ONE_MONTHS = 86400 * 30;
//         const NINE_MONTHS = 86400 * 30 * 9;
//         const LOCK_10_PERCENT = 1000;
//         const PRICE = 0.015 * 10 ** 6;
//         const SUPPLY = parseEther("80000000");
//         const MIN_BUY = 5000 * 10 ** 6;
//         async function deployFixture() {
//             const [
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//             ] = await ethers.getSigners();

//             //deploy sQUO
//             const SQUO = await ethers.getContractFactory("SQuollToken");
//             const squo = await SQUO.deploy();
//             await squo.initialize(owner.address);

//             //deploy USD
//             const MockERC20 = await ethers.getContractFactory("MockERC20");
//             const usdt = await MockERC20.deploy();

//             //deplou ICO Vested Escrow
//             const SQUOVestedEscrow = await ethers.getContractFactory("SQUOVestedEscrow");
//             const squoVestedEscrow = await SQUOVestedEscrow.deploy();
//             await squoVestedEscrow.initialize(squo.address, await currentTime() + 86400, ONE_MONTHS, LOCK_10_PERCENT, NINE_MONTHS, usdt.address, PRICE, MIN_BUY, treasury.address, false, false);

//             return {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             }
//         }
//         it("should deploy fixture", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             expect(await squo.balanceOf(owner.address)).to.eq(parseEther("500000000"));
//         })

//         it("should fund public", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fundAll(SUPPLY);
//             expect(await squoVestedEscrow.supply()).to.eq(SUPPLY);
//         })

//         it("should anyone can buy token successfully", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//             //fund public
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy 
//             await usdt.mint(user1.address, 15_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 15_000 * 10 ** 6);

//             await squoVestedEscrow.connect(user1).buy(15_000 * 10 ** 6);

//             expect(await usdt.balanceOf(user1.address)).to.be.eq(0);
//             expect(await squoVestedEscrow.totalAmounts(user1.address)).to.eq(parseEther("1000000"));
//             expect(await squoVestedEscrow.sold()).to.eq(parseEther("1000000"));
//         })

//         it("should  not fund whitelist in public sale", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//             //fund public
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fundAll(SUPPLY);
//             try {
//                 await squoVestedEscrow.fund([user1.address], [parseEther("10000000")]);
//             }
//             catch (e) {
//                 expect(e?.toString()).to.contain("fund all instead!");
//             }

//         })

//         it("should user claim 10% unlock after cliff time", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//             //fund public
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy 
//             await usdt.mint(user1.address, 15_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 15_000 * 10 ** 6);

//             await squoVestedEscrow.connect(user1).buy(15_000 * 10 ** 6);
//             await increase(86400); // increase to pass start time

//             expect(await squoVestedEscrow.getClaimableAmount(user1.address));

//             await increase(ONE_MONTHS); // cliff time
//             const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
//             expect(claimAmount).to.gt(parseEther("100000")); //10 % unlock
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
//         })

//         it("should linear vesting in 9 months", async function () {
//             const {
//                 owner,
//                 user1,
//                 user2,
//                 user3,
//                 user4,
//                 user5,
//                 user6,
//                 user7,
//                 user8,
//                 treasury,
//                 squo,
//                 usdt,
//                 squoVestedEscrow
//             } = await deployFixture();

//             //fund public
//             await squo.approve(squoVestedEscrow.address, SUPPLY);
//             await squoVestedEscrow.fundAll(SUPPLY);

//             //user buy 
//             await usdt.mint(user1.address, 15_000 * 10 ** 6);
//             await usdt.connect(user1).approve(squoVestedEscrow.address, 15_000 * 10 ** 6);

//             await squoVestedEscrow.connect(user1).buy(15_000 * 10 ** 6);
//             await increase(86400); // increase to pass start time


//             //user claim 10% unlock after cliff time
//             await increase(ONE_MONTHS); // cliff time
//             const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
//             expect(claimAmount).to.gt(parseEther("100000")); //10 % unlock
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
//             await squoVestedEscrow.connect(user1).claim();

//             //user vesting in 9  months
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS * 2);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gte(parseEther("200000"));
//             await squoVestedEscrow.connect(user1).claim();
//             await increase(ONE_MONTHS);
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.lte(parseEther("100000"));
//             await squoVestedEscrow.connect(user1).claim();
//             expect(await squo.balanceOf(user1.address)).to.eq(parseEther("1000000"));
//             expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
//         })
//     })
// })