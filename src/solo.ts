// Solo deployments: deployments exactly one indexer is allocated to, that have curation signal
// and are not denied rewards, counted per indexer.
//
// Every handler follows one shape: note what the deployment contributed before the event,
// apply the event, then move the contribution to whoever it belongs to now. An event touches
// one deployment, so counts stay exact without ever scanning.
//
// Tracking starts at the SubgraphService's launch, so every open allocation is seen being
// created. Signal and denial predate it, so a deployment's are read from the contracts the
// first time it is seen; curation events re-read them rather than applying deltas, since a
// call sees the state at the end of the block, after the event.

import { Address, BigInt, Bytes, dataSource, log } from "@graphprotocol/graph-ts"
import { AllocationClosed, AllocationCreated } from "../generated/SubgraphService/SubgraphService"
import { Burned, Collected, Curation, Signalled } from "../generated/Curation/Curation"
import { RewardsDenylistUpdated, RewardsManager } from "../generated/RewardsManager/RewardsManager"
import { Deployment, DeploymentIndexer, Indexer } from "../generated/schema"

// Contracts read for state that predates tracking. Calls can come from any handler, so the
// addresses are needed outside their own data sources.
function curationAddress(): Address {
  if (dataSource.network() == "arbitrum-sepolia") {
    return Address.fromString("0xDe761f075200E75485F4358978FB4d1dC8644FD5")
  }
  return Address.fromString("0x22d78fb4bc72e191C765807f8891B5e1785C8014")
}

function rewardsManagerAddress(): Address {
  if (dataSource.network() == "arbitrum-sepolia") {
    return Address.fromString("0x1F49caE7669086c8ba53CC35d1E9f80176d67E79")
  }
  return Address.fromString("0x971B9d3d0Ae3ECa029CAB5eA1fB0F72c85e6a525")
}

// ---- handlers ------------------------------------------------------------------------

export function handleAllocationCreated(event: AllocationCreated): void {
  let deployment = loadDeployment(event.params.subgraphDeploymentId)
  let before = soloOf(deployment)

  let indexer = loadIndexer(event.params.indexer)
  indexer.save()
  let link = loadLink(deployment, event.params.indexer)
  link.openAllocations = link.openAllocations + 1
  link.save()
  if (link.openAllocations == 1) {
    let active = deployment.activeIndexers
    active.push(event.params.indexer)
    deployment.activeIndexers = active
  }

  settle(deployment, before)
}

export function handleAllocationClosed(event: AllocationClosed): void {
  let deployment = loadDeployment(event.params.subgraphDeploymentId)
  let link = DeploymentIndexer.load(linkId(deployment.id, event.params.indexer))
  if (link == null || link.openAllocations == 0) {
    // Cannot happen when tracking starts at the SubgraphService's launch. Counting it would
    // drive the indexer's allocations below zero, so it is reported and skipped.
    log.warning("closed an allocation never seen open: indexer {} deployment {}", [
      event.params.indexer.toHexString(),
      deployment.id.toHexString(),
    ])
    return
  }
  let before = soloOf(deployment)

  link.openAllocations = link.openAllocations - 1
  link.save()
  if (link.openAllocations == 0) {
    let active: Bytes[] = []
    let current = deployment.activeIndexers
    for (let i = 0; i < current.length; i++) {
      if (!current[i].equals(event.params.indexer)) active.push(current[i])
    }
    deployment.activeIndexers = active
  }

  settle(deployment, before)
}

export function handleSignalled(event: Signalled): void {
  refreshSignal(event.params.subgraphDeploymentID)
}

export function handleBurned(event: Burned): void {
  refreshSignal(event.params.subgraphDeploymentID)
}

export function handleCollected(event: Collected): void {
  refreshSignal(event.params.subgraphDeploymentID)
}

export function handleRewardsDenylistUpdated(event: RewardsDenylistUpdated): void {
  let deployment = loadDeployment(event.params.subgraphDeploymentID)
  let before = soloOf(deployment)
  // A sinceBlock of zero takes the deployment off the denylist.
  deployment.denied = event.params.sinceBlock.gt(BigInt.zero())
  settle(deployment, before)
}

// ---- solo bookkeeping ----------------------------------------------------------------

/** What a deployment contributes to one indexer's solo figures. Empty `indexer`: nothing. */
class Solo {
  indexer: Bytes
  tokens: BigInt

  constructor(indexer: Bytes, tokens: BigInt) {
    this.indexer = indexer
    this.tokens = tokens
  }
}

function soloOf(deployment: Deployment): Solo {
  let active = deployment.activeIndexers
  if (active.length == 1 && deployment.signal.gt(BigInt.zero()) && !deployment.denied) {
    return new Solo(active[0], deployment.signalledTokens)
  }
  return new Solo(Bytes.empty(), BigInt.zero())
}

/** Move the deployment's contribution from what it was before the change to what it is now. */
function settle(deployment: Deployment, before: Solo): void {
  deployment.activeIndexerCount = deployment.activeIndexers.length
  let after = soloOf(deployment)

  if (before.indexer.length > 0) {
    let indexer = loadIndexer(before.indexer)
    indexer.soloCount = indexer.soloCount - 1
    indexer.soloSignalledTokens = indexer.soloSignalledTokens.minus(before.tokens)
    indexer.save()
  }
  if (after.indexer.length > 0) {
    let indexer = loadIndexer(after.indexer)
    indexer.soloCount = indexer.soloCount + 1
    indexer.soloSignalledTokens = indexer.soloSignalledTokens.plus(after.tokens)
    indexer.save()
    deployment.soloIndexer = after.indexer
  } else {
    deployment.soloIndexer = null
  }
  deployment.save()
}

function refreshSignal(id: Bytes): void {
  let deployment = loadDeployment(id)
  let before = soloOf(deployment)
  readSignal(deployment)
  settle(deployment, before)
}

// ---- entities ------------------------------------------------------------------------

function loadDeployment(id: Bytes): Deployment {
  let deployment = Deployment.load(id)
  if (deployment == null) {
    deployment = new Deployment(id)
    deployment.activeIndexers = []
    deployment.activeIndexerCount = 0
    deployment.soloIndexer = null
    readSignal(deployment)
    deployment.denied = readDenied(id)
  }
  return deployment
}

function loadIndexer(id: Bytes): Indexer {
  let indexer = Indexer.load(id)
  if (indexer == null) {
    indexer = new Indexer(id)
    indexer.soloCount = 0
    indexer.soloSignalledTokens = BigInt.zero()
  }
  return indexer
}

function linkId(deployment: Bytes, indexer: Bytes): Bytes {
  return deployment.concat(indexer)
}

function loadLink(deployment: Deployment, indexer: Bytes): DeploymentIndexer {
  let id = linkId(deployment.id, indexer)
  let link = DeploymentIndexer.load(id)
  if (link == null) {
    link = new DeploymentIndexer(id)
    link.deployment = deployment.id
    link.indexer = indexer
    link.openAllocations = 0
  }
  return link
}

// ---- contract reads ------------------------------------------------------------------

function readSignal(deployment: Deployment): void {
  let curation = Curation.bind(curationAddress())
  let signal = curation.try_getCurationPoolSignal(deployment.id)
  let tokens = curation.try_getCurationPoolTokens(deployment.id)
  if (signal.reverted || tokens.reverted) {
    log.warning("could not read curation pool of {}", [deployment.id.toHexString()])
  }
  deployment.signal = signal.reverted ? BigInt.zero() : signal.value
  deployment.signalledTokens = tokens.reverted ? BigInt.zero() : tokens.value
}

function readDenied(id: Bytes): boolean {
  let denied = RewardsManager.bind(rewardsManagerAddress()).try_isDenied(id)
  if (denied.reverted) {
    log.warning("could not read denial of {}", [id.toHexString()])
    return false
  }
  return denied.value
}
