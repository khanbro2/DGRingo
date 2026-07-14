import type { ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { PhoneFrame } from "./PhoneFrame";
import { SHOTS } from "../data";

/**
 * The two hero phones — they fade + scale in, breathe with a gentle endless
 * float, and tilt in 3D toward the pointer for a tactile, premium feel.
 * The whole group shares one perspective so the tilt reads as real depth.
 */
const SPRING = { stiffness: 120, damping: 18, mass: 0.6 };

export function HeroPhones() {
  // pointer position, normalised to [-0.5, 0.5] over the group's box
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), SPRING);
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), SPRING);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      className="dg-hero-phones"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: "flex", justifyContent: "center", gap: 18, position: "relative", perspective: 1200 }}
    >
      <Floating offset={18} tilt={-4} delay={0.25} rotX={rotX} rotY={rotY} dur={6.5}>
        <PhoneFrame src={SHOTS.home} caption="Home" />
      </Floating>
      <Floating offset={-18} tilt={4} delay={0.38} rotX={rotX} rotY={rotY} dur={7.5}>
        <PhoneFrame src={SHOTS.chat} caption="Messages" glow={false} />
      </Floating>
    </motion.div>
  );
}

function Floating({
  children,
  offset,
  tilt,
  delay,
  dur,
  rotX,
  rotY,
}: {
  children: ReactNode;
  offset: number;
  tilt: number;
  delay: number;
  dur: number;
  rotX: import("motion/react").MotionValue<number>;
  rotY: import("motion/react").MotionValue<number>;
}) {
  return (
    // outer: static placement (vertical offset + base rotation) — plain element
    // so its transform never fights the animated transforms inside it.
    <div style={{ transform: `translateY(${offset}px) rotate(${tilt}deg)` }}>
      {/* middle: pointer tilt + fade/scale entrance */}
      <motion.div
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d", willChange: "transform" }}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
        whileHover={{ scale: 1.03 }}
      >
        {/* inner: endless gentle float */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
