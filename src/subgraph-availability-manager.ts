import {
  NewOwnership as NewOwnershipEvent,
  NewPendingOwnership as NewPendingOwnershipEvent,
  OracleSet as OracleSetEvent,
  OracleVote as OracleVoteEvent,
  VoteTimeLimitSet as VoteTimeLimitSetEvent
} from "../generated/SubgraphAvailabilityManager/SubgraphAvailabilityManager"
import {
  NewOwnership,
  NewPendingOwnership,
  OracleSet,
  OracleVote,
  VoteTimeLimitSet
} from "../generated/schema"

export function handleNewOwnership(event: NewOwnershipEvent): void {
  let entity = new NewOwnership(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleNewPendingOwnership(
  event: NewPendingOwnershipEvent
): void {
  let entity = new NewPendingOwnership(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOracleSet(event: OracleSetEvent): void {
  let entity = new OracleSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = event.params.index
  entity.oracle = event.params.oracle

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOracleVote(event: OracleVoteEvent): void {
  let entity = new OracleVote(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.subgraphDeploymentID = event.params.subgraphDeploymentID
  entity.deny = event.params.deny
  entity.oracleIndex = event.params.oracleIndex
  entity.timestamp = event.params.timestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVoteTimeLimitSet(event: VoteTimeLimitSetEvent): void {
  let entity = new VoteTimeLimitSet(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.voteTimeLimit = event.params.voteTimeLimit

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
