/* global React, Icon, Avatar, Modal, APPT_TYPES, WEEK0, addDays, NL_MONTHS, NL_DAYS, fmtTime, fmtRange, fmtDayLong, euro, durLabel, TODAY, makePractitioner */
// ============================================================
//  PAGE 3 — Admin  (summary, totals per practitioner, export)
// ============================================================
const { useState: useStateA, useMemo: useMemoA } = React;

function feeOf(a, rate) { return rate * a.duration / 60; }

// ---------- CSV / PDF export ----------
function buildRows(appts, rate, allUsers) {
  return appts.slice().sort((x, y) => new Date(x.start) - new Date(y.start)).map((a) => {
    const s = new Date(a.start);
    const who = allUsers.find((u) => u.id === a.practitioner);
    return {
      datum: `${String(s.getDate()).padStart(2,"0")}-${String(s.getMonth()+1).padStart(2,"0")}-${s.getFullYear()}`,
      tijd: fmtTime(s),
      behandelaar: who ? who.name : a.practitioner,
      type: APPT_TYPES[a.typeId].name,
      duur_min: a.duration,
      patient: a.patient || "",
      kamerhuur: feeOf(a, rate).toFixed(2),
    };
  });
}

function exportCSV(appts, rate, allUsers) {
  const rows = buildRows(appts, rate, allUsers);
  const head = ["Datum","Tijd","Behandelaar","Type","Duur (min)","Patiënt","Kamerhuur (€)"];
  const lines = [head.join(";")].concat(rows.map((r) => [r.datum, r.tijd, r.behandelaar, r.type, r.duur_min, r.patient, r.kamerhuur.replace(".",",")].map((c) => `"${String(c).replace(/"/g,'""')}"`).join(";")));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `afspraken_overzicht.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function exportPDF(appts, rate, totals, allUsers) {
  const rows = buildRows(appts, rate, allUsers);
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) { alert("Sta pop-ups toe om de PDF te genereren."); return; }
  const grand = appts.reduce((s, a) => s + feeOf(a, rate), 0);
  const totalRows = totals.map((t) => `<tr><td>${t.name}</td><td style="text-align:center">${t.count}</td><td style="text-align:center">${(t.minutes/60).toFixed(1)} u</td><td style="text-align:right">€ ${t.value.toFixed(2).replace(".",",")}</td></tr>`).join("");
  const detailRows = rows.map((r) => `<tr><td>${r.datum}</td><td>${r.tijd}</td><td>${r.behandelaar}</td><td>${r.type}</td><td style="text-align:center">${r.duur_min}m</td><td style="text-align:right">€ ${r.kamerhuur.replace(".",",")}</td></tr>`).join("");
  w.document.write(`<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Afsprakenoverzicht</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600&family=Mulish:wght@400;700;800&display=swap');
    *{box-sizing:border-box} body{font-family:'Mulish',sans-serif;color:#1c2422;margin:46px 50px;}
    h1{font-family:'Spectral',serif;font-size:26px;margin:0;color:#0f4a43}
    .sub{color:#76817b;font-size:13px;margin-top:4px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #185e56;padding-bottom:14px;margin-bottom:22px}
    .kpis{display:flex;gap:14px;margin-bottom:26px}
    .kpi{flex:1;border:1px solid #e4ddcd;border-radius:12px;padding:13px 15px}
    .kpi .l{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#76817b;font-weight:800}
    .kpi .v{font-family:'Spectral',serif;font-size:24px;font-weight:600;color:#0f4a43;margin-top:3px}
    h2{font-family:'Spectral',serif;font-size:17px;color:#185e56;margin:22px 0 9px}
    table{width:100%;border-collapse:collapse;font-size:12.5px}
    th{text-align:left;background:#e9f0ec;color:#0f4a43;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;padding:7px 10px}
    td{padding:7px 10px;border-bottom:1px solid #efe9da}
    tfoot td{font-weight:800;border-top:2px solid #185e56;border-bottom:0}
    .brand{font-family:'Spectral',serif;font-weight:600;color:#185e56;font-size:13px}
  </style></head><body>
  <div class="hdr"><div><div class="brand">Acupunctuur &amp; Chi Kung · Ruimteverhuur</div><h1>Afsprakenoverzicht</h1><div class="sub">Gegenereerd op ${TODAY.getDate()} ${NL_MONTHS[TODAY.getMonth()]} ${TODAY.getFullYear()} · tarief € ${rate.toFixed(2).replace(".",",")} per uur</div></div></div>
  <div class="kpis">
    <div class="kpi"><div class="l">Afspraken</div><div class="v">${appts.length}</div></div>
    <div class="kpi"><div class="l">Totaal uren</div><div class="v">${(appts.reduce((s,a)=>s+a.duration,0)/60).toFixed(1)}</div></div>
    <div class="kpi"><div class="l">Totale kamerhuur</div><div class="v">€ ${grand.toFixed(2).replace(".",",")}</div></div>
  </div>
  <h2>Per behandelaar</h2>
  <table><thead><tr><th>Behandelaar</th><th style="text-align:center">Afspraken</th><th style="text-align:center">Uren</th><th style="text-align:right">Kamerhuur</th></tr></thead>
  <tbody>${totalRows}</tbody>
  <tfoot><tr><td>Totaal</td><td style="text-align:center">${appts.length}</td><td style="text-align:center">${(appts.reduce((s,a)=>s+a.duration,0)/60).toFixed(1)} u</td><td style="text-align:right">€ ${grand.toFixed(2).replace(".",",")}</td></tr></tfoot></table>
  <h2>Alle afspraken</h2>
  <table><thead><tr><th>Datum</th><th>Tijd</th><th>Behandelaar</th><th>Type</th><th style="text-align:center">Duur</th><th style="text-align:right">Kamerhuur</th></tr></thead><tbody>${detailRows}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print();},350);}</script>
  </body></html>`);
  w.document.close();
}

// ---------- KPI ----------
function Kpi({ label, value, sub, icon }) {
  return (
    <div className="card" style={{ padding: "16px 18px", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
        <span style={{ color: "var(--green-300)" }}><Icon name={icon} size={18} /></span>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "var(--green-700)", marginTop: 6, whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ---------- Team (behandelaars) modal ----------
function TeamModal({ open, onClose, practitioners, setPractitioners, appointments, setAppointments }) {
  const [name, setName] = useStateA("");
  const [pwd, setPwd] = useStateA("");
  const [confirmId, setConfirmId] = useStateA(null);

  React.useEffect(() => { if (open) { setName(""); setPwd(""); setConfirmId(null); } }, [open]);

  function add() {
    const n = name.trim();
    if (!n || !pwd.trim()) return;
    const p = makePractitioner(n, pwd.trim(), practitioners);
    setPractitioners((list) => [...list, p]);
    setName(""); setPwd("");
  }
  function remove(id) {
    setPractitioners((list) => list.filter((p) => p.id !== id));
    setAppointments((list) => list.filter((a) => a.practitioner !== id));
    setConfirmId(null);
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">Beheer</div>
          <h2 style={{ fontSize: 22, marginTop: 6 }}>Behandelaars</h2>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 10 }}><Icon name="x" size={18} /></button>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {practitioners.length === 0 && <div className="muted" style={{ fontSize: 13.5 }}>Er zijn nog geen behandelaars.</div>}
          {practitioners.map((p) => {
            const count = appointments.filter((a) => a.practitioner === p.id).length;
            const confirming = confirmId === p.id;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 13, background: confirming ? "#f6ece6" : "var(--paper-2)", border: "1px solid " + (confirming ? "#e7c4b6" : "var(--line)") }}>
                <Avatar user={p} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.name}</div>
                  {confirming
                    ? <div style={{ fontSize: 12, color: "#b4543b", fontWeight: 700, marginTop: 1 }}>{count} afspraken worden ook verwijderd. Zeker weten?</div>
                    : <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{count} afspraken</div>}
                </div>
                {confirming ? (
                  <div style={{ display: "flex", gap: 6, flex: "none" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>Nee</button>
                    <button className="btn btn-sm" onClick={() => remove(p.id)} style={{ background: "#b4543b", color: "#fff", border: 0 }}>Verwijder</button>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(p.id)} style={{ padding: "7px 10px", color: "#b4543b", flex: "none" }}>
                    <Icon name="trash" size={15} /> Verwijder
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="hr" />

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".02em", color: "var(--ink-2)", marginBottom: 10 }}>NIEUWE BEHANDELAAR</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Naam</label>
              <input className="input" value={name} placeholder="bv. Sanne Bakker" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            </div>
            <div className="field">
              <label>Wachtwoord</label>
              <input className="input" value={pwd} placeholder="wachtwoord" onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={add} disabled={!name.trim() || !pwd.trim()} style={{ marginTop: 12 }}>
            <Icon name="userPlus" size={17} /> Behandelaar toevoegen
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", background: "var(--paper-2)" }}>
        <button className="btn btn-primary" onClick={onClose}>Klaar</button>
      </div>
    </Modal>
  );
}

// ---------- Reset-year modal ----------
function ResetModal({ open, onClose, year, appointments, blocked, onConfirm }) {
  const [text, setText] = useStateA("");
  React.useEffect(() => { if (open) setText(""); }, [open]);
  const apptCount = appointments.filter((a) => new Date(a.start).getFullYear() === year).length;
  const blockCount = (blocked || []).filter((b) => Number((b.date || "").slice(0, 4)) === year).length;
  const armed = text.trim().toUpperCase() === "RESET";

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div style={{ height: 5, background: "var(--clay)" }} />
      <div style={{ padding: "24px 26px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "var(--clay)" }}><Icon name="refresh" size={22} /></span>
          <h2 style={{ fontSize: 22 }}>Jaar {year} resetten</h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 12 }}>
          Dit verwijdert <b>{apptCount} reserveringen</b> en <b>{blockCount} blokkades</b> uit {year}. De agenda begint daarna helemaal opnieuw. <b>Deze actie kan niet ongedaan worden gemaakt.</b>
        </p>
      </div>
      <div style={{ padding: "8px 26px 4px" }}>
        <div className="field">
          <label>Typ <b>RESET</b> om te bevestigen</label>
          <input className="input" value={text} placeholder="RESET" onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <div style={{ padding: "16px 26px 22px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuleren</button>
        <button className="btn" disabled={!armed} onClick={onConfirm}
          style={{ background: armed ? "#b4543b" : "transparent", color: armed ? "#fff" : "var(--muted)", border: armed ? 0 : "1px solid var(--line)" }}>
          <Icon name="trash" size={16} /> Definitief resetten
        </button>
      </div>
    </Modal>
  );
}

function Admin({ appointments, setAppointments, blocked = [], practitioners, setPractitioners, allUsers, rate, setRate, currentUser, onReset }) {
  const [filter, setFilter] = useStateA("all"); // practitioner id or 'all'
  const [rateInput, setRateInput] = useStateA(String(rate));
  const [showTeam, setShowTeam] = useStateA(false);
  const [showReset, setShowReset] = useStateA(false);

  React.useEffect(() => setRateInput(String(rate)), [rate]);

  const appts = appointments.filter((a) => filter === "all" || a.practitioner === filter);

  const totals = useMemoA(() => practitioners.map((p) => {
    const mine = appointments.filter((a) => a.practitioner === p.id);
    return {
      id: p.id, name: p.name, hue: p.hue, user: p,
      count: mine.length,
      minutes: mine.reduce((s, a) => s + a.duration, 0),
      long: mine.filter((a) => a.typeId === "full").length,
      short: mine.filter((a) => a.typeId === "half").length,
      value: mine.reduce((s, a) => s + feeOf(a, rate), 0),
    };
  }), [appointments, rate, practitioners]);

  const grandValue = appointments.reduce((s, a) => s + feeOf(a, rate), 0);
  const grandMin = appointments.reduce((s, a) => s + a.duration, 0);
  const maxVal = Math.max(...totals.map((t) => t.value), 1);

  const rows = appts.slice().sort((x, y) => new Date(y.start) - new Date(x.start));

  function commitRate() {
    const v = Math.max(0, Math.round(parseFloat(rateInput.replace(",", ".")) || 0));
    setRate(v); setRateInput(String(v));
  }

  return (
    <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "26px 28px 48px" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <div className="eyebrow">Beheer</div>
          <h1 style={{ fontSize: 28, marginTop: 6 }}>Overzicht &amp; afrekening</h1>
          <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Alle reserveringen en de kamerhuur per behandelaar.</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => exportCSV(appts, rate, allUsers)}><Icon name="table" size={17} /> CSV</button>
          <button className="btn btn-primary" onClick={() => exportPDF(appts, rate, totals, allUsers)}><Icon name="download" size={17} /> PDF-rapport</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
        <Kpi label="Afspraken" value={appointments.length} sub="deze periode" icon="calendar" />
        <Kpi label="Totaal uren" value={(grandMin/60).toFixed(1).replace(".",",")} sub="behandeltijd" icon="clock" />
        <Kpi label="Totale kamerhuur" value={euro(grandValue)} sub="te factureren" icon="euro" />
        <Kpi label="Behandelaars" value={practitioners.length} sub="actief" icon="users" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        {/* left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* per practitioner */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 17, whiteSpace: "nowrap" }}>Kamerhuur per behandelaar</h3>
              <span className="muted" style={{ fontSize: 12.5 }}>tarief {euro(rate)}/uur</span>
            </div>
            <div style={{ padding: "8px 12px" }}>
              {totals.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 8px", borderBottom: "1px solid var(--line-2)" }}>
                  <Avatar user={t.user} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                      <span>{t.count} afspraken</span>
                      <span>{(t.minutes/60).toFixed(1).replace(".",",")} u</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span className="dot" style={{ background: "var(--green)", width: 7, height: 7 }} />{t.long}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span className="dot" style={{ background: "var(--clay)", width: 7, height: 7 }} />{t.short}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--paper-2)", borderRadius: 6, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${t.value/maxVal*100}%`, height: "100%", background: t.hue, borderRadius: 6 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, color: "var(--green-700)" }}>{euro(t.value)}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>te factureren</div>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 8px 8px" }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Totaal</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 700, color: "var(--green-700)" }}>{euro(grandValue)}</span>
              </div>
            </div>
          </div>

          {/* all appointments table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ fontSize: 17, whiteSpace: "nowrap" }}>Alle afspraken</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {[{ id: "all", label: "Iedereen" }, ...practitioners.map((p) => ({ id: p.id, label: p.name.split(" ")[0] }))].map((o) => (
                  <button key={o.id} onClick={() => setFilter(o.id)} className="btn btn-sm" style={{
                    background: filter === o.id ? "var(--green)" : "var(--paper)", color: filter === o.id ? "#f4f1e7" : "var(--ink-2)",
                    border: "1px solid " + (filter === o.id ? "var(--green)" : "var(--line)"),
                  }}>{o.label}</button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: "var(--paper-2)" }}>
                    {["Datum","Tijd","Behandelaar","Type","Duur","Kamerhuur"].map((h, i) => (
                      <th key={h} style={{ textAlign: i >= 4 ? "right" : "left", padding: "10px 16px", fontSize: 11, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => {
                    const s = new Date(a.start);
                    const who = allUsers.find((u) => u.id === a.practitioner);
                    const t = APPT_TYPES[a.typeId];
                    return (
                      <tr key={a.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                        <td style={{ padding: "11px 16px", fontWeight: 700 }}>{fmtDayLong(s).replace(/^\w/, c => c.toUpperCase())}</td>
                        <td style={{ padding: "11px 16px", color: "var(--ink-2)" }}>{fmtTime(s)}</td>
                        <td style={{ padding: "11px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: who?.hue }} />{who?.name}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}><span className={"badge " + t.badge}>{t.name}</span></td>
                        <td style={{ padding: "11px 16px", textAlign: "right", color: "var(--ink-2)" }}>{durLabel(a.duration)}</td>
                        <td style={{ padding: "11px 16px", textAlign: "right", fontWeight: 800 }}>{euro(feeOf(a, rate))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* right rail */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 88 }}>
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <span style={{ color: "var(--green-300)" }}><Icon name="settings" size={18} /></span>
              <h3 style={{ fontSize: 16, whiteSpace: "nowrap" }}>Tarief instellen</h3>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "0 0 14px", lineHeight: 1.5 }}>Kamerhuur per uur. Geldt voor beide sessietypes en herberekent alle bedragen.</p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontWeight: 800 }}>€</span>
                <input className="input" value={rateInput} onChange={(e) => setRateInput(e.target.value.replace(/[^\d.,]/g,""))}
                  onKeyDown={(e) => e.key === "Enter" && commitRate()} style={{ paddingLeft: 28, fontWeight: 800, fontSize: 17 }} />
              </div>
              <button className="btn btn-primary" onClick={commitRate}>Opslaan</button>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 12 }}>
              {[30, 35, 40, 45].map((v) => (
                <button key={v} onClick={() => { setRate(v); }} className="btn btn-sm" style={{ flex: 1, background: rate === v ? "var(--green-50)" : "var(--paper)", border: "1px solid " + (rate === v ? "var(--green-100)" : "var(--line)"), color: rate === v ? "var(--green-700)" : "var(--ink-2)" }}>€{v}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Export</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <button className="btn btn-soft" onClick={() => exportCSV(appts, rate, allUsers)} style={{ justifyContent: "flex-start", width: "100%" }}><Icon name="table" size={17} /> Download CSV (.csv)</button>
              <button className="btn btn-soft" onClick={() => exportPDF(appts, rate, totals, allUsers)} style={{ justifyContent: "flex-start", width: "100%" }}><Icon name="doc" size={17} /> Download PDF-rapport</button>
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>CSV bevat alle regels voor de boekhouding. Het PDF-rapport vat de kamerhuur per behandelaar samen.</div>
          </div>

          {/* Behandelaars beheren */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ color: "var(--green-300)" }}><Icon name="users" size={18} /></span>
                <h3 style={{ fontSize: 16, whiteSpace: "nowrap" }}>Behandelaars</h3>
              </div>
              <span className="muted" style={{ fontSize: 12.5 }}>{practitioners.length}</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "0 0 14px", lineHeight: 1.5 }}>Voeg behandelaars toe of verwijder ze. Elke behandelaar logt in met een eigen wachtwoord.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {practitioners.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 10px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                  <Avatar user={p} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{appointments.filter((a) => a.practitioner === p.id).length} afspraken</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setShowTeam(true)}>
              <Icon name="userPlus" size={17} /> Behandelaars beheren
            </button>
          </div>

          {/* Jaar resetten */}
          <div className="card" style={{ padding: "18px 20px", border: "1px solid rgba(178,116,71,.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
              <span style={{ color: "var(--clay)" }}><Icon name="refresh" size={18} /></span>
              <h3 style={{ fontSize: 16, whiteSpace: "nowrap" }}>Jaar resetten</h3>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: "0 0 14px", lineHeight: 1.5 }}>Verwijdert alle reserveringen en blokkades van <b>{TODAY.getFullYear()}</b>. De app begint daarna met een schone agenda.</p>
            <button className="btn" style={{ width: "100%", background: "#fff", color: "#b4543b", border: "1px solid #e7c4b6" }} onClick={() => setShowReset(true)}>
              <Icon name="trash" size={16} /> Reset {TODAY.getFullYear()}
            </button>
          </div>
        </aside>
      </div>

      <TeamModal open={showTeam} onClose={() => setShowTeam(false)} practitioners={practitioners} setPractitioners={setPractitioners} appointments={appointments} setAppointments={setAppointments} />
      <ResetModal open={showReset} onClose={() => setShowReset(false)} year={TODAY.getFullYear()} appointments={appointments} blocked={blocked} onConfirm={() => { onReset(); setShowReset(false); }} />
    </div>
  );
}

Object.assign(window, { Admin });
