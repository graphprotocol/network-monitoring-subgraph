import { log, ethereum, Bytes } from "@graphprotocol/graph-ts";
import { Log as LogEvent } from "../generated/SAODataEdge/SAODataEdge"
import { parseCalldata, isSubmitterAllowed } from "./helpers"
import { StoreCache } from "./store-cache";
import { ORACLE_CONFIGURATION_ABI } from "./constants";

export function handleLog(event: LogEvent): void {
  let submitter = event.transaction.from.toHexString();
  event.logIndex.toI32();
  processPayload(submitter, event.params.data, event.transaction.hash.toHexString());
}

export function processPayload(submitter: string, payload: Bytes, txHash: string): void {
  log.warning("Processing payload. Submitter: {}", [submitter]);

  let cache = new StoreCache();

  let parsedCalldata = parseCalldata(payload);
  let decoded = ethereum.decode(ORACLE_CONFIGURATION_ABI, parsedCalldata)!.toTuple();
  let decodedConfig = decoded[1].toTuple();
  let decodedOracleIndex = decodedConfig[8].toString();

  if (!isSubmitterAllowed(cache, decodedOracleIndex, submitter)) {
    log.error("Submitter not allowed: {}", [submitter]);
    return;
  }

  log.info("Submitter allowed", []);

  let oracle = cache.getOracle(decodedOracleIndex);
  let config = cache.getOracleConfiguration(txHash);
  config.oracle = oracle.id;
  config.commitHash = decoded[0].toString();
  config.ipfsConcurrency = decodedConfig[0].toString();
  config.ipfsTimeout = decodedConfig[1].toString();
  config.minSignal = decodedConfig[2].toString();
  config.period = decodedConfig[3].toString();
  config.gracePeriod = decodedConfig[4].toString();
  config.supportedDataSourceKinds = decodedConfig[5].toString();
  config.subgraph = decodedConfig[6].toString();
  config.subgraphAvailabilityManagerContract = decodedConfig[7].toString();
  config.oracleIndex = decodedOracleIndex;

  oracle.latestConfig = config.id;

  cache.commitChanges();
}
