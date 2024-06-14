import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  OracleSet,
  OracleVote
} from "../generated/SubgraphAvailabilityManager/SubgraphAvailabilityManager"

export function createOracleSetEvent(
  index: BigInt,
  oracle: Address
): OracleSet {
  let oracleSetEvent = changetype<OracleSet>(newMockEvent())

  oracleSetEvent.parameters = new Array()

  oracleSetEvent.parameters.push(
    new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
  )
  oracleSetEvent.parameters.push(
    new ethereum.EventParam("oracle", ethereum.Value.fromAddress(oracle))
  )

  return oracleSetEvent
}

export function createOracleVoteEvent(
  oracleAddress: Address,
  subgraphDeploymentID: Bytes,
  deny: boolean,
  oracleIndex: BigInt,
  timestamp: BigInt
): OracleVote {
  let event = newMockEvent()
  event.transaction.from = oracleAddress
  let oracleVoteEvent = changetype<OracleVote>(event)

  oracleVoteEvent.parameters = new Array()

  oracleVoteEvent.parameters.push(
    new ethereum.EventParam(
      "subgraphDeploymentID",
      ethereum.Value.fromFixedBytes(subgraphDeploymentID)
    )
  )
  oracleVoteEvent.parameters.push(
    new ethereum.EventParam("deny", ethereum.Value.fromBoolean(deny))
  )
  oracleVoteEvent.parameters.push(
    new ethereum.EventParam(
      "oracleIndex",
      ethereum.Value.fromUnsignedBigInt(oracleIndex)
    )
  )
  oracleVoteEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return oracleVoteEvent
}
