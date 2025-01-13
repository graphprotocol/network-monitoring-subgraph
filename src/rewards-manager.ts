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

  let entity = cache.getRewardsDenylist(id);
  entity.subgraphDeploymentID = subgraphDeploymentID;
  entity.subgraphState = subgraphState.id;
  entity.sinceBlock = event.params.sinceBlock;
  entity.timestamp = event.block.timestamp;

  cache.commitChanges();
}
