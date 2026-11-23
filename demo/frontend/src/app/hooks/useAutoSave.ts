import { useEffect, useRef } from 'react';
import { saveProject } from '../utils/projectApi';

/**
 * Auto-save project data with debounce.
 * Saves 2 seconds after the last change + saves on unmount.
 *
 * The `enabled` and `snapshotReady` gates are deliberately separate so callers
 * can capture the initial baseline early (right after project load) but defer
 * actual PUT calls until some later condition (e.g. transcription finishing).
 * This is what lets a transcribe-generated state change trigger exactly one
 * save, instead of either (a) saving empty state during transcription or
 * (b) missing the transcribe-generated change entirely because the snapshot
 * was captured too late.
 */
export function useAutoSave(
  projectId: string | undefined,
  getData: () => Record<string, any>,
  deps: any[],
  enabled: boolean = true,
  snapshotReady: boolean = enabled,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const snapshotRef = useRef<string>('');
  const getDataRef = useRef(getData);
  getDataRef.current = getData;
  const dirtyRef = useRef(false);
  const savingRef = useRef(false); // prevents overlapping saves (debounce + unmount race)
  const projectIdRef = useRef(projectId);
  projectIdRef.current = projectId;

  // Take initial baseline snapshot as soon as the project data is ready,
  // even if saves are still gated. Comparing against this baseline later
  // lets us detect real changes vs. loaded/initial state.
  useEffect(() => {
    if (snapshotReady && !snapshotRef.current) {
      try { snapshotRef.current = JSON.stringify(getDataRef.current()); } catch { /* */ }
    }
  }, [snapshotReady]);

  // Debounced save on deps change
  useEffect(() => {
    if (!enabled || !projectId) return;

    // Compare with snapshot — skip if nothing actually changed
    let current: string;
    try { current = JSON.stringify(getDataRef.current()); } catch { return; }
    if (current === snapshotRef.current) return;

    dirtyRef.current = true;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (savingRef.current) return;
      savingRef.current = true;
      dirtyRef.current = false;
      snapshotRef.current = current;
      saveProject(projectId, getDataRef.current())
        .catch(() => {})
        .finally(() => { savingRef.current = false; });
    }, 2000);

    return () => clearTimeout(timerRef.current);
  }, deps);

  // Save on unmount if dirty (user navigates away or reloads)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dirtyRef.current && !savingRef.current && projectIdRef.current) {
        const data = getDataRef.current();
        // Use keepalive fetch so the request survives page unload
        fetch(`/api/projects/${projectIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount (navigate away) — flush pending save
      clearTimeout(timerRef.current);
      if (dirtyRef.current && !savingRef.current && projectIdRef.current) {
        saveProject(projectIdRef.current, getDataRef.current()).catch(() => {});
      }
    };
  }, []);
}
