import {
  OracleSet as OracleSetEvent,
  OracleVote as OracleVoteEvent,
} from "../generated/SubgraphAvailabilityManager/SubgraphAvailabilityManager"

import { StoreCache } from "./store-cache";
import { getOracleVoteId } from "./helpers";

export function handleOracleSet(event: OracleSetEvent): void {
  let oracleIndex = event.params.index.toString();
  let oracleAddress = event.params.oracle;
  
  let cache = new StoreCache();
  let state = cache.getGlobalState();
  let oracle = cache.getOracle(oracleIndex);
  oracle.state = state.id;
  oracle.address = oracleAddress;
  oracle.latestConfig = "";
  
  cache.commitChanges();
}

export function handleOracleVote(event: OracleVoteEvent): void {
  let subgraphDeploymentID = event.params.subgraphDeploymentID.toHexString();
  let oracleIndex = event.params.oracleIndex.toString();
  let timestamp = event.params.timestamp.toString();
  let voteId = getOracleVoteId(subgraphDeploymentID, oracleIndex, timestamp);
  
  let cache = new StoreCache();
  let oracle = cache.getOracle(oracleIndex);
  let oracleVote = cache.getOracleVote(voteId);
  oracleVote.subgraphDeploymentID = event.params.subgraphDeploymentID
  oracleVote.deny = event.params.deny
  oracleVote.oracle = oracle.id
  oracleVote.timestamp = event.params.timestamp

  cache.commitChanges();
}
