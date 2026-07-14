import type { ReactNode, CSSProperties, ElementType } from "react";
import { motion } from "motion/react";

/**
 * Scroll-reveal wrapper — fades + lifts its children into view once, the way
 * Apple's product pages stage content as you scroll. Powered by Motion
 * (framer-motion v12) via `whileInView`, so it respects reduced-motion (see the
 * MotionConfig in SiteApp) and animates with a soft spring-like ease.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  as = "div",
  className = "",
  style,
}: {
  children: ReactNode;
  /** stagger delay in milliseconds (kept ms for call-site compatibility) */
  delay?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  // esbuild strips types; motion is a proxy that resolves string tags at runtime.
  const MotionTag: ElementType = (motion as Record<string, ElementType>)[as as string] ?? motion.div;

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </MotionTag>
  );
}
