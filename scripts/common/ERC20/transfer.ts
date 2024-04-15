import Web3 from "web3";

import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import { getContracts } from "../../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const to = "0xC17ADEE898ba323242B7C9654F617F7542128322";

async function main() {
  const quoll_token = "0x55d398326f99059fF775485246999027B3197955";

  const Token = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(Token);

  const txData = contract.methods
    .transfer(to, "28000000000000000000")
    .encodeABI();

  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
    data: txData,
    to: quoll_token,
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
