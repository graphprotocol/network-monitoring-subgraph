import {
  assert,
  describe,
  test,
  clearStore,
  afterEach,
  createMockedFunction,
  newMockEvent,
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import {
  handleAllocationClosed,
  handleAllocationCreated,
  handleBurned,
  handleRewardsDenylistUpdated,
  handleSignalled,
} from "../src/solo"
import { AllocationClosed, AllocationCreated } from "../generated/SubgraphService/SubgraphService"
import { Burned, Signalled } from "../generated/Curation/Curation"
import { RewardsDenylistUpdated } from "../generated/RewardsManager/RewardsManager"

// Outside arbitrum-sepolia the mappings read the arbitrum-one contracts.
const CURATION = Address.fromString("0x22d78fb4bc72e191C765807f8891B5e1785C8014")
const REWARDS_MANAGER = Address.fromString("0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525")

const DEPLOYMENT = Bytes.fromHexString(
  "0x1111111111111111111111111111111111111111111111111111111111111111"
)
const A = Address.fromString("0x000000000000000000000000000000000000000a")
const B = Address.fromString("0x000000000000000000000000000000000000000b")
const CURATOR = Address.fromString("0x00000000000000000000000000000000000000cc")

/** Set what the contracts report for DEPLOYMENT. */
function mockState(signal: i32, tokens: i32, denied: boolean): void {
  let arg = [ethereum.Value.fromFixedBytes(DEPLOYMENT)]
  createMockedFunction(CURATION, "getCurationPoolSignal", "getCurationPoolSignal(bytes32):(uint256)")
    .withArgs(arg)
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(signal))])
  createMockedFunction(CURATION, "getCurationPoolTokens", "getCurationPoolTokens(bytes32):(uint256)")
    .withArgs(arg)
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokens))])
  createMockedFunction(REWARDS_MANAGER, "isDenied", "isDenied(bytes32):(bool)")
    .withArgs(arg)
    .returns([ethereum.Value.fromBoolean(denied)])
}

function allocation(indexer: Address, id: i32): ethereum.EventParam[] {
  return [
    new ethereum.EventParam("indexer", ethereum.Value.fromAddress(indexer)),
    // Single-digit ids: 39 zeros and the digit make a 20-byte address.
    new ethereum.EventParam("allocationId", ethereum.Value.fromAddress(Address.fromString(
      "0x000000000000000000000000000000000000000" + id.toString()
    ))),
    new ethereum.EventParam("subgraphDeploymentId", ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    new ethereum.EventParam("tokens", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100))),
  ]
}

function open(indexer: Address, id: i32): void {
  let event = changetype<AllocationCreated>(newMockEvent())
  event.parameters = allocation(indexer, id)
  event.parameters.push(new ethereum.EventParam("currentEpoch", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))))
  handleAllocationCreated(event)
}

function close(indexer: Address, id: i32): void {
  let event = changetype<AllocationClosed>(newMockEvent())
  event.parameters = allocation(indexer, id)
  event.parameters.push(new ethereum.EventParam("forceClosed", ethereum.Value.fromBoolean(false)))
  handleAllocationClosed(event)
}

function signalled(): void {
  let event = changetype<Signalled>(newMockEvent())
  event.parameters = [
    new ethereum.EventParam("curator", ethereum.Value.fromAddress(CURATOR)),
    new ethereum.EventParam("subgraphDeploymentID", ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    new ethereum.EventParam("tokens", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
    new ethereum.EventParam("signal", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
    new ethereum.EventParam("curationTax", ethereum.Value.fromUnsignedBigInt(BigInt.zero())),
  ]
  handleSignalled(event)
}

function burned(): void {
  let event = changetype<Burned>(newMockEvent())
  event.parameters = [
    new ethereum.EventParam("curator", ethereum.Value.fromAddress(CURATOR)),
    new ethereum.EventParam("subgraphDeploymentID", ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    new ethereum.EventParam("tokens", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
    new ethereum.EventParam("signal", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))),
  ]
  handleBurned(event)
}

function denylist(sinceBlock: i32): void {
  let event = changetype<RewardsDenylistUpdated>(newMockEvent())
  event.parameters = [
    new ethereum.EventParam("subgraphDeploymentID", ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    new ethereum.EventParam("sinceBlock", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(sinceBlock))),
  ]
  handleRewardsDenylistUpdated(event)
}

function assertSolo(indexer: Address, count: i32, tokens: i32): void {
  assert.fieldEquals("Indexer", indexer.toHexString(), "soloCount", count.toString())
  assert.fieldEquals("Indexer", indexer.toHexString(), "soloSignalledTokens", tokens.toString())
}

describe("Solo deployments", () => {
  afterEach(() => {
    clearStore()
  })

  test("one indexer on a deployment with signal is solo", () => {
    mockState(10, 500, false)
    open(A, 1)
    assertSolo(A, 1, 500)
    assert.fieldEquals("Deployment", DEPLOYMENT.toHexString(), "activeIndexerCount", "1")
    assert.fieldEquals("Deployment", DEPLOYMENT.toHexString(), "soloIndexer", A.toHexString())
  })

  test("a second indexer ends it, and leaving restores it", () => {
    mockState(10, 500, false)
    open(A, 1)
    open(B, 2)
    assertSolo(A, 0, 0)
    assertSolo(B, 0, 0)
    assert.fieldEquals("Deployment", DEPLOYMENT.toHexString(), "activeIndexerCount", "2")

    close(A, 1)
    assertSolo(B, 1, 500)
    assertSolo(A, 0, 0)
  })

  test("several allocations by one indexer count as one indexer", () => {
    mockState(10, 500, false)
    open(A, 1)
    open(A, 2)
    assertSolo(A, 1, 500)
    close(A, 1)
    assertSolo(A, 1, 500)
    close(A, 2)
    assertSolo(A, 0, 0)
    assert.fieldEquals("Deployment", DEPLOYMENT.toHexString(), "activeIndexerCount", "0")
  })

  test("no signal, no solo", () => {
    mockState(0, 0, false)
    open(A, 1)
    assertSolo(A, 0, 0)
  })

  test("signal going to zero and back moves the deployment out and in", () => {
    mockState(10, 500, false)
    open(A, 1)

    mockState(0, 0, false)
    burned()
    assertSolo(A, 0, 0)

    mockState(20, 900, false)
    signalled()
    assertSolo(A, 1, 900)
  })

  test("denial removes it, and lifting the denial restores it", () => {
    mockState(10, 500, false)
    open(A, 1)
    denylist(1234)
    assertSolo(A, 0, 0)
    denylist(0)
    assertSolo(A, 1, 500)
  })

  test("a deployment already denied when first seen is not solo", () => {
    mockState(10, 500, true)
    open(A, 1)
    assertSolo(A, 0, 0)
  })

  test("closing an allocation never seen open changes nothing", () => {
    mockState(10, 500, false)
    open(A, 1)
    close(B, 7)
    assertSolo(A, 1, 500)
    assert.fieldEquals("Deployment", DEPLOYMENT.toHexString(), "activeIndexerCount", "1")
  })
})
