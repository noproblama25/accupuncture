/* global React */
// ============================================================
//  Shared UI: icons, logo, avatars, format helpers
// ============================================================
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Dutch date helpers ----------
const NL_DAYS = ["maandag","dinsdag","woensdag","donderdag","vrijdag","zaterdag","zondag"];
const NL_DAYS_SHORT = ["ma","di","wo","do","vr","za","zo"];
const NL_MONTHS = ["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"];

function fmtTime(d) { return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function fmtRange(start, durMin) {
  const e = new Date(start.getTime() + durMin*60000);
  return `${fmtTime(start)}–${fmtTime(e)}`;
}
function fmtDayLong(d) { return `${NL_DAYS[(d.getDay()+6)%7]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`; }
function fmtDateShort(d) { return `${d.getDate()} ${NL_MONTHS[d.getMonth()].slice(0,3)}`; }
function euro(n) { return "€ " + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function durLabel(min) { if (min < 60) return `${min} min`; const h = Math.floor(min/60), m = min%60; return m ? `${h} u ${m} min` : `${h} uur`; }

// ---------- Icons (simple line set) ----------
const ICON_PATHS = {
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  user: <><circle cx="12" cy="8" r="3.8"/><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5"/></>,
  users: <><circle cx="9" cy="8" r="3.3"/><path d="M2.5 19.5c1-3.2 3.4-4.5 6.5-4.5s5.5 1.3 6.5 4.5"/><path d="M16 5.2a3.3 3.3 0 0 1 0 6.3M17.5 15c2.4.4 3.7 1.8 4.3 4"/></>,
  logout: <><path d="M14 4.5H6.5A2.5 2.5 0 0 0 4 7v10a2.5 2.5 0 0 0 2.5 2.5H14"/><path d="M17 8.5 20.5 12 17 15.5M9.5 12h11"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <><path d="M5 12.5 10 17.5 19.5 7"/></>,
  x: <><path d="M6 6l12 12M18 6 6 18"/></>,
  chevronL: <><path d="M14.5 5 8 12l6.5 7"/></>,
  chevronR: <><path d="M9.5 5 16 12l-6.5 7"/></>,
  download: <><path d="M12 3.5v11M7.5 10 12 14.5 16.5 10"/><path d="M4.5 17.5v1A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2v-1"/></>,
  euro: <><path d="M16.5 6.5A6 6 0 1 0 16.5 18M5 10.5h7M5 13.5h6"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z"/></>,
  doc: <><path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h4"/></>,
  table: <><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9 9.5v10M3.5 14.5h17"/></>,
  leaf: <><path d="M5 19c0-8 6-13 14-13 0 8-5 14-14 13Z"/><path d="M8 16C11 13 13 11 16 9.5"/></>,
  arrowR: <><path d="M5 12h13M13 6l6 6-6 6"/></>,
  info: <><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></>,
  pencil: <><path d="M14.5 5.5 18.5 9.5M4 20l1-4L16 5a2 2 0 0 1 3 3L8 19l-4 1Z"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff: <><path d="M9.5 5.8A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.4 7.4A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a8.6 8.6 0 0 0 3.6-.77"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18"/></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></>,
  ban: <><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></>,
  trash: <><path d="M4.5 6.5h15M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5M6.5 6.5l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12"/></>,
  userPlus: <><circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c1-3.4 3.6-4.8 6.5-4.8 1 0 2 .17 2.9.5M17.5 13.5v6M14.5 16.5h6"/></>,
  refresh: <><path d="M20 11.5A8 8 0 1 0 19 16M20 5v6h-6"/></>,
};
function Icon({ name, size = 20, stroke = 1.8, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

// ---------- Brand logo ----------
function TreeLogo({ size = 40, style }) {
  return <img src="assets/tree-logo.png" alt="" width={size} height={size}
    style={{ objectFit: "contain", objectPosition: "center", display: "block", ...style }} />;
}
function Wordmark({ compact, light }) {
  const col = light ? "#f4f1e7" : "var(--green-700)";
  const sub = light ? "rgba(244,241,231,.7)" : "var(--green-300)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <TreeLogo size={compact ? 34 : 40} style={light ? { filter: "brightness(0) invert(1)" } : null} />
      <div style={{ lineHeight: 1.12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: compact ? 16.5 : 19, color: col, letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
          Acupunctuur &amp; Chi Kung
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".15em", textTransform: "uppercase", color: sub, marginTop: 2 }}>
          Ruimteverhuur
        </div>
      </div>
    </div>
  );
}

// ---------- Avatar ----------
function Avatar({ user, size = 34, ring }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flex: "none",
      background: user.hue, color: "#f4f1e7",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.36, letterSpacing: ".02em",
      boxShadow: ring ? `0 0 0 3px var(--paper), 0 0 0 4px ${user.hue}` : "none",
    }}>{user.initials}</div>
  );
}

// ---------- Modal shell ----------
function Modal({ open, onClose, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onMouseDown={onClose} style={{
      position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(18,32,28,.42)", backdropFilter: "blur(3px)", animation: "fadeIn .18s ease both", padding: 20,
    }}>
      <div onMouseDown={(e) => e.stopPropagation()} className="card" style={{
        width: "100%", maxWidth: width, boxShadow: "var(--shadow-lg)", borderRadius: "var(--r-xl)",
        animation: "riseIn .26s cubic-bezier(.2,.8,.2,1) both", overflow: "hidden",
      }}>{children}</div>
    </div>
  );
}

// ---------- Segmented control ----------
function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 999, padding: 4, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            border: 0, borderRadius: 999, padding: "7px 16px", fontSize: 13.5, fontWeight: 700,
            background: active ? "var(--green)" : "transparent",
            color: active ? "#f4f1e7" : "var(--ink-2)",
            boxShadow: active ? "var(--shadow-sm)" : "none", transition: "all .15s",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  NL_DAYS, NL_DAYS_SHORT, NL_MONTHS,
  fmtTime, fmtRange, fmtDayLong, fmtDateShort, euro, durLabel,
  Icon, TreeLogo, Wordmark, Avatar, Modal, Segmented,
});
