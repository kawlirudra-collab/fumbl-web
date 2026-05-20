"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";

// ---------------------------------------------------------------------------
// TORN EDGE — inline SVG rendered once as a data URI clip reference.
// We use an SVG clipPath injected into the DOM so we can reference it by id.
// ---------------------------------------------------------------------------
function TornEdgeDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="tornEdge" clipPathUnits="objectBoundingBox">
          {/* A hand-crafted polygon that reads like a torn sheet of paper */}
          <polygon points="
            0.04,0
            1,0
            1,1
            0.04,1
            0,0.97
            0.03,0.93
            0.01,0.89
            0.05,0.84
            0.02,0.79
            0.06,0.73
            0.01,0.67
            0.04,0.61
            0.02,0.55
            0.07,0.49
            0.01,0.43
            0.05,0.37
            0.02,0.31
            0.06,0.25
            0.01,0.19
            0.04,0.13
            0.02,0.07
            0.05,0.03
          " />
        </clipPath>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ANIMATION VARIANTS
// ---------------------------------------------------------------------------

// The panel itself: slides from off-screen right with a small CW rotation,
// lands level — like a heavy page being slapped onto a desk.
const panelVariants = {
  hidden: {
    x: "110%",
    rotate: 4,
    opacity: 0,
  },
  visible: {
    x: 0,
    rotate: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 18,
      mass: 1.4,
      // Children stagger begins only after the panel has mostly landed
      delayChildren: 0.35,
      staggerChildren: 0.1,
    },
  },
  exit: {
    x: "110%",
    rotate: 3,
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 20,
      mass: 1,
    },
  },
};

// Each text child: rises from slightly below and fades in
const childVariants = {
  hidden: { y: 22, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function ProductUI() {
  const { activeProduct, setActiveProduct } = useStore();

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && activeProduct) setActiveProduct(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct, setActiveProduct]);

  return (
    <>
      {/* Inject the SVG clip-path defs (invisible, zero-size) */}
      <TornEdgeDefs />

      <style>{`
        @media (max-width: 767px) {
          .fumbl-panel {
            width: 100vw !important;
            height: 60svh !important;
            top: auto !important;
            bottom: 0 !important;
            clip-path: none !important;
            border-top: 1px solid #D9281E !important;
            padding: 3rem 6vw 4rem !important;
            justify-content: flex-start !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {activeProduct && (
          <motion.div
            key={activeProduct.id}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fumbl-panel"
            style={styles.panel}
          >
            {/* ── CATEGORY / INDEX TAG ── */}
            <motion.p variants={childVariants} style={styles.tag}>
              — {String(activeProduct.id).padStart(2, "0")} / 07
            </motion.p>

            {/* ── TITLE (2-line forced break) ── */}
            <motion.h1 variants={childVariants} style={styles.title}>
              {/* Break the name into two visual lines by splitting at the first space */}
              {splitTitle(activeProduct.name)}
            </motion.h1>

            {/* ── RED RULE ── */}
            <motion.div variants={childVariants} style={styles.rule} />

            {/* ── DESCRIPTION ── */}
            <motion.p variants={childVariants} style={styles.description}>
              {activeProduct.description}
            </motion.p>

            {/* ── PRE-ORDER BUTTON ── */}
            <motion.div variants={childVariants} style={styles.buttonWrap}>
              <PreOrderButton href={activeProduct.link} />
            </motion.div>

            {/* ── CLOSE HINT ── */}
            <motion.p variants={childVariants} style={styles.closeHint}>
              <span
                style={styles.closeBtn}
                onClick={() => setActiveProduct(null)}
              >
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
// PRE-ORDER BUTTON — raw text, crawling underline on hover
// ---------------------------------------------------------------------------
function PreOrderButton({ href }) {
  const ref = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      ref.current.style.backgroundSize = "100% 1px";
    }
  };
  const handleLeave = () => {
    if (ref.current) {
      ref.current.style.backgroundSize = "0% 1px";
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={styles.button}
    >
      PRE-ORDER →
    </a>
  );
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Splits a product name at the first space so it renders across two visual
 * lines for the editorial oversized headline effect.
 */
function splitTitle(name) {
  const idx = name.indexOf(" ");
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <br />
      {name.slice(idx + 1)}
    </>
  );
}

// ---------------------------------------------------------------------------
// STYLES (plain JS objects — no library needed)
// ---------------------------------------------------------------------------
const styles = {
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "42vw",
    height: "100vh",
    backgroundColor: "#f2ead8",   // slightly warmer than the canvas cream
    clipPath: "url(#tornEdge)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "0 6vw 0 7vw",       // extra left padding respects the torn edge
    boxSizing: "border-box",
    userSelect: "none",
    pointerEvents: "auto",        // panel itself must be clickable
    // No shadow — brutalist zero ornamentation
  },

  tag: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.25em",
    color: "#D9281E",
    margin: "0 0 1.6rem 0",
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

  rule: {
    width: "100%",
    height: "1px",
    backgroundColor: "#D9281E",
    margin: "0 0 1.8rem 0",
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

  buttonWrap: {
    marginBottom: "3rem",
  },

  button: {
    // The "crawling underline" is a gradient that grows from 0% to 100% width
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
