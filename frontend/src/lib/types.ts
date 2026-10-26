export interface Run {
  id?: number;
  run_id: string;
  status: "PENDING" | "RUNNING" | "HEALED" | "ESCALATED" | "FAILED";
  prompt: string;
  target_repo?: string;
  cloud_mode: string;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id?: number;
  run_id: string;
  event_type: "PLAN" | "TOOL_CALL" | "POLICY_VERDICT" | "PROOF_RESULT" | "SYSTEM";
  summary: string;
  details_json: string;
  created_at: string;
}

export interface Incident {
  id?: number;
  incident_id: string;
  run_id: string;
  scenario: "WRONG_PORT" | "MISSING_ENV" | "BROKEN_BUILD" | "BAD_HEALTH_PATH" | "OOM" | "GATEWAY_502" | "UNKNOWN";
  status: "DETECTED" | "DIAGNOSING" | "PROVING" | "HEALED" | "ESCALATED";
  attempts: number;
  proof_bundle_json?: string;
  created_at: string;
  updated_at: string;
}

export interface ProofBundle {
  incident_id: string;
  scenario: string;
  evidence: string;
  hypothesis: string;
  proposed_fix: {
    action: string;
    target: string;
    diff: string;
  };
  policy_verdict: {
    allowed: boolean;
    requires_approval: boolean;
    reasons: string[];
    blast_radius: number;
  };
  sandbox_result: {
    status: "PROVEN" | "FAILED" | "INCONCLUSIVE";
    reproduction_confirmed: boolean;
    health_check_passed: boolean;
    execution_time_seconds: number;
  };
  live_health_before: string;
  live_health_after: string;
  attempts: number;
  final_status: "HEALED" | "ESCALATED" | "REJECTED";
  ledger_hash_range: [string, string];
  created_at: string;
}

export interface Approval {
  id?: number;
  approval_id: string;
  run_id: string;
  tool_name: string;
  arguments_json: string;
  blast_radius: number;
  reasons_json: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export interface LedgerEntry {
  id?: number;
  entry_id: string;
  timestamp: string;
  actor: "agent" | "policy" | "human" | "system";
  action: string;
  payload_json: string;
  prev_hash: string;
  hash: string;
}

export interface BenchmarkResult {
  id?: number;
  benchmark_id: string;
  mode: "BASELINE" | "PROVEIT";
  scenario: string;
  iteration: number;
  fixed: boolean;
  time_to_recovery_seconds: number;
  policy_violations_detected: number;
  error_message?: string;
  created_at: string;
}
