"use client";
import { useSyncExternalStore } from "react";

/** True when the viewport is narrower than `px` (owner layout switches to a drawer below 960px). */
export function useNarrow(px = 960) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(`(max-width: ${px - 0.02}px)`);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(`(max-width: ${px - 0.02}px)`).matches,
    () => false,
  );
}
