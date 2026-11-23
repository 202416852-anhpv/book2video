import { useCallback, useRef, useState } from 'react';

export interface UndoableSnapshot {
  blocks: any[];
  mediaBlocks: any[];
  musicBlocks: any[];
}

const MAX_HISTORY = 50;

export function useUndoRedo() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const past = useRef<UndoableSnapshot[]>([]);
  const future = useRef<UndoableSnapshot[]>([]);

  const sync = () => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  };

  // Call with current snapshot BEFORE mutating state
  const push = useCallback((snapshot: UndoableSnapshot) => {
    past.current = [...past.current.slice(-(MAX_HISTORY - 1)), snapshot];
    future.current = [];
    sync();
  }, []);

  // Returns the snapshot to restore, or null if nothing to undo
  const undo = useCallback((current: UndoableSnapshot): UndoableSnapshot | null => {
    if (past.current.length === 0) return null;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [current, ...future.current].slice(0, MAX_HISTORY);
    sync();
    return prev;
  }, []);

  // Returns the snapshot to restore, or null if nothing to redo
  const redo = useCallback((current: UndoableSnapshot): UndoableSnapshot | null => {
    if (future.current.length === 0) return null;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current, current].slice(-MAX_HISTORY);
    sync();
    return next;
  }, []);

  return { push, undo, redo, canUndo, canRedo };
}
