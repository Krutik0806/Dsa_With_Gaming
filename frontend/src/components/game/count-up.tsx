
import { useEffect, useState } from "react";

export function CountUp({
  from = 0,
  to,
  duration = 900,
  prefix = "",
  suffix = "",
  className,
}: {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration]);

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}
