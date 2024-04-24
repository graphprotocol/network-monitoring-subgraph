import {
  assert,
  describe,
  test,
  clearStore,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { handleOracleSet, handleOracleVote } from "../src/subgraph-availability-manager"
import { createOracleSetEvent, createOracleVoteEvent } from "./subgraph-availability-manager-utils"
import { getOracleVoteId } from "../src/helpers"

const oracleID = "0x0000000000000000000000000000000000000004"
const oracleAddress = Address.fromString(oracleID)
const subgraphDeploymentID = "0x0000000000000000000000000000000000000005"
const subgraphDeploymentAddress = Address.fromString(subgraphDeploymentID)

describe("ORACLE", () => {
  afterAll(() => {
    clearStore()
  })

  test("OracleSet created and stored", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    assert.entityCount("Oracle", 1)
    assert.fieldEquals("Oracle", "0", "address", oracleID)
  })

  test("OracleVote created and stored", () => {
    let newOracleSetEvent = createOracleSetEvent(BigInt.fromI32(0), oracleAddress)
    handleOracleSet(newOracleSetEvent)

    assert.entityCount("Oracle", 1)

    let newOracleVoteEvent = createOracleVoteEvent(
      subgraphDeploymentAddress, 
      true, 
      BigInt.fromI32(0),
      BigInt.fromI32(300)
    )
    handleOracleVote(newOracleVoteEvent)
    
    let oracleVoteID = getOracleVoteId(subgraphDeploymentID, "0", "300");
    assert.entityCount("OracleVote", 1)
    assert.fieldEquals("OracleVote", oracleVoteID, "subgraphDeploymentID", subgraphDeploymentID)
    assert.fieldEquals("OracleVote", oracleVoteID, "deny", "true")
    assert.fieldEquals("OracleVote", oracleVoteID, "oracle", "0")
    assert.fieldEquals("OracleVote", oracleVoteID, "timestamp", "300")
  })
})
