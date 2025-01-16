import { newMockEvent } from "matchstick-as"
import { ethereum, Bytes, BigInt } from "@graphprotocol/graph-ts"
import {
  RewardsDenylistUpdated
} from "../generated/RewardsManager/RewardsManager"

export function createRewardsDenylistUpdatedEvent(
  subgraphDeploymentID: Bytes,
  sinceBlock: BigInt
): RewardsDenylistUpdated {
  let rewardsDenylistUpdatedEvent =
    changetype<RewardsDenylistUpdated>(newMockEvent())

  rewardsDenylistUpdatedEvent.parameters = new Array()

  rewardsDenylistUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "subgraphDeploymentID",
      ethereum.Value.fromFixedBytes(subgraphDeploymentID)
    )
  )
  rewardsDenylistUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "sinceBlock",
      ethereum.Value.fromUnsignedBigInt(sinceBlock)
    )
  )

  return rewardsDenylistUpdatedEvent
}
