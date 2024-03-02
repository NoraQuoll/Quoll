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
  const _token = "";
  const _startTime = "";
  const _lockDuration = "";
  const _lockPercent = "";
  const _releaseDuration = "";

  const data = await deploy("VestedEscrow", {
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
        args: [
          _token,
          _startTime,
          _lockDuration,
          _lockPercent,
          _releaseDuration,
        ],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    "VestedEscrow",
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

deploy.tags = ["VestedEscrow"];

export default deploy;
