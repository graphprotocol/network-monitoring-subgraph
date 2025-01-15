import { BigInt } from "@graphprotocol/graph-ts"
import {
  RewardsDenylistUpdated as RewardsDenylistUpdatedEvent,
} from "../generated/RewardsManager/RewardsManager"
import { StoreCache } from "./store-cache";

export function handleRewardsDenylistUpdated(
  event: RewardsDenylistUpdatedEvent,
): void {
  let subgraphDeploymentID = event.params.subgraphDeploymentID;
  let id = event.transaction.hash.concatI32(event.logIndex.toI32());

  let cache = new StoreCache();
  let state = cache.getGlobalState();
  
  let subgraphState = cache.getSubgraphState(subgraphDeploymentID);
  subgraphState.globalState = state.id;
  subgraphState.lastUpdated = event.block.timestamp;

  let entity = cache.getRewardsDenyLogs(id);
  entity.deny = event.params.sinceBlock != BigInt.fromI32(0);
  entity.subgraphDeploymentID = subgraphDeploymentID;
  entity.subgraphState = subgraphState.id;
  entity.timestamp = event.block.timestamp;

  cache.commitChanges();
}
