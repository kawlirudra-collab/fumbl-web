"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store";

// ---------------------------------------------------------------------------
// BRAND COPY
// ---------------------------------------------------------------------------
const STORY = `fumbl.

We didn't set out to build a brand.

We set out to find an ashtray worth keeping.
Something you'd actually leave on the table
instead of hiding when company comes over.

We looked everywhere.
Gas stations. Gift shops. Design stores.
Nothing.

So we made one.
Then another.
Then seven.

Each one ugly in the right way.
Stupid in the right way.
Beautiful in the way that only happens
when nobody's trying to be beautiful.

fumbl. is for the ones who stay up too late,
burn through too many,
and still somehow show up the next morning.

Not a lifestyle.
Not a movement.
Just really good ashtrays,
made by people who care way too much
about something nobody else thinks about.

fumbl. — for the committed.`;

// ---------------------------------------------------------------------------
// TYPEWRITER HOOK — variable timing for authentic rhythm
// ---------------------------------------------------------------------------
function useTypewriter(text, active) {
  const [index, setIndex] = useState(0);

  // Reset when story closes
  useEffect(() => {
    if (!active) setIndex(0);
  }, [active]);

  // Drive the typing
  useEffect(() => {
    if (!active || index >= text.length) return;

    const char = text[index];
    const next = text[index + 1];

    let delay = 30 + Math.random() * 20; // base 30–50ms per char
    if (char === "\n" && next === "\n") delay = 450; // paragraph pause
    else if (char === "\n") delay = 160;             // line break
    else if (".,!?".includes(char))     delay = 150; // punctuation pause
    else if (char === "-")              delay = 90;
    else if (char === " ")              delay = 40;

    const t = setTimeout(() => setIndex((i) => i + 1), delay);
    return () => clearTimeout(t);
  }, [active, index, text]);

  return { displayed: text.slice(0, index), done: index >= text.length };
}

// ---------------------------------------------------------------------------
// INLINE RENDERER — highlights every "fumbl." in brand red
// ---------------------------------------------------------------------------
function TypedText({ text }) {
  const parts = text.split(/(fumbl\.)/g);
  return (
    <>
      {parts.map((part, i) =>
        part === "fumbl." ? (
          <span key={i} style={{ color: "#D9281E" }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ANIMATION
// ---------------------------------------------------------------------------
const panelVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.3,  ease: [0.22, 1, 0.36, 1] } },
};

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------
export default function StoryUI() {
  const { storyMode, setStoryMode } = useStore();
  const { displayed, done } = useTypewriter(STORY, storyMode);
  const scrollRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Keep cursor in view while typing
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayed]);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && storyMode) setStoryMode(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [storyMode, setStoryMode]);

  // Close button hover
  const handleClosEnter = () => { if (closeBtnRef.current) closeBtnRef.current.style.color = "#0a0a0a"; };
  const handleCloseLeave = () => { if (closeBtnRef.current) closeBtnRef.current.style.color = "#aaa"; };

  return (
    <>
      <style>{`
        @keyframes fumbl-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .fumbl-cursor {
          display: inline-block;
          width: 0.52em;
          height: 1.1em;
          background: #1a1a1a;
          vertical-align: text-bottom;
          margin-left: 2px;
          animation: fumbl-blink 900ms step-end infinite;
        }
        /* hide scrollbar */
        .fumbl-scroll::-webkit-scrollbar { display: none; }
        .fumbl-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 767px) {
          .fumbl-story-scroll { padding-top: 4.5rem !important; }
          .fumbl-story-close  { top: 1.2rem !important; right: 1.4rem !important; }
        }
      `}</style>

      <AnimatePresence>
        {storyMode && (
          <motion.div
            key="story-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={styles.overlay}
          >
            {/* ── CLOSE ── */}
            <button
              ref={closeBtnRef}
              className="fumbl-story-close"
              style={styles.closeBtn}
              onClick={() => setStoryMode(false)}
              onMouseEnter={handleClosEnter}
              onMouseLeave={handleCloseLeave}
            >
              ✕ &nbsp;close
            </button>

            {/* ── SCROLL AREA ── */}
            <div ref={scrollRef} className="fumbl-scroll fumbl-story-scroll" style={styles.scrollArea}>
              <div style={styles.inner}>

                {/* Index tag */}
                <p style={styles.tag}>— our story</p>

                {/* Typed text */}
                <pre style={styles.body}>
                  <TypedText text={displayed} />
                  {!done && <span className="fumbl-cursor" />}
                </pre>

                {/* Footer rule — appears only when done */}
                {done && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={styles.rule}
                  />
                )}
              </div>
            </div>
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
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "#f2ead8",
    // Subtle warm vignette — gives the "aged paper" feel without a texture file
    backgroundImage: `
      radial-gradient(ellipse 80% 60% at 50% 50%, transparent 60%, rgba(10,10,10,0.07) 100%),
      radial-gradient(ellipse at 15% 50%, rgba(217,40,30,0.04) 0%, transparent 55%)
    `,
    zIndex: 20,
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
  },

  closeBtn: {
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

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "7rem 2rem 5rem",
  },

  inner: {
    width: "100%",
    maxWidth: "50ch",
  },

  tag: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.3em",
    color: "#D9281E",
    textTransform: "uppercase",
    margin: "0 0 3rem 0",
  },

  body: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "clamp(0.88rem, 1.3vw, 1.02rem)",
    lineHeight: 2.1,
    color: "#1a1a1a",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    margin: 0,
    fontWeight: 400,
    letterSpacing: "0.015em",
  },

  rule: {
    height: "1px",
    backgroundColor: "#D9281E",
    marginTop: "3.5rem",
    transformOrigin: "left",
  },
};
