import * as dotenv from "dotenv";
import Web3 from "web3";

dotenv.config();

import * as fs from "fs";
import { getContracts } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const lp_token = "0xa387A64D4E1711442FADeF1dd4C697d901DCCf05";
  const vlQuoV2 = "0xc634c0A24BFF88c015Ff32145CE0F8d578B02F60";
  const treasury = "0xAB7ABCF6D4d1A75F00804dCBF5551794eB6c87B1";
  
  const cakeLpLocker = "0x0FFd14D28Af0fc1A64d7d63Bc64C45551078D01E";

  const CakeLpLocker = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/CakeLpLocker.sol/CakeLpLocker.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(CakeLpLocker);

  const txData = contract.methods
    .setParams(lp_token, vlQuoV2, treasury)
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("300000"),
    data: txData,
    to: cakeLpLocker,
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
