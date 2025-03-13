import { ethers, network } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";

import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";


// for pre-seed
//Pre-seed have 20% unlock after 3 months cliff and the rest is linear vesting over 12 months 
//Private sale and public sale have unlock 10% after 1 month cliff, and linear vesting for 9 months
describe("SQUOVestedEscrow", function () {
    describe("Preseed", function () {
        const THREE_MONTHS = 86400 * 30 * 3;
        const TWELVE_MONTHS = 86400 * 30 * 12;
        const LOCK_20_PERCENT = 2000;
        const PRICE = 0.01 * 10 ** 6;
        const SUPPLY = parseEther("20000000");
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

            //deploy sQUO
            const SQUO = await ethers.getContractFactory("SQuollToken");
            const squo = await SQUO.deploy();
            await squo.initialize(owner.address);

            //deploy USD
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const usdc = await MockERC20.deploy();

            //deplou ICO Vested Escrow
            const SQUOVestedEscrow = await ethers.getContractFactory("SQUOVestedEscrow");
            const squoVestedEscrow = await SQUOVestedEscrow.deploy();
            await squoVestedEscrow.initialize(squo.address, await currentTime() + 86400, THREE_MONTHS, LOCK_20_PERCENT, TWELVE_MONTHS, usdc.address, PRICE, false, SUPPLY);

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
                squo,
                usdc,
                squoVestedEscrow
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            expect(await squo.balanceOf(owner.address)).to.eq(parseEther("500000000"));
        })

        it("should whitelist user", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);
            expect(await squoVestedEscrow.whitelist(user1.address)).to.eql(true);

        })


        it("should whitelisted user buy token successfully", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            expect(await usdc.balanceOf(user1.address)).to.eq(0);
            expect(await squoVestedEscrow.userBoughts(user1.address)).to.be.eq(parseEther("100"));
            expect(await squoVestedEscrow.sold()).to.eq(parseEther("100"));
        })

        it("should reject non-whitelisted user to buy token", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            try {
                await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);
            } catch (e) {
                expect(e?.toString()).to.contains('whitelisted only!');
            }

        })

        it("should not buy token after start time", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await increase(86400);
            try {
                await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);
            } catch (e) {
                expect(e?.toString()).to.contains('can not buy this time!');
            }
        })

        it("should not buy twice", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);
            try {
                await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);
            } catch (e) {
                expect(e?.toString()).to.contains('buy once only!');
            }
        })

        it("should fund all buyers", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            await usdc.mint(user2.address, 1 * 10 ** 6);
            await usdc.connect(user2).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user2).buy(1 * 10 ** 6);

            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fundAllBuyers();
            expect(await squo.balanceOf(squoVestedEscrow.address)).to.be.eq(parseEther("200"));
            expect(await squoVestedEscrow.totalAmounts(user1.address)).to.be.eq(parseEther("100"));
            expect(await squoVestedEscrow.totalAmounts(user2.address)).to.be.eq(parseEther("100"));

        })
        it("should  claim 0 token in the cliff time", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            //user claim
            await increase(86400 * 30);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.eq(0);
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.be.eq(0);
        })

        it("should user claim 20% unlock after cliff time", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            //user claim
            await increase(86400); // increase to pass start time
            await increase(THREE_MONTHS); // cliff time
            const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
            expect(claimAmount).to.gt(parseEther("20")); //20 % unlock
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
        })

        it("should linear vesting in 12 months", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            //user claim 20% after 3 months cliff
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
            await increase(86400);
            await increase(THREE_MONTHS); // cliff time
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gt(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();

            //user vesting in 12 months
            await increase(THREE_MONTHS);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();

            await increase(THREE_MONTHS);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();

            await increase(THREE_MONTHS);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();

            await increase(THREE_MONTHS);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.lte(parseEther("20"));
            //zconsole.log(await squoVestedEscrow.getClaimableAmount(user1.address));
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.eq(parseEther("100"));
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
        })

        it("should change vesting address", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();

            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            //user claim 20% after 3 months cliff
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
            await increase(86400);
            await increase(THREE_MONTHS); // cliff time
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.gt(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();

            //user change vesting address
            await squoVestedEscrow.changeVestingAddr(user1.address, user2.address);
            await increase(THREE_MONTHS); // cliff time
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
            expect(await squoVestedEscrow.getClaimableAmount(user2.address)).to.be.gt(parseEther("20"));

        })

        it("should manager withdraw", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //whitelist user
            await squoVestedEscrow.addWhitelist([user1.address, user2.address, user3.address]);

            //user buy
            await usdc.mint(user1.address, 1 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1 * 10 ** 6);
            expect(await usdc.balanceOf(user1.address)).to.eq(0);
            expect(await usdc.balanceOf(squoVestedEscrow.address)).to.eq(1 * 10 ** 6);


            await squoVestedEscrow.withdraw();
            expect(await usdc.balanceOf(owner.address)).to.eq(1 * 10 ** 6);
        })
    })

    describe("Public sale", function () {
        const ONE_MONTHS = 86400 * 30;
        const NINE_MONTHS = 86400 * 30 * 9;
        const LOCK_10_PERCENT = 1000;
        const PRICE = 0.015 * 10 ** 6;
        const SUPPLY = parseEther("20000000");

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

            //deploy sQUO
            const SQUO = await ethers.getContractFactory("SQuollToken");
            const squo = await SQUO.deploy();
            await squo.initialize(owner.address);

            //deploy USD
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const usdc = await MockERC20.deploy();

            //deplou ICO Vested Escrow
            const SQUOVestedEscrow = await ethers.getContractFactory("SQUOVestedEscrow");
            const squoVestedEscrow = await SQUOVestedEscrow.deploy();
            await squoVestedEscrow.initialize(squo.address, await currentTime() + 86400, ONE_MONTHS, LOCK_10_PERCENT, NINE_MONTHS, usdc.address, PRICE, true, SUPPLY);

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
                squo,
                usdc,
                squoVestedEscrow
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            expect(await squo.balanceOf(owner.address)).to.eq(parseEther("500000000"));
        })


        it("should anyone can buy token successfully", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();

            //user buy 
            await usdc.mint(user1.address, 1.5 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1.5 * 10 ** 6);

            await squoVestedEscrow.connect(user1).buy(1.5 * 10 ** 6);


            expect(await usdc.balanceOf(user1.address)).to.be.eq(0);
            expect(await squoVestedEscrow.userBoughts(user1.address)).to.be.eq(parseEther("100"));
            expect(await squoVestedEscrow.sold()).to.eq(parseEther("100"));
        })



        it("should user claim 10% unlock after cliff time", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //user buy 
            await usdc.mint(user1.address, 1.5 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1.5 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1.5 * 10 ** 6);
            await increase(86400); // increase to pass start time

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            expect(await squoVestedEscrow.getClaimableAmount(user1.address));

            await increase(ONE_MONTHS); // cliff time
            const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
            expect(claimAmount).to.gt(parseEther("10")); //10 % unlock
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
        })

        it("should linear vesting in 12 months", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            await usdc.mint(user1.address, 1.5 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1.5 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1.5 * 10 ** 6);
            await increase(86400); // increase to pass start time

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            //user claim 10% unlock after cliff time
            await increase(ONE_MONTHS); // cliff time
            const claimAmount = await squoVestedEscrow.getClaimableAmount(user1.address);
            expect(claimAmount).to.gt(parseEther("10")); //10 % unlock
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.gt(claimAmount);
            await squoVestedEscrow.connect(user1).claim();

            //user vesting in 9  months
            await increase(ONE_MONTHS * 2);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();
            await increase(ONE_MONTHS * 2);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();
            await increase(ONE_MONTHS * 2);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();
            await increase(ONE_MONTHS * 2);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(parseEther("20"));
            await squoVestedEscrow.connect(user1).claim();
            await increase(ONE_MONTHS);
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.lte(parseEther("10"));
            await squoVestedEscrow.connect(user1).claim();
            expect(await squo.balanceOf(user1.address)).to.eq(parseEther("100"));
            expect(await squoVestedEscrow.getClaimableAmount(user1.address)).to.be.eq(0);
        })

        it("should manager withdraw", async function () {
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
                squo,
                usdc,
                squoVestedEscrow
            } = await deployFixture();
            //user buy
            await usdc.mint(user1.address, 1.5 * 10 ** 6);
            await usdc.connect(user1).approve(squoVestedEscrow.address, 1.5 * 10 ** 6);
            await squoVestedEscrow.connect(user1).buy(1.5 * 10 ** 6);
            await increase(86400); // increase to pass start time

            //fund user
            await squo.approve(squoVestedEscrow.address, SUPPLY);
            await squoVestedEscrow.fund([user1.address], [parseEther("100")]);

            await squoVestedEscrow.withdraw();
            expect(await usdc.balanceOf(owner.address)).to.eq(1.5 * 10 ** 6);
        })
    })
})