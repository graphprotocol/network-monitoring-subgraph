import { GlobalState, Oracle, OracleConfiguration, OracleVote } from "../generated/schema"
import { log, Bytes } from "@graphprotocol/graph-ts"

export class SafeMap<K, V> extends Map<K, V> {
  safeGet(id: K): V | null {
    return this.has(id) ? this.get(id) : null;
  }
}

export class StoreCache {
  state: GlobalState;
  oracles: SafeMap<Bytes, Oracle>;
  oraclesConfigs: SafeMap<String, OracleConfiguration>;
  oracleVotes: SafeMap<String, OracleVote>;

  constructor() {
    let state = GlobalState.load("0");
    if (state == null) {
      state = new GlobalState("0");
      state.activeOracles = [];
      state.save();
    }

    this.state = state;
    this.oracles = new SafeMap<Bytes, Oracle>();
    this.oraclesConfigs = new SafeMap<String, OracleConfiguration>();
    this.oracleVotes = new SafeMap<String, OracleVote>();
  }

  getGlobalState(): GlobalState {
    return this.state;
  }

  getOracle(id: Bytes): Oracle {
    if (this.oracles.safeGet(id) == null) {
      let oracle = Oracle.load(id);
      if (oracle == null) {
        oracle = new Oracle(id);
        oracle.state = this.state.id;
        oracle.index = "";
      }
      this.oracles.set(id, oracle);
    }
    return this.oracles.safeGet(id)!;
  }

  getOracleConfiguration(id: String): OracleConfiguration {
    if (this.oraclesConfigs.safeGet(id) == null) {
      let config = OracleConfiguration.load(id);
      if (config == null) {
        config = new OracleConfiguration(id);
      }
      this.oraclesConfigs.set(id, config);
    }
    return this.oraclesConfigs.safeGet(id)!;
  }

  getOracleVote(id: String): OracleVote {
    if (this.oracleVotes.safeGet(id) == null) {
      let vote = OracleVote.load(id);
      if (vote == null) {
        vote = new OracleVote(id);
      }
      this.oracleVotes.set(id, vote);
    }
    return this.oracleVotes.safeGet(id)!;
  }

  commitChanges(): void {
    this.state.save();

    let oracles = this.oracles.values();
    for (let i = 0; i < oracles.length; i++) {
      oracles[i].save();
    }

    let configs = this.oraclesConfigs.values();
    for (let i = 0; i < configs.length; i++) {
      configs[i].save();
    }

    let votes = this.oracleVotes.values();
    for (let i = 0; i < votes.length; i++) {
      votes[i].save();
    }
  }
}