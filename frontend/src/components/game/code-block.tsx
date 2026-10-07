
import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  title,
  language = "javascript",
  maxHeight,
  className,
}: {
  code: string;
  title?: string;
  language?: string;
  maxHeight?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-zinc-800 bg-[#282c34]", className)}>
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </span>
          {title && (
            <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-xs text-zinc-400">
              <FileCode2 className="h-3.5 w-3.5" />
              {title}
            </span>
          )}
        </div>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:border-emerald-600/50 hover:text-emerald-400"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "transparent",
          fontSize: "13px",
          lineHeight: 1.65,
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          overflowX: "auto",
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-geist-mono), ui-monospace, monospace" } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
