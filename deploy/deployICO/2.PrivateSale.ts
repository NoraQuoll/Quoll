import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../../scripts/utils";

import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const web3 = new Web3(process.env.RPC!);
  
  //REPLACE THESES PARAMS
  const token = "0x27DA92438996FbC6Bc3bEbA3d92610b2Ff3dC37a"; //squo
  const startTime =    Math.floor(Date.now() / 1000) + 86400; //one day after deploy
  const lockDuration = 86400 * 30 * 1; // 1 month cliff
  const lockPercent = 2000; //20%
  const releaseDuration =  86400 * 30 * 9; // 9 months linear vesting
  const price =  0.012 * 10 ** 6;
  const minBuy = 5000 * 10**6; //5k$
  const usdt = "0xEAEf71E1c2f02b9cBB90E7dCCa6Dd7d99B0a2858";
  const recipient = "0xC822DcaD6f4e7CD8B6e80CAd1AFA3F97ae8579CD";

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
        args: [token, startTime, lockDuration, lockPercent,releaseDuration, usdt, price, minBuy, recipient, true, true],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    `PrivateSaleSQUOVestedEscrow`,
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

deploy.tags = ["PrivateSaleSQUOVestedEscrow"];

export default deploy;
