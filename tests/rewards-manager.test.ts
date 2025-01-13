import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Bytes, BigInt } from "@graphprotocol/graph-ts"
import { handleRewardsDenylistUpdated } from "../src/rewards-manager"
import { createRewardsDenylistUpdatedEvent } from "./rewards-manager-utils"

const subgraphDeploymentID = "0x0000000000000000000000000000000000000005"
const subgraphDeploymentBytes = Bytes.fromHexString(subgraphDeploymentID)

describe("RewardsManager", () => {
  afterEach(() => {
    clearStore()
  })

  test("RewardsDenylistUpdated created and stored", () => {
    let newRewardsDenylistUpdatedEvent = createRewardsDenylistUpdatedEvent(
      subgraphDeploymentBytes,
      BigInt.fromI32(100)
    )
    handleRewardsDenylistUpdated(newRewardsDenylistUpdatedEvent)

    assert.entityCount("RewardsDenylist", 1)
    assert.fieldEquals(
      "RewardsDenylist",
      newRewardsDenylistUpdatedEvent.transaction.hash.concatI32(newRewardsDenylistUpdatedEvent.logIndex.toI32()).toHexString(),
      "subgraphDeploymentID",
      subgraphDeploymentID
    )
    assert.fieldEquals(
      "RewardsDenylist",
      newRewardsDenylistUpdatedEvent.transaction.hash.concatI32(newRewardsDenylistUpdatedEvent.logIndex.toI32()).toHexString(),
      "sinceBlock",
      "100"
    )
    // Verify SubgraphState relationship
    assert.entityCount("SubgraphState", 1)
    assert.fieldEquals("SubgraphState", subgraphDeploymentID, "id", subgraphDeploymentID)
    assert.fieldEquals(
      "SubgraphState",
      subgraphDeploymentID,
      "lastUpdated",
      newRewardsDenylistUpdatedEvent.block.timestamp.toString()
    )
  })
})
