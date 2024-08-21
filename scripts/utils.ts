import fs from "fs";
import path from "path";

import { utils } from "ethers";
import MerkleTree from "merkletreejs";

const SHA256 = require("crypto-js/sha256");

export async function saveContract(
  network: string,
  contract: string,
  address: string,
  impl?: string
) {
  const addresses = await getContracts();
  addresses[network] = addresses[network] || {};
  addresses[network][contract] = {
    address,
    impl,
  };
  fs.writeFileSync(
    path.join(__dirname, "../contract-addresses.json"),
    JSON.stringify(addresses, null, "    ")
  );
}

export function getContracts(): any {
  let json;
  try {
    json = fs.readFileSync(
      path.join(__dirname, "../contract-addresses.json"),
      "utf-8"
    );
  } catch {
    json = "{}";
  }
  if (json === "") json = "{}";
  return JSON.parse(json);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function hashUserAndAmount(user: string, amount: string) {
  const encodedData = utils.solidityPack(
    ["address", "uint256"],
    [user, amount]
  );

  // Compute the keccak256 hash
  const hash = utils.keccak256(encodedData);

  return hash;
}
export function bufferToBytes32(buffer: any) {
  const hexString = "0x" + buffer.toString("hex");
  return utils.hexZeroPad(hexString, 32);
}

export function createTree(leaves: any[]) {
  return new MerkleTree(leaves, utils.keccak256, {
    sortPairs: true,
    sortLeaves: true,
    sort: true,
  });
}

export function getProofandRoot(leaves: any[], leaf: string) {
  let tree = createTree(leaves);

  const root = "0x" + tree.getRoot().toString("hex");

  let proof = tree.getProof(leaf);

  let newProof = proof.map((x) => bufferToBytes32(x.data));

  return {
    proof: newProof,
    root,
  };
}
