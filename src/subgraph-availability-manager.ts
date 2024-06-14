import { BigInt, log } from "@graphprotocol/graph-ts"

import {
  OracleSet as OracleSetEvent,
  OracleVote as OracleVoteEvent,
} from "../generated/SubgraphAvailabilityManager/SubgraphAvailabilityManager"
import { Oracle } from "../generated/schema"
import { StoreCache } from "./store-cache";
import { getOracleVoteId } from "./helpers";

export function handleOracleSet(event: OracleSetEvent): void {
  let oracleIndex = event.params.index.toString();
  let oracleAddress = event.params.oracle;
  
  let cache = new StoreCache();
  let state = cache.getGlobalState();
  let oracle = cache.getOracle(oracleAddress);
  oracle.state = state.id;
  oracle.index = oracleIndex;
  oracle.latestConfig = "";
  oracle.active = true
  oracle.activeSince = event.block.timestamp;
  oracle.activeUntil = BigInt.fromI32(0);

  replaceActiveOracle(oracle, cache);
  cache.commitChanges();
}

export function handleOracleVote(event: OracleVoteEvent): void {
  let subgraphDeploymentID = event.params.subgraphDeploymentID.toHexString();
  let oracleAddress = event.transaction.from.toHexString();
  let timestamp = event.params.timestamp.toString();
  let voteId = getOracleVoteId(subgraphDeploymentID, oracleAddress, timestamp);
  
  let cache = new StoreCache();
  let oracle = cache.getOracle(event.transaction.from);
  let oracleVote = cache.getOracleVote(voteId);
  oracleVote.subgraphDeploymentID = event.params.subgraphDeploymentID
  oracleVote.deny = event.params.deny
  oracleVote.oracle = oracle.id
  oracleVote.timestamp = event.params.timestamp

  cache.commitChanges();
}

function replaceActiveOracle(newOracle: Oracle, cache: StoreCache): void {
  let state = cache.getGlobalState();
  let activeOracles = cache.getGlobalState().activeOracles;

  for (let i = 0; i < activeOracles.length; i++) {
    let currectActiveOracle = cache.getOracle(activeOracles[i]);
    // Replacement is done by oracle_index
    if (currectActiveOracle.index == newOracle.index) {
      activeOracles[i] = newOracle.id;
      state.activeOracles = activeOracles;
      currectActiveOracle.active = false;
      currectActiveOracle.activeUntil = newOracle.activeSince;
      return;
    }
  }

  activeOracles.push(newOracle.id);
  state.activeOracles = activeOracles;
}