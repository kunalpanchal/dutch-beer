"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { SearchIndex } from "@/lib/catalog/search";

let cachedIndex: SearchIndex | null = null;
let inflight: Promise<SearchIndex> | null = null;

async function fetchSearchIndex(): Promise<SearchIndex> {
  if (cachedIndex) return cachedIndex;
  if (!inflight) {
    inflight = fetch("/api/search-index")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load search index");
        return (await response.json()) as SearchIndex;
      })
      .then((index) => {
        cachedIndex = index;
        return index;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useSearchIndex(enabled = true): {
  index: SearchIndex | null;
  loading: boolean;
  error: string | null;
} {
  const [index, setIndex] = useState<SearchIndex | null>(() => (enabled ? cachedIndex : null));
  const [loading, setLoading] = useState(() => enabled && !cachedIndex);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || cachedIndex) return;

    let cancelled = false;
    fetchSearchIndex()
      .then((next) => {
        if (cancelled) return;
        setIndex(next);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Search unavailable");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { index, loading, error };
}

export function useSearchHotkeys(options: {
  onOpen: () => void;
  enabled?: boolean;
}) {
  const { onOpen, enabled = true } = options;
  const handleOpen = useEffectEvent(onOpen);

  useEffect(() => {
    if (!enabled) return;

    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleOpen();
        return;
      }
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget(event.target)) {
        event.preventDefault();
        handleOpen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

function detectMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || navigator.userAgent.includes("Mac");
}

export function useIsMac(): boolean {
  return useState(detectMac)[0];
}
