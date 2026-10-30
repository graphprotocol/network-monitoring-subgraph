import { Address, BigInt, ByteArray, Bytes, crypto, ethereum } from "@graphprotocol/graph-ts"
import { Activity, ActivityDay } from "../generated/schema"

const SECONDS_PER_DAY = 86400
const ANY_SENDER = Address.zero()

/**
 * Record that the transaction sender caused `signature` on the emitting contract.
 *
 * Generic on purpose: it knows nothing about what the event means, only who caused it, where
 * and when. Updates the sender's entity and the any-sender entity for the same event.
 */
export function recordActivity(event: ethereum.Event, signature: string): void {
  let topic0 = Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8(signature)))
  touch(event, signature, topic0, event.transaction.from)
  touch(event, signature, topic0, ANY_SENDER)
}

export function getActivityId(emitter: Bytes, topic0: Bytes, account: Bytes): string {
  return [emitter.toHexString(), topic0.toHexString(), account.toHexString()].join("-")
}

function touch(event: ethereum.Event, signature: string, topic0: Bytes, account: Bytes): void {
  let id = getActivityId(event.address, topic0, account)
  let activity = Activity.load(id)
  if (activity == null) {
    activity = new Activity(id)
    activity.emitter = event.address
    activity.topic0 = topic0
    activity.event = signature
    activity.account = account
    activity.count = BigInt.zero()
    activity.firstBlock = event.block.number
    activity.firstTimestamp = event.block.timestamp
  }
  activity.count = activity.count.plus(BigInt.fromI32(1))
  activity.lastBlock = event.block.number
  activity.lastTimestamp = event.block.timestamp
  activity.lastTransaction = event.transaction.hash
  activity.save()

  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY
  let dayId = id + "-" + day.toString()
  let bucket = ActivityDay.load(dayId)
  if (bucket == null) {
    bucket = new ActivityDay(dayId)
    bucket.activity = id
    bucket.day = day
    bucket.date = BigInt.fromI32(day * SECONDS_PER_DAY)
    bucket.count = BigInt.zero()
  }
  bucket.count = bucket.count.plus(BigInt.fromI32(1))
  bucket.save()
}
