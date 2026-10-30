import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { TokensPulled } from "../generated/BillingContract/BillingContract"

export function createTokensPulledEvent(
  emitter: Address,
  sender: Address,
  timestamp: i32,
  block: i32
): TokensPulled {
  let event = changetype<TokensPulled>(newMockEvent())
  event.address = emitter
  event.transaction.from = sender
  event.transaction.hash = Bytes.fromI32(block)
  event.block.timestamp = BigInt.fromI32(timestamp)
  event.block.number = BigInt.fromI32(block)

  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam("user", ethereum.Value.fromAddress(sender)))
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1)))
  )
  return event
}
