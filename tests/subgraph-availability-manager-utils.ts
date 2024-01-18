import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  NewOwnership,
  NewPendingOwnership,
  OracleSet,
  OracleVote,
  VoteTimeLimitSet
} from "../generated/SubgraphAvailabilityManager/SubgraphAvailabilityManager"

export function createNewOwnershipEvent(
  from: Address,
  to: Address
): NewOwnership {
  let newOwnershipEvent = changetype<NewOwnership>(newMockEvent())

  newOwnershipEvent.parameters = new Array()

  newOwnershipEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  newOwnershipEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return newOwnershipEvent
}

export function createNewPendingOwnershipEvent(
  from: Address,
  to: Address
): NewPendingOwnership {
  let newPendingOwnershipEvent = changetype<NewPendingOwnership>(newMockEvent())

  newPendingOwnershipEvent.parameters = new Array()

  newPendingOwnershipEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  newPendingOwnershipEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )

  return newPendingOwnershipEvent
}

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
  subgraphDeploymentID: Bytes,
  deny: boolean,
  oracleIndex: BigInt,
  timestamp: BigInt
): OracleVote {
  let oracleVoteEvent = changetype<OracleVote>(newMockEvent())

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

export function createVoteTimeLimitSetEvent(
  voteTimeLimit: BigInt
): VoteTimeLimitSet {
  let voteTimeLimitSetEvent = changetype<VoteTimeLimitSet>(newMockEvent())

  voteTimeLimitSetEvent.parameters = new Array()

  voteTimeLimitSetEvent.parameters.push(
    new ethereum.EventParam(
      "voteTimeLimit",
      ethereum.Value.fromUnsignedBigInt(voteTimeLimit)
    )
  )

  return voteTimeLimitSetEvent
}
