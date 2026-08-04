/* global React, ReactDOM, Login, Booking, Admin, Wordmark, Avatar, Icon, ALL_USERS, PRACTITIONERS, ADMIN, SEED_APPOINTMENTS, DEFAULT_RATE, TODAY, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle */
// ============================================================
//  App shell — routing, top bar, tweaks
// ============================================================
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "loginStyle": "split",
  "green": "#185e56",
  "clay": "#b27447",
  "showNow": true
}/*EDITMODE-END*/;

function loadPractitioners() {
  try { const s = localStorage.getItem("ack_practitioners"); if (s) return JSON.parse(s); } catch (e) {}
  return PRACTITIONERS;
}

// The room is a single shared resource: drop any appointment that overlaps an
// earlier-starting one on the same day, so stale/incompatible persisted data
// (or future seed edits) can never render as visually overlapping cards.
function dropOverlaps(list) {
  const sorted = list.slice().sort((a, b) => new Date(a.start) - new Date(b.start));
  const kept = [];
  for (const a of sorted) {
    const aStart = new Date(a.start).getTime(), aEnd = aStart + a.duration * 60000;
    const clash = kept.some((k) => {
      if (new Date(k.start).toDateString() !== new Date(a.start).toDateString()) return false;
      const kStart = new Date(k.start).getTime(), kEnd = kStart + k.duration * 60000;
      return aStart < kEnd && kStart < aEnd;
    });
    if (!clash) kept.push(a);
  }
  return kept;
}

function TopBar({ user, view, setView, onLogout }) {
  const [menu, setMenu] = useState(false);
  const tabs = [{ id: "booking", label: "Agenda", icon: "calendar" }];
  if (user.role === "beheerder") tabs.push({ id: "admin", label: "Beheer", icon: "shield" });
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(251,249,243,.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "11px 28px", display: "flex", alignItems: "center", gap: 24 }}>
        <Wordmark compact />
        <nav style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {tabs.map((t) => {
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => setView(t.id)} style={{
                display: "flex", alignItems: "center", gap: 8, border: 0, borderRadius: 999, padding: "9px 16px",
                fontSize: 14, fontWeight: 700, transition: "all .15s",
                background: active ? "var(--green-50)" : "transparent", color: active ? "var(--green-700)" : "var(--ink-2)",
              }}><Icon name={t.icon} size={16} /> {t.label}</button>
            );
          })}
        </nav>
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <button onClick={() => setMenu((m) => !m)} style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--line)", background: "var(--paper)", borderRadius: 999, padding: "5px 6px 5px 13px" }}>
            <span style={{ textAlign: "right", lineHeight: 1.15 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{user.name}</span>
              <span style={{ display: "block", fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>{user.role === "beheerder" ? "Beheerder" : "Behandelaar"}</span>
            </span>
            <Avatar user={user} size={34} />
          </button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 1 }} />
              <div className="card rise" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 200, padding: 6, zIndex: 2, boxShadow: "var(--shadow-lg)", animationDuration: ".16s" }}>
                <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", border: 0, background: "transparent", padding: "10px 12px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "var(--ink-2)", textAlign: "left" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <Icon name="logout" size={17} /> Uitloggen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [practitioners, setPractitioners] = useState(loadPractitioners);
  const allUsers = React.useMemo(() => [...practitioners, ADMIN], [practitioners]);
  const [user, setUser] = useState(() => { try { const id = localStorage.getItem("ack_user"); return [...loadPractitioners(), ADMIN].find((u) => u.id === id) || null; } catch (e) { return null; } });
  const [view, setView] = useState(() => { try { return localStorage.getItem("ack_view") || "booking"; } catch (e) { return "booking"; } });
  const [appointments, setAppointments] = useState(() => {
    try {
      const s = localStorage.getItem("ack_appts_v2");
      const list = s ? JSON.parse(s) : SEED_APPOINTMENTS;
      return dropOverlaps(list);
    } catch (e) { return SEED_APPOINTMENTS; }
  });
  const [blocked, setBlocked] = useState(() => { try { const s = localStorage.getItem("ack_blocked"); return s ? JSON.parse(s) : []; } catch (e) { return []; } });
  const [rate, setRate] = useState(() => { try { return Number(localStorage.getItem("ack_rate")) || DEFAULT_RATE; } catch (e) { return DEFAULT_RATE; } });

  useEffect(() => { try { localStorage.setItem("ack_appts_v2", JSON.stringify(appointments)); } catch (e) {} }, [appointments]);
  useEffect(() => { try { localStorage.setItem("ack_blocked", JSON.stringify(blocked)); } catch (e) {} }, [blocked]);
  useEffect(() => { try { localStorage.setItem("ack_practitioners", JSON.stringify(practitioners)); } catch (e) {} }, [practitioners]);
  useEffect(() => { try { localStorage.setItem("ack_rate", String(rate)); } catch (e) {} }, [rate]);
  useEffect(() => { try { user ? localStorage.setItem("ack_user", user.id) : localStorage.removeItem("ack_user"); } catch (e) {} }, [user]);
  useEffect(() => { try { localStorage.setItem("ack_view", view); } catch (e) {} }, [view]);

  // apply theme tweaks
  useEffect(() => {
    document.documentElement.style.setProperty("--green", t.green);
    document.documentElement.style.setProperty("--clay", t.clay);
  }, [t.green, t.clay]);

  function login(u) { setUser(u); setView(u.role === "beheerder" ? "admin" : "booking"); }
  function logout() { setUser(null); }

  // Reset the whole current year — wipe all records so the app starts fresh.
  function resetYear() {
    const yr = TODAY.getFullYear();
    setAppointments((p) => p.filter((a) => new Date(a.start).getFullYear() !== yr));
    setBlocked((p) => p.filter((b) => Number((b.date || "").slice(0, 4)) !== yr));
  }

  const panel = (
    <TweaksPanel>
      <TweakSection label="Login-ontwerp" />
      <TweakRadio label="Layout" value={t.loginStyle} options={["split", "centered", "immersive"]} onChange={(v) => setTweak("loginStyle", v)} />
      <TweakSection label="Kleuren" />
      <TweakColor label="Hoofdgroen" value={t.green} options={["#185e56", "#1f6b62", "#14534c", "#216b5a"]} onChange={(v) => setTweak("green", v)} />
      <TweakColor label="Accent (korte sessie)" value={t.clay} options={["#b27447", "#a8743f", "#9c6b5a", "#86796a"]} onChange={(v) => setTweak("clay", v)} />
    </TweaksPanel>
  );

  if (!user) {
    return (<>
      <Login style={t.loginStyle} onLogin={login} users={allUsers} />
      {panel}
    </>);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <TopBar user={user} view={view} setView={setView} onLogout={logout} />
      <main key={view + user.id} className="rise" style={{ animationDuration: ".4s" }}>
        {view === "booking"
          ? <Booking appointments={appointments} setAppointments={setAppointments} blocked={blocked} setBlocked={setBlocked} practitioners={practitioners} allUsers={allUsers} rate={rate} currentUser={user} />
          : <Admin appointments={appointments} setAppointments={setAppointments} blocked={blocked} practitioners={practitioners} setPractitioners={setPractitioners} allUsers={allUsers} rate={rate} setRate={setRate} currentUser={user} onReset={resetYear} />}
      </main>
      {panel}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
