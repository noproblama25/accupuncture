/* global window */
// ============================================================
//  Mock data for the space-rental prototype  (Dutch UI)
// ============================================================

// Anchor "today" to the real current date.
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

// Practitioners + owner
const PRACTITIONERS = [
  { id: "louisa", name: "Louisa Vermeer",  role: "behandelaar", initials: "LV", color: "var(--green)",  hue: "#185e56", pin: "1111", password: "louisa2026" },
  { id: "martin", name: "Martin de Groot", role: "behandelaar", initials: "MG", color: "var(--clay)",   hue: "#b27447", pin: "2222", password: "martin2026" },
];
const ADMIN = { id: "admin", name: "Praktijkbeheer", role: "beheerder", initials: "AB", color: "var(--green-700)", hue: "#0f4a43", pin: "0000", password: "beheer2026" };
const ALL_USERS = [...PRACTITIONERS, ADMIN];

// Palette used when adding new behandelaars in Beheer
const PRACTITIONER_HUES = ["#185e56", "#b27447", "#3a6ea5", "#8a5a83", "#6b7a3a", "#a8543b", "#4a7c6e", "#9c7b3a"];
function initialsFrom(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function makePractitioner(name, password, existing) {
  const used = new Set((existing || []).map((p) => p.hue));
  const hue = PRACTITIONER_HUES.find((h) => !used.has(h)) || PRACTITIONER_HUES[(existing || []).length % PRACTITIONER_HUES.length];
  return {
    id: "p" + Date.now().toString(36),
    name: name.trim(),
    role: "behandelaar",
    initials: initialsFrom(name),
    color: hue,
    hue,
    password: password || "welkom",
  };
}

// The two appointment / rental types: half day or whole day. Rate is shared and set in admin.
const APPT_TYPES = {
  full: {
    id: "full",
    name: "Hele dag",
    sub: "De volledige dag, 09:00–19:00",
    durations: [600],
    defaultDuration: 600,
    cancelText: "Kosteloos annuleren tot 12 dagen vóór de afspraak.",
    cancelDays: 12,
    color: "var(--green)",
    hue: "#185e56",
    soft: "var(--green-50)",
    badge: "badge-green",
  },
  half: {
    id: "half",
    name: "Halve dag",
    sub: "5 uur — ochtend of middag",
    durations: [300],
    defaultDuration: 300,
    cancelText: "Kosteloos annuleren tot 24 uur vóór de afspraak.",
    cancelHours: 24,
    color: "var(--clay)",
    hue: "#b27447",
    soft: "var(--clay-50)",
    badge: "badge-clay",
  },
};

const DEFAULT_RATE = 35; // € per uur — kamerhuur (set in admin)

// Working hours shown on the calendar
const DAY_START = 9;   // 09:00
const DAY_END = 19;    // 19:00

// Helpers --------------------------------------------------
function startOfWeek(d) {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - wd);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }

const WEEK0 = startOfWeek(TODAY);

// Build a seeded appointment
let _id = 1;
function appt(dayOffset, h, m, typeId, who, note) {
  const start = addDays(WEEK0, dayOffset);
  start.setHours(h, m, 0, 0);
  const dur = APPT_TYPES[typeId].durations[0];
  return {
    id: "a" + (_id++),
    practitioner: who,
    typeId,
    start: start.toISOString(),
    duration: dur,
    patient: note?.patient || "",
  };
}

// Seeded week — one shared room, so bookings never overlap: a full day stands
// alone; two half-days on the same day are one morning + one afternoon.
const SEED_APPOINTMENTS = [
  // Monday — full day
  appt(0,  9, 0,  "full", "louisa", { patient: "Mw. Jansen" }),
  // Tuesday — morning + afternoon
  appt(1,  9, 0,  "half", "martin", { patient: "Hr. Visser" }),
  appt(1, 14, 0,  "half", "louisa", { patient: "Mw. Smit" }),
  // Wednesday — morning + afternoon
  appt(2,  9, 0,  "half", "louisa", { patient: "Hr. Mulder" }),
  appt(2, 14, 0,  "half", "martin", { patient: "Hr. Hendriks" }),
  // Thursday — full day
  appt(3,  9, 0,  "full", "martin", { patient: "Mw. van Dijk" }),
  // Friday — morning + afternoon
  appt(4,  9, 0,  "half", "louisa", { patient: "Mw. Kok" }),
  appt(4, 14, 0,  "half", "martin", { patient: "Mw. Brouwer" }),
];

Object.assign(window, {
  TODAY, PRACTITIONERS, ADMIN, ALL_USERS, APPT_TYPES, DEFAULT_RATE,
  DAY_START, DAY_END, WEEK0, SEED_APPOINTMENTS,
  PRACTITIONER_HUES, initialsFrom, makePractitioner,
  startOfWeek, addDays, ymd,
});
