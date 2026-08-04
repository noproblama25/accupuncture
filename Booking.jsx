/* global React, Icon, Avatar, Modal, Segmented, APPT_TYPES, DAY_START, DAY_END, WEEK0, addDays, startOfWeek, TODAY, ymd, NL_DAYS_SHORT, NL_MONTHS, fmtTime, fmtRange, fmtDayLong, fmtDateShort, euro, durLabel */
// ============================================================
//  PAGE 2 — Booking  (week calendar + type info + book/cancel)
// ============================================================
const { useState: useStateB, useMemo: useMemoB, useRef: useRefB } = React;

const HOUR_PX = 58;
const NOW = new Date(); // real current date/time

function startOf(a) { return new Date(a.start); }
function endOf(a) { return new Date(new Date(a.start).getTime() + a.duration * 60000); }

// cancellation status for an appointment given its type policy
function cancelStatus(a) {
  const t = APPT_TYPES[a.typeId];
  const start = startOf(a);
  const limitMs = (t.cancelHours ? t.cancelHours * 3600 : t.cancelDays * 86400) * 1000;
  const deadline = new Date(start.getTime() - limitMs);
  const past = start < NOW;
  const allowed = !past && NOW < deadline;
  return { allowed, deadline, past, t };
}

// ---------- Type info card ----------
function TypeCard({ t, rate }) {
  const dur = t.durations[0];
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--paper)" }}>
      <div style={{ height: 4, background: t.color }} />
      <div style={{ padding: "15px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
          <span className="dot" style={{ background: t.color, width: 10, height: 10 }} />
          <h4 style={{ fontSize: 16.5 }}>{t.name}</h4>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 13 }}>{t.sub}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: "var(--paper-2)", borderRadius: 10, padding: "9px 11px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase" }}>Duur</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 2 }}>{durLabel(dur)}</div>
          </div>
          <div style={{ flex: 1, background: "var(--paper-2)", borderRadius: 10, padding: "9px 11px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase" }}>Kamerhuur</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, marginTop: 2 }}>{euro(rate * dur/60)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>
          <span style={{ color: t.color, marginTop: 1, flex: "none" }}><Icon name="shield" size={15} /></span>
          <span>{t.cancelText}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Booking modal ----------
function BookModal({ open, onClose, slot, onConfirm, rate, user, blockedSet }) {
  const [typeId, setTypeId] = useStateB("full");
  const [dayPart, setDayPart] = useStateB("morning");
  const [date, setDate] = useStateB("");
  const [patient, setPatient] = useStateB("");
  const [recurring, setRecurring] = useStateB(false);
  const [to, setTo] = useStateB("");
  const [recurUntil, setRecurUntil] = useStateB("");

  React.useEffect(() => {
    if (open && slot) {
      setTypeId("full"); setDayPart("morning"); setDate(slot.date || ymd(TODAY)); setTo(slot.date || ymd(TODAY));
      setPatient(""); setRecurring(false); setRecurUntil("");
    }
  }, [open, slot]);

  if (!slot) return null;
  const t = APPT_TYPES[typeId];
  const dur = t.durations[0];
  const fee = rate * dur / 60;
  const hh = typeId === "full" ? 9 : (dayPart === "morning" ? 9 : 14);
  const day = new Date((date || slot.date) + "T00:00:00");
  const start = new Date(day); start.setHours(hh, 0, 0, 0);
  const a = { typeId, start: start.toISOString(), duration: dur };
  const cs = cancelStatus(a);
  const dayBlocked = blockedSet && blockedSet.has(date);
  const isRange = to && to > date;
  const recurValid = !recurring || isRange || (recurUntil && recurUntil >= date);

  return (
    <Modal open={open} onClose={onClose} width={500}>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">Ruimte reserveren</div>
          <h2 style={{ fontSize: 22, marginTop: 6 }}>{isRange ? `${fmtDayLong(day)} – ${fmtDayLong(new Date(to + "T00:00:00"))}` : fmtDayLong(day)}</h2>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 10 }}><Icon name="x" size={18} /></button>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        {dayBlocked && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(178,116,71,.1)", border: "1px solid rgba(178,116,71,.3)", borderRadius: 12, padding: "11px 13px", fontSize: 13, color: "var(--clay)", fontWeight: 700 }}>
            <Icon name="ban" size={17} /> Deze dag is geblokkeerd voor verhuur — reserveren is niet mogelijk.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Van</label>
            <input type="date" className="input" value={date} onChange={(e) => { const v = e.target.value; if (to === date) setTo(v); setDate(v); }} />
          </div>
          <div className="field">
            <label>Tot <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optioneel — meerdere dagen)</span></label>
            <input type="date" className="input" value={to} min={date} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Type sessie</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {Object.values(APPT_TYPES).map((tp) => {
              const active = tp.id === typeId;
              return (
                <button key={tp.id} onClick={() => setTypeId(tp.id)} style={{
                  textAlign: "left", padding: "12px 13px", borderRadius: 13, background: active ? tp.soft : "var(--paper)",
                  border: `1.5px solid ${active ? tp.color : "var(--line)"}`, transition: "all .15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span className="dot" style={{ background: tp.color }} />
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{tp.name}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>{durLabel(tp.durations[0])}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <label>Tijd</label>
          {typeId === "full" ? (
            <div style={{ background: "var(--paper-2)", borderRadius: 12, padding: "11px 13px", fontSize: 14, fontWeight: 700, color: "var(--ink-2)" }}>09:00–19:00 · volledige dag</div>
          ) : (
            <Segmented value={dayPart} onChange={setDayPart} options={[
              { value: "morning", label: "Ochtend · 09:00–14:00" },
              { value: "afternoon", label: "Middag · 14:00–19:00" },
            ]} />
          )}
        </div>

        <div className="field">
          <label>Patiënt / notitie <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optioneel)</span></label>
          <input className="input" value={patient} placeholder="bv. Mw. Jansen" onChange={(e) => setPatient(e.target.value)} />
        </div>

        <div style={{ background: "var(--paper-2)", borderRadius: 14, padding: "13px 15px", display: "flex", flexDirection: "column", gap: 10, opacity: isRange ? .45 : 1, pointerEvents: isRange ? "none" : "auto" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={recurring} disabled={isRange} onChange={(e) => setRecurring(e.target.checked)} style={{ width: 17, height: 17 }} />
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 13.5 }}><Icon name="refresh" size={15} /> Wekelijks herhalen</span>
          </label>
          {recurring && !isRange && (
            <div className="field" style={{ marginLeft: 27 }}>
              <label>Tot en met</label>
              <input type="date" className="input" value={recurUntil} min={date} onChange={(e) => setRecurUntil(e.target.value)} />
            </div>
          )}
          {isRange && <div style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 27 }}>Niet beschikbaar bij een periode van meerdere dagen.</div>}
        </div>

        {/* summary */}
        <div style={{ background: "var(--paper-2)", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span className="muted">Tijd</span><b>{fmtRange(start, dur)} · {durLabel(dur)}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span className="muted">Behandelaar</span><b>{user.name}</b>
          </div>
          <div className="hr" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 800 }}>Kamerhuur {(isRange || (recurring && recurUntil)) ? "per dag" : ""}</span>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22, color: "var(--green-700)" }}>{euro(fee)}</span>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
            <span style={{ color: t.color, flex: "none", marginTop: 1 }}><Icon name="shield" size={14} /></span>
            <span>{t.cancelText} {cs.allowed ? "" : <em>(annuleren niet meer mogelijk vanaf deze tijd)</em>}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 10, background: "var(--paper-2)" }}>
        <button className="btn btn-ghost" onClick={onClose}>Annuleren</button>
        <button className="btn btn-primary" disabled={dayBlocked || !date || !recurValid}
          onClick={() => onConfirm({ typeId, start: start.toISOString(), duration: dur, patient, practitioner: user.id, to: isRange ? to : "", recurring: !isRange && recurring, recurUntil })}>
          <Icon name="check" size={17} /> Bevestig reservering
        </button>
      </div>
    </Modal>
  );
}

// ---------- Appointment detail modal ----------
function DetailModal({ open, onClose, appt, onCancel, rate, currentUser, allUsers }) {
  if (!appt) return null;
  const t = APPT_TYPES[appt.typeId];
  const who = allUsers.find((u) => u.id === appt.practitioner);
  const start = startOf(appt);
  const cs = cancelStatus(appt);
  const fee = rate * appt.duration / 60;
  const mine = appt.practitioner === currentUser.id || currentUser.role === "beheerder";

  return (
    <Modal open={open} onClose={onClose} width={430}>
      <div style={{ height: 5, background: t.color }} />
      <div style={{ padding: "22px 24px 8px" }}>
        <span className={"badge " + t.badge}><span className="dot" style={{ background: t.color }} />{t.name}</span>
        <h2 style={{ fontSize: 22, marginTop: 12 }}>{appt.patient || "Gereserveerd"}</h2>
        <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{fmtDayLong(start)}</div>
      </div>
      <div style={{ padding: "10px 24px 4px", display: "flex", flexDirection: "column", gap: 11 }}>
        {[["clock", `${fmtRange(start, appt.duration)} · ${durLabel(appt.duration)}`],
          ["user", who ? who.name : "—"],
          ["euro", `Kamerhuur ${euro(fee)}`],
          ...(appt.to ? [["calendar", `Elke dag geboekt t/m ${appt.to}`]] : []),
          ...(appt.recurring && appt.recurUntil ? [["refresh", `Wekelijks herhaald tot ${appt.recurUntil}`]] : [])].map(([ic, tx], i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "center", fontSize: 14.5 }}>
            <span style={{ color: "var(--green-300)" }}><Icon name={ic} size={18} /></span><span>{tx}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", fontSize: 13, color: "var(--ink-2)", background: cs.allowed ? "var(--green-50)" : "#f6ece6", borderRadius: 12, padding: "11px 13px", marginTop: 4 }}>
          <span style={{ color: cs.allowed ? "var(--green)" : "var(--clay)", flex: "none", marginTop: 1 }}><Icon name="shield" size={16} /></span>
          <span>
            {t.cancelText}<br />
            {cs.past ? <b>Deze afspraak is al geweest.</b>
              : cs.allowed ? <>Annuleren kan nog tot <b>{fmtDayLong(cs.deadline)}, {fmtTime(cs.deadline)}</b>.</>
              : <b>De annuleringstermijn is verstreken.</b>}
          </span>
        </div>
      </div>
      <div style={{ padding: "18px 24px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost" onClick={onClose}>Sluiten</button>
        {mine && !cs.past && (
          <button className="btn" disabled={!cs.allowed}
            onClick={() => { onCancel(appt.id); onClose(); }}
            style={{ background: cs.allowed ? "#fff" : "transparent", color: cs.allowed ? "#b4543b" : "var(--muted)", border: "1px solid " + (cs.allowed ? "#e7c4b6" : "var(--line)") }}>
            Afspraak annuleren
          </button>
        )}
      </div>
    </Modal>
  );
}

// ---------- Block-days modal ----------
function BlockModal({ open, onClose, blocked, setBlocked, currentUser }) {
  const [from, setFrom] = useStateB("");
  const [to, setTo] = useStateB("");
  const [reason, setReason] = useStateB("");

  React.useEffect(() => { if (open) { const f = ymd(TODAY); setFrom(f); setTo(ymd(addDays(TODAY, 6))); setReason(""); } }, [open]);

  const blockedSet = new Set(blocked.map((b) => b.date));
  const sorted = blocked.slice().sort((a, b) => a.date.localeCompare(b.date));

  function addBlock() {
    if (!from) return;
    const start = new Date(from + "T00:00:00");
    const end = to ? new Date(to + "T00:00:00") : start;
    if (end < start) return;
    const adds = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = ymd(d);
      if (!blockedSet.has(key) && !adds.find((x) => x.date === key)) {
        adds.push({ date: key, reason: reason.trim(), by: currentUser.id });
      }
    }
    if (adds.length) setBlocked((p) => [...p, ...adds]);
    const nf = ymd(TODAY);
    setFrom(nf); setTo(ymd(addDays(TODAY, 6))); setReason("");
  }
  function remove(date) { setBlocked((p) => p.filter((b) => b.date !== date)); }

  function labelFor(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return fmtDayLong(d).replace(/^\w/, (c) => c.toUpperCase()) + " " + d.getFullYear();
  }

  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div style={{ padding: "22px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">Beschikbaarheid</div>
          <h2 style={{ fontSize: 22, marginTop: 6 }}>Dagen blokkeren</h2>
          <p className="muted" style={{ fontSize: 13, margin: "6px 0 0", maxWidth: 360, lineHeight: 1.5 }}>
            Geblokkeerde dagen kunnen niet gereserveerd worden — bv. vakantie, schoonmaak of onderhoud.
          </p>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 10 }}><Icon name="x" size={18} /></button>
      </div>

      <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Van</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>Tot</label>
            <input type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Reden <span style={{ fontWeight: 500, color: "var(--muted)" }}>(optioneel)</span></label>
          <input className="input" value={reason} placeholder="bv. Vakantie, onderhoud…" onChange={(e) => setReason(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={addBlock} disabled={!from} style={{ alignSelf: "flex-start" }}>
          <Icon name="ban" size={17} /> Dag(en) blokkeren
        </button>

        <div className="hr" />

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".02em", color: "var(--ink-2)", marginBottom: 10 }}>
            GEBLOKKEERDE DAGEN <span style={{ color: "var(--muted)", fontWeight: 700 }}>· {sorted.length}</span>
          </div>
          {sorted.length === 0 ? (
            <div className="muted" style={{ fontSize: 13.5, padding: "10px 0" }}>Er zijn nog geen geblokkeerde dagen.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
              {sorted.map((b) => (
                <div key={b.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "var(--paper-2)", border: "1px solid var(--line)" }}>
                  <span style={{ color: "var(--clay)", flex: "none", display: "flex" }}><Icon name="ban" size={17} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13.5 }}>{labelFor(b.date)}</div>
                    {b.reason && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{b.reason}</div>}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(b.date)} style={{ padding: "6px 10px", color: "#b4543b" }}>
                    <Icon name="trash" size={15} /> Vrijgeven
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", background: "var(--paper-2)" }}>
        <button className="btn btn-primary" onClick={onClose}>Klaar</button>
      </div>
    </Modal>
  );
}

// ---------- The week calendar ----------
function Booking({ appointments, setAppointments, blocked = [], setBlocked, practitioners, allUsers, rate, currentUser }) {
  const [weekOff, setWeekOff] = useStateB(0);
  const [filterMine, setFilterMine] = useStateB(false);
  const [bookSlot, setBookSlot] = useStateB(null);
  const [detail, setDetail] = useStateB(null);
  const [showBlock, setShowBlock] = useStateB(false);
  const gridRef = useRefB(null);

  const blockedSet = useMemoB(() => new Set(blocked.map((b) => b.date)), [blocked]);
  function blockInfo(d) { return blocked.find((b) => b.date === ymd(d)); }

  const weekStart = addDays(WEEK0, weekOff * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i);

  const visible = appointments.filter((a) => {
    const d = startOf(a);
    return d >= weekStart && d < addDays(weekStart, 7) && (!filterMine || a.practitioner === currentUser.id);
  });

  function openBookingFor(dayIdx) {
    const day = addDays(weekStart, dayIdx);
    if (blockedSet.has(ymd(day))) return;
    setBookSlot({ date: ymd(day) });
  }

  function confirm(data) {
    const { recurring, recurUntil, to, ...base } = data;
    const startDate = new Date(base.start);
    let list = [];
    if (to) {
      const end = new Date(to + "T23:59:59");
      let d = new Date(startDate), i = 0;
      while (d <= end) {
        list.push({ ...base, start: d.toISOString(), id: "u" + Date.now() + "_" + (i++), to });
        d = addDays(d, 1);
      }
    } else if (recurring && recurUntil) {
      const end = new Date(recurUntil + "T23:59:59");
      let d = new Date(startDate), i = 0;
      while (d <= end) {
        list.push({ ...base, start: d.toISOString(), id: "u" + Date.now() + "_" + (i++), recurring: true, recurUntil });
        d = addDays(d, 7);
      }
    } else {
      list.push({ ...base, id: "u" + Date.now() });
    }
    list = list.filter((a) => !blockedSet.has(ymd(new Date(a.start))));
    // the room is a single shared resource — reject any occurrence that would
    // overlap an existing booking on the same day
    list = list.filter((a) => {
      const aStart = new Date(a.start).getTime(), aEnd = aStart + a.duration * 60000;
      return !appointments.some((k) => {
        if (new Date(k.start).toDateString() !== new Date(a.start).toDateString()) return false;
        const kStart = new Date(k.start).getTime(), kEnd = kStart + k.duration * 60000;
        return aStart < kEnd && kStart < aEnd;
      });
    });
    if (list.length) setAppointments((p) => [...p, ...list]);
    setBookSlot(null);
  }
  function cancel(id) { setAppointments((p) => p.filter((a) => a.id !== id)); }

  const todayIdx = days.findIndex((d) => d.toDateString() === TODAY.toDateString());
  const weekLabel = `${weekStart.getDate()} ${NL_MONTHS[weekStart.getMonth()].slice(0,3)} – ${addDays(weekStart,6).getDate()} ${NL_MONTHS[addDays(weekStart,6).getMonth()].slice(0,3)} ${addDays(weekStart,6).getFullYear()}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 24, alignItems: "start", maxWidth: "var(--maxw)", margin: "0 auto", padding: "26px 28px 40px" }}>
      {/* main */}
      <div>
        {/* today chip — stays visible while the page scrolls */}
        <div style={{ position: "sticky", top: 64, zIndex: 30, display: "inline-flex", alignItems: "center", gap: 10, background: "var(--today)", color: "#fff", padding: "10px 20px", borderRadius: 999, fontWeight: 800, fontSize: 18, marginBottom: 14, boxShadow: "var(--shadow-sm)" }}>
          <Icon name="calendar" size={20} /> Vandaag · {TODAY.getDate()} {NL_MONTHS[TODAY.getMonth()]} {TODAY.getFullYear()}
        </div>

        {/* toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, whiteSpace: "nowrap" }}>Agenda &amp; ruimteverhuur</h1>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 3 }}>Reserveer de behandelruimte voor jouw afspraken.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setFilterMine((v) => !v)}
              style={filterMine ? { background: "var(--green-50)", borderColor: "var(--green-100)", color: "var(--green-700)" } : {}}>
              <Icon name="user" size={15} /> {filterMine ? "Alleen ik" : "Iedereen"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 999, padding: 3 }}>
              <button className="btn btn-ghost btn-sm" style={{ border: 0, padding: 7, opacity: weekOff <= 0 ? .35 : 1 }} disabled={weekOff <= 0} onClick={() => setWeekOff((w) => Math.max(0, w - 1))} title={weekOff <= 0 ? "Historische weken zijn niet beschikbaar" : "Vorige week"}><Icon name="chevronL" size={16} /></button>
              <button className="btn btn-ghost btn-sm" style={{ border: 0, padding: "7px 10px", fontWeight: 700 }} onClick={() => setWeekOff(0)}>Vandaag</button>
              <button className="btn btn-ghost btn-sm" style={{ border: 0, padding: 7 }} onClick={() => setWeekOff((w) => w + 1)}><Icon name="chevronR" size={16} /></button>
            </div>
          </div>
        </div>

        <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--green-700)", marginBottom: 12 }}>{weekLabel}</div>

        {/* calendar card */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          {/* day header row */}
          <div style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", borderBottom: "1px solid var(--line)", background: "var(--paper)" }}>
            <div />
            {days.map((d, i) => {
              const isToday = i === todayIdx;
              const blk = blockInfo(d);
              return (
                <div key={i} onClick={() => openBookingFor(i)} title={blk ? undefined : "Klik om een reservering te maken"} style={{ padding: "11px 6px", textAlign: "center", borderLeft: "1px solid var(--line-2)", cursor: blk ? "not-allowed" : "pointer", background: blk ? "rgba(178,116,71,.08)" : isToday ? "var(--today-50)" : "transparent", borderBottom: isToday ? "4px solid #000" : "2px solid transparent", boxShadow: isToday ? "inset 0 0 0 3px #000" : "none" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: blk ? "var(--clay)" : isToday ? "var(--today)" : "var(--muted)" }}>{NL_DAYS_SHORT[i]}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: blk ? "var(--clay)" : isToday ? "var(--today)" : "var(--ink)", marginTop: 2 }}>{d.getDate()}</div>
                  {blk && <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, color: "var(--clay)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}><Icon name="ban" size={11} /> Geblok.</div>}
                  {isToday && !blk && <div style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3, color: "var(--today)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase" }}>Vandaag</div>}
                </div>
              );
            })}
          </div>

          {/* grid body */}
          <div ref={gridRef} style={{ display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)", position: "relative", maxHeight: 620, overflowY: "auto" }}>
            {/* time gutter */}
            <div style={{ borderRight: "1px solid var(--line-2)" }}>
              {hours.map((h) => (
                <div key={h} style={{ height: HOUR_PX, position: "relative" }}>
                  <span style={{ position: "absolute", top: -8, right: 8, fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{String(h).padStart(2,"0")}:00</span>
                </div>
              ))}
            </div>
            {/* day columns */}
            {days.map((d, dayIdx) => {
              const isToday = dayIdx === todayIdx;
              const blk = blockInfo(d);
              const dayAppts = visible.filter((a) => startOf(a).toDateString() === d.toDateString());
              return (
                <div key={dayIdx} onClick={() => openBookingFor(dayIdx)} style={{
                  position: "relative", borderLeft: "1px solid var(--line-2)", cursor: blk ? "not-allowed" : "pointer",
                  background: blk ? "transparent" : isToday ? "var(--today-50)" : "transparent",
                  boxShadow: isToday && !blk ? "inset 3px 0 0 #000, inset -3px 0 0 #000" : "none",
                }}>
                  {/* hour lines */}
                  {hours.map((h) => <div key={h} style={{ height: HOUR_PX, borderBottom: "1px solid var(--line-2)" }} />)}
                  {/* sticky "vandaag" tag, stays visible while scrolling the grid */}
                  {isToday && !blk && (
                    <div style={{ position: "sticky", top: 6, zIndex: 4, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ background: "var(--today)", color: "#fff", fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999, boxShadow: "var(--shadow-sm)" }}>Vandaag</span>
                    </div>
                  )}
                  {/* blocked overlay */}
                  {blk && (
                    <div style={{
                      position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
                      background: "repeating-linear-gradient(135deg, rgba(178,116,71,.10) 0 10px, rgba(178,116,71,.04) 10px 20px)",
                      borderTop: "2px solid rgba(178,116,71,.3)",
                    }}>
                      <div style={{ position: "sticky", top: 8, display: "flex", justifyContent: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--clay)", color: "#f4f1e7", fontSize: 10.5, fontWeight: 800, letterSpacing: ".04em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 999, boxShadow: "var(--shadow-sm)" }}>
                          <Icon name="ban" size={12} /> Geblokkeerd
                        </span>
                      </div>
                      {blk.reason && <div style={{ position: "absolute", top: 38, left: 6, right: 6, textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--clay)" }}>{blk.reason}</div>}
                    </div>
                  )}
                  {/* now line */}
                  {isToday && (() => { const mins = NOW.getHours()*60 + NOW.getMinutes() - DAY_START*60; if (mins < 0) return null; const top = mins/60*HOUR_PX; return (
                    <div style={{ position: "absolute", left: 0, right: 0, top, height: 2, background: "#c0563a", zIndex: 5, pointerEvents: "none" }}>
                      <span style={{ position: "absolute", left: -4, top: -3, width: 8, height: 8, borderRadius: "50%", background: "#c0563a" }} />
                    </div>); })()}
                  {/* appointments */}
                  {dayAppts.map((a) => {
                    const s = startOf(a);
                    const top = ((s.getHours()*60 + s.getMinutes()) - DAY_START*60) / 60 * HOUR_PX;
                    const h = a.duration / 60 * HOUR_PX;
                    const t = APPT_TYPES[a.typeId];
                    const who = allUsers.find((u) => u.id === a.practitioner);
                    const mine = a.practitioner === currentUser.id;
                    return (
                      <div key={a.id} onClick={(e) => { e.stopPropagation(); setDetail(a); }} style={{
                        position: "absolute", left: 4, right: 4, top: top + 1, height: Math.max(h - 3, 22),
                        background: t.soft, borderLeft: `3px solid ${t.color}`, borderRadius: 8,
                        padding: "5px 8px", overflow: "hidden", cursor: "pointer", zIndex: 3,
                        boxShadow: mine ? `0 0 0 1.5px ${t.color}55, var(--shadow-sm)` : "var(--shadow-sm)",
                        opacity: filterMine || mine || currentUser.role === "beheerder" ? 1 : (mine ? 1 : .92),
                        transition: "transform .1s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.012)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 800, color: t.color === "var(--clay)" ? "var(--clay)" : "var(--green-700)" }}>
                          {fmtTime(s)}
                          {(a.recurring || a.to) && <Icon name="refresh" size={11} />}
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: who?.hue, marginLeft: "auto" }} title={who?.name} />
                        </div>
                        {h > 34 && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.patient || t.name}</div>}
                        {h > 52 && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{who?.name.split(" ")[0]} · {durLabel(a.duration)}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 18, marginTop: 14, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span className="dot" style={{ background: "var(--green)" }} /> Hele dag</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span className="dot" style={{ background: "var(--clay)" }} /> Halve dag</span>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            {practitioners.map((p) => <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 9, height: 9, borderRadius: "50%", background: p.hue }} /> {p.name.split(" ")[0]}</span>)}
          </span>
        </div>
      </div>

      {/* right rail */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 88 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => setBookSlot({ date: ymd(TODAY) })}>
            <Icon name="plus" size={18} /> Nieuwe reservering
          </button>
          {currentUser.role === "beheerder" && (
            <button className="btn btn-lg" onClick={() => setShowBlock(true)} title="Dagen blokkeren voor verhuur"
              style={{ flex: "none", background: "var(--paper)", border: "1px solid var(--line)", color: "var(--clay)", padding: "0 16px" }}>
              <Icon name="ban" size={18} /> Block
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 2px" }}>
          <div className="eyebrow">Tarieven &amp; voorwaarden</div>
        </div>
        <div style={{ background: "var(--green)", borderRadius: 16, padding: "16px 18px", color: "#f4f1e7", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(244,241,231,.7)" }}>Kamerhuur per uur</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, marginTop: 2 }}>{euro(rate)}</div>
          </div>
          <span style={{ opacity: .5 }}><Icon name="leaf" size={30} /></span>
        </div>

        <TypeCard t={APPT_TYPES.full} rate={rate} />
        <TypeCard t={APPT_TYPES.half} rate={rate} />

        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, padding: "0 2px" }}>
          Tarief geldt voor beide sessietypes en wordt beheerd door de praktijk. Kamerhuur = tarief × duur.
        </div>
      </aside>

      <BookModal open={!!bookSlot} slot={bookSlot} onClose={() => setBookSlot(null)} onConfirm={confirm} rate={rate} user={currentUser} blockedSet={blockedSet} />
      <DetailModal open={!!detail} appt={detail} onClose={() => setDetail(null)} onCancel={cancel} rate={rate} currentUser={currentUser} allUsers={allUsers} />
      <BlockModal open={showBlock} onClose={() => setShowBlock(false)} blocked={blocked} setBlocked={setBlocked} currentUser={currentUser} />
    </div>
  );
}

Object.assign(window, { Booking });
