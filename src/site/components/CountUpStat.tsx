import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";

/**
 * Animates the numeric part of a stat (e.g. "8+", "60s", "$1", "100%") counting
 * up from zero the first time it scrolls into view. Any non-digit prefix/suffix
 * (currency sign, %, +, unit) is preserved; non-numeric values render as-is.
 */
export function CountUpStat({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const parts = value.match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/);
  const [text, setText] = useState(parts ? `${parts[1]}0${parts[3]}` : value);

  useEffect(() => {
    if (!parts) return;
    if (!inView) return;
    const target = parseFloat(parts[2]);
    const decimals = (parts[2].split(".")[1] ?? "").length;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setText(`${parts[1]}${v.toFixed(decimals)}${parts[3]}`),
    });
    return () => controls.stop();
  }, [inView]);

  return (
    <div ref={ref} className={className}>
      {text}
    </div>
  );
}
