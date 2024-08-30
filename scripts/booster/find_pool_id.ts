import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";


const web3 = new Web3(process.env.RPC!);

const address = "0xd940aEa46851E6Dc4DBf564C0B8b3D7691Cb5d54";

async function main() {
    const WombatBooster = JSON.parse(
        fs.readFileSync(
          "./artifacts/contracts/WombatBooster.sol/WombatBooster.json",
          "utf-8"
        )
      ).abi;

      const ERC20 = JSON.parse(
        fs.readFileSync(
          "./artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json",
          "utf-8"
        )
      ).abi;

      const contract = new web3.eth.Contract(
        WombatBooster,
        address
      );

      const poolLens = await contract.methods.poolLength().call();


      console.log(poolLens);

      for (let i = 0; i < Number(poolLens); i++) {
        const data: any = await contract.methods.poolInfo(i).call();

        if (i == 30) {
            console.log({data})
        }

        const contract_lp = new web3.eth.Contract(ERC20, data.lptoken);

        const lp_name = await contract_lp.methods.name().call();

        console.log(
            i,
            ":",
            data.lptoken,
            ":",
            lp_name
          );
      }
}

main()