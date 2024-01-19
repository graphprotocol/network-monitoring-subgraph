import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { handleNewOwnership, handleNewPendingOwnership, handleOracleSet, handleOracleVote, handleVoteTimeLimitSet } from "../src/subgraph-availability-manager"
import { createNewOwnershipEvent, createNewPendingOwnershipEvent, createOracleSetEvent, createOracleVoteEvent, createVoteTimeLimitSetEvent } from "./subgraph-availability-manager-utils"

import { logStore } from 'matchstick-as/assembly/store'

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

const defaultID = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a01000000"
const samID = "0x0000000000000000000000000000000000000001"
const samAddress = Address.fromString(samID)
const governorID = "0x0000000000000000000000000000000000000002"
const governorAddress = Address.fromString(governorID)
const pendingGovernorID = "0x0000000000000000000000000000000000000003"
const pendingGovernorAddress = Address.fromString(pendingGovernorID)
const oracleID = "0x0000000000000000000000000000000000000004"
const oracleAddress = Address.fromString(oracleID)
const subgraphDeploymentID = "0x0000000000000000000000000000000000000005"
const subgraphDeploymentAddress = Address.fromString(subgraphDeploymentID)

describe("OWNERSHIP", () => {
  afterAll(() => {
    clearStore()
  })

  test("NewPendingOwnership created and stored", () => {
    let newPendingOwnershipEvent = createNewPendingOwnershipEvent(governorAddress, pendingGovernorAddress)
    handleNewPendingOwnership(newPendingOwnershipEvent)

    assert.entityCount("NewPendingOwnership", 1)
    assert.fieldEquals("NewPendingOwnership", defaultID, "from", governorID)
    assert.fieldEquals("NewPendingOwnership", defaultID, "to", pendingGovernorID)
  })

  test("NewOwnership created and stored", () => {
    let newNewOwnershipEvent = createNewOwnershipEvent(governorAddress, pendingGovernorAddress)
    handleNewOwnership(newNewOwnershipEvent)

    assert.entityCount("NewOwnership", 1)
    assert.fieldEquals("NewOwnership", defaultID, "from", governorID)
    assert.fieldEquals("NewOwnership", defaultID, "to", pendingGovernorID)
  })
})

describe("ORACLE", () => {
  afterAll(() => {
    clearStore()
  })

  test("OracleSet created and stored", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    assert.entityCount("OracleSet", 1)
    assert.fieldEquals("OracleSet", defaultID, "index", "0")
    assert.fieldEquals("OracleSet", defaultID, "oracle", oracleID)
  })

  test("OracleVote created and stored", () => {
    let newOracleVoteEvent = createOracleVoteEvent(
      subgraphDeploymentAddress, 
      true, 
      BigInt.fromI32(0),
      BigInt.fromI32(300)
    )
    handleOracleVote(newOracleVoteEvent)

    assert.entityCount("OracleVote", 1)
    assert.fieldEquals("OracleVote", defaultID, "subgraphDeploymentID", subgraphDeploymentID)
    assert.fieldEquals("OracleVote", defaultID, "deny", "true")
    assert.fieldEquals("OracleVote", defaultID, "oracleIndex", "0")
    assert.fieldEquals("OracleVote", defaultID, "timestamp", "300")
  })
})

describe("VOTE_TIME_LIMIT", () => {
  afterAll(() => {
    clearStore()
  })

  test("VoteTimeLimit created and stored", () => {
    let newVoteTimeLimitEvent = createVoteTimeLimitSetEvent(BigInt.fromI32(300))
    handleVoteTimeLimitSet(newVoteTimeLimitEvent)

    assert.entityCount("VoteTimeLimitSet", 1)
    assert.fieldEquals("VoteTimeLimitSet", defaultID, "voteTimeLimit", "300")
  })
})
