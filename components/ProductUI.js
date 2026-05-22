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
// ANIMATION VARIANTS
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
// FORM FIELD — naked input over a red rule
// ---------------------------------------------------------------------------
function FormField({ label, type = "text", value, error, onChange, isMobile }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={isMobile ? styles.mobileFieldLabel : styles.fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={isMobile ? styles.mobileFieldInput : styles.fieldInput}
        autoComplete="off"
        spellCheck="false"
      />
      <div style={{ ...styles.fieldLine, borderBottomColor: error ? "#a00" : "#D9281E" }} />
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PRE-ORDER TRIGGER BUTTON (now a button, not a link — opens form)
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
// HELPERS
// ---------------------------------------------------------------------------
function splitTitle(name) {
  const idx = name.indexOf(" ");
  if (idx === -1) return name;
  return <>{name.slice(0, idx)}<br />{name.slice(idx + 1)}</>;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function ProductUI() {
  const activeProduct  = useStore(s => s.activeProduct);
  const setActiveProduct = useStore(s => s.setActiveProduct);
  const preOrderMode   = useStore(s => s.preOrderMode);
  const setPreOrderMode = useStore(s => s.setPreOrderMode);
  const isMobile = useIsMobile();

  const closeBtnRef = useRef(null);

  const [formData,  setFormData]  = useState({ name: "", email: "", country: "" });
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Reset form state whenever a different product is selected
  useEffect(() => {
    setFormData({ name: "", email: "", country: "" });
    setErrors({});
    setSubmitted(false);
  }, [activeProduct?.id]);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && activeProduct) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setActiveProduct(null);
    setPreOrderMode(false);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const variants  = isMobile ? mobileVariants : desktopVariants;
  const panelStyle = isMobile ? styles.mobilePanel : styles.desktopPanel;

  return (
    <>
      <style>{`
        .fumbl-field-input { -webkit-tap-highlight-color: transparent; }
        .fumbl-field-input:focus { outline: none; }
        .fumbl-preorder-close:hover { color: #0a0a0a !important; }
        @media (max-width: 767px) {
          .fumbl-preorder-close { top: 1.2rem !important; right: 1.4rem !important; }
        }
      `}</style>

      <TornEdgeDefs />

      {/* ── PRE-ORDER CLOSE (top-right, replaces logo) ── */}
      <AnimatePresence>
        {preOrderMode && activeProduct && (
          <motion.button
            key="po-close"
            className="fumbl-preorder-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3, duration: 0.35 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            style={styles.preOrderCloseBtn}
            onClick={handleClose}
          >
            ✕ &nbsp;close
          </motion.button>
        )}
      </AnimatePresence>

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
            {/* Mobile drag handle */}
            {isMobile && (
              <div style={styles.dragHandle} onClick={handleClose} />
            )}

            {/* ── CONTENT — crossfades between product info and pre-order form ── */}
            <AnimatePresence mode="wait">

              {!preOrderMode ? (
                /* ── PRODUCT INFO ── */
                <motion.div
                  key="info"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.22 } }}
                  style={styles.contentBlock}
                >
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

              ) : (
                /* ── PRE-ORDER FORM ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.35, delay: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  style={styles.contentBlock}
                >
                  <AnimatePresence mode="wait">
                    {!submitted ? (

                      <motion.form
                        key="fields"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        onSubmit={handleSubmit}
                        noValidate
                        style={styles.form}
                      >
                        <p style={isMobile ? styles.mobileTag : styles.tag}>— pre-order</p>

                        <FormField
                          label="name"
                          value={formData.name}
                          error={errors.name}
                          onChange={v => handleFieldChange("name", v)}
                          isMobile={isMobile}
                        />
                        <FormField
                          label="email"
                          type="email"
                          value={formData.email}
                          error={errors.email}
                          onChange={v => handleFieldChange("email", v)}
                          isMobile={isMobile}
                        />
                        <FormField
                          label="country of residence"
                          value={formData.country}
                          error={errors.country}
                          onChange={v => handleFieldChange("country", v)}
                          isMobile={isMobile}
                        />

                        <button
                          type="submit"
                          style={isMobile ? styles.mobileSubmitBtn : styles.submitBtn}
                        >
                          commit to the fire
                        </button>
                      </motion.form>

                    ) : (

                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                        style={styles.successBlock}
                      >
                        <p style={isMobile ? styles.mobileTag : styles.tag}>— confirmed</p>
                        <h1 style={isMobile ? styles.mobileTitle : styles.title}>
                          you're<br />in.
                        </h1>
                        <div style={styles.rule} />
                        <p style={isMobile ? styles.mobileDescription : styles.description}>
                          We'll be in touch when your ashtray is ready to ship.
                          The committed always hear first.
                        </p>
                      </motion.div>

                    )}
                  </AnimatePresence>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = {
  // ── DESKTOP PANEL ────────────────────────────────────────────────────────
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

  // ── MOBILE BOTTOM SHEET ──────────────────────────────────────────────────
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

  // ── DRAG HANDLE ──────────────────────────────────────────────────────────
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

  // ── CONTENT WRAPPER ──────────────────────────────────────────────────────
  contentBlock: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },

  // ── SHARED ───────────────────────────────────────────────────────────────
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

  // PRE-ORDER trigger — button styled like the original <a>
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
    display: "inline-block",
    cursor: "pointer",
    border: "none",
    outline: "none",
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

  // ── PRE-ORDER CLOSE BUTTON (top-right, mirrors Our Story close) ──────────
  preOrderCloseBtn: {
    position: "fixed",
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
    zIndex: 21,
    padding: 0,
    pointerEvents: "auto",
  },

  // ── FORM ─────────────────────────────────────────────────────────────────
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.4rem",
  },

  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },

  fieldLabel: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.25em",
    color: "#D9281E",
    textTransform: "uppercase",
  },
  mobileFieldLabel: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.55rem",
    letterSpacing: "0.22em",
    color: "#D9281E",
    textTransform: "uppercase",
  },

  fieldInput: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.9rem",
    letterSpacing: "0.04em",
    color: "#1a1a1a",
    background: "none",
    border: "none",
    outline: "none",
    padding: "0.4rem 0",
    width: "100%",
    boxSizing: "border-box",
  },
  mobileFieldInput: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.85rem",
    letterSpacing: "0.03em",
    color: "#1a1a1a",
    background: "none",
    border: "none",
    outline: "none",
    padding: "0.3rem 0",
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
    letterSpacing: "0.25em",
    color: "#f2ead8",
    textTransform: "uppercase",
    backgroundColor: "#D9281E",
    border: "none",
    padding: "1rem 2rem",
    cursor: "pointer",
    marginTop: "0.6rem",
    display: "block",
    width: "100%",
    textAlign: "center",
    transition: "opacity 0.2s",
  },
  mobileSubmitBtn: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.22em",
    color: "#f2ead8",
    textTransform: "uppercase",
    backgroundColor: "#D9281E",
    border: "none",
    padding: "0.9rem 1.5rem",
    cursor: "pointer",
    marginTop: "0.4rem",
    display: "block",
    width: "100%",
    textAlign: "center",
  },

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  successBlock: {
    display: "flex",
    flexDirection: "column",
  },
};
