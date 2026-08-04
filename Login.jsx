/* global React, Avatar, TreeLogo, Wordmark, Icon, ALL_USERS, PRACTITIONERS, ADMIN */
// ============================================================
//  PAGE 1 — Login  (3 layout variations, chosen via Tweaks)
//  Account picker + password (was PIN).
// ============================================================
const { useState: useStateL } = React;

function AccountList({ users, selected, onSelect, light }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map((u) => {
        const active = selected === u.id;
        const isAdmin = u.role === "beheerder";
        return (
          <button key={u.id} onClick={() => onSelect(u.id)} style={{
            display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            padding: "11px 13px", borderRadius: 14, width: "100%",
            background: active ? (light ? "rgba(255,255,255,.16)" : "var(--green-50)") : (light ? "rgba(255,255,255,.06)" : "var(--paper)"),
            border: `1.5px solid ${active ? (light ? "rgba(255,255,255,.5)" : "var(--green-300)") : (light ? "rgba(255,255,255,.12)" : "var(--line)")}`,
            transition: "all .15s",
          }}>
            <Avatar user={u} size={38} />
            <div style={{ flex: 1, lineHeight: 1.25 }}>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: light ? "#f4f1e7" : "var(--ink)" }}>{u.name}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: light ? "rgba(244,241,231,.65)" : "var(--muted)", textTransform: "capitalize" }}>
                {isAdmin ? "Beheerder" : "Behandelaar"}
              </div>
            </div>
            {isAdmin && <span style={{ color: light ? "rgba(244,241,231,.8)" : "var(--green-300)" }}><Icon name="shield" size={17} /></span>}
            <span style={{
              width: 18, height: 18, borderRadius: "50%", flex: "none",
              border: `2px solid ${active ? (light ? "#f4f1e7" : "var(--green)") : (light ? "rgba(255,255,255,.3)" : "var(--line)")}`,
              background: active ? (light ? "#f4f1e7" : "var(--green)") : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{active && <span style={{ color: light ? "var(--green)" : "#fff", display: "flex" }}><Icon name="check" size={11} stroke={3} /></span>}</span>
          </button>
        );
      })}
    </div>
  );
}

function PasswordField({ value, onChange, onSubmit, light, err }) {
  const [show, setShow] = useStateL(false);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <span style={{ position: "absolute", left: 14, display: "flex", color: light ? "rgba(244,241,231,.7)" : "var(--green-300)", pointerEvents: "none" }}>
        <Icon name="lock" size={18} />
      </span>
      <input
        autoFocus
        type={show ? "text" : "password"}
        value={value}
        placeholder="Wachtwoord"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
        style={{
          width: "100%", height: 54, borderRadius: 14, padding: "0 48px 0 44px",
          fontSize: 16, fontWeight: 700, letterSpacing: show ? "normal" : ".18em",
          background: light ? "rgba(255,255,255,.1)" : "var(--paper)",
          border: `1.5px solid ${err ? (light ? "#ffd9c9" : "#e7b3a3") : (light ? "rgba(255,255,255,.2)" : "var(--line)")}`,
          color: light ? "#f4f1e7" : "var(--ink)", outline: "none", transition: "border-color .15s, box-shadow .15s",
        }}
        onFocus={(e) => { e.target.style.boxShadow = light ? "0 0 0 4px rgba(255,255,255,.12)" : "0 0 0 4px rgba(24,94,86,.1)"; }}
        onBlur={(e) => { e.target.style.boxShadow = "none"; }}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Verberg wachtwoord" : "Toon wachtwoord"}
        style={{ position: "absolute", right: 8, border: 0, background: "transparent", padding: 8, borderRadius: 10, cursor: "pointer", color: light ? "rgba(244,241,231,.75)" : "var(--muted)", display: "flex" }}>
        <Icon name={show ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

function LoginCore({ users, light, onLogin, title = "Welkom terug" }) {
  const [sel, setSel] = useStateL(null);
  const [pwd, setPwd] = useStateL("");
  const [err, setErr] = useStateL(false);

  const user = users.find((u) => u.id === sel);

  function submit() {
    if (!user || !pwd) return;
    if (pwd === user.password) { onLogin(user); }
    else { setErr(true); setTimeout(() => setErr(false), 600); setPwd(""); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <div className="eyebrow" style={{ color: light ? "rgba(244,241,231,.7)" : "var(--green-300)" }}>Praktijkportaal</div>
        <h1 style={{ fontSize: 30, marginTop: 8, color: light ? "#f4f1e7" : "var(--ink)" }}>{title}</h1>
        <p style={{ margin: "7px 0 0", fontSize: 14.5, color: light ? "rgba(244,241,231,.72)" : "var(--muted)", maxWidth: 330 }}>
          Kies je account en voer je wachtwoord in om de agenda en ruimteverhuur te openen.
        </p>
      </div>

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".02em", color: light ? "rgba(244,241,231,.7)" : "var(--ink-2)", marginBottom: 9 }}>ACCOUNT</div>
        <AccountList users={users} selected={sel} onSelect={(id) => { setSel(id); setPwd(""); setErr(false); }} light={light} />
      </div>

      {user && (
        <div className="rise" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: light ? "rgba(244,241,231,.7)" : "var(--ink-2)" }}>WACHTWOORD</div>
          <div style={{ animation: err ? "shake .4s" : "none" }}>
            <PasswordField value={pwd} onChange={setPwd} onSubmit={submit} light={light} err={err} />
          </div>
          {err && <div style={{ color: light ? "#ffd9c9" : "#b4543b", fontSize: 13, fontWeight: 700 }}>Onjuist wachtwoord — probeer opnieuw.</div>}
        </div>
      )}

      <button className="btn btn-primary btn-lg" disabled={!user || !pwd} onClick={submit}
        style={ light ? { background: "#f4f1e7", color: "var(--green-700)" } : {}}>
        Inloggen <Icon name="arrowR" size={18} />
      </button>

      <div style={{ fontSize: 12.5, color: light ? "rgba(244,241,231,.55)" : "var(--muted)", lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 800 }}>Demo</strong> · wachtwoorden — Louisa <b>louisa2026</b> · Martin <b>martin2026</b> · Beheer <b>beheer2026</b>
      </div>
    </div>
  );
}

function Login({ style = "split", onLogin, users = ALL_USERS }) {
  // -------- variation A: split brand panel --------
  if (style === "split") {
    return (
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 1fr" }}>
        <div style={{ position: "relative", background: "linear-gradient(160deg, var(--green-700), var(--green-800))", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "44px 48px" }}>
          <div style={{ position: "relative", zIndex: 2 }}><Wordmark light /></div>
          <img src="assets/tree-logo.png" alt="" style={{ position: "absolute", right: "-8%", bottom: "-4%", width: "86%", filter: "brightness(0) invert(1)", opacity: .14, pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 2, maxWidth: 380 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 27, fontWeight: 500, color: "#f4f1e7", lineHeight: 1.32, fontStyle: "italic" }}>
              "Een rustige, gedeelde ruimte om te behandelen — geworteld in zorg en aandacht."
            </div>
            <div style={{ marginTop: 18, fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(244,241,231,.55)" }}>
              Gedeelde praktijkruimte · Sinds 2008
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--cream)" }}>
          <div style={{ width: "100%", maxWidth: 380 }} className="rise"><LoginCore users={users} onLogin={onLogin} /></div>
        </div>
      </div>
    );
  }

  // -------- variation B: centered card on cream --------
  if (style === "centered") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, position: "relative", overflow: "hidden", background: "radial-gradient(120% 80% at 50% -10%, var(--paper) 0%, var(--cream) 60%)" }}>
        <img src="assets/tree-logo.png" alt="" style={{ position: "absolute", left: "50%", top: "54%", transform: "translate(-50%,-50%)", width: 720, opacity: .05, pointerEvents: "none" }} />
        <div className="card rise" style={{ width: "100%", maxWidth: 430, padding: "38px 40px", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", position: "relative", zIndex: 2, background: "var(--paper)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Wordmark /></div>
          <div className="hr" style={{ margin: "4px 0 24px" }} />
          <LoginCore users={users} onLogin={onLogin} />
        </div>
      </div>
    );
  }

  // -------- variation C: immersive full-bleed --------
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "flex-start", padding: "0 0 0 8vw", position: "relative", overflow: "hidden", background: "linear-gradient(120deg, var(--green-800) 0%, var(--green-700) 46%, #14534c 100%)" }}>
      <img src="assets/tree-logo.png" alt="" style={{ position: "absolute", right: "-6%", top: "50%", transform: "translateY(-50%)", height: "112%", filter: "brightness(0) invert(1)", opacity: .12, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 36, left: "8vw" }}><Wordmark light /></div>
      <div className="rise" style={{
        width: "100%", maxWidth: 400, padding: "34px 34px 30px", borderRadius: "var(--r-xl)", position: "relative", zIndex: 2,
        background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", backdropFilter: "blur(18px)", boxShadow: "0 30px 80px -30px rgba(0,0,0,.5)", marginTop: 40,
      }}>
        <LoginCore users={users} light onLogin={onLogin} />
      </div>
    </div>
  );
}

// shake keyframe
const _shk = document.createElement("style");
_shk.textContent = "@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}";
document.head.appendChild(_shk);

Object.assign(window, { Login });
