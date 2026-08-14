// =====================================================================
//  Desen tehnic (SVG) al unei ferestre/uși, scalat după dimensiuni și
//  colorat după culoarea aleasă. Suportă mai multe tipuri, cu simbolistica
//  standard de tâmplărie (liniile diagonale indică sensul de deschidere):
//
//   - "fix"          : panou fix (fără simbol de deschidere)
//   - "canat"        : un canat cu deschidere pe balama (stânga/dreapta)
//   - "oscilobatant" : canat oscilobatant (deschidere laterală + basculare)
//   - "usa"          : ușă (canat înalt, cu mâner și prag)
//
//  Convenție: triunghiul format din diagonale are VÂRFUL spre balama.
//   • balama stânga  -> vârf în stânga
//   • balama dreapta -> vârf în dreapta
//   • basculare (oscilo) -> vârf jos (balama de jos)
// =====================================================================

export type DrawingKind = "fix" | "canat" | "oscilobatant" | "usa";
export type Hinge = "stanga" | "dreapta";

interface Props {
  widthMm: number;
  heightMm: number;
  color?: string;
  kind?: DrawingKind;
  hinge?: Hinge;
}

/** Deduce tipul de desen și balamaua din numele modelului. */
export function inferDrawing(name: string): { kind: DrawingKind; hinge: Hinge } {
  const s = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const hinge: Hinge = /\bstanga\b/.test(s) ? "stanga" : "dreapta";

  let kind: DrawingKind = "canat";
  if (/\busa\b|\busi\b|balcon/.test(s)) kind = "usa";
  else if (/oscilobatant/.test(s)) kind = "oscilobatant";
  else if (/\bfix\b|panou fix/.test(s)) kind = "fix";

  return { kind, hinge };
}

export function WindowDrawing({
  widthMm,
  heightMm,
  color = "Alb",
  kind = "fix",
  hinge = "dreapta",
}: Props) {
  const VB_W = 340;
  const VB_H = 250;
  const padL = 12;
  const padT = 12;
  const padR = 58;
  const padB = 34;
  const areaW = VB_W - padL - padR;
  const areaH = VB_H - padT - padB;

  const w = Number.isFinite(widthMm) && widthMm > 0 ? widthMm : 0;
  const h = Number.isFinite(heightMm) && heightMm > 0 ? heightMm : 0;
  // Ușile au implicit o proporție înaltă dacă nu s-au dat dimensiuni.
  const ratio = w > 0 && h > 0 ? w / h : kind === "usa" ? 0.45 : 3 / 4;

  let dw: number;
  let dh: number;
  if (ratio > areaW / areaH) {
    dw = areaW;
    dh = areaW / ratio;
  } else {
    dh = areaH;
    dw = areaH * ratio;
  }
  const ox = padL + (areaW - dw) / 2;
  const oy = padT + (areaH - dh) / 2;
  const t = Math.max(9, Math.min(dw, dh) * 0.075); // grosimea profilului

  const dark = /antracit|gri/i.test(color);
  const frame = dark ? "#3b4046" : "#eceff1";
  const frameHi = dark ? "#4a5158" : "#ffffff";
  const frameStroke = dark ? "#20242a" : "#aeb7c0";
  const symbol = "#3f5666"; // culoarea liniilor de deschidere

  const gx = ox + t;
  const gy = oy + t;
  const gw = dw - 2 * t;
  const gh = dh - 2 * t;

  const wLbl = w > 0 ? `${w} mm` : "— mm";
  const hLbl = h > 0 ? `${h} mm` : "— mm";
  const yDim = oy + dh + 20;
  const xDim = ox + dw + 30;

  // --- Simbolurile de deschidere (peste geam) ---
  const lines: React.ReactNode[] = [];
  const turn = (hg: Hinge, key: string) => {
    if (hg === "stanga") {
      // vârf la mijloc-stânga (balama stânga)
      lines.push(
        <line key={`${key}-a`} x1={gx + gw} y1={gy} x2={gx} y2={gy + gh / 2} stroke={symbol} strokeWidth={1.4} />,
        <line key={`${key}-b`} x1={gx + gw} y1={gy + gh} x2={gx} y2={gy + gh / 2} stroke={symbol} strokeWidth={1.4} />,
      );
    } else {
      // vârf la mijloc-dreapta (balama dreapta)
      lines.push(
        <line key={`${key}-a`} x1={gx} y1={gy} x2={gx + gw} y2={gy + gh / 2} stroke={symbol} strokeWidth={1.4} />,
        <line key={`${key}-b`} x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh / 2} stroke={symbol} strokeWidth={1.4} />,
      );
    }
  };
  const tilt = (key: string) => {
    // Basculare: balamaua e JOS, muchia care se deschide e SUS.
    // Simbolul standard = triunghi cu VÂRFUL SUS (baza jos, la balama).
    lines.push(
      <line key={`${key}-a`} x1={gx} y1={gy + gh} x2={gx + gw / 2} y2={gy} stroke={symbol} strokeWidth={1.4} strokeDasharray="5 3" />,
      <line key={`${key}-b`} x1={gx + gw} y1={gy + gh} x2={gx + gw / 2} y2={gy} stroke={symbol} strokeWidth={1.4} strokeDasharray="5 3" />,
    );
  };

  if (kind === "canat" || kind === "usa") turn(hinge, "turn");
  if (kind === "oscilobatant") {
    turn(hinge, "turn");
    tilt("tilt");
  }

  // --- Elemente specifice ușii (mâner + prag) ---
  const doorExtras: React.ReactNode[] = [];
  if (kind === "usa") {
    const handleOnRight = hinge === "stanga"; // mânerul e opus balamalei
    const hxLocal = handleOnRight ? gx + gw - t * 0.6 : gx + t * 0.6;
    doorExtras.push(
      <rect
        key="handle"
        x={hxLocal - 2}
        y={oy + dh / 2 - 12}
        width={4}
        height={24}
        rx={2}
        fill={dark ? "#c7ccd1" : "#8a939c"}
      />,
      <line
        key="prag"
        x1={ox}
        y1={oy + dh - 1}
        x2={ox + dw}
        y2={oy + dh - 1}
        stroke={frameStroke}
        strokeWidth={2}
      />,
    );
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Desen ${kind} ${wLbl} pe ${hLbl}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="glass-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cfe3f2" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#eaf3fa" stopOpacity="0.55" />
          <stop offset="1" stopColor="#bcd6ea" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Rama exterioară (profilul) */}
      <rect x={ox} y={oy} width={dw} height={dh} rx={4} fill={frame} stroke={frameStroke} strokeWidth={1.2} />
      <rect x={ox + 1.5} y={oy + 1.5} width={dw - 3} height={dh - 3} rx={3} fill="none" stroke={frameHi} strokeWidth={1} opacity={0.6} />

      {/* Geamul */}
      <rect x={gx} y={gy} width={gw} height={gh} rx={1.5} fill="url(#glass-grad)" stroke={frameStroke} strokeWidth={1} />

      {/* Reflexii de sticlă */}
      <line x1={gx + gw * 0.18} y1={gy + gh - 2} x2={gx + gw * 0.55} y2={gy + 2} stroke="#ffffff" strokeWidth={6} opacity={0.28} strokeLinecap="round" />
      <line x1={gx + gw * 0.34} y1={gy + gh - 2} x2={gx + gw * 0.62} y2={gy + gh * 0.42} stroke="#ffffff" strokeWidth={3} opacity={0.22} strokeLinecap="round" />

      {/* Simbolurile de deschidere + extra ușă */}
      {lines}
      {doorExtras}

      {/* Cotă lățime (jos) */}
      <g stroke="#94a3b8" strokeWidth={1}>
        <line x1={ox} y1={yDim - 6} x2={ox} y2={yDim + 2} />
        <line x1={ox + dw} y1={yDim - 6} x2={ox + dw} y2={yDim + 2} />
        <line x1={ox} y1={yDim - 2} x2={ox + dw} y2={yDim - 2} />
      </g>
      <text x={ox + dw / 2} y={yDim + 14} textAnchor="middle" fill="#64748b" fontSize={12} fontFamily="ui-sans-serif, system-ui, sans-serif">
        {wLbl}
      </text>

      {/* Cotă înălțime (dreapta) */}
      <g stroke="#94a3b8" strokeWidth={1}>
        <line x1={xDim - 8} y1={oy} x2={xDim} y2={oy} />
        <line x1={xDim - 8} y1={oy + dh} x2={xDim} y2={oy + dh} />
        <line x1={xDim - 4} y1={oy} x2={xDim - 4} y2={oy + dh} />
      </g>
      <text x={xDim + 2} y={oy + dh / 2} textAnchor="middle" fill="#64748b" fontSize={12} fontFamily="ui-sans-serif, system-ui, sans-serif" transform={`rotate(90 ${xDim + 2} ${oy + dh / 2})`}>
        {hLbl}
      </text>
    </svg>
  );
}
