import * as dotenv from "dotenv";
import Web3 from "web3";

dotenv.config();

import * as fs from "fs";
import { getContracts } from "../utils";

const web3 = new Web3(process.env.RPC!);

const user_pk = process.env.PK;

const user = web3.eth.accounts.privateKeyToAccount(user_pk!).address;

async function main() {
  const bribeManager = await getContracts()[process.env.NETWORK_NAME!][
    "BribeManager"
  ]["address"];

  const voterProxy = await getContracts()[process.env.NETWORK_NAME!][
    "WombatVoterProxy"
  ]["address"];

  const vlQuoV2 = await getContracts()[process.env.NETWORK_NAME!]["VlQuoV2"][
    "address"
  ];

  const nativeZap = await getContracts()[process.env.NETWORK_NAME!][
    "NativeZapper"
  ]["address"];

  const delegatePool = await getContracts()[process.env.NETWORK_NAME!][
    "DelegateVotePool"
  ]["address"];

  const BribeManager = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/BribeManager.sol/BribeManager.json",
      "utf-8"
    )
  ).abi;

  const txCount = await web3.eth.getTransactionCount(user);

  const contract = new web3.eth.Contract(BribeManager);

  const txData = contract.methods
    .setParams(
      process.env.WOMBAT_VOTER,
      voterProxy,
      vlQuoV2,
      nativeZap,
      delegatePool
    )
    .encodeABI();
  console.log(txData);

  //using ETH
  const txObj = {
    nonce: txCount,
    gasLimit: web3.utils.toHex("30000000"),
    data: txData,
    to: bribeManager,
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
