import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../../scripts/utils";
import { parseEther } from "ethers/lib/utils";
import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const web3 = new Web3(process.env.RPC!);

  //REPLACE THESES PARAMS
  const token = "0xF02b3b6dE7a3f1ED2651e34812eA10C9850cAf19"; //squo 
  const startTime =    Math.floor(new Date("2025-03-24T00:00:00Z").getTime() / 1000);;
  const lockDuration =   86400 * 30 * 1; // 1 months cliff;
  const lockPercent = 1000;
  const releaseDuration =  86400 * 30 * 9; //9 months linear vesting
  const data = await deploy("SQUOVestedEscrow", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
    gasPrice: (await web3.eth.getGasPrice()).toString(),
    proxy: {
      proxyContract: "OptimizedTransparentProxy",
      owner: deployer,
      execute: {
        methodName: "initialize",
        args: [token, startTime, lockDuration, lockPercent, releaseDuration],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    `SQUOVestedEscrowPrivateSale`,
    data.address,
    data.implementation!
  );


  // verify proxy contract
  try {
    // verify
    await hre.run("verify:verify", {
      address: data.address,
      constructorArguments: [],
    });
  } catch (e) {
    console.log(e);
  }

  // verify impl contract 
  try {
    // verify
    await hre.run("verify:verify", {
      address: data.implementation,
      constructorArguments: [],
    });
  } catch (e) {
    console.log(e);
  }
};

deploy.tags = ["SQUOVestedEscrowPrivateSale"];

export default deploy;
