import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the custom theme scales in globals.css, otherwise it mistakes
// `text-13` / `text-meta` for text *colours* and drops them when a colour class is also present.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["meta", "13", "13_5"],
      shadow: ["card", "pop", "chip"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
