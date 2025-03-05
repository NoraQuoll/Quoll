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
    const data = await deploy("VotingEscrowV1_1", {
        from: deployer,
        args: [],
        log: true,
        deterministicDeployment: false,
        gasPrice: (await web3.eth.getGasPrice()).toString(),
    });

   
    console.log("VotingEscrowV1_1 deployed to:", data.address);
    await saveContract(network.name, "VotingEscrowV1_1", data.address, data.implementation!);

    try {
        await hre.run("verify:verify", {
            address: data.address,
            constructorArguments: [],
        });
    } catch (e) {
        console.log(e);
    }
};

deploy.tags = ["VotingEscrowV1_1"];
export default deploy;
