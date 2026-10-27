import React, { useState } from "react";
import { RepoItem, API_BASE } from "../types";
import { I } from "../icons";

export const ReposTab = ({
  repos,
  profile,
  onDeploy,
  onInjectEnv,
  onRefresh,
  onOpenConnect,
  onDeleteRepo,
}: {
  repos: RepoItem[];
  profile: any;
  onDeploy: (repo: string) => void;
  onInjectEnv: (repo: string) => void;
  onRefresh: () => void;
  onOpenConnect: () => void;
  onDeleteRepo: (repoId: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [newRepoPort, setNewRepoPort] = useState("3000");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const myUsername = (profile?.username || profile?.login || "").toLowerCase();

  const filtered = repos.filter(r => {
    const repoIdentifier = (r.name || r.repo_name || "").toLowerCase();
    const matchesSearch = repoIdentifier.includes(search.toLowerCase()) || (r.description && r.description.toLowerCase().includes(search.toLowerCase()));
    const matchesLang = langFilter === "ALL" || (r.language && r.language.toLowerCase() === langFilter.toLowerCase());
    const matchesOwner = ownerFilter === "all" || (myUsername && (r.owner || "").toLowerCase() === myUsername);
    return matchesSearch && matchesLang && matchesOwner;
  });

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/github/sync-repos`, { method: "POST" });
      if (!res.ok) {
        onOpenConnect();
      } else {
        onRefresh();
      }
    } catch {
      onOpenConnect();
    }
    setSyncing(false);
  };

  const handleAddRepo = async (targetUrl?: string) => {
    const urlToUse = (targetUrl || newRepoUrl).trim();
    if (!urlToUse) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`${API_BASE}/api/agent/repos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: urlToUse,
          port: parseInt(newRepoPort, 10) || 3000,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Could not find or inspect repository on GitHub.");
      }
      setNewRepoUrl("");
      setShowAdd(false);
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Failed to inspect repository via GitHub API.");
    }
    setAdding(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Top Banner: Dynamic Connected GitHub Profile */}
      <div style={{
        marginBottom: 20, padding: "16px 20px", borderRadius: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="GitHub Avatar" style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid var(--border)" }} />
          ) : (
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--badge-bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I.Github />
            </div>
          )}
          <div>
            {profile?.connected ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>GitHub: @{profile.username || profile.login}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#16a34a", color: "#ffffff" }}>LIVE TOKEN ACTIVE</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  {profile.name ? `${profile.name} · ` : ""}{profile.public_repos || repos.length} Repositories · Dynamic GitHub API sync
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>GitHub: Not Connected</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "var(--yellow-bg)", color: "var(--yellow)" }}>NO CREDENTIALS</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  Connect your Personal Access Token (PAT) to dynamically access your repositories, or enter any public repo URL below.
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onOpenConnect} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--orange-border)", background: "var(--orange-bg)", color: "var(--orange)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <I.Key /> {profile?.connected ? "Switch Token" : "Connect GitHub Token"}
          </button>
          {profile?.connected && (
            <button onClick={handleSyncAll} disabled={syncing} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
              fontSize: 12, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer",
            }}>
              {syncing ? <><I.Loader /> Syncing…</> : <><I.Refresh /> Sync All Repos</>}
            </button>
          )}
          <button onClick={() => { setShowAdd(!showAdd); setAddError(null); }} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "none", background: "var(--orange)", color: "#fff",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}>
            <I.Plus /> Add Repo by URL
          </button>
        </div>
      </div>

      {/* Add Repo Form */}
      {showAdd && (
        <div style={{ marginBottom: 20, padding: 18, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--orange-border)" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>Inspect & Add GitHub Repository</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
            Enter any public or private GitHub repository URL or format <code style={{ fontFamily: "JetBrains Mono, monospace" }}>owner/repo</code>. The agent inspects runtime files, Dockerfile, and exposed ports dynamically via GitHub REST API.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              value={newRepoUrl} onChange={e => setNewRepoUrl(e.target.value)}
              placeholder="e.g. https://github.com/fastapi/fastapi or fastapi/fastapi"
              style={{
                flex: 2, minWidth: 260, padding: "9px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
              }}
            />
            <input
              value={newRepoPort} onChange={e => setNewRepoPort(e.target.value)}
              placeholder="Port (e.g. 8000)"
              style={{
                width: 140, padding: "9px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
              }}
            />
            <button onClick={() => handleAddRepo()} disabled={adding} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8,
              border: "none", background: "var(--orange)", color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: adding ? "not-allowed" : "pointer",
            }}>
              {adding ? <><I.Loader /> Inspecting…</> : "Inspect & Add"}
            </button>
            <button onClick={() => setShowAdd(false)} style={{
              padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent",
              color: "var(--text-2)", fontSize: 13, cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>

          {addError && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12, marginBottom: 10 }}>
              {addError}
            </div>
          )}

          {/* Quick suggestions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-3)" }}>
            <span>Quick add samples:</span>
            {[
              { label: "fastapi/fastapi", url: "https://github.com/fastapi/fastapi", port: "8000" },
              { label: "pallets/flask", url: "https://github.com/pallets/flask", port: "5000" },
              { label: "vercel/next.js", url: "https://github.com/vercel/next.js", port: "3000" },
            ].map(s => (
              <button key={s.label} onClick={() => { setNewRepoUrl(s.url); setNewRepoPort(s.port); handleAddRepo(s.url); }} style={{
                background: "var(--badge-bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 4,
                color: "var(--orange)", fontSize: 11, cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
              }}>
                + {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0 12px", width: 320 }}>
          <span style={{ color: "var(--text-3)" }}><I.Search /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search connected repositories…"
            style={{ width: "100%", padding: "8px 0", background: "none", border: "none", color: "var(--text-1)", fontSize: 12.5, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {myUsername && (
            <div style={{ display: "flex", background: "var(--badge-bg)", padding: 2, borderRadius: 8, border: "1px solid var(--border)", marginRight: 6 }}>
              <button
                onClick={() => setOwnerFilter("all")}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: ownerFilter === "all" ? 700 : 500,
                  background: ownerFilter === "all" ? "var(--orange)" : "transparent",
                  color: ownerFilter === "all" ? "#fff" : "var(--text-2)",
                }}
              >
                All Repos
              </button>
              <button
                onClick={() => setOwnerFilter("mine")}
                style={{
                  padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: ownerFilter === "mine" ? 700 : 500,
                  background: ownerFilter === "mine" ? "var(--green)" : "transparent",
                  color: ownerFilter === "mine" ? "#fff" : "var(--text-2)",
                }}
              >
                My Repos Only
              </button>
            </div>
          )}

          {["ALL", "TypeScript", "Python", "JavaScript"].map(l => (
            <button key={l} onClick={() => setLangFilter(l)} style={{
              padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
              background: langFilter === l ? "var(--orange)" : "var(--badge-bg)",
              color: langFilter === l ? "#fff" : "var(--text-2)",
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Repositories Cards List */}
      {filtered.length === 0 ? (
        <div style={{
          padding: "48px 24px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <I.Github />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>No Repositories Connected</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", maxWidth: 460, marginTop: 4 }}>
              Connect your GitHub Personal Access Token to pull your real repositories, or enter any public GitHub URL (e.g. <code style={{ fontFamily: "JetBrains Mono, monospace" }}>fastapi/fastapi</code>) to inspect and deploy.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onOpenConnect} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
              border: "none", background: "var(--orange)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            }}>
              <I.Key /> Connect GitHub Token
            </button>
            <button onClick={() => handleAddRepo("https://github.com/fastapi/fastapi")} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <I.Plus /> Add fastapi/fastapi
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(r => (
            <div key={r.name} style={{
              padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)",
              border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16,
              transition: "all .15s",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8, background: "var(--badge-bg)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)", flexShrink: 0,
              }}>
                <I.Github />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <a
                    href={r.html_url || `https://github.com/${r.name}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 700, color: "var(--text-1)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span>{r.name || r.repo_name}</span> <I.ExternalLink />
                  </a>
                  {r.owner && (
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: 4,
                      background: myUsername && r.owner.toLowerCase() === myUsername ? "var(--green-bg)" : "var(--badge-bg)",
                      color: myUsername && r.owner.toLowerCase() === myUsername ? "var(--green)" : "var(--text-3)",
                      border: myUsername && r.owner.toLowerCase() === myUsername ? "1px solid rgba(22,163,74,0.3)" : "1px solid var(--border)",
                    }}>
                      {myUsername && r.owner.toLowerCase() === myUsername ? "My Repo" : `@${r.owner}`}
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "var(--blue-bg)", color: "var(--blue)" }}>
                    {r.language || "Other"}
                  </span>
                  {r.framework && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: "var(--badge-bg)", color: "var(--text-2)" }}>
                      {r.framework}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>
                    port: {r.default_port || (r.language === "Python" ? 8000 : 3000)}
                  </span>
                  {r.default_branch && (
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>
                      branch: {r.default_branch}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                  {r.description || "Deployable via Autonomous EC2 Agent"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => onInjectEnv(r.name)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  <I.Sliders /> Inject .env
                </button>

                <button onClick={() => onDeploy(r.name)} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8,
                  border: "none", background: "var(--orange)", color: "#fff",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                }}>
                  <I.Play /> Deploy to EC2
                </button>

                <button onClick={() => onDeleteRepo(r.name)} title="Remove Repository" style={{
                  padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-3)", cursor: "pointer",
                }}>
                  <I.Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
