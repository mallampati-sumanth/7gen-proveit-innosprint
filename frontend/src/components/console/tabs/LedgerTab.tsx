import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const LedgerTab = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLedger = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/agent/ledger`)
      .then(r => r.json())
      .then(d => setEntries(d || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLedger();
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <div style={{
        marginBottom: 20, padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>Immutable Proof Ledger - Cryptographic Fixes</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            SHA-256 tamper-evident proof records stored directly in proof database
          </div>
        </div>
        <button onClick={loadLedger} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <I.Refresh /> Refresh Ledger
        </button>
      </div>

      {entries.length === 0 ? (
        <div style={{
          padding: "60px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <I.Book />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>No Proofs Committed Yet</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", maxWidth: 440 }}>
            Every autonomous deployment to EC2 executes health checks and commits a signed SHA-256 proof record directly to the ledger table.
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {entries.map(r => (
            <div key={r.entry_id} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--orange)", fontWeight: 700 }}>{r.entry_id}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{r.action}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{r.evidence}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "var(--text-2)", background: "var(--badge-bg)", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>
                  #{r.hash}
                </span>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{r.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
