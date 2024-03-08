import Web3 from "web3";

import * as dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

const token = "0x7BFC90abeEB4138e583bfC46aBC69De34c9ABb8B";
const contract_add = "0x944B7ee4113A0bd0b916cE752193D7A4A56e402d";

async function main() {
  const Token = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/QuollToken.sol/QuollToken.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(Token, token);

  const txData = contract.methods
    .approve(contract_add, "1000000000000000010000000000000000")
    .encodeABI();

  const estGas = Math.ceil(
    (await contract.methods
      .approve(contract_add, "1000000000000000010000000000000000")
      .estimateGas({ from: user })) * 1.1
  );

  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex(estGas),
    data: txData,
    to: token,
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
