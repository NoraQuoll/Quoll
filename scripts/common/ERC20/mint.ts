import Web3 from "web3";

import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import { getContracts } from "../../utils";
import { getGasPrice } from "web3/lib/commonjs/eth.exports";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const quoll_token = "0xCBD28bDF789422c3e4fF37834ADe0d0e804b8f50"
  const Token = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(Token, quoll_token);

  const txData = contract.methods
    .mint("0x0bab13c3c77b0d1c0be7b19f7987e20dd242e70d", "719750345039652193149069")
    .encodeABI();


  const txObj = {
    nonce: txCount,
    gas: web3.utils.toHex(300000),
    data: txData,
    to: quoll_token,
    from: user,
    gasPrice: await web3.eth.getGasPrice()
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
