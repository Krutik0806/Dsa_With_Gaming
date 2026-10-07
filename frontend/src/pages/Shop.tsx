
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  BadgeCheck,
  Coins,
  Crown,
  Loader2,
  Receipt,
  Shield,
  ShoppingBag,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context"; import type { ClientUser } from "@/lib/auth-context";
import { PageHeader } from "@/components/game/page-header";
import { PlayerAvatar } from "@/components/game/player-avatar";
import { playSound } from "@/lib/sound";
import { timeAgo } from "@/lib/format";
import type { ShopResponse, ShopItemView } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── How coins are earned (mirrors src/lib/shop.ts COIN_REWARDS) ─────────────
const EARN_RULES = [
  { icon: Swords, label: "match win", amount: "+40" },
  { icon: Target, label: "daily challenge", amount: "+50" },
  { icon: Trophy, label: "cup round", amount: "+30" },
  { icon: Crown, label: "cup title", amount: "+200" },
  { icon: Sparkles, label: "daily check-in", amount: "+15" },
];

function CoinGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 to-amber-600 font-mono text-[10px] font-black text-amber-950 shadow-[0_0_10px_-2px_rgba(251,191,36,0.6)]",
        className
      )}
      aria-hidden
    >
      C
    </span>
  );
}

function FramePreview({ itemId, accent }: { itemId: string; accent: string }) {
  return (
    <div className="relative flex h-24 items-center justify-center">
      <PlayerAvatar name="You" size="xl" frame={itemId} />
      <span
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-2 py-px font-mono text-[9px] font-bold uppercase tracking-wider"
        style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14`, color: accent }}
      >
        preview
      </span>
    </div>
  );
}

function TitlePreview({ flair, accent }: { flair: string; accent: string }) {
  return (
    <div className="flex h-24 flex-col items-center justify-center gap-2">
      <span className="font-mono text-sm font-bold text-zinc-100">DemoDuelist</span>
      <span
        className="rounded-full border px-3 py-1 font-mono text-xs font-semibold"
        style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14`, color: accent }}
      >
        ✦ {flair}
      </span>
    </div>
  );
}

function ShopItemCard({
  item,
  coins,
  onBuy,
  onEquip,
  onUnequip,
  busy,
}: {
  item: ShopItemView;
  coins: number;
  onBuy: (item: ShopItemView) => void;
  onEquip: (item: ShopItemView) => void;
  onUnequip: (kind: "FRAME" | "TITLE") => void;
  busy: string | null;
}) {
  const isBusy = busy === item.id;
  const canAfford = coins >= item.cost;

  let action: { label: string; disabled: boolean; onClick: () => void; primary?: boolean };
  if (item.kind === "CONSUMABLE") {
    action = { label: `buy · ${item.cost}`, disabled: !canAfford || isBusy, onClick: () => onBuy(item), primary: true };
  } else if (item.equipped) {
    action = {
      label: "unequip",
      disabled: isBusy,
      onClick: () => onUnequip(item.kind === "FRAME" ? "FRAME" : "TITLE"),
    };
  } else if (item.owned) {
    action = { label: "equip", disabled: isBusy, onClick: () => onEquip(item), primary: true };
  } else {
    action = { label: `buy · ${item.cost}`, disabled: !canAfford || isBusy, onClick: () => onBuy(item), primary: true };
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-zinc-900/40 transition-all duration-200 hover:-translate-y-0.5",
        item.equipped ? "border-amber-500/40 shadow-[0_0_24px_-8px_rgba(251,191,36,0.35)]" : "border-zinc-800 hover:border-zinc-700"
      )}
    >
      {item.equipped && (
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-300">
          <BadgeCheck className="h-3 w-3" /> equipped
        </span>
      )}
      <div className="border-b border-zinc-800/70 bg-zinc-950/40">
        {item.kind === "FRAME" ? (
          <FramePreview itemId={item.id} accent={item.accent} />
        ) : item.kind === "TITLE" ? (
          <TitlePreview flair={item.flair ?? item.name} accent={item.accent} />
        ) : (
          <div className="relative flex h-24 items-center justify-center">
            <Shield className="h-12 w-12 text-sky-400/80 cc-float" />
            {typeof item.count === "number" && item.count > 0 && (
              <span className="absolute right-3 top-3 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300">
                ×{item.count} banked
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-mono text-sm font-bold text-zinc-100">{item.name}</h3>
          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-300">
            <CoinGlyph className="h-3.5 w-3.5" />
            {item.cost}
          </span>
        </div>
        <p className="flex-1 text-xs leading-relaxed text-zinc-500">{item.description}</p>
        <button
          onClick={action.onClick}
          disabled={action.disabled}
          className={cn(
            "mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-xs font-bold transition-all",
            action.disabled && "cursor-not-allowed opacity-40",
            action.primary
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400/70 hover:bg-amber-500/20"
              : "border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          )}
        >
          {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {action.label}
        </button>
        {!canAfford && !item.owned && item.kind !== "CONSUMABLE" && (
          <p className="text-center font-mono text-[10px] text-zinc-600">
            {item.cost - coins} more coins needed
          </p>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { user: userRaw, setUser } = useAuth(); const user = userRaw!;
  const [data, setData] = useState<ShopResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [coinRain, setCoinRain] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/shop").then(r => r.data);
      setData(data);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshUser = (u: ClientUser) => {
    setUser(u);
    void load(); // reload ownership/equipped state
  };

  const buy = async (item: ShopItemView) => {
    if (busy) return;
    setBusy(item.id);
    try {
      const payload = await api.post("/shop", { action: "BUY", itemId: item.id }).then(r => r.data);
      refreshUser(payload.user);
      playSound("victory");
      setCoinRain(true);
      setTimeout(() => setCoinRain(false), 1200);
      toast.success(`Purchased — ${payload.itemName}`, {
        description: `−${payload.cost} coins · balance ${payload.user.coins.toLocaleString()}`,
      });
    } catch (e: any) {
      playSound("wrong");
      toast.error(e?.response?.data?.error ?? (e instanceof Error ? e.message : "Purchase failed"));
    } finally {
      setBusy(null);
    }
  };

  const equip = async (item: ShopItemView) => {
    if (busy) return;
    setBusy(item.id);
    try {
      const payload = await api.post("/shop", { action: "EQUIP", itemId: item.id }).then(r => r.data);
      refreshUser(payload.user);
      playSound("click");
      toast.success(`Equipped — ${item.name}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? (e instanceof Error ? e.message : "Equip failed"));
    } finally {
      setBusy(null);
    }
  };

  const unequip = async (kind: "FRAME" | "TITLE") => {
    if (busy) return;
    setBusy(kind);
    try {
      const payload = await api.post("/shop", { action: "UNEQUIP", kind }).then(r => r.data);
      refreshUser(payload.user);
      playSound("click");
      toast.success(`${kind === "FRAME" ? "Frame" : "Title"} unequipped`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? (e instanceof Error ? e.message : "Unequip failed"));
    } finally {
      setBusy(null);
    }
  };

  const coins = user.coins ?? 0;
  const consumables = data?.items.filter((i) => i.kind === "CONSUMABLE") ?? [];
  const frames = data?.items.filter((i) => i.kind === "FRAME") ?? [];
  const titles = data?.items.filter((i) => i.kind === "TITLE") ?? [];

  return (
    <div>
      <PageHeader
        icon={ShoppingBag}
        title="Arena Shop"
        description="Coins earned in battle, spent on swagger. Consumables that protect your grind, cosmetics that announce it."
        actions={
          <span className="relative inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-600/5 px-4 py-2.5">
            {coinRain && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                {[12, 32, 52, 72, 88].map((left, i) => (
                  <span
                    key={i}
                    className="cc-coin-fall absolute top-0"
                    style={{ left: `${left}%`, animationDelay: `${i * 120}ms` }}
                  >
                    <CoinGlyph className="h-3.5 w-3.5" />
                  </span>
                ))}
              </span>
            )}
            <Coins className="h-5 w-5 text-amber-400 cc-coin-spin" />
            <span className="font-mono text-xl font-black tabular-nums text-amber-300">
              {coins.toLocaleString()}
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500/80">coins</span>
          </span>
        }
      />

      {/* ── How to earn ─────────────────────────────────────────────────────── */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
        <div className="border-b border-zinc-800/70 px-5 py-3">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">how to earn</h2>
        </div>
        <div className="grid grid-cols-2 divide-zinc-800/70 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
          {EARN_RULES.map((rule) => (
            <div key={rule.label} className="flex items-center gap-3 px-4 py-3.5">
              <rule.icon className="h-4 w-4 shrink-0 text-zinc-500" />
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-zinc-400">{rule.label}</p>
                <p className="font-mono text-sm font-bold text-amber-300">{rule.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {data === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="cc-shimmer h-72 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Consumables ──────────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                <Shield className="h-3.5 w-3.5 text-sky-400" /> consumables
              </h2>
              <span className="font-mono text-[10px] text-zinc-600">
                {data.freezes} freeze{data.freezes === 1 ? "" : "s"} banked
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {consumables.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  coins={coins}
                  onBuy={buy}
                  onEquip={equip}
                  onUnequip={unequip}
                  busy={busy}
                />
              ))}
            </div>
          </section>

          {/* ── Frames ──────────────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                <Crown className="h-3.5 w-3.5 text-amber-400" /> avatar frames
              </h2>
              <span className="font-mono text-[10px] text-zinc-600">
                {frames.filter((f) => f.owned).length}/{frames.length} owned
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {frames.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  coins={coins}
                  onBuy={buy}
                  onEquip={equip}
                  onUnequip={unequip}
                  busy={busy}
                />
              ))}
            </div>
          </section>

          {/* ── Titles ──────────────────────────────────────────────────────── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5 text-pink-400" /> name titles
              </h2>
              <span className="font-mono text-[10px] text-zinc-600">
                {titles.filter((t) => t.owned).length}/{titles.length} owned
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {titles.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  coins={coins}
                  onBuy={buy}
                  onEquip={equip}
                  onUnequip={unequip}
                  busy={busy}
                />
              ))}
            </div>
          </section>

          {/* ── Purchase log ─────────────────────────────────────────────────── */}
          {data.purchases.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
              <div className="border-b border-zinc-800/70 px-5 py-3">
                <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <Receipt className="h-3.5 w-3.5 text-zinc-400" /> purchase log
                </h2>
              </div>
              <ul className="max-h-72 divide-y divide-zinc-800/60 overflow-y-auto cc-scroll-thin">
                {data.purchases.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <CoinGlyph className="h-4 w-4" />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">{p.itemName}</span>
                    <span className="font-mono text-xs font-bold text-amber-300/90">−{p.cost}</span>
                    <span className="hidden shrink-0 font-mono text-[10px] text-zinc-600 sm:inline">
                      {timeAgo(new Date(p.at))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
