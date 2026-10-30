"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { siteDataSchema } from "@/lib/schema";
import { starterData } from "@/lib/starter";
import type { SiteData } from "@/lib/types";

export const STORAGE_KEY = "aangan-kitchens:v1";
const CHANGE_EVENT = "aangan-content-change";
const MAX_IMPORT_BYTES = 1_500_000;

type SaveResult = { ok: true } | { ok: false; error: string };
type ContentContextValue = {
  data: SiteData;
  ready: boolean;
  warning: string;
  save: (next: SiteData) => SaveResult;
  reset: () => SaveResult;
  exportData: () => string;
  importData: (raw: string) => SaveResult;
};

const ContentContext = createContext<ContentContextValue | null>(null);

function readStored(): { data: SiteData; warning: string } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starterData));
      return { data: starterData, warning: "" };
    }
    const parsed = siteDataSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { data: starterData, warning: "Saved data could not be read. Export it from this browser before resetting." };
    return { data: parsed.data, warning: "" };
  } catch {
    return { data: starterData, warning: "Browser storage is unavailable. You can browse the starter site, but changes will not be saved." };
  }
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SiteData>(starterData);
  const [ready, setReady] = useState(false);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const sync = () => {
      const result = readStored();
      setData(result.data);
      setWarning(result.warning);
      setReady(true);
    };
    sync();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const save = useCallback((next: SiteData): SaveResult => {
    const parsed = siteDataSchema.safeParse(next);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "Content is invalid." };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
      setData(parsed.data);
      setWarning("");
      window.dispatchEvent(new Event(CHANGE_EVENT));
      return { ok: true };
    } catch {
      const error = "Browser storage is full or unavailable. Nothing was saved.";
      setWarning(error);
      return { ok: false, error };
    }
  }, []);

  const reset = useCallback(() => save(starterData), [save]);

  const exportData = useCallback(() => JSON.stringify(data, null, 2), [data]);

  const importData = useCallback((raw: string): SaveResult => {
    if (new Blob([raw]).size > MAX_IMPORT_BYTES) return { ok: false, error: "The file is too large. Choose a JSON backup under 1.5 MB." };
    try {
      const parsed = siteDataSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message || "This backup is not valid." };
      return save(parsed.data);
    } catch {
      return { ok: false, error: "This is not a valid JSON backup." };
    }
  }, [save]);

  const value = useMemo(() => ({ data, ready, warning, save, reset, exportData, importData }), [data, ready, warning, save, reset, exportData, importData]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent must be used inside ContentProvider");
  return value;
}
