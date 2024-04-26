import {
  assert,
  describe,
  test,
  clearStore,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, log } from "@graphprotocol/graph-ts"
import { handleOracleSet, handleOracleVote } from "../src/subgraph-availability-manager"
import { createOracleSetEvent, createOracleVoteEvent } from "./subgraph-availability-manager-utils"
import { getOracleVoteId } from "../src/helpers"
import { Oracle, GlobalState } from "../generated/schema"

const oracleID = "0x0000000000000000000000000000000000000004"
const oracleAddress = Address.fromString(oracleID)
const newOracleID = "0x0000000000000000000000000000000000000006"
const newOracleAddress = Address.fromString(newOracleID)
const subgraphDeploymentID = "0x0000000000000000000000000000000000000005"
const subgraphDeploymentAddress = Address.fromString(subgraphDeploymentID)

describe("ORACLE", () => {
  afterEach(() => {
    clearStore()
  })

  test("OracleSet created and stored", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    assert.entityCount("Oracle", 1)
    assert.fieldEquals("Oracle", oracleID, "index", "0")
  })

  test("Replace oracle", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    // Replace oracle
    let newOracleSetEvent2 = createOracleSetEvent(BigInt.fromI32(0), newOracleAddress)
    handleOracleSet(newOracleSetEvent2)

    assert.entityCount("Oracle", 2)
    let oldOracle = Oracle.load(oracleAddress)!
    let newOracle = Oracle.load(newOracleAddress)!
    assert.booleanEquals(oldOracle.active, false)
    assert.booleanEquals(newOracle.active, true)

    let state = GlobalState.load("0")!
    let activeOracles = state.activeOracles
    assert.i32Equals(activeOracles.length, 1)
  })

  test("OracleVote created and stored", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    assert.entityCount("Oracle", 1)

    let newOracleVoteEvent = createOracleVoteEvent(
      oracleAddress,
      subgraphDeploymentAddress, 
      true, 
      BigInt.fromI32(0),
      BigInt.fromI32(300)
    )
    handleOracleVote(newOracleVoteEvent)
    
    let oracleVoteID = getOracleVoteId(subgraphDeploymentID, oracleID, "300");
    assert.entityCount("OracleVote", 1)
    assert.fieldEquals("OracleVote", oracleVoteID, "subgraphDeploymentID", subgraphDeploymentID)
    assert.fieldEquals("OracleVote", oracleVoteID, "deny", "true")
    assert.fieldEquals("OracleVote", oracleVoteID, "oracle", oracleID)
    assert.fieldEquals("OracleVote", oracleVoteID, "timestamp", "300")
  })
})
