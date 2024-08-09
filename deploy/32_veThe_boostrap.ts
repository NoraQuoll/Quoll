import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../scripts/utils";

import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const voterProxy = "0x605519B1ef3E9d8490e61136cA95607040E95254";
const qTHE = "0x342435347F5FEd4F9ACd18185883C1E2F6E26d1A";
const veTHE = "0xb8Cd7F22722F80CBDc21059Ae91BfA0d8b6ebc9B";
const bootstrapLens = "0xeE68e08e79DCb2458A3423C926e1E992675B9341";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const web3 = new Web3(process.env.RPC!);

  const data = await deploy("VeTHEbootstrap", {
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
        args: [voterProxy, qTHE, veTHE, bootstrapLens],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    `VeTHEbootstrap`,
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

deploy.tags = ["VeTHEbootstrap"];

export default deploy;
