import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, ByteArray, Bytes, crypto } from "@graphprotocol/graph-ts"
import { handleTokensPulled } from "../src/activity-handlers"
import { handleOracleSet, handleOracleVote } from "../src/subgraph-availability-manager"
import { getActivityId } from "../src/activity"
import { createTokensPulledEvent } from "./activity-utils"
import { createOracleSetEvent, createOracleVoteEvent } from "./subgraph-availability-manager-utils"
import { Activity } from "../generated/schema"

const billing = Address.fromString("0x1b07d3344188908fb6deceac381f3ee63c48477a")
const wallet = Address.fromString("0x05f9eea50c6bcd46c07c8ef64566af9a9cc91109")
const other = Address.fromString("0x0000000000000000000000000000000000000007")
const anySender = Address.zero()

const DAY = 86400
const tokensPulled = Bytes.fromByteArray(
  crypto.keccak256(ByteArray.fromUTF8("TokensPulled(address,uint256)"))
)

function idFor(account: Address): string {
  return getActivityId(billing, tokensPulled, account)
}

describe("Activity", () => {
  afterEach(() => {
    clearStore()
  })

  test("topic0 is the event's real topic", () => {
    // 0x3c3f210f… is what TokensPulled logs carry on Arbitrum One.
    assert.assertTrue(tokensPulled.toHexString().startsWith("0x3c3f210f"))
  })

  test("the id is emitter-topic0-account in lowercase hex", () => {
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 10 * DAY, 100))
    let id =
      "0x1b07d3344188908fb6deceac381f3ee63c48477a-" +
      tokensPulled.toHexString() +
      "-0x05f9eea50c6bcd46c07c8ef64566af9a9cc91109"
    assert.fieldEquals("Activity", id, "count", "1")
    assert.fieldEquals("Activity", id, "event", "TokensPulled(address,uint256)")
  })

  test("first event creates the sender and any-sender entities", () => {
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 10 * DAY, 100))

    assert.entityCount("Activity", 2)
    assert.fieldEquals("Activity", idFor(wallet), "account", wallet.toHexString())
    assert.fieldEquals("Activity", idFor(wallet), "lastBlock", "100")
    assert.fieldEquals("Activity", idFor(wallet), "lastTimestamp", (10 * DAY).toString())
    assert.fieldEquals("Activity", idFor(wallet), "firstBlock", "100")
    assert.fieldEquals("Activity", idFor(anySender), "count", "1")
  })

  test("later events move last-seen forward and keep first-seen", () => {
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 10 * DAY, 100))
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 10 * DAY + 60, 101))
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 11 * DAY + 5, 200))

    assert.fieldEquals("Activity", idFor(wallet), "count", "3")
    assert.fieldEquals("Activity", idFor(wallet), "firstBlock", "100")
    assert.fieldEquals("Activity", idFor(wallet), "lastBlock", "200")
    assert.fieldEquals("Activity", idFor(wallet), "lastTimestamp", (11 * DAY + 5).toString())

    // Per-day buckets: two events on day 10, one on day 11.
    assert.fieldEquals("ActivityDay", idFor(wallet) + "-10", "count", "2")
    assert.fieldEquals("ActivityDay", idFor(wallet) + "-10", "date", (10 * DAY).toString())
    assert.fieldEquals("ActivityDay", idFor(wallet) + "-11", "count", "1")
  })

  test("each sender gets its own entity; any-sender counts them all", () => {
    handleTokensPulled(createTokensPulledEvent(billing, wallet, 10 * DAY, 100))
    handleTokensPulled(createTokensPulledEvent(billing, other, 10 * DAY + 1, 101))

    assert.entityCount("Activity", 3)
    assert.fieldEquals("Activity", idFor(wallet), "count", "1")
    assert.fieldEquals("Activity", idFor(other), "count", "1")
    assert.fieldEquals("Activity", idFor(anySender), "count", "2")
    assert.fieldEquals("Activity", idFor(anySender), "lastBlock", "101")
  })

  test("oracle votes are tracked as activity too", () => {
    let oracle = Address.fromString("0x0000000000000000000000000000000000000004")
    // As on chain, the oracle is registered before it votes.
    handleOracleSet(createOracleSetEvent(BigInt.fromI32(0), oracle))
    let event = createOracleVoteEvent(
      oracle,
      Bytes.fromHexString("0x0000000000000000000000000000000000000005"),
      false,
      BigInt.fromI32(0),
      BigInt.fromI32(1)
    )
    handleOracleVote(event)

    let topic0 = Bytes.fromByteArray(
      crypto.keccak256(ByteArray.fromUTF8("OracleVote(bytes32,bool,uint256,uint256)"))
    )
    let activity = Activity.load(getActivityId(event.address, topic0, oracle))
    assert.assertNotNull(activity)
    // The existing vote entity is still written.
    assert.entityCount("OracleVote", 1)
  })
})
