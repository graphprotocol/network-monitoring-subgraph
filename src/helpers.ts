import { log, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { StoreCache } from "./store-cache";
import { TUPLE_OFFSET_HEX } from './constants';

export function parseCalldata(calldata: Bytes): Bytes {
  // Remove function signature
  let dataWithoutSignature = calldata.toHexString().slice(10);
  let result = TUPLE_OFFSET_HEX + dataWithoutSignature;
  return Bytes.fromHexString(result);
}

export function isSubmitterAllowed(
  cache: StoreCache,
  oracleIndex: String,
  submitter: String,
): boolean {
  let oracle = cache.getOracle(oracleIndex);
  return oracle.address.toHexString() == submitter;
}


export function getOracleVoteId(
  subgraphDeploymentID: String,
  oracleIndex: String,
  timestamp: String
): string {
  return [subgraphDeploymentID, oracleIndex, timestamp].join("-") as string;
}