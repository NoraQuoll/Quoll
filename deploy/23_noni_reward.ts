import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../scripts/utils";

import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const web3 = new Web3(process.env.RPC!);

  const noniAddr = "0x88f8754b428f137099d7f60cd76b12a1754495c3"
  const bribeAddr = "0x2906d3392d90563DaB2548C0F353a4491F8E9bCc"


  const data = await deploy("NoniHolderReward", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
    gasPrice: await web3.eth.getGasPrice(),
    gasLimit: 50000000,
    proxy: {
      proxyContract: "OptimizedTransparentProxy",
      owner: deployer,
      execute: {
        methodName: "initialize",
        args: [noniAddr, bribeAddr],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    `NoniHolderReward`,
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

deploy.tags = ["NoniHolderReward"];

export default deploy;
