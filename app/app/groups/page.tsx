"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Plus,
  RefreshCw,
  ChevronRight,
  Crown,
  Link as LinkIcon,
  LogOut,
  Settings,
  Search,
  Loader2,
  UserCheck,
  UserMinus,
  Copy,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  subject: string;
  desc?: string;
  participantCount: number;
  owner?: string;
  announce: boolean;
  restrict: boolean;
}

interface Participant {
  id: string;
  admin?: "admin" | "superadmin" | null;
}

interface ApiSession {
  id: string;
  name: string;
  status: string;
  apiKeyPrefix?: string;
}

function GroupCard({
  group,
  selected,
  onClick
}: {
  group: Group;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = group.subject.slice(0, 2).toUpperCase();
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all duration-150",
        selected
          ? "border-accent/40 bg-accent/[0.07]"
          : "border-border bg-card hover:border-accent/20 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/20 to-cyan-400/20 text-sm font-bold text-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{group.subject}</p>
            <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition", selected && "text-accent")} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {group.participantCount} participant{group.participantCount !== 1 ? "s" : ""}
          </p>
          {group.desc && (
            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground/70">{group.desc}</p>
          )}
          <div className="mt-2 flex gap-1.5">
            {group.announce && (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 dark:text-amber-400">
                Announce
              </span>
            )}
            {group.restrict && (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-500 dark:text-blue-400">
                Locked
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function GroupsPage() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupSubject, setNewGroupSubject] = useState("");
  const [newGroupParticipants, setNewGroupParticipants] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/whatsapp/sessions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data || []);
      }
    } catch {}
  }

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError("");
    setGroups([]);
    setSelectedGroup(null);
    try {
      const res = await fetch("/api/groups", {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load groups."); return; }
      setGroups(data.groups || []);
    } catch {
      setError("Failed to load groups.");
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (selectedSessionId && apiKey) {
      void fetchGroups();
    }
  }, [selectedSessionId, apiKey, fetchGroups]);

  async function fetchParticipants(groupId: string) {
    setLoadingParticipants(true);
    setParticipants([]);
    setInviteLink("");
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/participants`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (res.ok) setParticipants(data.participants || []);
    } catch {}
    finally { setLoadingParticipants(false); }
  }

  async function getInviteLink() {
    if (!selectedGroup) return;
    setActionLoading("invite");
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(selectedGroup.id)}/invite`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (res.ok) setInviteLink(data.inviteLink || "");
      else setFeedback(`Error: ${data.error}`);
    } catch { setFeedback("Failed to get invite link."); }
    finally { setActionLoading(""); }
  }

  async function leaveGroup() {
    if (!selectedGroup || !confirm(`Leave "${selectedGroup.subject}"? You will need an invite to rejoin.`)) return;
    setActionLoading("leave");
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(selectedGroup.id)}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback("Left group successfully.");
        setSelectedGroup(null);
        fetchGroups();
      } else { setFeedback(`Error: ${data.error}`); }
    } catch { setFeedback("Failed to leave group."); }
    finally { setActionLoading(""); setTimeout(() => setFeedback(""), 3000); }
  }

  async function createGroup() {
    if (!newGroupSubject.trim()) return;
    const parts = newGroupParticipants.split(",").map((p) => p.trim()).filter(Boolean).map((p) => `${p}@s.whatsapp.net`);
    if (parts.length === 0) { setFeedback("Add at least one participant phone number."); return; }
    setActionLoading("create");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newGroupSubject.trim(), participants: parts })
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback("Group created!");
        setCreateOpen(false);
        setNewGroupSubject("");
        setNewGroupParticipants("");
        fetchGroups();
      } else { setFeedback(`Error: ${data.error}`); }
    } catch { setFeedback("Failed to create group."); }
    finally { setActionLoading(""); setTimeout(() => setFeedback(""), 3000); }
  }

  const filteredGroups = groups.filter((g) =>
    g.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectedSessions = sessions.filter((s) => s.status === "connected");

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent/80">WhatsApp</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Groups</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage WhatsApp groups — participants, invite links, and settings.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_4px_20px_rgba(52,211,153,0.2)] transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Create Group
        </button>
      </div>

      {/* Session + API Key selector */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Session & Authentication</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Session</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="input-field mt-1.5"
            >
              <option value="">Select a connected session…</option>
              {connectedSessions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Session API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="wfk_live_…"
              className="input-field mt-1.5 font-mono"
            />
          </div>
        </div>
        <button
          onClick={fetchGroups}
          disabled={!selectedSessionId || !apiKey || loading}
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent/40 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Load Groups
        </button>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main content */}
      {(groups.length > 0 || loading) && (
        <section className="grid gap-4 xl:grid-cols-[360px_1fr]">
          {/* Groups list */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center gap-2">
                <Users className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No groups found</p>
              </div>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto">
                {filteredGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    selected={selectedGroup?.id === group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      fetchParticipants(group.id);
                      setInviteLink("");
                      setFeedback("");
                    }}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">{groups.length} group{groups.length !== 1 ? "s" : ""} total</p>
          </div>

          {/* Group detail panel */}
          {selectedGroup ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              {/* Group header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedGroup.subject}</h2>
                  {selectedGroup.desc && (
                    <p className="mt-1 text-sm text-muted-foreground">{selectedGroup.desc}</p>
                  )}
                  <p className="mt-2 font-mono text-xs text-muted-foreground/60">{selectedGroup.id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={leaveGroup}
                    disabled={actionLoading === "leave"}
                    className="focus-ring flex items-center gap-1.5 rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    {actionLoading === "leave" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                    Leave
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Participants", selectedGroup.participantCount],
                  ["Announce only", selectedGroup.announce ? "Yes" : "No"],
                  ["Info locked", selectedGroup.restrict ? "Yes" : "No"]
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Invite link */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Invite Link</p>
                  </div>
                  <button
                    onClick={getInviteLink}
                    disabled={actionLoading === "invite"}
                    className="focus-ring flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-accent/30 hover:text-foreground disabled:opacity-50"
                  >
                    {actionLoading === "invite" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Settings className="h-3 w-3" />}
                    Get Link
                  </button>
                </div>
                {inviteLink ? (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 truncate font-mono text-xs text-accent">{inviteLink}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(inviteLink); setCopiedInvite(true); setTimeout(() => setCopiedInvite(false), 2000); }}
                      className="focus-ring flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      {copiedInvite ? <CheckCircle2 className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
                      {copiedInvite ? "Copied" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Click "Get Link" to generate the invite link.</p>
                )}
              </div>

              {/* Participants */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-foreground">
                    Participants ({participants.length})
                  </p>
                </div>
                {loadingParticipants ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  </div>
                ) : participants.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No participants loaded.</p>
                ) : (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto">
                    {participants.map((p) => {
                      const phone = p.id.replace(/@.*/, "");
                      const isAdmin = p.admin === "admin" || p.admin === "superadmin";
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent/20 to-cyan-400/20 text-[10px] font-bold text-accent">
                              {phone.slice(-2)}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">+{phone}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{p.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.admin === "superadmin" && (
                              <span className="flex items-center gap-1 rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                                <Crown className="h-2.5 w-2.5" /> Owner
                              </span>
                            )}
                            {p.admin === "admin" && (
                              <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400">
                                <UserCheck className="h-2.5 w-2.5" /> Admin
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {feedback && (
                <p className={cn("text-xs font-medium", feedback.startsWith("Error") ? "text-rose-400" : "text-accent")}>
                  {feedback}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 p-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">Select a group</p>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-xs">
                Pick a group from the left to see participants, get the invite link, and manage settings.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Empty state when no session selected */}
      {!loading && groups.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 py-20 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-border bg-muted mb-5">
            <Users className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold text-foreground">No groups loaded</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Select a connected session and enter its API key, then click "Load Groups."
          </p>
        </div>
      )}

      {/* Create group modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-foreground mb-5">Create New Group</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Group Name *</label>
                <input
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  placeholder="My Awesome Group"
                  className="input-field mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Participants (comma-separated phone numbers) *
                </label>
                <textarea
                  value={newGroupParticipants}
                  onChange={(e) => setNewGroupParticipants(e.target.value)}
                  placeholder="8801712345678, 8801987654321"
                  rows={3}
                  className="input-field mt-1.5 resize-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">Include country code, no +</p>
              </div>
              {feedback && (
                <p className={cn("text-xs font-medium", feedback.startsWith("Error") ? "text-rose-400" : "text-accent")}>
                  {feedback}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => { setCreateOpen(false); setFeedback(""); }}
                className="focus-ring rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!newGroupSubject.trim() || actionLoading === "create"}
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
              >
                {actionLoading === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
