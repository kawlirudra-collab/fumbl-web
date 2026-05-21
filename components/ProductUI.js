"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";

// ---------------------------------------------------------------------------
// TORN EDGE (desktop only — clip-path dropped on mobile)
// ---------------------------------------------------------------------------
function TornEdgeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="tornEdge" clipPathUnits="objectBoundingBox">
          <polygon points="
            0.04,0  1,0  1,1  0.04,1
            0,0.97  0.03,0.93  0.01,0.89  0.05,0.84  0.02,0.79
            0.06,0.73  0.01,0.67  0.04,0.61  0.02,0.55  0.07,0.49
            0.01,0.43  0.05,0.37  0.02,0.31  0.06,0.25  0.01,0.19
            0.04,0.13  0.02,0.07  0.05,0.03
          " />
        </clipPath>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// MOBILE DETECTION — runs once, updates on resize
// ---------------------------------------------------------------------------
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ---------------------------------------------------------------------------
// ANIMATION VARIANTS
// Desktop: panel slaps in from the right with a slight rotation.
// Mobile:  sheet rises from the bottom — no rotation (feels native/premium).
// ---------------------------------------------------------------------------
const desktopVariants = {
  hidden:  { x: "110%", rotate: 4, opacity: 0 },
  visible: {
    x: 0, rotate: 0, opacity: 1,
    transition: { type: "spring", stiffness: 60, damping: 18, mass: 1.4, delayChildren: 0.35, staggerChildren: 0.1 },
  },
  exit:    { x: "110%", rotate: 3, opacity: 0, transition: { type: "spring", stiffness: 80, damping: 20, mass: 1 } },
};

const mobileVariants = {
  hidden:  { y: "100%", opacity: 1 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 55, damping: 20, mass: 1.2, delayChildren: 0.25, staggerChildren: 0.08 },
  },
  exit:    { y: "100%", opacity: 1, transition: { type: "spring", stiffness: 70, damping: 22, mass: 1 } },
};

const childVariants = {
  hidden:  { y: 22, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function ProductUI() {
  const { activeProduct, setActiveProduct } = useStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && activeProduct) setActiveProduct(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct, setActiveProduct]);

  const variants = isMobile ? mobileVariants : desktopVariants;
  const panelStyle = isMobile ? styles.mobilePanel : styles.desktopPanel;

  return (
    <>
      <TornEdgeDefs />

      <AnimatePresence>
        {activeProduct && (
          <motion.div
            key={activeProduct.id}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={panelStyle}
          >
            {/* Mobile drag handle — visual cue that panel is dismissible */}
            {isMobile && (
              <div style={styles.dragHandle} onClick={() => setActiveProduct(null)} />
            )}

            {/* ── INDEX TAG ── */}
            <motion.p variants={childVariants} style={isMobile ? styles.mobileTag : styles.tag}>
              — {String(activeProduct.id).padStart(2, "0")} / 07
            </motion.p>

            {/* ── TITLE ── */}
            <motion.h1 variants={childVariants} style={isMobile ? styles.mobileTitle : styles.title}>
              {splitTitle(activeProduct.name)}
            </motion.h1>

            {/* ── RED RULE ── */}
            <motion.div variants={childVariants} style={styles.rule} />

            {/* ── DESCRIPTION ── */}
            <motion.p variants={childVariants} style={isMobile ? styles.mobileDescription : styles.description}>
              {activeProduct.description}
            </motion.p>

            {/* ── PRE-ORDER BUTTON ── */}
            <motion.div variants={childVariants} style={styles.buttonWrap}>
              <PreOrderButton href={activeProduct.link} isMobile={isMobile} />
            </motion.div>

            {/* ── CLOSE ── */}
            <motion.p variants={childVariants} style={styles.closeHint}>
              <span style={styles.closeBtn} onClick={() => setActiveProduct(null)}>
                ✕ close
              </span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// PRE-ORDER BUTTON
// ---------------------------------------------------------------------------
function PreOrderButton({ href, isMobile }) {
  const ref = useRef(null);
  const handleEnter = () => { if (ref.current) ref.current.style.backgroundSize = "100% 1px"; };
  const handleLeave = () => { if (ref.current) ref.current.style.backgroundSize = "0% 1px"; };

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={isMobile ? styles.mobileButton : styles.button}
    >
      PRE-ORDER →
    </a>
  );
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function splitTitle(name) {
  const idx = name.indexOf(" ");
  if (idx === -1) return name;
  return <>{name.slice(0, idx)}<br />{name.slice(idx + 1)}</>;
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = {
  // ── DESKTOP PANEL ──────────────────────────────────────────────────────────
  desktopPanel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "42vw",
    height: "100%",
    backgroundColor: "#f2ead8",
    clipPath: "url(#tornEdge)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "0 6vw 0 7vw",
    boxSizing: "border-box",
    userSelect: "none",
    pointerEvents: "auto",
  },

  // ── MOBILE BOTTOM SHEET ────────────────────────────────────────────────────
  // Uses 62svh so the product is still visible behind the sheet.
  // No clip-path — clean straight edge reads better at phone scale.
  // Border-top gives the single editorial line the desktop has via clip-path.
  mobilePanel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55svh",
    backgroundColor: "#f2ead8",
    borderTop: "1px solid #D9281E",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: "1.6rem 7vw 3rem",
    boxSizing: "border-box",
    userSelect: "none",
    pointerEvents: "auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: "0",
  },

  // ── DRAG HANDLE ────────────────────────────────────────────────────────────
  dragHandle: {
    width: "2.8rem",
    height: "3px",
    backgroundColor: "#D9281E",
    borderRadius: "2px",
    alignSelf: "center",
    marginBottom: "1.6rem",
    opacity: 0.4,
    cursor: "pointer",
    flexShrink: 0,
  },

  // ── SHARED ─────────────────────────────────────────────────────────────────
  tag: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.25em",
    color: "#D9281E",
    margin: "0 0 1.6rem 0",
    textTransform: "uppercase",
  },
  mobileTag: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.25em",
    color: "#D9281E",
    margin: "0 0 0.9rem 0",
    textTransform: "uppercase",
  },

  title: {
    fontFamily: "'Fraunces', 'Georgia', serif",
    fontWeight: 700,
    fontSize: "clamp(2.4rem, 4.2vw, 4.4rem)",
    lineHeight: 1.0,
    letterSpacing: "-0.02em",
    color: "#0a0a0a",
    margin: "0 0 1.8rem 0",
    textTransform: "uppercase",
  },
  mobileTitle: {
    fontFamily: "'Fraunces', 'Georgia', serif",
    fontWeight: 700,
    fontSize: "clamp(1.9rem, 8vw, 2.6rem)",
    lineHeight: 1.0,
    letterSpacing: "-0.02em",
    color: "#0a0a0a",
    margin: "0 0 1.1rem 0",
    textTransform: "uppercase",
  },

  rule: {
    width: "100%",
    height: "1px",
    backgroundColor: "#D9281E",
    margin: "0 0 1.4rem 0",
    flexShrink: 0,
  },

  description: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 300,
    fontSize: "clamp(0.85rem, 1.2vw, 1rem)",
    lineHeight: 1.75,
    letterSpacing: "0.03em",
    color: "#3a3a3a",
    margin: "0 0 2.8rem 0",
    maxWidth: "30ch",
  },
  mobileDescription: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 300,
    fontSize: "0.9rem",
    lineHeight: 1.65,
    letterSpacing: "0.02em",
    color: "#3a3a3a",
    margin: "0 0 1.8rem 0",
  },

  buttonWrap: { marginBottom: "2rem" },

  button: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "clamp(0.75rem, 1vw, 0.9rem)",
    letterSpacing: "0.3em",
    color: "#0a0a0a",
    textDecoration: "none",
    textTransform: "uppercase",
    backgroundImage: "linear-gradient(#D9281E, #D9281E)",
    backgroundPosition: "0 100%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "0% 1px",
    transition: "background-size 0.45s cubic-bezier(0.76, 0, 0.24, 1)",
    paddingBottom: "4px",
    display: "inline-block",
    cursor: "pointer",
  },
  mobileButton: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.28em",
    color: "#0a0a0a",
    textDecoration: "none",
    textTransform: "uppercase",
    borderBottom: "1px solid #D9281E",
    paddingBottom: "5px",
    display: "inline-block",
    cursor: "pointer",
  },

  closeHint: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontSize: "0.65rem",
    letterSpacing: "0.2em",
    color: "#888",
    margin: 0,
  },
  closeBtn: {
    cursor: "pointer",
    textTransform: "uppercase",
    transition: "color 0.2s",
  },
};
