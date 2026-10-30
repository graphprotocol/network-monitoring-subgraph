# network-monitoring-subgraph

Indexes data about The Graph's protocol components on Arbitrum. It feeds
[graph-monitor](https://github.com/graphprotocol/graph-monitor) and can be queried directly.

## Entities

### SAM oracles

`GlobalState`, `Oracle`, `OracleVote` and `OracleConfiguration` track the Subgraph Availability
Manager oracles: who they are, which are active, their votes, and the configuration each oracle
publishes through the SAO DataEdge.

### Activity

`Activity` answers "when did this account last cause this event on this contract?". There is one
entity per (contract, event, account), where the account is the **transaction sender**. The id is
built from values the caller already has:

```
<emitter>-<topic0>-<account>      all lowercase 0x hex
```

`topic0` is the keccak256 of the event signature. For each event there is also an entity with
the zero address as account, which tracks the event from any sender.

```graphql
{
  activity(id: "0x1b07d3344188908fb6deceac381f3ee63c48477a-0x3c3f210f…-0x05f9eea50c6bcd46c07c8ef64566af9a9cc91109") {
    event
    count
    lastBlock
    lastTimestamp
    lastTransaction
    days(orderBy: day, orderDirection: desc, first: 7) { day count }
  }
}
```

`ActivityDay` holds events per UTC day for each `Activity`, so a drop in rate is visible before
an account goes silent. Days with no events have no entity.

Tracked events:

| Contract | Event | Typically sent by |
|---|---|---|
| Billing | `TokensPulled(address,uint256)` | Billing wallet |
| PaymentsEscrow | `Deposit(address,address,address,uint256)` | GraphTally wallet |
| EBO DataEdge | `Log(bytes)` | Epoch Block Oracle |
| RewardsEligibilityOracle A and B | `IndexerEligibilityRenewed(address,address)` | REO |
| SubgraphAvailabilityManager | `OracleVote(bytes32,bool,uint256,uint256)` | SAM oracles |
| L2Curation | `Signalled(address,bytes32,uint256,uint256,uint256)` | Curators, including the curation bot |

The mappings are generic: every handler calls `recordActivity` (`src/activity.ts`) and none reads
the event's parameters. Tracking another event takes a data source in `subgraph.yaml`, an entry in
`networks.json`, a minimal ABI with the event, and a one-line handler in
`src/activity-handlers.ts`.

Contracts older than this subgraph start indexing at the same block as the SAM data sources
(mid-2024), not at their deployment. Last-seen tracking does not need older history, and starting
earlier would make syncing much slower. `count` and `firstBlock` therefore count from that point.

## Development

```sh
yarn
yarn codegen
yarn build                    # or: graph build --network arbitrum-one
yarn test                     # matchstick; on platforms graph-cli does not recognise, use `graph test -d` (Docker)
```

Deploy with `yarn deploy-arbitrum` or `yarn deploy-arbitrum-sepolia`. Addresses and start blocks
per network live in `networks.json`.
