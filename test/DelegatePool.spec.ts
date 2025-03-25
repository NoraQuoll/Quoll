import { ethers, network } from "hardhat";

import { assert } from "console";
import * as ethersI from "ethers";

import { currentTime, increase, increaseTo } from "./utils/time";

import { expect, use } from "chai";

import { keccak256, solidityPack } from "ethers/lib/utils";

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

        const bazmy = await ethers.getSigner(
            "0xCAa15Fd0cd0D8b537a0d3961d7b43b5FEcF19b4C"
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






        const vlQuoV2 = VlQuoV2__factory.connect(
            "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60",
            owner
        );

        const nativeZapper = NativeZapper__factory.connect(
            "0x61C855f3a9A1B3FeFD065DbE53c9DAf630F29Df8",
            owner
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

        const thenaVoterProxy = ThenaVoterProxy16__factory.connect(
            "0xc0cd42017380cf4dc76adb8535cdF76b8f3fE398",
            owner);



        const voterv3 = IVoterV3__factory.connect(
            "0x3A1D0952809F4948d15EBCe8d345962A282C4fCb",
            owner);

        const proxyAmin = ProxyAmin__factory.connect(
            "0x88F45Ea192eFac81EB848e9879FFCe858865c298",
            bazmy
        )

        const minter = IMinter__factory.connect(
            "0x86069FEb223EE303085a1A505892c9D4BdBEE996", 
            owner
        )

        const qCake = await ethers.getContractFactory("QuollExternalToken");
        const qCakeInstance = await qCake.deploy();
        await qCakeInstance.initialize("Quoll Cake", "qCake");


        const virtualBalanceRewardPool = await ethers.getContractFactory(
            "VirtualBalanceRewardPool"
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
            delegatePoolVirtualBalanceRewardPoolInstance.address,
            nativeZapper.address,
            treasury.address,
            thenaVoterProxy.address
        )


        const ThenaVoterProxy17 = await ethers.getContractFactory("ThenaVoterProxy17");
        const thenaVoterProxy17 = await ThenaVoterProxy17.deploy();
    

        //upgrade 
        await proxyAmin.connect(bazmy).upgradeAndCall(thenaVoterProxy.address, thenaVoterProxy17.address, "0x");
        

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
            bazmy,
            vlQuoV2,
            // firstVirtualBalanceRewardPool,
            // secondVirtualBalanceRewardPool,
            thenaVoterProxy,
            thenaDelegatePoolIns,
            voterv3,
            minter
        };
    }

    // it("should deploy fixture successfully", async function () {
    //     await deployFixture();
    // })

    // it("shoud get correct data on voterproxy & voter", async function () {
    //     const {
    //         owner,
    //         user1,
    //         user2,
    //         user3,
    //         user4,
    //         user5,
    //         user6,
    //         user7,
    //         user1HolderVlquo,
    //         user2HolderVlquo,
    //         vlQuoV2,
    //         gaugeVoting,
    //         thenaVoterProxy,
    //         voterv3
    //     } = await deployFixture();

    //     expect(await voterv3._ve()).to.be.eql("0xfBBF371C9B0B994EebFcC977CEf603F7f31c070D");
    //     expect(await thenaVoterProxy.getCurrentEpoch()).to.be.eql(await voterv3._epochTimestamp());
    // })

    it("should user vote to voter proxy", async function () {
        // prepare vl quo
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
            thenaVoterProxy,
            voterv3,
            minter
        } = await deployFixture();

        const pool1 = await voterv3.pools(1);
        const pool2 = await voterv3.pools(2);
        console.log(await thenaVoterProxy.getClaimableEpochsForUser(user1HolderVlquo.address));

        await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, pool2], [50, 50]);
        const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
        console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));


        await increase(86400*7);
        await minter.update_period();
        console.log(await thenaVoterProxy.getClaimableEpochsForUser(user1HolderVlquo.address));
        await thenaVoterProxy.claimAllEpochs();
       // console.log(await thenaVoterProxy.claimableByUserAndPool(currentEpoch, user1HolderVlquo.address, pool1));
       //console.log(await thenaVoterProxy.rewards(1741219200));
    })

    it("should user vote for delegated pool", async function (){
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
            bazmy,
            thenaVoterProxy,
            thenaDelegatePoolIns,
            minter,
            voterv3
        } = await deployFixture();
        const pool1 = await voterv3.pools(1);
        const pool2 = await voterv3.pools(2);
        const pool3 = await voterv3.pools(3);

     
        const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
        
        await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaVoterProxy.address], [50, 50]);
        console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
        //cast vote to thena voter
        await thenaVoterProxy.castVote();
        const tokenId = await thenaVoterProxy.getVeTheTokenId();
        console.log(await voterv3.votes(tokenId, pool1 ));
        console.log(await voterv3.votes(tokenId,  thenaVoterProxy.address))

    })

    it("should delegate pool vote for user", async function (){
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
            bazmy,
            thenaVoterProxy,
            thenaDelegatePoolIns,
            minter,
            voterv3
        } = await deployFixture();
        const pool1 = await voterv3.pools(1);
        const pool2 = await voterv3.pools(2);
        const pool3 = await voterv3.pools(3);

     
        const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
        
        await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaVoterProxy.address], [50, 50]);
        console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
        await thenaVoterProxy.connect(bazmy).setDelegationAdmin(thenaDelegatePoolIns.address, true);
        await thenaDelegatePoolIns.updateWeights([pool1 ,pool2, pool3] , [100, 100,100]);
        console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, thenaDelegatePoolIns.address));
        
        console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
        await thenaVoterProxy.castVote();
        
        
        // console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));
        const tokenId = await thenaVoterProxy.getVeTheTokenId();
        console.log(await voterv3.votes(tokenId, pool1 ));
        console.log(await voterv3.votes(tokenId,  pool2));
        console.log(await voterv3.votes(tokenId,  pool3));
        
    })

    it("should register reward", async function () {
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
            bazmy,
            thenaVoterProxy,
            thenaDelegatePoolIns,
            minter,
            voterv3
        } = await deployFixture();
        const pool1 = await voterv3.pools(1);
        const pool2 = await voterv3.pools(2);
        const pool3 = await voterv3.pools(3);

        await increase(86400*21);  
        await minter.update_period();
        const currentEpoch = await thenaVoterProxy.getCurrentEpoch();
        
        await thenaVoterProxy.connect(user1HolderVlquo).vote([pool1, thenaVoterProxy.address], [50, 50]);
        console.log('user 1 vote weight');
        console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user1HolderVlquo.address));
        console.log('vote to cast');
        console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));
        
        await thenaVoterProxy.connect(user2HolderVlquo).vote([pool2, thenaVoterProxy.address], [50, 50]);
        console.log('user 2 vote weight');
        console.log(await thenaVoterProxy.getVotesForUserAtEpoch(currentEpoch, user2HolderVlquo.address));
        console.log('vote to cast');
        console.log(await thenaVoterProxy.getVoteToBeCasted(currentEpoch));


        

    })
});
