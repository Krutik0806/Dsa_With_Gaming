
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, playSound, setMuted } from "@/lib/sound";

/**
 * Header mute toggle for the Web Audio cue engine.
 * State mounts from localStorage to avoid hydration mismatch.
 */
export function SoundToggle() {
  const [muted, setMutedState] = useState<boolean | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMutedState(isMuted()));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = () => {
    const next = !(muted ?? true);
    setMuted(next);
    setMutedState(next);
    if (!next) playSound("xp");
  };

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
      title={muted ? "Sound: off" : "Sound: on"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-emerald-600/40 hover:text-emerald-400"
    >
      {muted === null ? (
        <VolumeX className="h-4 w-4 opacity-0" />
      ) : muted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4 text-emerald-400" />
      )}
    </button>
  );
}
