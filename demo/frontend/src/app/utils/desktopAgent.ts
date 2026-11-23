/**
 * Bridge to the Vbee Studio Plugin export agent.
 *
 * The web editor runs in the browser; heavy export is offloaded to a local
 * companion app reached over loopback HTTP. If the agent isn't running, we
 * launch it via the `vbeestudio://` protocol (no page navigation) and wait.
 */
const AGENT_BASE = "http://127.0.0.1:47800";
const PROTOCOL_LAUNCH = "vbeestudio://export";
// NOTE: real installer download (direct .dmg/.exe) is wired in Phase 5 once the
// packaged, signed installer is hosted.

export interface AgentVideoInfo {
  width?: number;
  height?: number;
  duration?: number;
  sizeBytes?: number;
}

export interface AgentExportResult {
  canceled: boolean;
  outputPath?: string;
  info?: AgentVideoInfo;
}

export interface AgentJobState {
  status: string;
  progress: number;
  outputPath?: string;
  error?: string;
  info?: AgentVideoInfo;
}

/** Is the local agent reachable right now? */
export async function pingAgent(timeoutMs = 700): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${AGENT_BASE}/ping`, { signal: ctrl.signal });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Hybrid local-first: hand media bytes to the agent (keyed by its cloud URL) so
 * export reads them locally instead of re-downloading. Best-effort & fire-and-forget:
 * silently no-ops when the agent isn't running. Call after a media upload resolves.
 */
export async function cacheMedia(url: string, data: Blob | ArrayBuffer): Promise<boolean> {
  try {
    if (!(await pingAgent(400))) return false;
    const res = await fetch(`${AGENT_BASE}/cache`, {
      method: "POST",
      headers: { "x-media-url": url, "Content-Type": "application/octet-stream" },
      body: data,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Open the exported file in the default player (agent runs hidden). */
export async function openFile(path: string): Promise<void> {
  try { await fetch(`${AGENT_BASE}/open`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }); } catch { /* ignore */ }
}

/** Reveal the exported file in Finder/Explorer (agent runs hidden). */
export async function revealFile(path: string): Promise<void> {
  try { await fetch(`${AGENT_BASE}/reveal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) }); } catch { /* ignore */ }
}

/** Ask the OS to launch the desktop app via custom protocol (no navigation). */
export function launchAgent(): void {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = PROTOCOL_LAUNCH;
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 1500);
}

/** Ensure the agent is up: ping, else launch and poll. Returns false if it never came up. */
export async function ensureAgent(launchTimeoutMs = 8000): Promise<boolean> {
  if (await pingAgent()) return true;
  launchAgent();
  const deadline = Date.now() + launchTimeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 500));
    if (await pingAgent(600)) return true;
  }
  return false;
}

export interface AgentExportOptions {
  filename?: string;
  /** Origin the agent uses to download relative `/api/...` media. */
  apiBase?: string;
  /** Bearer token for authenticated server downloads. */
  token?: string | null;
  /** Called with live job state while the agent renders (for a progress bar). */
  onProgress?: (s: AgentJobState) => void;
}

/**
 * Hand the export payload to the agent and poll its job until done.
 * Resolves when rendering finishes (or is canceled), rejects on error.
 */
export async function exportViaAgent(payload: unknown, opts: AgentExportOptions = {}): Promise<AgentExportResult> {
  const res = await fetch(`${AGENT_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payload,
      filename: opts.filename || "video",
      apiBase: opts.apiBase,
      token: opts.token || undefined,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Agent export failed (${res.status})`);
  }
  const { jobId } = await res.json();
  if (!jobId) throw new Error("Agent did not return a job id");

  // Poll job status for a live progress bar.
  for (;;) {
    await new Promise((r) => setTimeout(r, 500));
    let job: AgentJobState;
    try {
      const s = await fetch(`${AGENT_BASE}/status/${jobId}`);
      if (!s.ok) throw new Error(`status ${s.status}`);
      job = await s.json();
    } catch {
      continue; // transient; keep polling
    }
    opts.onProgress?.(job);
    if (job.status === "done") return { canceled: false, outputPath: job.outputPath, info: job.info };
    if (job.status === "canceled") return { canceled: true };
    if (job.status === "error") throw new Error(job.error || "Export thất bại");
  }
}
