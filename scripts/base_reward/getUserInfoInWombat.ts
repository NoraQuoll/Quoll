// setParams

// contract WombatBooster
// _wom
// _voterProxy
// _womDepositor
// _qWom
// _quo
// _vlQuo
// _quoRewardPool
// _qWomRewardPool
// _treasury: Address

import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../utils";

const web3 = new Web3(process.env.RPC!);

async function main() {
  const masterWombat = "0xE2C07d20AF0Fb50CAE6cDD615CA44AbaAA31F9c8";
  const voterProxy = "0xe96c48C5FddC0DC1Df5Cf21d68A3D8b3aba68046";

  const MasterWombat: any = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: true,
          internalType: "contract IERC20",
          name: "lpToken",
          type: "address",
        },
        {
          indexed: false,
          internalType: "contract IBoostedMultiRewarder",
          name: "boostedRewarder",
          type: "address",
        },
      ],
      name: "Add",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Deposit",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "DepositFor",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "EmergencyWithdraw",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "balance",
          type: "uint256",
        },
      ],
      name: "EmergencyWomWithdraw",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Harvest",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint8",
          name: "version",
          type: "uint8",
        },
      ],
      name: "Initialized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "Paused",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "contract IBoostedMultiRewarder",
          name: "boostedRewarder",
          type: "address",
        },
      ],
      name: "SetBoostedRewarder",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract IBribeRewarderFactory",
          name: "bribeRewarderFactory",
          type: "address",
        },
      ],
      name: "SetBribeRewarderFactory",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "contract IMasterWombatV3",
          name: "masterWormbat",
          type: "address",
        },
      ],
      name: "SetNewMasterWombat",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "contract IMultiRewarder",
          name: "rewarder",
          type: "address",
        },
      ],
      name: "SetRewarder",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "Unpaused",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "basePartition",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "boostedPartition",
          type: "uint256",
        },
      ],
      name: "UpdateEmissionPartition",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "oldVeWOM",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newVeWOM",
          type: "address",
        },
      ],
      name: "UpdateVeWOM",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "oldVoter",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "newVoter",
          type: "address",
        },
      ],
      name: "UpdateVoter",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "user",
          type: "address",
        },
        {
          indexed: true,
          internalType: "uint256",
          name: "pid",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Withdraw",
      type: "event",
    },
    {
      inputs: [],
      name: "ACC_TOKEN_PRECISION",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "REWARD_DURATION",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "TOTAL_PARTITION",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IERC20",
          name: "_lpToken",
          type: "address",
        },
        {
          internalType: "contract IBoostedMultiRewarder",
          name: "_boostedRewarder",
          type: "address",
        },
      ],
      name: "add",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "basePartition",
      outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "boostedPartition",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "boostedRewarders",
      outputs: [
        {
          internalType: "contract IBoostedMultiRewarder",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "bribeRewarderFactory",
      outputs: [
        {
          internalType: "contract IBribeRewarderFactory",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "calRewardPerUnit",
      outputs: [
        { internalType: "uint256", name: "accWomPerShare", type: "uint256" },
        {
          internalType: "uint256",
          name: "accWomPerFactorShare",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "deposit",
      outputs: [
        { internalType: "uint256", name: "reward", type: "uint256" },
        {
          internalType: "uint256[]",
          name: "additionalRewards",
          type: "uint256[]",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
        { internalType: "address", name: "_user", type: "address" },
      ],
      name: "depositFor",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "emergencyWithdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "emergencyWomWithdraw",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "asset", type: "address" }],
      name: "getAssetPid",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "getSumOfFactors",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "contract IERC20", name: "_wom", type: "address" },
        { internalType: "contract IVeWom", name: "_veWom", type: "address" },
        { internalType: "address", name: "_voter", type: "address" },
        { internalType: "uint16", name: "_basePartition", type: "uint16" },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_periodFinish", type: "uint256" },
      ],
      name: "lastTimeRewardApplicable",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "massUpdatePools",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256[]", name: "_pids", type: "uint256[]" }],
      name: "migrate",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256[]", name: "_pids", type: "uint256[]" }],
      name: "multiClaim",
      outputs: [
        { internalType: "uint256", name: "reward", type: "uint256" },
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
        {
          internalType: "uint256[][]",
          name: "additionalRewards",
          type: "uint256[][]",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_lpToken", type: "address" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "notifyRewardAmount",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "pause",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "paused",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "address", name: "_user", type: "address" },
      ],
      name: "pendingTokens",
      outputs: [
        { internalType: "uint256", name: "pendingRewards", type: "uint256" },
        {
          internalType: "contract IERC20[]",
          name: "bonusTokenAddresses",
          type: "address[]",
        },
        {
          internalType: "string[]",
          name: "bonusTokenSymbols",
          type: "string[]",
        },
        {
          internalType: "uint256[]",
          name: "pendingBonusRewards",
          type: "uint256[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "poolInfo",
      outputs: [
        { internalType: "contract IERC20", name: "lpToken", type: "address" },
        { internalType: "uint96", name: "allocPoint", type: "uint96" },
        {
          internalType: "contract IMultiRewarder",
          name: "rewarder",
          type: "address",
        },
        { internalType: "uint256", name: "sumOfFactors", type: "uint256" },
        { internalType: "uint104", name: "accWomPerShare", type: "uint104" },
        {
          internalType: "uint104",
          name: "accWomPerFactorShare",
          type: "uint104",
        },
        {
          internalType: "uint40",
          name: "lastRewardTimestamp",
          type: "uint40",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      name: "poolInfoV3",
      outputs: [
        { internalType: "contract IERC20", name: "lpToken", type: "address" },
        {
          internalType: "contract IMultiRewarder",
          name: "rewarder",
          type: "address",
        },
        { internalType: "uint40", name: "periodFinish", type: "uint40" },
        { internalType: "uint128", name: "sumOfFactors", type: "uint128" },
        { internalType: "uint128", name: "rewardRate", type: "uint128" },
        { internalType: "uint104", name: "accWomPerShare", type: "uint104" },
        {
          internalType: "uint104",
          name: "accWomPerFactorShare",
          type: "uint104",
        },
        {
          internalType: "uint40",
          name: "lastRewardTimestamp",
          type: "uint40",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "poolLength",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "rewarderBonusTokenInfo",
      outputs: [
        {
          internalType: "contract IERC20[]",
          name: "bonusTokenAddresses",
          type: "address[]",
        },
        {
          internalType: "string[]",
          name: "bonusTokenSymbols",
          type: "string[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        {
          internalType: "contract IBoostedMultiRewarder",
          name: "_boostedRewarder",
          type: "address",
        },
      ],
      name: "setBoostedRewarder",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IBribeRewarderFactory",
          name: "_bribeRewarderFactory",
          type: "address",
        },
      ],
      name: "setBribeRewarderFactory",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IMasterWombatV3",
          name: "_newMasterWombat",
          type: "address",
        },
      ],
      name: "setNewMasterWombat",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        {
          internalType: "contract IMultiRewarder",
          name: "_rewarder",
          type: "address",
        },
      ],
      name: "setRewarder",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "contract IVeWom",
          name: "_newVeWom",
          type: "address",
        },
      ],
      name: "setVeWom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_newVoter", type: "address" }],
      name: "setVoter",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "unpause",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint16", name: "_basePartition", type: "uint16" },
      ],
      name: "updateEmissionPartition",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_user", type: "address" },
        {
          internalType: "uint256",
          name: "_newVeWomBalance",
          type: "uint256",
        },
      ],
      name: "updateFactor",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "_pid", type: "uint256" }],
      name: "updatePool",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "", type: "uint256" },
        { internalType: "address", name: "", type: "address" },
      ],
      name: "userInfo",
      outputs: [
        { internalType: "uint128", name: "amount", type: "uint128" },
        { internalType: "uint128", name: "factor", type: "uint128" },
        { internalType: "uint128", name: "rewardDebt", type: "uint128" },
        { internalType: "uint128", name: "pendingWom", type: "uint128" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "veWom",
      outputs: [{ internalType: "contract IVeWom", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "voter",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "_pid", type: "uint256" },
        { internalType: "uint256", name: "_amount", type: "uint256" },
      ],
      name: "withdraw",
      outputs: [
        { internalType: "uint256", name: "reward", type: "uint256" },
        {
          internalType: "uint256[]",
          name: "additionalRewards",
          type: "uint256[]",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "wom",
      outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const contract = new web3.eth.Contract(MasterWombat, masterWombat);

  // get all pool from 0 to 50
  for (let i = 0; i < 100; i++) {
    const dataReward = await contract.methods.userInfo(i, voterProxy).call();

    console.log(i, ":", dataReward.amount / 10 ** 18);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
