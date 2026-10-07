// ─── Theme management for CodeClash (Dark / Light) ───────────────────────────
export type Theme = "dark" | "light";

const THEME_KEY = "codeclash-theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore
  }
  return "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function toggleTheme(): Theme {
  const current = getInitialTheme();
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("codeclash-theme-change", { detail: next }));
  }
  return next;
}
