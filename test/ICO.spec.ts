import { ethers, network } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";

import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

describe("ICO", function () {
    // In preseed, whitelisted user can buy any amount
    describe("ICOPreseed", function () {
        const PRICE = 0.01 * 10 ** 6;
        const SUPPLY = parseEther("20000000");
        const MIN_BUY = 5000 * 10 ** 6;
        async function deployFixture(){
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
             //deploy USD
             const MockERC20 = await ethers.getContractFactory("MockERC20");
             const usdt = await MockERC20.deploy();
    
            const ICOPreseed = await ethers.getContractFactory("ICOPreseedSale");
            const preseed = await ICOPreseed.deploy();
            await preseed.initialize(usdt.address,  PRICE, MIN_BUY, SUPPLY,  await currentTime(),await currentTime() + 86400, treasury.address);
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
                usdt,
                preseed
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
                usdt,
                preseed
            } = await deployFixture();
            expect(await preseed.supply()).to.be.eq(SUPPLY);
        })
        it("should whitelist user", async function(){
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
                usdt,
                preseed
            } = await deployFixture();
            await preseed.addWhitelist([user1.address, user2.address]);
            expect(await preseed.whitelist(user1.address)).to.eql(true);
        })
        it("shoud whitelisted buy successfully", async function () {
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
                usdt,
                preseed
            } = await deployFixture();
            await preseed.addWhitelist([user1.address, user2.address]);
            await usdt.mint(user1.address, 5_000 * 10 ** 6);
            await usdt.connect(user1).approve(preseed.address, 5_000 * 10 ** 6);
            await preseed.connect(user1).buy(5000*10**6);
            expect(await preseed.totalAmounts(user1.address)).to.be.eq(parseEther("500000"));
            expect(await usdt.balanceOf(treasury.address)).to.be.eq(5_000 * 10 ** 6);
        })

        it("should check min amount at first time deposit", async function () {
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
                usdt,
                preseed
            } = await deployFixture();
            await preseed.addWhitelist([user1.address, user2.address]);
            await usdt.mint(user1.address, 6_000 * 10 ** 6);
            await usdt.connect(user1).approve(preseed.address, 6_000 * 10 ** 6);
            try {
            await preseed.connect(user1).buy(4000*10**6);

            }
            catch (e){
                expect(e?.toString()).to.contains("insufficient purchase amount!")
            }
            await preseed.connect(user1).buy(5000*10**6);

            expect(await preseed.totalAmounts(user1.address)).to.be.eq(parseEther("500000"));
            expect(await usdt.balanceOf(treasury.address)).to.be.eq(5_000 * 10 ** 6);

            //do not check min amount in the following deposit
            await preseed.connect(user1).buy(1000*10**6);


        })
    })
    //In private sale
    describe("ICO Private sale", async function () {
        const PRICE = 0.012 * 10 ** 6;
        const SUPPLY = parseEther("50000000");
        async function deployFixture(){
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
             //deploy USD
             const MockERC20 = await ethers.getContractFactory("MockERC20");
             const usdt = await MockERC20.deploy();
    
            const ICOPrivateSale = await ethers.getContractFactory("ICOPrivateSale");
            const privateSale = await ICOPrivateSale.deploy();
            await privateSale.initialize(usdt.address,  PRICE, SUPPLY,  await currentTime(),await currentTime() + 86400, treasury.address);
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
                usdt,
                privateSale
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
                usdt,
                privateSale
            } = await deployFixture();
            expect(await privateSale.supply()).to.be.eq(SUPPLY);
        })
        it("should whitelisted user buy any amount", async function () {
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
                usdt,
                privateSale
            } = await deployFixture();
            await privateSale.addWhitelist([user1.address, user2.address]);
            await usdt.mint(user1.address, 60 * 10 ** 6);
            await usdt.connect(user1).approve(privateSale.address, 60 * 10 ** 6);
            await privateSale.connect(user1).buy(60*10**6);
            expect(await privateSale.totalAmounts(user1.address)).to.eq(parseEther("5000"));
            expect(await usdt.balanceOf(treasury.address)).to.be.eq(60*10**6);
            
        })
    })
    describe("ICO Public", function () {
        const PRICE = 0.015 * 10 ** 6;
        const SUPPLY = parseEther("80000000");
        async function deployFixture(){
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
             //deploy USD
             const MockERC20 = await ethers.getContractFactory("MockERC20");
             const usdt = await MockERC20.deploy();
    
            const ICOPublicSale = await ethers.getContractFactory("ICOPublicSale");
            const publicSale = await ICOPublicSale.deploy();
            await publicSale.initialize(usdt.address,  PRICE, SUPPLY,  await currentTime(),await currentTime() + 86400, treasury.address);
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
                usdt,
                publicSale
            }
        }
        it("should everyone can buy any amount", async function (){
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
                usdt,
                publicSale
            } = await deployFixture();
            await usdt.mint(user1.address, 60 * 10 ** 6);
            await usdt.connect(user1).approve(publicSale.address, 60 * 10 ** 6);
            await publicSale.connect(user1).buy(60*10**6);
            expect(await publicSale.totalAmounts(user1.address)).to.be.eq(parseEther("4000"));
            expect(await usdt.balanceOf(treasury.address)).to.be.eq(60*10**6);
        })
    })
})
