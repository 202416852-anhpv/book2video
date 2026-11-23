import posthog from 'posthog-js';

/**
 * Central analytics module — wraps PostHog so the rest of the app never calls
 * `posthog.*` directly. Add new tracked events to ANALYTICS_EVENTS + a typed
 * helper below; UI code only imports `analytics`.
 *
 * Local PostHog (Docker hobby): set in .env
 *   VITE_PUBLIC_POSTHOG_KEY=phc_xxx
 *   VITE_PUBLIC_POSTHOG_HOST=http://localhost:8000
 */

const KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined) || 'http://localhost:8000';

let enabled = false;

/** Canonical event names — single source of truth, avoids typos across the app. */
export const ANALYTICS_EVENTS = {
  // System events (things the engine/app does, not direct clicks)
  VIDEO_PLAY: 'video_play',
  VIDEO_PAUSE: 'video_pause',
  VIDEO_PLAY_COMPLETED: 'video_play_completed',
  // Conversion funnel — exporting a video is the primary goal of this app
  EXPORT_CLICKED: 'export_clicked',
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  EXPORT_FAILED: 'export_failed',
  // Upgrade / pricing funnel
  PRICING_VIEWED: 'pricing_viewed',
  PLAN_SELECTED: 'plan_selected',
  // Revenue-style event — fired on (simulated) successful purchase
  PURCHASE: 'purchase',
  // Voice picker modal — search & filter behaviour
  VOICE_MODAL_OPENED: 'voice_modal_opened',
  VOICE_SEARCH: 'voice_search',
  VOICE_FILTER_TAB: 'voice_filter_tab',
  VOICE_LOAD_MORE: 'voice_load_more',
  VOICE_SELECTED: 'voice_selected',
} as const;

/**
 * Experiment (feature-flag) keys. Create a matching Experiment in the PostHog
 * UI with these exact keys and variants. Example for EXPORT_CTA:
 *   key:      export-cta-test
 *   variants: control | bold
 */
export const EXPERIMENTS = {
  /** Variants the export CTA button renders as: 'control' (default) | 'bold'. */
  EXPORT_CTA: 'export-cta-test',
} as const;

type AnalyticsProps = Record<string, unknown>;

/** Best-effort decode of a JWT payload (no verification — display/id only). */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const body = token.split('.')[1];
    return JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function initAnalytics(): void {
  if (enabled) return;
  if (!KEY) {
    // No key configured (e.g. local dev without PostHog) — stay silent, no-op.
    if (import.meta.env.DEV) console.info('[analytics] disabled: VITE_PUBLIC_POSTHOG_KEY not set');
    return;
  }
  posthog.init(KEY, {
    api_host: HOST,
    // Auto-track every click / input / submit on the UI without manual wiring.
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    // Only create person profiles for users we identify (saves quota on anon).
    person_profiles: 'identified_only',
  });
  enabled = true;
}

/** Expose the raw client for the React provider / hooks. */
export { posthog };

export const analytics = {
  isEnabled: () => enabled,

  /** Tie subsequent events to a logged-in user. Pass the access token. */
  identifyFromToken(accessToken: string): void {
    if (!enabled) return;
    const payload = decodeJwt(accessToken);
    if (!payload) return;
    const id = String(payload.sub ?? payload.userId ?? payload.id ?? payload.username ?? '');
    if (!id) return;
    posthog.identify(id, {
      username: payload.username,
      email: payload.email,
      role: payload.role ?? payload.type,
    });
  },

  /** Clear identity on logout so the next session is anonymous. */
  reset(): void {
    if (!enabled) return;
    posthog.reset();
  },

  /** Generic escape hatch for ad-hoc events. */
  track(event: string, props?: AnalyticsProps): void {
    if (!enabled) return;
    posthog.capture(event, props);
  },

  // ── Domain helpers ───────────────────────────────────────────────────────
  videoPlay(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.VIDEO_PLAY, props);
  },
  videoPause(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.VIDEO_PAUSE, props);
  },
  /** System event: playback reached the end of the timeline on its own. */
  videoPlayCompleted(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.VIDEO_PLAY_COMPLETED, props);
  },
  exportClicked(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.EXPORT_CLICKED, props);
  },
  exportStarted(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.EXPORT_STARTED, props);
  },
  exportCompleted(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.EXPORT_COMPLETED, props);
  },
  exportFailed(props?: AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.EXPORT_FAILED, props);
  },
  /** Revenue event — call when a purchase/subscription completes. */
  purchase(props: { value: number; currency?: string } & AnalyticsProps) {
    this.track(ANALYTICS_EVENTS.PURCHASE, { currency: 'VND', ...props });
  },

  // ── A/B testing ──────────────────────────────────────────────────────────
  /**
   * Read the assigned variant of an experiment (feature flag with variants).
   * Returns undefined while flags are still loading or PostHog is disabled.
   * Prefer the `useFeatureFlagVariantKey` hook inside components; use this for
   * imperative reads (e.g. inside event handlers).
   */
  getVariant(flagKey: string): string | boolean | undefined {
    if (!enabled) return undefined;
    return posthog.getFeatureFlag(flagKey);
  },
};

export type Analytics = typeof analytics;
