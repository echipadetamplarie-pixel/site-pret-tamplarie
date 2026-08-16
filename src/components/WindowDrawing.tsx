// =====================================================================
//  Desen tehnic (SVG) al unei ferestre/uși, scalat după dimensiuni și
//  colorat după culoarea aleasă. Suportă unul sau mai multe canate
//  (cu montant între ele), cu simbolistica standard de tâmplărie:
//
//   - "fix"          : panou fix (fără simbol de deschidere)
//   - "canat"        : canat rotativ (deschidere pe balama stânga/dreapta)
//   - "oscilobatant" : canat oscilobatant (rotativ + basculare)
//   - "usa"          : tratat ca un canat, dar cu prag jos și mâner
//
//  Convenție (ca în Fenestra): triunghiul are VÂRFUL spre muchia care se
//  deschide (opusă balamalei); bascularea are vârful SUS (balamaua e jos).
// =====================================================================

export type DrawingKind = "fix" | "canat" | "oscilobatant" | "usa";
export type Hinge = "stanga" | "dreapta";

/** Un canat din cadru. */
export interface Panel {
  kind: DrawingKind;
  hinge: Hinge;
  /** La ușă: acest canat are mânerul (canatul activ). */
  handle?: boolean;
}

interface Props {
  widthMm: number;
  heightMm: number;
  color?: string;
  /** Canatele, de la stânga la dreapta. Dacă lipsește, se folosește kind/hinge. */
  panels?: Panel[];
  /** Adaugă prag jos + mâner (pentru uși). */
  door?: boolean;
  // Compatibilitate cu apelul simplu (un singur canat):
  kind?: DrawingKind;
  hinge?: Hinge;
}

/**
 * Deduce configurația de desen din numele modelului: câte canate, ce tip
 * și pe ce parte sunt balamalele. Aproximativ, dar rezonabil vizual.
 */
export function inferDrawing(name: string): { panels: Panel[]; door: boolean } {
  const s = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const door = /\busa\b|\busi\b|balcon/.test(s);
  const nameHinge: Hinge = /\bstanga\b/.test(s) ? "stanga" : "dreapta";
  const openKind: DrawingKind = /oscilobatant/.test(s) ? "oscilobatant" : "canat";
  const hasFix = /\bfix\b/.test(s);

  // Număr de canate
  let count = 1;
  if (/\b3\s*canate|trei canate/.test(s)) count = 3;
  else if (/\b2\s*canate|doua canate|dubl/.test(s)) count = 2;

  let panels: Panel[];
  if (count === 1) {
    const kind: DrawingKind =
      hasFix && !/canat|oscilobatant|usa|balcon/.test(s) ? "fix" : openKind;
    panels = [{ kind, hinge: nameHinge }];
  } else if (hasFix) {
    // Un canat care se deschide (pe partea indicată), restul fixe.
    panels = Array.from({ length: count }, () => ({
      kind: "fix" as DrawingKind,
      hinge: "stanga" as Hinge,
    }));
    const openIdx = nameHinge === "stanga" ? 0 : count - 1;
    panels[openIdx] = { kind: openKind, hinge: nameHinge };
  } else {
    // Toate canatele se deschid; balamalele spre exterior.
    panels = Array.from({ length: count }, (_, i) => ({
      kind: openKind,
      hinge: (i === 0
        ? "stanga"
        : i === count - 1
          ? "dreapta"
          : i % 2
            ? "stanga"
            : "dreapta") as Hinge,
    }));
  }

  // La ușă, mânerul (canatul activ) e pe un singur canat: pe partea indicată
  // în nume (mâna dreaptă = canatul din dreapta), implicit dreapta.
  if (door) {
    const openIdxs = panels
      .map((p, i) => ({ p, i }))
      .filter((x) => x.p.kind !== "fix")
      .map((x) => x.i);
    if (openIdxs.length > 0) {
      const handleIdx =
        panels.length >= 2
          ? nameHinge === "stanga"
            ? openIdxs[0]
            : openIdxs[openIdxs.length - 1]
          : openIdxs[0];
      panels[handleIdx] = { ...panels[handleIdx], handle: true };
    }
  }

  return { panels, door };
}

export function WindowDrawing({
  widthMm,
  heightMm,
  color = "Alb",
  panels,
  door,
  kind = "fix",
  hinge = "dreapta",
}: Props) {
  const resolved: Panel[] =
    panels && panels.length ? panels : [{ kind, hinge }];
  const isDoor = door ?? kind === "usa";

  // Dacă e ușă și niciun canat nu are mâner marcat, îl punem pe ultimul
  // canat care se deschide (implicit pe dreapta).
  const drawPanels = resolved.map((p) => ({ ...p }));
  if (isDoor && !drawPanels.some((p) => p.handle)) {
    for (let i = drawPanels.length - 1; i >= 0; i--) {
      if (drawPanels[i].kind !== "fix") {
        drawPanels[i].handle = true;
        break;
      }
    }
  }

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
  const defaultRatio = isDoor ? 0.5 : resolved.length >= 2 ? 1.1 : 3 / 4;
  const ratio = w > 0 && h > 0 ? w / h : defaultRatio;

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
  const t = Math.max(8, Math.min(dw, dh) * 0.06); // grosimea profilului

  const dark = /antracit|gri/i.test(color);
  const frame = dark ? "#3b4046" : "#eceff1";
  const frameHi = dark ? "#4a5158" : "#ffffff";
  const frameStroke = dark ? "#20242a" : "#aeb7c0";
  const symbolColor = "#3f5666";
  const handleColor = dark ? "#c7ccd1" : "#8a939c";

  const gx = ox + t;
  const gy = oy + t;
  const gw = dw - 2 * t;
  const gh = dh - 2 * t;

  // Împărțim zona interioară în canate egale, cu montant între ele.
  const N = drawPanels.length;
  const mt = N > 1 ? Math.max(4, t * 0.9) : 0; // grosime montant
  const sashW = (gw - (N - 1) * mt) / N;

  const parts: React.ReactNode[] = [];

  drawPanels.forEach((panel, i) => {
    const sx = gx + i * (sashW + mt);
    const key = `p${i}`;

    // Geamul canatului
    parts.push(
      <rect
        key={`${key}-glass`}
        x={sx}
        y={gy}
        width={sashW}
        height={gh}
        rx={1.5}
        fill="url(#glass-grad)"
        stroke={frameStroke}
        strokeWidth={1}
      />,
      <line
        key={`${key}-refl`}
        x1={sx + sashW * 0.2}
        y1={gy + gh - 3}
        x2={sx + sashW * 0.55}
        y2={gy + 3}
        stroke="#ffffff"
        strokeWidth={5}
        opacity={0.26}
        strokeLinecap="round"
      />,
    );

    // Simbolul de deschidere
    const cx = sx + sashW; // muchia dreaptă a canatului
    const midY = gy + gh / 2;
    const midX = sx + sashW / 2;
    // La UȘĂ simbolul e un TRAPEZ (muchie verticală scurtă pe partea care se
    // deschide); la ferestre e triunghi (vârf într-un punct).
    const kTrap = isDoor ? gh * 0.16 : 0;
    const drawTurn = () => {
      const topY = midY - kTrap;
      const botY = midY + kTrap;
      if (panel.hinge === "stanga") {
        // balama stânga -> se deschide spre dreapta (la cx)
        parts.push(
          <line key={`${key}-t1`} x1={sx} y1={gy} x2={cx} y2={topY} stroke={symbolColor} strokeWidth={1.4} />,
          <line key={`${key}-t2`} x1={sx} y1={gy + gh} x2={cx} y2={botY} stroke={symbolColor} strokeWidth={1.4} />,
        );
        if (kTrap > 0)
          parts.push(<line key={`${key}-t3`} x1={cx} y1={topY} x2={cx} y2={botY} stroke={symbolColor} strokeWidth={1.4} />);
      } else {
        // balama dreapta -> se deschide spre stânga (la sx)
        parts.push(
          <line key={`${key}-t1`} x1={cx} y1={gy} x2={sx} y2={topY} stroke={symbolColor} strokeWidth={1.4} />,
          <line key={`${key}-t2`} x1={cx} y1={gy + gh} x2={sx} y2={botY} stroke={symbolColor} strokeWidth={1.4} />,
        );
        if (kTrap > 0)
          parts.push(<line key={`${key}-t3`} x1={sx} y1={topY} x2={sx} y2={botY} stroke={symbolColor} strokeWidth={1.4} />);
      }
    };
    const drawTilt = () => {
      // basculare: vârf sus (balamaua e jos)
      parts.push(
        <line key={`${key}-k1`} x1={sx} y1={gy + gh} x2={midX} y2={gy} stroke={symbolColor} strokeWidth={1.4} strokeDasharray="5 3" />,
        <line key={`${key}-k2`} x1={cx} y1={gy + gh} x2={midX} y2={gy} stroke={symbolColor} strokeWidth={1.4} strokeDasharray="5 3" />,
      );
    };
    if (panel.kind === "canat" || panel.kind === "usa") drawTurn();
    if (panel.kind === "oscilobatant") {
      drawTurn();
      drawTilt();
    }

    // Mâner (la ușă), doar pe canatul activ (marcat cu handle)
    if (isDoor && panel.handle) {
      const hxx =
        panel.hinge === "stanga" ? sx + sashW - t * 0.7 : sx + t * 0.7;
      parts.push(
        <rect
          key={`${key}-handle`}
          x={hxx - 2}
          y={midY - 12}
          width={4}
          height={24}
          rx={2}
          fill={handleColor}
        />,
      );
    }

    // Montantul dintre canate
    if (i < N - 1) {
      parts.push(
        <rect
          key={`${key}-mullion`}
          x={sx + sashW}
          y={oy}
          width={mt}
          height={dh}
          fill={frame}
          stroke={frameStroke}
          strokeWidth={1}
        />,
      );
    }
  });

  const wLbl = w > 0 ? `${w} mm` : "— mm";
  const hLbl = h > 0 ? `${h} mm` : "— mm";
  const yDim = oy + dh + 20;
  const xDim = ox + dw + 30;
  const ariaTip = isDoor ? "ușă" : N > 1 ? `${N} canate` : "fereastră";

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Desen ${ariaTip} ${wLbl} pe ${hLbl}`}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="glass-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cfe3f2" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#eaf3fa" stopOpacity="0.55" />
          <stop offset="1" stopColor="#bcd6ea" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* Rama exterioară (toc) */}
      <rect x={ox} y={oy} width={dw} height={dh} rx={4} fill={frame} stroke={frameStroke} strokeWidth={1.2} />
      <rect x={ox + 1.5} y={oy + 1.5} width={dw - 3} height={dh - 3} rx={3} fill="none" stroke={frameHi} strokeWidth={1} opacity={0.6} />

      {/* Canatele (geam + simbol + montant + mâner) */}
      {parts}

      {/* Prag (la ușă) */}
      {isDoor && (
        <line x1={ox} y1={oy + dh - 1} x2={ox + dw} y2={oy + dh - 1} stroke={frameStroke} strokeWidth={2.5} />
      )}

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
