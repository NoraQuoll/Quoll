import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../scripts/utils";

import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const lp_token = "0xAD87CB711ADF067e0D6F0Ed6867bF23C00d930d6";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const web3 = new Web3(process.env.RPC!);

  //booster
  const operator = "0x6FCA396A8a2b623b24A998A5808c0E144Aa0689a"

  const data = await deploy("DepositToken", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
    gasPrice: await web3.eth.getGasPrice(),
    proxy: {
      proxyContract: "OptimizedTransparentProxy",
      owner: deployer,
      execute: {
        methodName: "initialize",
        args: [operator, lp_token],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    "DepositToken" + lp_token,
    data.address,
    data.implementation!
  );

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

deploy.tags = ["DepositToken"];

export default deploy;
