"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  SCHEMA_VERSION,
  inferFields,
  notApplicableKeys,
  progress as computeProgress,
  questionsRemaining as computeRemaining,
} from "./schema";
import type {
  ExtractResult,
  IntakeDraft,
  IntakeExport,
  IntakeKey,
  PlanIntake,
} from "./types";

/**
 * Intake state: the member's answers, where each one came from, and automatic
 * persistence.
 *
 * Auto-save is a graded requirement — partial progress must survive the member
 * closing the tab. It lives in localStorage because there is no account system
 * and the deploy target has an ephemeral filesystem.
 *
 * Provenance is tracked per field because the UI has to be honest about it:
 * a value we pulled off a document or worked out ourselves must be visibly
 * marked as such, and must stay editable (Product Principle 5).
 */

const STORAGE_KEY = "emme:intake:v1";
const SAVE_DEBOUNCE_MS = 400;

export type Provenance = "typed" | "extracted" | "inferred";

interface PersistedState {
  schemaVersion: number;
  draft: IntakeDraft;
  provenance: Partial<Record<IntakeKey, Provenance>>;
  skipped: IntakeKey[];
  extractionSource: ExtractResult["source"] | null;
  startedAt: string;
}

interface IntakeContextValue {
  draft: IntakeDraft;
  provenance: Partial<Record<IntakeKey, Provenance>>;
  skipped: ReadonlySet<IntakeKey>;
  extractionSource: ExtractResult["source"] | null;
  /** False until localStorage has been read. Gate resume UI on this. */
  hydrated: boolean;
  /** Drives the "Saved" confirmation. The copy promises autosave; this shows it. */
  saveState: "idle" | "saving" | "saved";
  /** True when a previous session left answers behind. */
  resumed: boolean;

  setField: <K extends IntakeKey>(key: K, value: PlanIntake[K] | undefined) => void;
  skipField: (key: IntakeKey) => void;
  unskipField: (key: IntakeKey) => void;
  applyExtraction: (result: ExtractResult) => void;
  reset: () => void;

  progress: { answered: number; total: number; pct: number };
  /** Drives the shrinking question counter. */
  questionsRemaining: number;
  buildExport: () => IntakeExport;
}

const IntakeContext = createContext<IntakeContextValue | null>(null);

function emptyState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    draft: {},
    provenance: {},
    skipped: [],
    extractionSource: null,
    startedAt: new Date().toISOString(),
  };
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // A schema change mid-hackathon would silently corrupt answers. Start over
    // rather than half-restore.
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null;
    if (!parsed.draft || typeof parsed.draft !== "object") return null;
    return {
      ...emptyState(),
      ...parsed,
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [],
      provenance: parsed.provenance ?? {},
    };
  } catch {
    // Corrupt or unreadable storage should never block the member. Start fresh.
    return null;
  }
}

function hasAnswers(draft: IntakeDraft): boolean {
  return Object.values(draft).some(
    (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
  );
}

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  // Start empty on both server and client so the first paint matches; real
  // state arrives in the effect below.
  const [state, setState] = useState<PersistedState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setState(persisted);
      setResumed(hasAnswers(persisted.draft));
    }
    setHydrated(true);
  }, []);

  // Debounced write. Never writes before hydration, or we'd clobber a saved
  // session with the empty initial state.
  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSaveState("saved");
      } catch {
        // Private mode or a full quota. Losing autosave is survivable; losing
        // the session to a thrown error is not. Stay quiet rather than claim a
        // save that did not happen.
        setSaveState("idle");
      }
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated]);

  // Fill in what we can work out, so we never ask for it. Only writes keys
  // that have no value yet, so this converges after one pass.
  useEffect(() => {
    if (!hydrated) return;
    const inferred = inferFields(state.draft);
    const keys = Object.keys(inferred) as IntakeKey[];
    if (keys.length === 0) return;
    setState((prev) => {
      const nextDraft = { ...prev.draft };
      const nextProv = { ...prev.provenance };
      let changed = false;
      for (const k of keys) {
        if (nextDraft[k] !== undefined) continue;
        Object.assign(nextDraft, { [k]: inferred[k] });
        nextProv[k] = "inferred";
        changed = true;
      }
      // Returning `prev` unchanged is what stops this effect re-triggering
      // itself. Without it, an inferFields rule that ever returns an
      // already-set key would spin forever.
      if (!changed) return prev;
      return { ...prev, draft: nextDraft, provenance: nextProv };
    });
  }, [state.draft, hydrated]);

  const setField = useCallback<IntakeContextValue["setField"]>((key, value) => {
    setState((prev) => {
      const draft = { ...prev.draft };
      const provenance = { ...prev.provenance };
      if (value === undefined || value === "") {
        delete draft[key];
        delete provenance[key];
      } else {
        Object.assign(draft, { [key]: value });
        // A member typing over an extracted value takes ownership of it.
        provenance[key] = "typed";
      }
      return {
        ...prev,
        draft,
        provenance,
        skipped: prev.skipped.filter((k) => k !== key),
      };
    });
  }, []);

  const skipField = useCallback((key: IntakeKey) => {
    setState((prev) =>
      prev.skipped.includes(key)
        ? prev
        : { ...prev, skipped: [...prev.skipped, key] },
    );
  }, []);

  const unskipField = useCallback((key: IntakeKey) => {
    setState((prev) => ({
      ...prev,
      skipped: prev.skipped.filter((k) => k !== key),
    }));
  }, []);

  /**
   * Merge document-extracted fields in. Never overwrites something the member
   * typed — their correction always wins over a re-upload.
   */
  const applyExtraction = useCallback((result: ExtractResult) => {
    setState((prev) => {
      const draft = { ...prev.draft };
      const provenance = { ...prev.provenance };
      for (const [k, v] of Object.entries(result.fields)) {
        const key = k as IntakeKey;
        if (v === undefined || v === "") continue;
        if (provenance[key] === "typed") continue;
        Object.assign(draft, { [key]: v });
        provenance[key] = "extracted";
      }
      return { ...prev, draft, provenance, extractionSource: result.source };
    });
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to recover from — the in-memory reset below still happens.
    }
    setState(emptyState());
    setResumed(false);
  }, []);

  const buildExport = useCallback((): IntakeExport => {
    const extractedFields = (Object.keys(state.provenance) as IntakeKey[]).filter(
      (k) => state.provenance[k] === "extracted",
    );
    return {
      schemaVersion: SCHEMA_VERSION,
      completedAt: new Date().toISOString(),
      answers: state.draft,
      meta: {
        extractedFields,
        skippedFields: state.skipped,
        notApplicableFields: notApplicableKeys(state.draft),
        extractionSource: state.extractionSource,
      },
    };
  }, [state]);

  const value = useMemo<IntakeContextValue>(
    () => ({
      draft: state.draft,
      provenance: state.provenance,
      skipped: new Set(state.skipped),
      extractionSource: state.extractionSource,
      hydrated,
      saveState,
      resumed,
      setField,
      skipField,
      unskipField,
      applyExtraction,
      reset,
      progress: computeProgress(state.draft),
      questionsRemaining: computeRemaining(state.draft),
      buildExport,
    }),
    [
      state,
      hydrated,
      saveState,
      resumed,
      setField,
      skipField,
      unskipField,
      applyExtraction,
      reset,
      buildExport,
    ],
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

export function useIntake(): IntakeContextValue {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntake must be used inside <IntakeProvider>");
  return ctx;
}
