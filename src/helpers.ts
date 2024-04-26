import { log, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { StoreCache } from "./store-cache";

export function parseCalldata(calldata: Bytes): Bytes {
  // Remove function signature
  let dataWithoutSignature = calldata.toHexString().slice(10);

  // ethabi expects a tuple offset if your tuple contains dynamic data
  // https://medium.com/@r2d2_68242/indexing-transaction-input-data-in-a-subgraph-6ff5c55abf20
  let hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' +
    dataWithoutSignature;
  return Bytes.fromHexString(hexStringToDecode);
}

export function isSubmitterAllowed(
  cache: StoreCache,
  oracleIndex: String,
  submitter: Bytes
): boolean {
  let oracle = cache.getOracle(submitter);
  return oracle.active && oracle.index == oracleIndex;
}


export function getOracleVoteId(
  subgraphDeploymentID: String,
  oracleAddress: String,
  timestamp: String
): string {
  return [subgraphDeploymentID, oracleAddress, timestamp].join("-") as string;
}