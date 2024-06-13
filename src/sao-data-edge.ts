import { log, ethereum, Bytes } from "@graphprotocol/graph-ts";
import { Log as LogEvent } from "../generated/SAODataEdge/SAODataEdge"
import { parseCalldata, isSubmitterAllowed } from "./helpers"
import { StoreCache } from "./store-cache";
import { ORACLE_CONFIGURATION_ABI } from "./constants";

export function handleLog(event: LogEvent): void {
  let submitter = event.transaction.from;
  processPayload(submitter, event.params.data, event.transaction.hash.toHexString(), event.block);
}

export function processPayload(
  submitter: Bytes,
  payload: Bytes,
  txHash: string,
  block: ethereum.Block
): void {
  let submitterAddress = submitter.toHexString();
  log.warning("Processing payload. Submitter: {}", [submitterAddress]);

  let cache = new StoreCache();

  let parsedCalldata = parseCalldata(payload);
  let decoded = ethereum.decode(ORACLE_CONFIGURATION_ABI, parsedCalldata)!.toTuple();
  let decodedConfig = decoded[1].toTuple();
  let decodedOracleIndex = decodedConfig[9].toString();

  if (!isSubmitterAllowed(cache, decodedOracleIndex, submitter)) {
    log.error("Submitter not allowed: {}", [submitterAddress]);
    return;
  }

  log.info("Submitter allowed", []);

  let oracle = cache.getOracle(submitter);
  let config = cache.getOracleConfiguration(txHash);
  config.oracle = oracle.id;
  config.version = decoded[0].toString();
  config.ipfsConcurrency = decodedConfig[0].toString();
  config.ipfsTimeout = decodedConfig[1].toString();
  config.minSignal = decodedConfig[2].toString();
  config.period = decodedConfig[3].toString();
  config.gracePeriod = decodedConfig[4].toString();
  config.supportedDataSourceKinds = decodedConfig[5].toString();
  config.networkSubgraphDeploymentId = decodedConfig[6].toString();
  config.epochBlockOracleSubgraphDeploymentId = decodedConfig[7].toString();
  config.subgraphAvailabilityManagerContract = decodedConfig[8].toString();
  config.oracleIndex = decodedOracleIndex;
  config.createdAt = block.timestamp;

  oracle.latestConfig = config.id;

  cache.commitChanges();
}
