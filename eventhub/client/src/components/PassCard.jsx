import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { fmtDate } from '../api';

const fit = (ctx, text, max) => {
  if (ctx.measureText(text).width <= max) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > max) text = text.slice(0, -1);
  return text + '…';
};

async function renderPass(p) {
  const qr = await QRCode.toDataURL(p.pass_token, { width: 420, margin: 1, errorCorrectionLevel: 'M' });
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = qr; });
  const c = document.createElement('canvas');
  c.width = 800; c.height = 500;
  const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 800, 500);
  const g = x.createLinearGradient(0, 0, 800, 0);
  g.addColorStop(0, '#4f46e5'); g.addColorStop(1, '#7c3aed');
  x.fillStyle = g; x.fillRect(0, 0, 800, 84);
  x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.fillText('EventHub  •  Entry Pass', 32, 54);
  const row = (label, value, y, big) => {
    x.fillStyle = '#64748b'; x.font = 'bold 14px sans-serif'; x.fillText(label.toUpperCase(), 32, y);
    x.fillStyle = '#0f172a'; x.font = `bold ${big ? 28 : 20}px sans-serif`; x.fillText(fit(x, value, 370), 32, y + (big ? 34 : 28));
  };
  row('Event', p.title, 130, true);
  row(p.type === 'team' ? 'Team' : 'Participant', p.holder, 210);
  row('Date & time', fmtDate(p.date_time), 285);
  row('Venue', p.venue, 360);
  x.fillStyle = '#94a3b8'; x.font = '13px sans-serif'; x.fillText('Pass ID: ' + p.pass_token.slice(0, 8).toUpperCase(), 32, 470);
  x.strokeStyle = '#e2e8f0'; x.lineWidth = 2; x.strokeRect(450, 120, 320, 320);
  x.drawImage(img, 455, 125, 310, 310);
  x.fillStyle = '#64748b'; x.font = '14px sans-serif'; x.textAlign = 'center'; x.fillText('Show this QR at the entrance', 610, 470);
  return c.toDataURL('image/png');
}

export default function PassCard({ pass }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { renderPass(pass).then(setUrl).catch(() => setUrl(null)); }, [pass]);
  const base = `pass_${pass.title.replace(/\W+/g, '_')}`;

  const png = () => Object.assign(document.createElement('a'), { href: url, download: base + '.png' }).click();
  const pdf = () => {
    const d = new jsPDF({ orientation: 'landscape', unit: 'px', format: [800, 500] });
    d.addImage(url, 'PNG', 0, 0, 800, 500);
    d.save(base + '.pdf');
  };

  return (
    <div className="card p-3">
      {url ? <img src={url} alt={`Pass for ${pass.title}`} className="w-full rounded-lg" /> : <div className="flex h-48 items-center justify-center text-slate-400">Generating pass…</div>}
      <div className="mt-3 flex gap-2">
        <button className="btn-primary flex-1" disabled={!url} onClick={png}>⬇ PNG</button>
        <button className="btn-ghost flex-1" disabled={!url} onClick={pdf}>⬇ PDF</button>
      </div>
    </div>
  );
}
