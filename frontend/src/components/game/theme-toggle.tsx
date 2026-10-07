import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getInitialTheme, toggleTheme, type Theme } from "@/lib/theme";
import { playSound } from "@/lib/sound";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "switch";
}

/**
 * Animated theme toggle switch supporting both Icon Button and Pill Switch styles.
 */
export function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = getInitialTheme();
    setTheme(init);
    applyTheme(init);
    setMounted(true);

    const onThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail) {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener("codeclash-theme-change", onThemeChange);
    return () => window.removeEventListener("codeclash-theme-change", onThemeChange);
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
    playSound("click");
  };

  if (!mounted) {
    return (
      <div className={`h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-900/60 ${className}`} />
    );
  }

  const isDark = theme === "dark";

  if (variant === "switch") {
    return (
      <button
        onClick={handleToggle}
        type="button"
        role="switch"
        aria-checked={!isDark}
        aria-label="Toggle light/dark theme"
        title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        className={`group relative inline-flex h-8 w-15 items-center rounded-full border p-0.5 transition-colors duration-300 focus:outline-none ${
          isDark
            ? "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            : "border-amber-300/60 bg-amber-100 hover:border-amber-400"
        } ${className}`}
      >
        <span
          className={`flex h-6.5 w-6.5 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ${
            isDark
              ? "translate-x-0 bg-zinc-800 text-amber-300"
              : "translate-x-7 bg-white text-amber-500 shadow-amber-200/50"
          }`}
        >
          {isDark ? (
            <Moon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-12" />
          ) : (
            <Sun className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-45" />
          )}
        </span>
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      type="button"
      aria-label={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      title={isDark ? "Theme: Dark (click for Light)" : "Theme: Light (click for Dark)"}
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-300 hover:scale-105 active:scale-95 ${
        isDark
          ? "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-amber-400/50 hover:bg-zinc-800 hover:text-amber-300 hover:shadow-[0_0_12px_-2px_rgba(251,191,36,0.3)]"
          : "border-amber-300/70 bg-amber-50 text-amber-600 hover:border-amber-400 hover:bg-amber-100/70 hover:text-amber-700 hover:shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)]"
      } ${className}`}
    >
      {isDark ? (
        <Moon className="h-4 w-4 transition-transform duration-300 hover:-rotate-12" />
      ) : (
        <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 hover:rotate-45" />
      )}
    </button>
  );
}
