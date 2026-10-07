
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { completionsFor, getLang, type LangId, type Snippet } from "@/lib/languages";
import { highlightCode } from "@/components/game/highlight";

const LINE_H = 21.45; // 13px * 1.65 line-height
const PAD_Y = 12; // p-3
const PAD_X = 12;

const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
const INDENT_UNIT: Record<LangId, number> = { js: 2, cpp: 4, py: 4, java: 4 };

export function CodeEditor({
  value,
  onChange,
  onSubmit,
  readOnly = false,
  minHeight = 340,
  className,
  language = "js",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  minHeight?: number;
  className?: string;
  /** Language for highlighting + autocomplete. */
  language?: LangId;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [charW, setCharW] = useState(7.8);
  const [caret, setCaret] = useState(0);
  const [scroll, setScroll] = useState({ top: 0, left: 0 });
  const [menu, setMenu] = useState<{ items: Snippet[]; selected: number; interacted: boolean } | null>(null);

  const lang = getLang(language);
  const lineCount = Math.max(value.split("\n").length, 1);
  const html = useMemo(() => highlightCode(value + "\n", language), [value, language]);

  // Measure the monospace character width once for popup positioning.
  useEffect(() => {
    if (measureRef.current) {
      const w = measureRef.current.getBoundingClientRect().width / 50;
      if (w > 0) setCharW(w);
    }
  }, []);

  // ── autocomplete ──────────────────────────────────────────────────────────
  const updateMenu = (text: string, caret: number) => {
    if (readOnly) return;
    const before = text.slice(0, caret);
    const m = /([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(before);
    if (!m || m[1].length < 1) {
      setMenu(null);
      return;
    }
    const items = completionsFor(language, m[1]);
    setMenu(items.length > 0 ? { items, selected: 0, interacted: false } : null);
  };

  const acceptCompletion = (item: Snippet) => {
    const ta = taRef.current;
    if (!ta) return;
    const caret = ta.selectionStart;
    const before = value.slice(0, caret);
    const m = /([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(before);
    if (!m) return;
    const start = caret - m[1].length;
    const next = value.slice(0, start) + item.insert + value.slice(ta.selectionEnd);
    onChange(next);
    const newCaret = start + item.insert.length;
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = newCaret;
      setMenu(null);
    });
  };

  const replaceSelection = (insert: string, caretOffset?: number) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = value.slice(0, start) + insert + value.slice(end);
    onChange(next);
    const caret = start + (caretOffset ?? insert.length);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = caret;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;

    // ── autocomplete navigation ──
    if (menu) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenu({ ...menu, selected: (menu.selected + 1) % menu.items.length, interacted: true });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenu({ ...menu, selected: (menu.selected - 1 + menu.items.length) % menu.items.length, interacted: true });
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        acceptCompletion(menu.items[menu.selected]);
        return;
      }
      if (e.key === "Enter" && menu.interacted) {
        e.preventDefault();
        acceptCompletion(menu.items[menu.selected]);
        return;
      }
      if (e.key === "Escape") {
        setMenu(null);
        return;
      }
    }

    // ── submit ──
    if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      setMenu(null);
      onSubmit();
      return;
    }

    if (readOnly) return;

    // ── bracket / quote auto-close ──
    if (!e.metaKey && !e.ctrlKey && !e.altKey && PAIRS[e.key] && start === end) {
      e.preventDefault();
      replaceSelection(e.key + PAIRS[e.key], 1);
      return;
    }
    // ── skip over an identical closer ──
    if (!e.metaKey && !e.ctrlKey && !e.altKey && [")", "]", "}", '"', "'", "`"].includes(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 1;
      });
      return;
    }
    // ── backspace deletes an empty pair ──
    if (e.key === "Backspace" && start === end && start > 0) {
      const before = value[start - 1];
      const after = value[start];
      if (PAIRS[before] && PAIRS[before] === after) {
        e.preventDefault();
        const next = value.slice(0, start - 1) + value.slice(start + 1);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start - 1;
        });
        return;
      }
    }

    // ── auto-indent on Enter ──
    if (e.key === "Enter" && start === end) {
      e.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const indent = (currentLine.match(/^[ \t]*/) ?? [""])[0];
      const prevChar = value[start - 1] ?? "";
      const openers = language === "py" ? ["{", "[", "(", ":"] : ["{", "[", "("];
      const extra = openers.includes(prevChar) ? " ".repeat(INDENT_UNIT[language]) : "";
      replaceSelection("\n" + indent + extra);
      return;
    }

    // ── tab: indent / block-indent ──
    if (e.key === "Tab") {
      e.preventDefault();
      if (start !== end) {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const sel = value.slice(start, end);
        if (e.shiftKey) {
          const dedented = sel.split("\n").map((l) => l.replace(/^ {1,2}|^\t/, "")).join("\n");
          const next = value.slice(0, start) + dedented + value.slice(end);
          onChange(next);
          requestAnimationFrame(() => {
            ta.selectionStart = start;
            ta.selectionEnd = start + dedented.length;
          });
        } else {
          const indented = sel.split("\n").map((l) => " ".repeat(INDENT_UNIT[language]) + l).join("\n");
          const next = value.slice(0, start) + indented + value.slice(end);
          onChange(next);
          requestAnimationFrame(() => {
            ta.selectionStart = start;
            ta.selectionEnd = start + indented.length;
          });
        }
      } else {
        replaceSelection(" ".repeat(INDENT_UNIT[language]));
      }
      return;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    onChange(next);
    setCaret(e.target.selectionStart);
    updateMenu(next, e.target.selectionStart);
  };

  // ── popup geometry (derived from state, not refs) ──
  let popupTop = 0;
  let popupLeft = 0;
  if (menu) {
    const before = value.slice(0, caret);
    const lineIdx = before.split("\n").length - 1;
    const col = caret - (before.lastIndexOf("\n") + 1);
    popupTop = Math.min(PAD_Y + (lineIdx + 1) * LINE_H - scroll.top + 4, (minHeight || 340) + PAD_Y);
    popupLeft = Math.max(PAD_X + 40, PAD_X + col * charW - scroll.left);
  }

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 focus-within:border-emerald-600/60",
        readOnly && "opacity-90",
        className
      )}
    >
      {/* char width probe */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute -z-10 invisible font-mono text-[13px] leading-[21.45px]"
      >
        00000000000000000000000000000000000000000000000000
      </span>

      <div
        ref={gutterRef}
        aria-hidden
        className="max-h-[70vh] select-none overflow-hidden border-r border-zinc-800/70 bg-zinc-900/40 py-3 pl-3 pr-2 text-right font-mono text-[13px] leading-[21.45px] text-zinc-600"
        style={{ minHeight: minHeight * 0.25 }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <pre
          ref={preRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-3 font-mono text-[13px] leading-[21.45px] text-zinc-200"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <textarea
          ref={taRef}
          value={value}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setMenu(null), 150)}
          onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
          onKeyUp={(e) => {
            if (!["ArrowUp", "ArrowDown", "Tab", "Escape"].includes(e.key)) setCaret(e.currentTarget.selectionStart);
          }}
          onClick={(e) => setCaret(e.currentTarget.selectionStart)}
          onScroll={(e) => {
            const t = e.currentTarget;
            setScroll({ top: t.scrollTop, left: t.scrollLeft });
            if (gutterRef.current) gutterRef.current.scrollTop = t.scrollTop;
            if (preRef.current) {
              preRef.current.scrollTop = t.scrollTop;
              preRef.current.scrollLeft = t.scrollLeft;
            }
          }}
          className="cc-scroll-thin relative max-h-[70vh] flex-1 resize-none whitespace-pre bg-transparent p-3 font-mono text-[13px] leading-[21.45px] text-transparent caret-emerald-400 outline-none selection:bg-emerald-500/25"
          style={{ minHeight }}
          placeholder={`// write your ${lang.name} solution here`}
          aria-label={`${lang.name} code editor`}
        />

        {/* autocomplete popup */}
        {menu && !readOnly && (
          <div
            className="cc-rise absolute z-20 w-72 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/50"
            style={{ top: Math.min(popupTop, (typeof minHeight === "number" ? minHeight : 340) + 8), left: popupLeft }}
            role="listbox"
            aria-label="Code suggestions"
          >
            <div className="border-b border-zinc-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {lang.name} suggestions · ↑↓ · tab
            </div>
            <div className="cc-scroll-thin max-h-52 overflow-y-auto">
              {menu.items.map((item, i) => (
                <button
                  key={item.label + i}
                  role="option"
                  aria-selected={i === menu.selected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    acceptCompletion(item);
                  }}
                  onMouseEnter={() => setMenu({ ...menu, selected: i })}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-3 px-2.5 py-1.5 text-left font-mono text-xs transition-colors",
                    i === menu.selected ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-300 hover:bg-zinc-800/60"
                  )}
                >
                  <span className="truncate">
                    <span className="font-bold">{item.label}</span>
                  </span>
                  {item.detail && <span className="shrink-0 text-[10px] text-zinc-500">{item.detail}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
