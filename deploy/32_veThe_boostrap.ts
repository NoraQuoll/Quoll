import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { saveContract, getContracts, sleep } from "../scripts/utils";

import * as dotenv from "dotenv";
dotenv.config();

import Web3 from "web3";

const voterProxy = "0x605519B1ef3E9d8490e61136cA95607040E95254";
const qTHE = "0x2ebB769F2714b0d22764a7f6A5ecD54462d1E4Dd";
const veTHE = "0x2b4A87Fd2b5Cf2Cbb253b5286Dfc7EED64421d15";
const rate = "1000000000000000000";
const bootstrapLens = "0xe453CE0b5E7c10F0F5F508E7C5967129DF10Ac52";

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
        args: [voterProxy, qTHE, veTHE, rate, bootstrapLens],
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
