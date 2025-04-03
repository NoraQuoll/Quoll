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

  const operator = "0x5d34F95157558af63dfD8091dA329D36Fe5C64b6"; //thena delegate pool contract address
  const data = await deploy("ThenaVirtualBalanceRewardPool", {
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
        args: [operator],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    "ThenaVirtualBalanceRewardPool",
    data.address,
    data.implementation!
  );

  
  // verify proxy contract
  try {
    // verify
    await hre.run("verify:verify", {
      address: data.address,
      constructorArguments: [operator],
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

deploy.tags = ["ThenaVirtualBalanceRewardPool"];

export default deploy;
