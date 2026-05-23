"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";

// ---------------------------------------------------------------------------
// TORN EDGE (desktop only)
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
// MOBILE DETECTION
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
// PANEL ANIMATION VARIANTS — unchanged from original
// ---------------------------------------------------------------------------
const desktopVariants = {
  hidden:  { x: "110%", rotate: 4, opacity: 0 },
  visible: {
    x: 0, rotate: 0, opacity: 1,
    transition: { type: "spring", stiffness: 60, damping: 18, mass: 1.4, delayChildren: 0.35, staggerChildren: 0.1 },
  },
  exit: { x: "110%", rotate: 3, opacity: 0, transition: { type: "spring", stiffness: 80, damping: 20, mass: 1 } },
};

const mobileVariants = {
  hidden:  { y: "100%", opacity: 1 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 55, damping: 20, mass: 1.2, delayChildren: 0.25, staggerChildren: 0.08 },
  },
  exit: { y: "100%", opacity: 1, transition: { type: "spring", stiffness: 70, damping: 22, mass: 1 } },
};

const childVariants = {
  hidden:  { y: 22, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

// ---------------------------------------------------------------------------
// FORM FIELD — naked input riding a red rule
// ---------------------------------------------------------------------------
function FormField({ label, type = "text", value, error, onChange }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={styles.fieldInput}
        autoComplete="off"
        spellCheck="false"
      />
      <div style={{ ...styles.fieldLine, borderBottomColor: error ? "#a00" : "#D9281E" }} />
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRE-ORDER TRIGGER (button, not link — opens full-screen overlay)
// ---------------------------------------------------------------------------
function PreOrderButton({ onClick, isMobile }) {
  const ref = useRef(null);
  const handleEnter = () => { if (ref.current) ref.current.style.backgroundSize = "100% 1px"; };
  const handleLeave = () => { if (ref.current) ref.current.style.backgroundSize = "0% 1px"; };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={isMobile ? styles.mobileButton : styles.button}
    >
      PRE-ORDER →
    </button>
  );
}

// ---------------------------------------------------------------------------
// PRE-ORDER OVERLAY
// Full-screen cinematic takeover — slides in from the right on desktop,
// rises from the bottom on mobile. Completely separate from the product
// info panel so neither component's layout bleeds into the other.
// ---------------------------------------------------------------------------
function PreOrderOverlay({ isMobile }) {
  const preOrderMode    = useStore(s => s.preOrderMode);
  const setPreOrderMode = useStore(s => s.setPreOrderMode);
  const activeProduct   = useStore(s => s.activeProduct);
  const setActiveProduct = useStore(s => s.setActiveProduct);

  const closeBtnRef = useRef(null);
  const [formData,    setFormData]    = useState({ name: "", email: "", country: "" });
  const [errors,      setErrors]      = useState({});
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState("");

  // Reset form after exit animation finishes
  useEffect(() => {
    if (!preOrderMode) {
      const t = setTimeout(() => {
        setFormData({ name: "", email: "", country: "" });
        setErrors({});
        setSubmitted(false);
        setSubmitting(false);
        setServerError("");
      }, 600);
      return () => clearTimeout(t);
    }
  }, [preOrderMode]);

  // Escape closes overlay and returns to vortex
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && preOrderMode) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preOrderMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setPreOrderMode(false);
    setActiveProduct(null);
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "valid email required";
    if (!formData.country.trim()) errs.country = "required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "something went wrong — try again");
      } else {
        setSubmitted(true);
      }
    } catch {
      setServerError("network error — try again");
    } finally {
      setSubmitting(false);
    }
  };

  // Desktop slides in from right; mobile rises from bottom.
  const overlayVariants = isMobile ? {
    hidden:  { y: "100%", opacity: 1 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50, damping: 22, mass: 1.2 } },
    exit:    { y: "100%", opacity: 1, transition: { type: "spring", stiffness: 65, damping: 22, mass: 1 } },
  } : {
    hidden:  { x: "100%", opacity: 1 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 50, damping: 22, mass: 1.2 } },
    exit:    { x: "100%", opacity: 1, transition: { type: "spring", stiffness: 65, damping: 22, mass: 1 } },
  };

  return (
    <AnimatePresence>
      {preOrderMode && activeProduct && (
        <motion.div
          key="preorder-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={styles.overlay}
        >
          {/* ── CLOSE ── */}
          <button
            ref={closeBtnRef}
            className="fumbl-po-close"
            style={styles.overlayCloseBtn}
            onClick={handleClose}
            onMouseEnter={() => { if (closeBtnRef.current) closeBtnRef.current.style.color = "#0a0a0a"; }}
            onMouseLeave={() => { if (closeBtnRef.current) closeBtnRef.current.style.color = "#aaa"; }}
          >
            ✕ &nbsp;close
          </button>

          {/* ── SCROLLABLE CONTENT ── */}
          <div className="fumbl-scroll fumbl-po-scroll" style={styles.overlayScroll}>
            <div style={styles.overlayInner}>

              <AnimatePresence mode="wait">
                {!submitted ? (

                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                    exit={{ opacity: 0, transition: { duration: 0.18 } }}
                    onSubmit={handleSubmit}
                    noValidate
                    style={styles.form}
                  >
                    <p style={styles.overlayTag}>— pre-order</p>

                    <FormField
                      label="name"
                      value={formData.name}
                      error={errors.name}
                      onChange={v => handleFieldChange("name", v)}
                    />
                    <FormField
                      label="email"
                      type="email"
                      value={formData.email}
                      error={errors.email}
                      onChange={v => handleFieldChange("email", v)}
                    />
                    <FormField
                      label="country of residence"
                      value={formData.country}
                      error={errors.country}
                      onChange={v => handleFieldChange("country", v)}
                    />

                    {serverError && (
                      <p style={styles.serverError}>{serverError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ ...styles.submitBtn, opacity: submitting ? 0.55 : 1 }}
                    >
                      {submitting ? "sending…" : "commit to the fire"}
                    </button>
                  </motion.form>

                ) : (

                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    style={styles.successBlock}
                  >
                    <p style={styles.overlayTag}>— confirmed</p>
                    <h1 style={styles.successTitle}>you're<br />in.</h1>
                    <div style={styles.rule} />
                    <p style={styles.successBody}>
                      We'll be in touch when your ashtray is ready to ship.
                      The committed always hear first.
                    </p>
                  </motion.div>

                )}
              </AnimatePresence>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
// MAIN COMPONENT
// Product info panel — structure identical to original so stagger animations
// and desktop centering are exactly preserved. PreOrderOverlay is a sibling.
// ---------------------------------------------------------------------------
export default function ProductUI() {
  const activeProduct    = useStore(s => s.activeProduct);
  const setActiveProduct = useStore(s => s.setActiveProduct);
  const setPreOrderMode  = useStore(s => s.setPreOrderMode);
  const isMobile = useIsMobile();

  const handleClose = () => {
    setActiveProduct(null);
    setPreOrderMode(false);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && activeProduct) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  const variants   = isMobile ? mobileVariants : desktopVariants;
  const panelStyle = isMobile ? styles.mobilePanel : styles.desktopPanel;

  return (
    <>
      <style>{`
        .fumbl-po-close:hover { color: #0a0a0a !important; }
        .fumbl-scroll::-webkit-scrollbar { display: none; }
        .fumbl-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .fumbl-po-scroll { padding-top: 5rem; }
        @media (max-width: 767px) {
          .fumbl-po-close { top: 1.2rem !important; right: 1.4rem !important; }
          .fumbl-po-scroll { padding-top: 4rem; }
        }
      `}</style>

      <TornEdgeDefs />

      {/* ── PRODUCT INFO PANEL — original layout, untouched ── */}
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
            {isMobile && (
              <div style={styles.dragHandle} onClick={handleClose} />
            )}

            <motion.p variants={childVariants} style={isMobile ? styles.mobileTag : styles.tag}>
              — {String(activeProduct.id).padStart(2, "0")} / 07
            </motion.p>

            <motion.h1 variants={childVariants} style={isMobile ? styles.mobileTitle : styles.title}>
              {splitTitle(activeProduct.name)}
            </motion.h1>

            <motion.div variants={childVariants} style={styles.rule} />

            <motion.p variants={childVariants} style={isMobile ? styles.mobileDescription : styles.description}>
              {activeProduct.description}
            </motion.p>

            <motion.div variants={childVariants} style={styles.buttonWrap}>
              <PreOrderButton isMobile={isMobile} onClick={() => setPreOrderMode(true)} />
            </motion.div>

            <motion.p variants={childVariants} style={styles.closeHint}>
              <span style={styles.closeBtn} onClick={handleClose}>✕ close</span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FULL-SCREEN PRE-ORDER OVERLAY — sibling, not nested ── */}
      <PreOrderOverlay isMobile={isMobile} />
    </>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = {
  // ── DESKTOP PANEL — identical to original ──────────────────────────────
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
    justifyContent: "flex-start",
    padding: "5rem 6vw 3rem 7vw",
    boxSizing: "border-box",
    userSelect: "none",
    pointerEvents: "auto",
  },

  // ── MOBILE BOTTOM SHEET ────────────────────────────────────────────────
  mobilePanel: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "44svh",
    backgroundColor: "#f2ead8",
    borderTop: "1px solid #D9281E",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: "1.6rem 7vw 2.5rem",
    boxSizing: "border-box",
    userSelect: "none",
    pointerEvents: "auto",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    borderRadius: "0",
  },

  // ── DRAG HANDLE ────────────────────────────────────────────────────────
  dragHandle: {
    width: "2.8rem",
    height: "3px",
    backgroundColor: "#D9281E",
    borderRadius: "2px",
    alignSelf: "center",
    marginBottom: "1.2rem",
    opacity: 0.4,
    cursor: "pointer",
    flexShrink: 0,
  },

  // ── SHARED PANEL TEXT ──────────────────────────────────────────────────
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
    margin: "0 0 0.8rem 0",
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
    margin: "0 0 1.6rem 0",
  },

  buttonWrap: { marginBottom: "2rem" },

  // PRE-ORDER button — button reset + underline animation on desktop
  button: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "clamp(0.75rem, 1vw, 0.9rem)",
    letterSpacing: "0.3em",
    color: "#0a0a0a",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    backgroundImage: "linear-gradient(#D9281E, #D9281E)",
    backgroundPosition: "0 100%",
    backgroundRepeat: "no-repeat",
    backgroundSize: "0% 1px",
    transition: "background-size 0.45s cubic-bezier(0.76, 0, 0.24, 1)",
    border: "none",
    outline: "none",
    display: "inline-block",
    cursor: "pointer",
    padding: "0 0 4px 0",
  },
  mobileButton: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.28em",
    color: "#0a0a0a",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "1px solid #D9281E",
    outline: "none",
    display: "inline-block",
    cursor: "pointer",
    padding: "0 0 5px 0",
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

  // ── FULL-SCREEN OVERLAY ────────────────────────────────────────────────
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#f2ead8",
    backgroundImage: `
      radial-gradient(ellipse 80% 60% at 50% 50%, transparent 60%, rgba(10,10,10,0.07) 100%),
      radial-gradient(ellipse at 15% 50%, rgba(217,40,30,0.04) 0%, transparent 55%)
    `,
    zIndex: 25,
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
  },

  overlayCloseBtn: {
    position: "absolute",
    top: "2rem",
    right: "2.5rem",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.22em",
    color: "#aaa",
    textTransform: "uppercase",
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.2s",
    zIndex: 1,
    padding: 0,
  },

  overlayScroll: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "7rem 2rem 5rem",
    boxSizing: "border-box",
  },

  overlayInner: {
    width: "100%",
    maxWidth: "46ch",
  },

  overlayTag: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.3em",
    color: "#D9281E",
    textTransform: "uppercase",
    margin: "0 0 3.5rem 0",
  },

  // ── FORM ──────────────────────────────────────────────────────────────
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },

  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },

  fieldLabel: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.58rem",
    letterSpacing: "0.25em",
    color: "#D9281E",
    textTransform: "uppercase",
  },

  fieldInput: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "clamp(0.88rem, 1.2vw, 1rem)",
    letterSpacing: "0.04em",
    color: "#1a1a1a",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    padding: "0.5rem 0",
    width: "100%",
    boxSizing: "border-box",
  },

  fieldLine: {
    height: 0,
    borderBottom: "1px solid #D9281E",
  },

  fieldError: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.52rem",
    letterSpacing: "0.15em",
    color: "#a00",
    textTransform: "uppercase",
  },

  submitBtn: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "0.75rem",
    letterSpacing: "0.28em",
    color: "#f2ead8",
    textTransform: "uppercase",
    backgroundColor: "#D9281E",
    border: "none",
    padding: "1.1rem 2rem",
    cursor: "pointer",
    marginTop: "0.8rem",
    display: "block",
    width: "100%",
    textAlign: "center",
    transition: "opacity 0.2s",
  },

  // ── SUCCESS ────────────────────────────────────────────────────────────
  successBlock: {
    display: "flex",
    flexDirection: "column",
  },

  successTitle: {
    fontFamily: "'Fraunces', 'Georgia', serif",
    fontWeight: 700,
    fontSize: "clamp(3rem, 6vw, 5.5rem)",
    lineHeight: 1.0,
    letterSpacing: "-0.02em",
    color: "#0a0a0a",
    margin: "0 0 2rem 0",
    textTransform: "uppercase",
  },

  successBody: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 300,
    fontSize: "clamp(0.85rem, 1.2vw, 1rem)",
    lineHeight: 1.75,
    letterSpacing: "0.03em",
    color: "#3a3a3a",
    margin: 0,
    maxWidth: "32ch",
  },

  serverError: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.58rem",
    letterSpacing: "0.15em",
    color: "#a00",
    textTransform: "uppercase",
    margin: "0 0 0.5rem 0",
  },
};
