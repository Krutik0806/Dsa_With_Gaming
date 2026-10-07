export type SoundName = "click" | "tick" | "correct" | "wrong" | "xp" | "victory" | "defeat" | "match-start" | "countdown";
export declare function isMuted(): boolean;
export declare function setMuted(muted: boolean): void;
/** Play a named cue. Silently no-ops when muted or before user gesture. */
export declare function playSound(name: SoundName): void;
//# sourceMappingURL=sound.d.ts.map