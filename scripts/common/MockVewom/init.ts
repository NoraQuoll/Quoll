import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";
import { saveContract, getContracts, sleep } from "../../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const address = "0x745047ee5EEf7644CC4CB26c6188cF39aD225493";

  const ContractABI: any = [
    {
      inputs: [
        { internalType: "contract IERC20", name: "_wom", type: "address" },
        {
          internalType: "contract IMasterWombat",
          name: "_masterWombat",
          type: "address",
        },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(ContractABI);

  const txData = contract.methods
    .initialize(
      "0x7bfc90abeeb4138e583bfc46abc69de34c9abb8b",
      "0x8C0e9334DBFAC1b9184bC01Ef638BA705cc13EaF"
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("3000000"),
    data: txData,
    to: address,
    from: user,
  };

  const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);

  const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction!);
  console.log(result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
