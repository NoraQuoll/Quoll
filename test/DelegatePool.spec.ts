import { ethers, network } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";

import { expect, use } from "chai";

import { keccak256, parseEther, solidityPack } from "ethers/lib/utils";

import {
    BribeManagerPCS__factory,
    IERC20__factory,
    IGaugeVoting__factory,
    NativeZapper__factory,
    QuollToken__factory,
    VlQuoV2__factory,
    WombatBooster__factory,
    WomDepositor__factory,
    ThenaVoterProxy16__factory,
    ThenaVoterProxy17__factory,
    ProxyAmin__factory,
    IMinter__factory,

} from "../typechain-types";
import {
    IMasterChefV2__factory,
    IVECake__factory,
    IVECakeOwner__factory,
} from "../typechain-types/factories/contracts/Interfaces/Pancake";
import { IVoterV3__factory } from "../typechain-types/factories/contracts/qThe/Interfaces/Thena";

describe("Thena Delegate Vote Pool", function () {

    async function getBlockTimestamp() {
        const block = await ethers.provider.getBlock("latest");
        return block.timestamp;
    }
    this.timeout(120000);
    async function deployFixture() {
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xF977814e90dA44bFA03b6295A0616a897441aceC"],
        });

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x8894e0a0c962cb723c1976a4421c95949be2d4e3"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xf89d7b9c864f589bbf53a82105107622b35eaa40"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x42Ed232DC3E65b3534DbB42d07A3f67A618f66a3"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x28B2a59343bc503C98c3E807A282c2345082d7aa"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xeC52ef632dB94C99fE523170d5aeEfFA4c92E384"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x59cDaf8578aa76a5aa800c8f2d8F93f022bF803c"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xA10270de26FA6f8CE38be80d338dB231f02a5C09"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x54F01F0Bb7021C62405d0BaBe1F8d70eb9458cDE"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xcB0Fd804a913ee4cB4e8CCe26dD5CC8012359B79"],
        });
        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xCAa15Fd0cd0D8b537a0d3961d7b43b5FEcF19b4C"],
        });

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0E16337362A4262C58717Af57564fb389d10c7aB"],
        });

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xE77b1452900b92A9D43Cf87a079fe59c31b3F5ab"],
        });

        await network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x1869fEe380966Ca266e9D345cFdD60C1F29cf0Ed"],
        });

        const [treasury] = await ethers.getSigners(); // Get the first signer (default account)

        const owner = await ethers.getSigner(
            "0xF977814e90dA44bFA03b6295A0616a897441aceC"
        );
        const user1 = await ethers.getSigner(
            "0x8894e0a0c962cb723c1976a4421c95949be2d4e3"
        );
        const user2 = await ethers.getSigner(
            "0xf89d7b9c864f589bbf53a82105107622b35eaa40"
        );
        const user3 = await ethers.getSigner(
            "0x42Ed232DC3E65b3534DbB42d07A3f67A618f66a3"
        );
        const user4 = await ethers.getSigner(
            "0x28B2a59343bc503C98c3E807A282c2345082d7aa"
        );
        const user5 = await ethers.getSigner(
            "0xeC52ef632dB94C99fE523170d5aeEfFA4c92E384"
        );

        const user6 = await ethers.getSigner(
            "0x59cDaf8578aa76a5aa800c8f2d8F93f022bF803c"
        );

        const user7 = await ethers.getSigner(
            "0xA10270de26FA6f8CE38be80d338dB231f02a5C09"
        );

        const user1HolderVlquo = await ethers.getSigner(
            "0x54F01F0Bb7021C62405d0BaBe1F8d70eb9458cDE"
        );

        const user2HolderVlquo = await ethers.getSigner(
            "0xcB0Fd804a913ee4cB4e8CCe26dD5CC8012359B79"
        );

        const barmy = await ethers.getSigner(
            "0xCAa15Fd0cd0D8b537a0d3961d7b43b5FEcF19b4C"
        );

        const wbnbholder = await ethers.getSigner(
            "0x0E16337362A4262C58717Af57564fb389d10c7aB"
        );

        const quollDeployer = await ethers.getSigner(
            "0xE77b1452900b92A9D43Cf87a079fe59c31b3F5ab"
        );

        const vlQUoV2ProxyAdminOwner = await ethers.getSigner(
            "0x1869fEe380966Ca266e9D345cFdD60C1F29cf0Ed"
        );

        await treasury.sendTransaction({
            to: owner.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });

        await treasury.sendTransaction({
            to: user1.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user2.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user3.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user4.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user5.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user6.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user7.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user1HolderVlquo.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });
        await treasury.sendTransaction({
            to: user2HolderVlquo.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });

        await treasury.sendTransaction({
            to: wbnbholder.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });


        await treasury.sendTransaction({
            to: vlQUoV2ProxyAdminOwner.address,
            value: ethers.utils.parseEther("1"), // Amount of ETH to send
        });


        const vlQuoV2 = VlQuoV2__factory.connect(
            "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60",
            owner
        );

        const nativeZapper = NativeZapper__factory.connect(
            "0x61C855f3a9A1B3FeFD065DbE53c9DAf630F29Df8",
            quollDeployer
        );

        const masterChef = IMasterChefV2__factory.connect(
            "0x73feaa1eE314F8c655E354234017bE2193C9E24E",
            owner
        );

        const booster = WombatBooster__factory.connect(
            "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a",
            owner
        );

        const quo = QuollToken__factory.connect(
            "0x08b450e4a48C04CDF6DB2bD4cf24057f7B9563fF",
            owner
        );

        const thenaVoterProxy = ThenaVoterProxy17__factory.connect(
            "0xc0cd42017380cf4dc76adb8535cdF76b8f3fE398",
            owner);



        const voterv3 = IVoterV3__factory.connect(
            "0x3A1D0952809F4948d15EBCe8d345962A282C4fCb",
            owner);

        const proxyAmin = ProxyAmin__factory.connect(
            "0x88F45Ea192eFac81EB848e9879FFCe858865c298",
            barmy
        )

        const quollDeployerProxyAdmin = ProxyAmin__factory.connect(
            "0x16821E45d208D8369c135f546759Fd9849e76433",
            quollDeployer
        )

        const minter = IMinter__factory.connect(
            "0x86069FEb223EE303085a1A505892c9D4BdBEE996",
            owner
        )

        const wbnb = IERC20__factory.connect(
            "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            wbnbholder
        )

        const virtualBalanceRewardPool = await ethers.getContractFactory(
            "ThenaVirtualBalanceRewardPool"
        );
        const delegatePoolVirtualBalanceRewardPoolInstance =
            await virtualBalanceRewardPool.deploy();

        const thenaDelegatePool = await ethers.getContractFactory("ThenaDelegatePool");
        const thenaDelegatePoolIns = await thenaDelegatePool.deploy();
        await thenaDelegatePoolIns.initialize();
        await delegatePoolVirtualBalanceRewardPoolInstance.initialize(
            thenaDelegatePoolIns.address
        );

        await thenaDelegatePoolIns.setParams(
            quo.address,
            thenaVoterProxy.address,
            delegatePoolVirtualBalanceRewardPoolInstance.address,
            nativeZapper.address,
            treasury.address
        );

        await nativeZapper.setAccess(thenaDelegatePoolIns.address, true);


        const ThenaVoterProxy17 = await ethers.getContractFactory("ThenaVoterProxy17");
        const thenaVoterProxy17 = await ThenaVoterProxy17.deploy();

        const RewardToken = await ethers.getContractFactory("MockERC20");
        const rewardToken = await RewardToken.deploy();

        const VlQuoV2 = await ethers.getContractFactory("VlQuoV2");
        const vlQuoV2New = await VlQuoV2.deploy();
        await quollDeployerProxyAdmin.connect(vlQUoV2ProxyAdminOwner).upgrade(vlQuoV2.address, vlQuoV2New.address);
        await vlQuoV2.connect(quollDeployer).setVoterProxy(thenaVoterProxy.address);

        //upgrade barmy's contract ThenaVoterProxy16 -> ThenaVoterProxy17
        await proxyAmin.connect(barmy).upgradeAndCall(thenaVoterProxy.address, thenaVoterProxy17.address, "0x");
        //set delegate pool address
        await thenaVoterProxy.connect(barmy).setDelegateVotePool(thenaDelegatePoolIns.address);

        const tokenId = await thenaVoterProxy.getVeTheTokenId();
        const pool1 = await voterv3.pools(1);
        const pool2 = await voterv3.pools(2);
        const pool3 = await voterv3.pools(3);

        return {
            owner,
            user1,
            user2,
            user3,
            user4,
            user5,
            user6,
            user7,
            user1HolderVlquo,
            user2HolderVlquo,
            barmy,
            vlQuoV2,
            thenaVoterProxy,
            thenaDelegatePoolIns,
            voterv3,
            minter,
            rewardToken,
            wbnb,
            wbnbholder,
            quo,
            delegatePoolVirtualBalanceRewardPoolInstance,
            tokenId,
            pool1,
            pool2,
            pool3,
        };
    }

    // it("should deploy fixture successfully", async function () {
    //     const {thenaVoterProxy} = await deployFixture();
    //     console.log(await thenaVoterProxy.getDelegatedWeights()); // check if data is overrided

    // })


    // })
    describe("Control unlock VlSQUO", function () {
        it("should block unlock too much  vlSQuo", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                pool1
            } = await deployFixture();
            await increaseTo(1746057600);


            await minter.update_period();
            await voterv3._epochTimestamp();
            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();

            console.log('user 1 vote to voter proxy');
            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaDelegatePoolIns.address], [50, 50]);

            console.log('user 1 try to unlock vlSQUO -> failed');
            try {
                await vlQuoV2.connect(user1HolderVlquo).unlock(0);
            }
            catch (e) {
                expect(e?.toString()).to.contains("Too much vote cast");
            }
        })
    })

    describe("User vote in delegate pool", function () {
        it("should user vote for delegate vote pool", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                tokenId,
                pool1,
            } = await deployFixture();


            // skip vote forked form this current epoch 
            await increase(86400 * 7);
            await minter.update_period();
            await voterv3._epochTimestamp();
            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();

            console.log('user 1 vote: 50 pool 1 - 50 delegate pool')
            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaDelegatePoolIns.address], [50, 50]);
            
            console.log('vote to cast pool1, delegate');
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
            
            console.log('cast vote to thena');
            await thenaVoterProxy.castVote();

            console.log('pool1', await voterv3.votes(tokenId, pool1));
            console.log('delegate pool  not a gauge so weight = 0', await voterv3.votes(tokenId, thenaVoterProxy.address))
        })
    })

    describe("Delegate pool distribute its weight to other pools", function () {
        it("should delegate pool vote with delegated power", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                pool1,
                pool2,
                pool3
            } = await deployFixture();
    
            await increase(86400 * 14);
            await minter.update_period();
            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('delegate vote pool use will vote for pool2, pool3 by its power')
            await thenaDelegatePoolIns.updateWeights([pool2, pool3], [100, 100]);
    
    
            await thenaVoterProxy.connect(user1HolderVlquo).vote([thenaDelegatePoolIns.address], [50]);
            await thenaVoterProxy.connect(user2HolderVlquo).vote([pool1, thenaDelegatePoolIns.address], [50, 50]);
    
            console.log('user 1 vote  delegate pool')
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));
            console.log('user 2 vote 50 pool1 - 50 delegate')
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user2HolderVlquo.address));
            console.log('vote to cast pool1, pool2, pool3')
            console.log('delegate pool is also listed here but then will be skipped by thena voter');
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
    
            console.log('delegate delete pool 3')
            await thenaDelegatePoolIns.deletePool(pool3);
            console.log('vote to cast: pool1, pool2')
            console.log('delegate pool is also listed here but then will be skipped by thena voter');
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
    
 
            await thenaVoterProxy.castVote();   
            console.log('vote casted');
            const tokenId = await thenaVoterProxy.getVeTheTokenId();
            console.log('pool 1', await voterv3.votes(tokenId, pool1));
            console.log('pool 2', await voterv3.votes(tokenId, pool2));
            console.log('pool 3 = 0', await voterv3.votes(tokenId, pool3));
    
        })
    });
   
    describe("Reward user", function () {
        it("should reward user voted for delegated pool", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                rewardToken,
                wbnb,
                wbnbholder,
                quo,
                delegatePoolVirtualBalanceRewardPoolInstance
            } = await deployFixture();

            const pool1 = await voterv3.pools(1);
            const pool2 = await voterv3.pools(2);
            const pool3 = await voterv3.pools(3);

            //increase time to new epoch
            await increase(86400 * 14);
            await minter.update_period();
            await voterv3._epochTimestamp();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('this case, delegate pool will vote for pool1 by its voting power');
            await thenaDelegatePoolIns.updateWeights([pool1], [100]);

            console.log('user 1 vote delegate pool')
            await thenaVoterProxy.connect(user1HolderVlquo).vote([thenaDelegatePoolIns.address], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));
            console.log('user 2 vote delegate pool')
            await thenaVoterProxy.connect(user2HolderVlquo).vote([thenaDelegatePoolIns.address], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user2HolderVlquo.address));
            
            console.log('vote to cast: pool1');
            console.log('delegate pool is also listed here but then will be skipped by thena voter');
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));


            await thenaVoterProxy.castVote();

            console.log('vote casted')
            const tokenId = await thenaVoterProxy.getVeTheTokenId();
            console.log('pool 1', await voterv3.votes(tokenId, pool1));
            console.log('pool 2=0', await voterv3.votes(tokenId, pool2));
            console.log('pool 3=0', await voterv3.votes(tokenId, pool3));

            //register reward
            console.log('\nregister reward token for pool 1')
            const balance = wbnb.balanceOf(wbnbholder.address);
            await wbnb.connect(wbnbholder).transfer(thenaVoterProxy.address, balance);
            await thenaVoterProxy.connect(barmy).setQuollRewardsDistributor(wbnbholder.address);
            await thenaVoterProxy.connect(wbnbholder).registerReward(currentEpoch, pool1, wbnb.address, balance);

            // user claim reward from delegated vote pool
            console.log('user claim reward after 2 weeks');
            await increase(86400 * 14);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            await thenaDelegatePoolIns.harvestManually(currentEpoch);

            console.log('delegate pool reward swapped to SQUO');
            console.log('squo in delegate', await quo.balanceOf(delegatePoolVirtualBalanceRewardPoolInstance.address));
            console.log('user1 earned squo', await thenaDelegatePoolIns.earned(user1HolderVlquo.address, quo.address));
            console.log('user2 earned squo', await thenaDelegatePoolIns.earned(user2HolderVlquo.address, quo.address));

            console.log('user 1 get reward');
            await thenaDelegatePoolIns.connect(user1HolderVlquo).getReward();
            console.log('user 1 squo balance', await quo.balanceOf(user1HolderVlquo.address));
            
        })
    })

    describe("Keep delegated vote weight", function () {
        it("should keep delegated weight in new epoch", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                rewardToken
            } = await deployFixture();
            const pool1 = await voterv3.pools(1);
            const pool2 = await voterv3.pools(2);
            const pool3 = await voterv3.pools(3);

            await increase(86400 * 14);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            await thenaDelegatePoolIns.updateWeights([pool2, pool3], [100, 100]);

            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('Epoch ', currentEpoch);


            console.log('user 1 vote pool1')
            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));

            console.log('user 2 vote delegate pool')
            await thenaVoterProxy.connect(user2HolderVlquo).vote([thenaDelegatePoolIns.address], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user2HolderVlquo.address));
            
            console.log('vote to cast: pool1, pool2, pool3')
            console.log('delegate pool is also listed here but then will be skipped by thena voter');
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));


            // increasse to the next epoch
            console.log('increase one week then user1 vote');
            await increase(86400 * 7);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            const nextEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('Epoch ', nextEpoch);

        
            console.log('user1 vote for pool 1')
            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(nextEpoch, user1HolderVlquo.address));

            console.log('vote to cast should include pool2, pool3 from last epoch')
            console.log(await thenaVoterProxy.getVoteToBeCasted(nextEpoch));
            console.log('user 2 reset vote --> delegate pool lost its weight')
            await thenaVoterProxy.connect(user2HolderVlquo).resetVote();
            console.log('vote to cast - pool1 only ')
            console.log(await thenaVoterProxy.getVoteToBeCasted(nextEpoch));

        })

        it("should cast poolS that delegate vote for  if no one vote this epoch", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                rewardToken, 
                tokenId,
                pool1, 
                pool2, 
                pool3
            } = await deployFixture();


            await increase(86400 * 14);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            console.log('delegate pool will vote for pool3 by its power');
            console.log(await thenaDelegatePoolIns.getPoolsLength());
            await thenaDelegatePoolIns.updateWeights([pool3], [100]);

            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('Epoch ', currentEpoch);

            console.log('user 1 vote pool1')
            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaDelegatePoolIns.address], [50, 50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));


            console.log('vote to cast: pool1 only')
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
            
            await thenaVoterProxy.castVote();
            console.log('vote casted');

            console.log('pool 1', await voterv3.votes(tokenId, pool1));
            console.log('pool 2=0', await voterv3.votes(tokenId, pool2));
            console.log('pool 3', await voterv3.votes(tokenId, pool3));


            // increasse to the next epoch
            console.log('increase one week and no new vote');
            await increase(86400 * 8);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            const nextEpoch = await thenaVoterProxy.getCurrentEpoch();
            
            console.log('Epoch ', nextEpoch);
            console.log('cast with last vote weight - pool3 ');
            await thenaVoterProxy.castVote();
            console.log('pool 1=0', await voterv3.votes(tokenId, pool1));
            console.log('pool 2=0', await voterv3.votes(tokenId, pool2));
            console.log('pool 3', await voterv3.votes(tokenId, pool3));
        })
        
    })


    describe("Reset delegate vote weights - withdraw - no reward", function () {
        it("should calculate correct weight when user reset vote for delegate pool", async function () {
            const {
                owner,
                user1,
                user2,
                user3,
                user4,
                user5,
                user6,
                user7,
                user1HolderVlquo,
                user2HolderVlquo,
                vlQuoV2,
                barmy,
                thenaVoterProxy,
                thenaDelegatePoolIns,
                minter,
                voterv3,
                rewardToken,
                pool1, 
                pool2, 
                pool3
            } = await deployFixture();

            await increase(86400 * 14);
            await minter.update_period();
            await thenaVoterProxy.connect(barmy).updateCurrentVotingEpoch();
            console.log('delegate pool will vote for pool1, pool2, pool3')
            await thenaDelegatePoolIns.updateWeights([pool1, pool2, pool3], [100, 100, 100]);


            const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
            console.log('Epoch ', currentEpoch);


            console.log('user 1 vote for pool1');

            await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1], [50]);
            console.log('total vlQUo vote after user 1 vote', await thenaVoterProxy.getTotalVlQuoVoted(currentEpoch));

            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));

            console.log('user2 vote for delegate pool')
            await thenaVoterProxy.connect(user2HolderVlquo).vote([thenaDelegatePoolIns.address], [50]);
            console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user2HolderVlquo.address));
            console.log('total vlQUo vote after user 2 vote for delegate', await thenaVoterProxy.getTotalVlQuoVoted(currentEpoch));

            
           
            console.log('balance user1 in delegate pool', await thenaDelegatePoolIns.balanceOf(user1HolderVlquo.address));
            console.log('balance user2 in delegate pool', await thenaDelegatePoolIns.balanceOf(user2HolderVlquo.address));
            
          
            
            console.log('vote to cast pool1, pool2, pool3')
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));

            console.log('user 2 reset his votes');
            
            await thenaVoterProxy.connect(user2HolderVlquo).resetVote();
            console.log('total vlQUo vote after user 2 reset vote ', await thenaVoterProxy.getTotalVlQuoVoted(currentEpoch));
            console.log('balance user2 in delegate pool should = 0' , await thenaDelegatePoolIns.balanceOf(user2HolderVlquo.address));


            console.log('vote to cast pool 1 only')
            console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));

            
        })

    })

});
