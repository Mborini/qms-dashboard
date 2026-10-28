'use client';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const uid = () => Math.random().toString(36).slice(2, 8);
const n = (v) => parseFloat(v) || 0;
const AREAS = ['ShafaBadran', 'AbuNsair', 'Aljubiha', 'TlaAli', 'Tareq', 'UHUD', 'Alnasir', 'Marka'];

const mkSolid = (name = '') => ({ id: uid(), name, vehicles: '', trips: '', bins: '', weight: '' });
const mkFuel = (name = '') => ({ id: uid(), name, cost: '' });
const mkQms = (name = '') => ({ id: uid(), name, total: '', resolved: '' });

const pct = (r, t) => (n(t) > 0 ? ((n(r) / n(t)) * 100).toFixed(2) + '%' : '');
const tone = (r, t) => { if (n(t) <= 0) return ''; const v = (n(r) / n(t)) * 100; return v >= 95 ? 'ok' : v >= 85 ? 'mid' : 'low'; };
const dayName = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' }) : '');
const todayStr = () => {
  const d = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const sv = (d) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const Ico = {
  img: sv(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></>),
  pdf: sv(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>),
  xls: sv(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>),
};

function In({ v, on, num, step }) {
  return (
    <input
      className={num ? 'num' : ''}
      type={num ? 'number' : 'text'}
      step={step}
      value={v}
      onChange={(e) => on(e.target.value)}
    />
  );
}

export default function Page() {
  const ref = useRef(null);
  const [date, setDate] = useState('');
  const [solid, setSolid] = useState(AREAS.map(mkSolid));
  const [fuel, setFuel] = useState([mkFuel('Waste'), mkFuel('Management')]);
  const [balance, setBalance] = useState('');
  const [qms, setQms] = useState(AREAS.map(mkQms));
  const [busy, setBusy] = useState(false);

  useEffect(() => setDate(todayStr()), []);

  const upd = (set) => (id, k, v) => set((rows) => rows.map((r) => (r.id === id ? { ...r, [k]: v } : r)));
  const del = (set) => (id) => set((rows) => rows.filter((r) => r.id !== id));
  const uS = upd(setSolid), uF = upd(setFuel), uQ = upd(setQms);

  const totalWeight = solid.reduce((s, r) => s + n(r.weight), 0);
  const totalCost = fuel.reduce((s, r) => s + n(r.cost), 0);
  const sumT = qms.reduce((s, r) => s + n(r.total), 0);
  const sumR = qms.reduce((s, r) => s + n(r.resolved), 0);
  const totalPct = pct(sumR, sumT);
  const day = dayName(date);
  const fname = `Daily-Report-${date}`;

  const save = (href, name) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  };
  const snap = () =>
    toPng(ref.current, {
      pixelRatio: 2,
      backgroundColor: '#fff',
      filter: (node) => !(node.classList && node.classList.contains('no-export')),
    });

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  const toImage = () => run(async () => save(await snap(), fname + '.png'));

  const toPdf = () =>
    run(async () => {
      const url = await snap();
      const img = new Image();
      img.src = url;
      await img.decode();
      const pdf = new jsPDF({ orientation: img.width > img.height ? 'l' : 'p', unit: 'pt', format: 'a4' });
      const W = pdf.internal.pageSize.getWidth() - 48;
      const H = pdf.internal.pageSize.getHeight() - 48;
      const k = Math.min(W / img.width, H / img.height);
      pdf.addImage(url, 'PNG', 24, 24, img.width * k, img.height * k);
      pdf.save(fname + '.pdf');
    });

  const toExcel = () => {
    const rows = [], merges = [];
    const add = (r) => { rows.push([...r, ...Array(7 - r.length).fill('')]); return rows.length - 1; };
    const m = (r1, c1, r2, c2) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

    m(add(['Command and Control Daily Summary Report']), 0, 0, 0, 6);
    add(['Day:', day, 'Date:', date]);
    m(rows.length - 1, 3, rows.length - 1, 6);

    let s = add(['Solid Waste', 'Area', 'Waste Vehicles', 'Trips', 'Bins', 'Weight', 'Total Weight']);
    solid.forEach((r, i) => add(['', r.name, n(r.vehicles), n(r.trips), n(r.bins), n(r.weight), i === 0 ? totalWeight : '']));
    m(s, 0, rows.length - 1, 0);
    if (solid.length) m(s + 1, 6, rows.length - 1, 6);

    s = add(['Fuel Consumption', 'Type', 'Cost', 'Total Cost', 'Balance']);
    fuel.forEach((r, i) => add(['', r.name, n(r.cost), i === 0 ? totalCost : '', i === 0 ? n(balance) : '']));
    m(s, 0, rows.length - 1, 0);
    if (fuel.length) { m(s + 1, 3, rows.length - 1, 3); m(s + 1, 4, rows.length - 1, 6); }

    s = add(['QMS', 'Area', 'Total', 'Resolved', 'Percentage', 'Total Percentage']);
    m(s, 5, s, 6);
    qms.forEach((r, i) => add(['', r.name, n(r.total), n(r.resolved), pct(r.resolved, r.total), i === 0 ? totalPct : '']));
    m(s, 0, rows.length - 1, 0);
    if (qms.length) m(s + 1, 5, rows.length - 1, 6);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!merges'] = merges;
    ws['!cols'] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, fname + '.xlsx');
  };

  const Name = ({ r, u, d }) => (
    <td className="name">
      <In v={r.name} on={(v) => u(r.id, 'name', v)} />
      <button className="x no-export" title="حذف" onClick={() => d(r.id)}>×</button>
    </td>
  );
  const Add = ({ label, on }) => (
    <button className="add no-export" onClick={on}>+ {label}</button>
  );

  return (
    <main dir="ltr">
      <style>{css}</style>

      <header className="top">
        <div>
          <h1>التقرير اليومي</h1>
          <p>Command and Control · {day} {date}</p>
        </div>
        <div className="bar">
          <button onClick={toImage} disabled={busy}>{Ico.img}صورة PNG</button>
          <button onClick={toPdf} disabled={busy}>{Ico.pdf}ملف PDF</button>
          <button className="xl" onClick={toExcel} disabled={busy}>{Ico.xls}ملف Excel</button>
        </div>
      </header>

      <div className="sheet" ref={ref}>
        <table>
          <tbody>
            <tr><td colSpan={7} className="title">Command and Control Daily Summary Report</td></tr>
            <tr>
              <td className="lbl">Day:</td>
              <td className="lbl">{day}</td>
              <td className="lbl">Date:</td>
              <td colSpan={4} className="center">
                <input className="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </td>
            </tr>

            {/* Solid Waste */}
            <tr className="head">
              <td rowSpan={solid.length + 1} className="sec">
                Solid Waste<br /><Add label="منطقة" on={() => setSolid([...solid, mkSolid()])} />
              </td>
              <td>Area</td><td>Waste Vehicles</td><td>Trips</td><td>Bins</td><td>Weight</td><td>Total Weight</td>
            </tr>
            {solid.map((r, i) => (
              <tr key={r.id}>
                <Name r={r} u={uS} d={del(setSolid)} />
                {['vehicles', 'trips', 'bins', 'weight'].map((k) => (
                  <td key={k}><In num v={r[k]} on={(v) => uS(r.id, k, v)} /></td>
                ))}
                {i === 0 && <td rowSpan={solid.length} className="total">{totalWeight || ''}</td>}
              </tr>
            ))}

            {/* Fuel */}
            <tr className="head">
              <td rowSpan={fuel.length + 1} className="sec">
                Fuel Consumption<br /><Add label="نوع" on={() => setFuel([...fuel, mkFuel()])} />
              </td>
              <td>Type</td><td>Cost</td><td>Total Cost</td><td colSpan={3}>Balance</td>
            </tr>
            {fuel.map((r, i) => (
              <tr key={r.id}>
                <Name r={r} u={uF} d={del(setFuel)} />
                <td><In num step="any" v={r.cost} on={(v) => uF(r.id, 'cost', v)} /></td>
                {i === 0 && <td rowSpan={fuel.length} className="total">{totalCost ? +totalCost.toFixed(3) : ''}</td>}
                {i === 0 && (
                  <td rowSpan={fuel.length} colSpan={3}><In num step="any" v={balance} on={setBalance} /></td>
                )}
              </tr>
            ))}

            {/* QMS */}
            <tr className="head">
              <td rowSpan={qms.length + 1} className="sec">
                QMS<br /><Add label="منطقة" on={() => setQms([...qms, mkQms()])} />
              </td>
              <td>Area</td><td>Total</td><td>Resolved</td><td>Percentage</td><td colSpan={2}>Total Percentage</td>
            </tr>
            {qms.map((r, i) => (
              <tr key={r.id}>
                <Name r={r} u={uQ} d={del(setQms)} />
                <td><In num v={r.total} on={(v) => uQ(r.id, 'total', v)} /></td>
                <td><In num v={r.resolved} on={(v) => uQ(r.id, 'resolved', v)} /></td>
                <td className="calc">{pct(r.resolved, r.total) && <span className={'pill ' + tone(r.resolved, r.total)}>{pct(r.resolved, r.total)}</span>}</td>
                {i === 0 && <td rowSpan={qms.length} colSpan={2} className="total">{totalPct && <span className={'pill big ' + tone(sumR, sumT)}>{totalPct}</span>}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const css = `
:root{--ink:#0f1f2e;--navy:#12344d;--teal:#0e7c7b;--line:#d3dce1;--band:#e7eef2;--tot:#e8f4f3}
body{margin:0;background:radial-gradient(1200px 400px at 50% -100px,#dbe8ee,transparent),#f1f4f6;color:var(--ink)}
main{max-width:960px;margin:0 auto;padding:28px 14px 56px;font-family:'Segoe UI',Inter,system-ui,-apple-system,Roboto,Arial,sans-serif}
.top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:18px;direction:rtl}
.top h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.01em}
.top p{margin:4px 0 0;font-size:13px;color:#5b6b78;direction:ltr;text-align:right}
.bar{display:flex;gap:8px;flex-wrap:wrap}
.bar button{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;font:600 14px 'Segoe UI',system-ui,sans-serif;border:1px solid var(--navy);border-radius:8px;background:var(--navy);color:#fff;cursor:pointer;box-shadow:0 1px 2px rgba(15,31,46,.18);transition:background .15s,transform .15s}
.bar button:hover{background:#0c2538}.bar button:active{transform:translateY(1px)}
.bar button.xl{background:var(--teal);border-color:var(--teal)}.bar button.xl:hover{background:#0b6564}
.bar button:disabled{opacity:.55;cursor:wait}
.bar button:focus-visible,.add:focus-visible,.x:focus-visible{outline:3px solid #8fd3d1;outline-offset:2px}
.sheet{background:#fff;padding:0;border-radius:12px;overflow:hidden;box-shadow:0 1px 2px rgba(15,31,46,.08),0 12px 32px -12px rgba(15,31,46,.25);border:1px solid var(--line)}
table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:14.5px;font-variant-numeric:tabular-nums}
td{border:1px solid var(--line);height:34px;padding:0 10px;vertical-align:middle;overflow:hidden}
tr:first-child td{border-top:0}td:first-child{border-left:0}td:last-child{border-right:0}
.title{background:linear-gradient(135deg,#0d2b42,#16486a);color:#fff;text-align:center;font-size:19px;font-weight:700;letter-spacing:.03em;height:58px;border:0!important}
.lbl{background:#f7fafb;font-weight:600;color:#33485a}
.center{text-align:center}
.head td{background:var(--band);color:var(--navy);font-weight:700;font-size:13px;text-align:center;letter-spacing:.02em;border-top:2px solid var(--navy)}
.sec{background:var(--navy)!important;color:#fff;text-align:center;font-weight:700;font-size:15px;line-height:1.5;border-color:#0c2538!important}
.total{text-align:center;font-weight:700;font-size:19px;background:var(--tot);color:#0a5a59}
.calc{text-align:center}
td input{width:100%;box-sizing:border-box;border:0;border-radius:4px;background:transparent;font:inherit;color:inherit;padding:5px 4px;outline:0;transition:background .12s,box-shadow .12s}
td input:hover{background:#f3f7f9}
td input:focus{background:#fff;box-shadow:inset 0 0 0 2px var(--teal)}
input.num{text-align:right;-moz-appearance:textfield}
input.num::-webkit-outer-spin-button,input.num::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
input.date{text-align:center;width:auto;font-weight:600}
.name{position:relative;padding-right:26px;font-weight:600}
.x{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:20px;height:20px;display:grid;place-items:center;border:0;border-radius:50%;background:none;color:#9aa8b2;font-size:16px;cursor:pointer;line-height:1;opacity:.6}
.x:hover{background:#fbe4e1;color:#a3261b;opacity:1}
.add{margin-top:8px;border:1px dashed rgba(255,255,255,.55);background:rgba(255,255,255,.1);color:#fff;border-radius:6px;padding:4px 10px;cursor:pointer;font:500 12.5px 'Segoe UI',system-ui,sans-serif}
.add:hover{background:rgba(255,255,255,.22)}
.pill{display:inline-block;min-width:68px;padding:3px 10px;border-radius:999px;font-weight:700;font-size:13px}
.pill.big{font-size:20px;padding:6px 18px}
.pill.ok{background:#dff3e8;color:#0b6b3b}.pill.mid{background:#fcefd0;color:#80540a}.pill.low{background:#fbe1de;color:#a3261b}
@media(max-width:640px){.sheet{overflow-x:auto}table{min-width:640px}}
`;
