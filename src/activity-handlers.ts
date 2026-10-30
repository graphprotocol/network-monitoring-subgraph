// One handler per tracked event. Each only records who caused it and when; none reads the
// event's parameters. Adding an event to track means a data source in subgraph.yaml and a
// one-line handler here.

import { recordActivity } from "./activity"
import { TokensPulled } from "../generated/BillingContract/BillingContract"
import { Deposit } from "../generated/PaymentsEscrow/PaymentsEscrow"
import { Log } from "../generated/EBODataEdge/EBODataEdge"
import { IndexerEligibilityRenewed } from "../generated/RewardsEligibilityOracleA/RewardsEligibilityOracle"
import { Signalled } from "../generated/L2Curation/L2Curation"

export function handleTokensPulled(event: TokensPulled): void {
  recordActivity(event, "TokensPulled(address,uint256)")
}

export function handleEscrowDeposit(event: Deposit): void {
  recordActivity(event, "Deposit(address,address,address,uint256)")
}

export function handleEBOLog(event: Log): void {
  recordActivity(event, "Log(bytes)")
}

export function handleIndexerEligibilityRenewed(event: IndexerEligibilityRenewed): void {
  recordActivity(event, "IndexerEligibilityRenewed(address,address)")
}

export function handleCurationSignalled(event: Signalled): void {
  recordActivity(event, "Signalled(address,bytes32,uint256,uint256,uint256)")
}
