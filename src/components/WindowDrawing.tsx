// =====================================================================
//  Desen tehnic (SVG) al unei ferestre/uși, care se scalează după
//  dimensiunile introduse și se colorează după culoarea aleasă.
//  Momentan desenează un "panou fix" (fără simbol de deschidere).
//  E pregătit pentru extindere: prop-ul `kind` va putea desena și
//  canate cu deschidere (cu simbolul triunghiular), în viitor.
// =====================================================================

interface Props {
  /** Lățimea în mm (poate fi NaN dacă nu e completată). */
  widthMm: number;
  /** Înălțimea în mm (poate fi NaN dacă nu e completată). */
  heightMm: number;
  /** Culoarea aleasă (ex: "Alb", "Gri antracit"). */
  color?: string;
  /** Tipul de desen (deocamdată doar "fix"). */
  kind?: "fix";
}

export function WindowDrawing({ widthMm, heightMm, color = "Alb" }: Props) {
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
  const ratio = w > 0 && h > 0 ? w / h : 3 / 4;

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

  const gx = ox + t;
  const gy = oy + t;
  const gw = dw - 2 * t;
  const gh = dh - 2 * t;

  const wLbl = w > 0 ? `${w} mm` : "— mm";
  const hLbl = h > 0 ? `${h} mm` : "— mm";
  const yDim = oy + dh + 20;
  const xDim = ox + dw + 30;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Desen panou fix ${wLbl} pe ${hLbl}`}
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
      <rect
        x={ox}
        y={oy}
        width={dw}
        height={dh}
        rx={4}
        fill={frame}
        stroke={frameStroke}
        strokeWidth={1.2}
      />
      <rect
        x={ox + 1.5}
        y={oy + 1.5}
        width={dw - 3}
        height={dh - 3}
        rx={3}
        fill="none"
        stroke={frameHi}
        strokeWidth={1}
        opacity={0.6}
      />

      {/* Geamul */}
      <rect
        x={gx}
        y={gy}
        width={gw}
        height={gh}
        rx={1.5}
        fill="url(#glass-grad)"
        stroke={frameStroke}
        strokeWidth={1}
      />
      {/* Reflexii de sticlă (fără simbol de deschidere = panou FIX) */}
      <line
        x1={gx + gw * 0.18}
        y1={gy + gh - 2}
        x2={gx + gw * 0.55}
        y2={gy + 2}
        stroke="#ffffff"
        strokeWidth={6}
        opacity={0.3}
        strokeLinecap="round"
      />
      <line
        x1={gx + gw * 0.34}
        y1={gy + gh - 2}
        x2={gx + gw * 0.62}
        y2={gy + gh * 0.42}
        stroke="#ffffff"
        strokeWidth={3}
        opacity={0.25}
        strokeLinecap="round"
      />

      {/* Cotă lățime (jos) */}
      <g stroke="#94a3b8" strokeWidth={1}>
        <line x1={ox} y1={yDim - 6} x2={ox} y2={yDim + 2} />
        <line x1={ox + dw} y1={yDim - 6} x2={ox + dw} y2={yDim + 2} />
        <line x1={ox} y1={yDim - 2} x2={ox + dw} y2={yDim - 2} />
      </g>
      <text
        x={ox + dw / 2}
        y={yDim + 14}
        textAnchor="middle"
        fill="#64748b"
        fontSize={12}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {wLbl}
      </text>

      {/* Cotă înălțime (dreapta) */}
      <g stroke="#94a3b8" strokeWidth={1}>
        <line x1={xDim - 8} y1={oy} x2={xDim} y2={oy} />
        <line x1={xDim - 8} y1={oy + dh} x2={xDim} y2={oy + dh} />
        <line x1={xDim - 4} y1={oy} x2={xDim - 4} y2={oy + dh} />
      </g>
      <text
        x={xDim + 2}
        y={oy + dh / 2}
        textAnchor="middle"
        fill="#64748b"
        fontSize={12}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        transform={`rotate(90 ${xDim + 2} ${oy + dh / 2})`}
      >
        {hLbl}
      </text>
    </svg>
  );
}
