
import Web3 from "web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

import * as fs from "fs";


const web3 = new Web3(process.env.RPC!);
const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;
const operator = "0x2347337880f5a428deC100Be1e1efB5b5C024F32";//bootstrap

async function main() {
    const votingEscrowV1_1 = "0x727B9feC11B1216dc2dDDFb93037D6F0342854d5";

   const VotingEscrowV1_1 = JSON.parse(
       fs.readFileSync(
       "./artifacts/contracts/SWPxVotingEscrowV1_1.sol/VotingEscrowV1_1.json",
         "utf-8"
       )
     ).abi;

    const txCount = await web3.eth.getTransactionCount(user);

    const contract = new web3.eth.Contract(VotingEscrowV1_1, votingEscrowV1_1);

    const txData = contract.methods
        .setApprovalForAll(operator, true)
        .encodeABI();
    console.log(txData);

     //using ETH
    const calculateFeeData = await web3.eth.calculateFeeData()
    const txObj = {
        nonce: txCount,
        gas: web3.utils.toHex(2000000),
        gasPrice: (await web3.eth.getGasPrice()).toString(),
        data: txData,
        to: votingEscrowV1_1,
        from: user,
       
    };
  
      const signedTx = await web3.eth.accounts.signTransaction(txObj, user_pk!);
  
      const result = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction!
      );
      console.log(result);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
