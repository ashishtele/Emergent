"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function useCoarsePointer() {
  return useMediaQuery("(pointer: coarse)");
}
