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
  const startTime =    1;
  const endTime = 1000000000000
  const price =  0.01 * 10 ** 6;
  const minBuy = 5000 * 10**6; //5k$
  const usdt = "0x6047828dc181963ba44974801ff68e538da5eaf9";
  const recipient = "0xA4d81496E03f2449D2002632652d9b277f141345";
  const supply = parseEther("20000000");

  const data = await deploy("ICOPreseedSale", {
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
        args: [usdt, price, minBuy, supply, startTime, endTime, recipient],
      },
    },
  });

  await saveContract(network.name, "DefaultProxyAdmin", data.args![1]);
  await saveContract(
    network.name,
    `ICOPreseedSale`,
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

deploy.tags = ["ICOPreseedSale"];

export default deploy;
