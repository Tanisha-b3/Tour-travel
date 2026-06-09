import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const W = 1000;
const H = 500;

// More detailed and accurate continent paths
const CONTINENT_PATHS = [
  // North America
  "M 88 68 L 108 58 L 138 52 L 168 50 L 196 54 L 218 62 L 238 72 L 252 88 L 258 106 L 254 128 L 242 148 L 228 162 L 210 174 L 192 182 L 174 194 L 160 210 L 148 228 L 136 218 L 120 200 L 104 180 L 92 158 L 80 134 L 78 110 L 82 88 Z",
  // Central America / Caribbean bridge
  "M 200 218 L 218 224 L 228 238 L 218 252 L 204 256 L 192 244 L 192 230 Z",
  // South America
  "M 218 262 L 244 254 L 268 258 L 292 270 L 312 288 L 326 314 L 332 342 L 328 370 L 318 396 L 302 416 L 280 428 L 258 424 L 238 410 L 222 390 L 210 364 L 206 336 L 208 308 L 212 282 Z",
  // Europe
  "M 458 56 L 482 50 L 508 52 L 532 58 L 554 68 L 568 82 L 572 100 L 560 116 L 542 126 L 520 132 L 496 134 L 472 128 L 452 114 L 444 96 L 448 76 Z",
  // Scandinavia bump
  "M 492 38 L 506 32 L 518 36 L 524 50 L 510 56 L 496 52 Z",
  // Africa
  "M 466 138 L 494 128 L 524 132 L 548 142 L 564 162 L 572 190 L 574 220 L 570 254 L 558 284 L 540 310 L 516 332 L 490 346 L 464 342 L 442 324 L 426 298 L 418 268 L 418 238 L 424 208 L 434 180 L 448 158 Z",
  // Middle East / Arabia
  "M 576 128 L 604 122 L 628 128 L 644 146 L 648 166 L 636 184 L 612 192 L 588 190 L 572 174 L 568 152 Z",
  // Russia / North Asia (large)
  "M 574 44 L 620 36 L 670 32 L 722 34 L 768 42 L 808 52 L 840 66 L 858 86 L 848 106 L 820 118 L 786 124 L 748 128 L 706 128 L 664 124 L 624 116 L 590 104 L 568 88 L 562 68 Z",
  // South Asia
  "M 632 142 L 664 136 L 694 140 L 714 156 L 720 178 L 710 198 L 688 210 L 660 212 L 636 202 L 620 184 L 618 162 Z",
  // Southeast Asia
  "M 720 148 L 752 142 L 778 150 L 792 168 L 790 192 L 772 208 L 748 212 L 726 204 L 714 186 L 714 164 Z",
  // China / East Asia
  "M 724 96 L 760 90 L 796 94 L 826 106 L 840 124 L 836 146 L 816 160 L 788 166 L 756 164 L 728 154 L 710 136 L 710 114 Z",
  // Japan
  "M 854 100 L 868 96 L 880 102 L 882 118 L 872 130 L 856 126 L 850 112 Z",
  // Australia
  "M 754 282 L 790 272 L 828 272 L 862 280 L 890 298 L 906 322 L 908 350 L 898 376 L 876 396 L 848 408 L 818 410 L 786 402 L 758 384 L 738 358 L 730 328 L 732 298 Z",
  // New Zealand (tiny)
  "M 930 350 L 942 344 L 950 354 L 944 366 L 932 366 Z",
  // Greenland
  "M 300 22 L 322 16 L 348 18 L 366 30 L 368 48 L 354 60 L 330 64 L 308 56 L 296 40 Z",
  // Iceland
  "M 412 42 L 428 38 L 440 44 L 440 56 L 426 60 L 412 56 Z",
];

// Island dots — small circles rather than paths
const ISLAND_DOTS = [
  { cx: 860, cy: 108, r: 3 },  // Japan south
  { cx: 870, cy: 122, r: 2.5 },
  { cx: 936, cy: 346, r: 4 },  // NZ north
  { cx: 928, cy: 360, r: 3 },
  { cx: 196, cy: 246, r: 3 },  // Caribbean
  { cx: 206, cy: 238, r: 2.5 },
  { cx: 212, cy: 252, r: 2 },
  { cx: 780, cy: 218, r: 3.5 }, // Philippines
  { cx: 790, cy: 228, r: 2.5 },
  { cx: 760, cy: 232, r: 3 },
];

function projectPoint(lat, lng) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

function PulsingPin({ x, y, color, r = 5, isSelected, isHovered, onClick, onEnter, onLeave }) {
  return (
    <g
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      {/* Outer pulse ring */}
      {(isSelected || isHovered) && (
        <>
          <circle cx={x} cy={y} r={r + 10} fill={color} fillOpacity="0.08" />
          <circle cx={x} cy={y} r={r + 5} fill={color} fillOpacity="0.18" />
        </>
      )}
      {/* Ambient glow always visible */}
      <circle cx={x} cy={y} r={r + 8} fill={color} fillOpacity="0.10" />
      <circle cx={x} cy={y} r={r + 4} fill={color} fillOpacity="0.20" />
      {/* Main dot */}
      <circle
        cx={x}
        cy={y}
        r={isSelected ? r + 3 : isHovered ? r + 1.5 : r}
        fill={color}
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />
      {/* Shine */}
      <circle
        cx={x - r * 0.25}
        cy={y - r * 0.25}
        r={r * 0.3}
        fill="#ffffff"
        fillOpacity="0.35"
      />
    </g>
  );
}

function TooltipBox({ d, W, darkMode }) {
  const tx = Math.min(d._x + 10, W - 170);
  const ty = Math.max(d._y - 38, 8);
  const textColor = darkMode ? "#e8f0ff" : "#1a2a4a";
  const subColor = darkMode ? "#7a98cc" : "#5a7ab8";
  const bgFill = darkMode ? "#0d1a2e" : "#ffffff";
  const borderColor = darkMode ? "#2a4070" : "#c8d8ec";

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={tx} y={ty}
        width="160" height="38"
        rx="8"
        fill={bgFill}
        stroke={borderColor}
        strokeWidth="0.8"
        fillOpacity="0.97"
      />
      <text x={tx + 10} y={ty + 14} fill={textColor} fontSize="11.5" fontWeight="700" fontFamily="inherit">
        {d.name}
      </text>
      <text x={tx + 10} y={ty + 28} fill={subColor} fontSize="10" fontFamily="inherit">
        📍 {d.location}
      </text>
    </g>
  );
}

const TYPE_DOT_COLOR = {
  beach: "#0ea5e9",
  mountain: "#22c55e",
  city: "#f59e0b",
  cultural: "#a855f7",
  adventure: "#ef4444",
  nature: "#10b981",
};

export default function WorldMap({ destinations = [], onSelect, darkMode = false }) {
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0, moved: false });
  const svgRef = useRef(null);

  const points = useMemo(
    () =>
      destinations
        .map((d) => {
          if (!d.coords) return null;
          const p = projectPoint(d.coords.lat, d.coords.lng);
          return { ...d, _x: p.x, _y: p.y };
        })
        .filter(Boolean),
    [destinations]
  );

  const handleSelect = useCallback(
    (d) => {
      setSelected((prev) => (prev?.id === d.id ? null : d));
      onSelect?.(d);
    },
    [onSelect]
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.3 : 0.3;
    setZoom((z) => Math.min(Math.max(z + delta, 1), 5));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onPointerDown = (e) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, baseX: pan.x, baseY: pan.y, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDragging(false);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      dragRef.current.moved = true;
      setIsDragging(true);
    }
    setPan({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  };
  const onPointerUp = (e) => {
    dragRef.current.active = false;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Theme colors
  const theme = {
    ocean: darkMode
      ? ["#071628", "#0a1e36"]
      : ["#b8d8f0", "#cce4f8"],
    land: darkMode ? "#1a2d4e" : "#dde8f2",
    landStroke: darkMode ? "#253d65" : "#aabfd8",
    landShadow: darkMode ? "#0d1a2e" : "#b5ccde",
    grid: darkMode ? "rgba(80,120,200,0.08)" : "rgba(50,80,150,0.07)",
    graticule: darkMode ? "rgba(80,120,200,0.14)" : "rgba(50,80,150,0.12)",
    text: darkMode ? "#c8dcf8" : "#1a3060",
    subtleText: darkMode ? "#5a7aaa" : "#6080b8",
    badge: {
      bg: darkMode ? "rgba(10,22,48,0.85)" : "rgba(255,255,255,0.9)",
      border: darkMode ? "#2a4070" : "#c0d4e8",
    },
  };

  // Graticule lines (lat/lng grid)
  const graticuleLines = [];
  // Every 30 degrees latitude
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * H;
    graticuleLines.push(<line key={`lat${lat}`} x1={0} y1={y} x2={W} y2={y} stroke={theme.graticule} strokeWidth="0.5" strokeDasharray={lat === 0 ? "none" : "3,4"} />);
  }
  // Every 60 degrees longitude
  for (let lng = -180; lng <= 180; lng += 60) {
    const x = ((lng + 180) / 360) * W;
    graticuleLines.push(<line key={`lng${lng}`} x1={x} y1={0} x2={x} y2={H} stroke={theme.graticule} strokeWidth="0.5" strokeDasharray="3,4" />);
  }

  // Equator label
  const eqY = H / 2;

  const typeColors = Object.entries(TYPE_DOT_COLOR);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{
        background: darkMode
          ? `linear-gradient(175deg, ${theme.ocean[0]} 0%, ${theme.ocean[1]} 100%)`
          : `linear-gradient(175deg, ${theme.ocean[0]} 0%, ${theme.ocean[1]} 100%)`,
        border: `1px solid ${darkMode ? "rgba(40,70,130,0.4)" : "rgba(100,150,210,0.35)"}`,
        aspectRatio: "1000 / 500",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: darkMode
          ? "inset 0 0 80px rgba(0,10,40,0.5)"
          : "inset 0 0 60px rgba(100,150,220,0.15)",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${W / zoom} ${H / zoom}`}
        className="w-full h-full touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <filter id="land-shadow" x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="1" dy="2" stdDeviation="3" floodColor={theme.landShadow} floodOpacity="0.5" />
          </filter>
          <linearGradient id="ocean-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={theme.ocean[0]} />
            <stop offset="100%" stopColor={theme.ocean[1]} />
          </linearGradient>
        </defs>

        {/* Ocean background */}
        <rect x="0" y="0" width={W} height={H} fill="url(#ocean-grad)" />

        {/* Graticule */}
        <g opacity="1">{graticuleLines}</g>

        {/* Equator — slightly bolder */}
        <line x1={0} y1={eqY} x2={W} y2={eqY} stroke={theme.graticule} strokeWidth="1" strokeOpacity="0.9" />

        {/* Continents */}
        <g filter="url(#land-shadow)">
          {CONTINENT_PATHS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill={theme.land}
              stroke={theme.landStroke}
              strokeWidth="0.7"
              strokeLinejoin="round"
            />
          ))}
          {ISLAND_DOTS.map((dot, i) => (
            <circle
              key={`island-${i}`}
              cx={dot.cx}
              cy={dot.cy}
              r={dot.r}
              fill={theme.land}
              stroke={theme.landStroke}
              strokeWidth="0.6"
            />
          ))}
        </g>

        {/* Destination pins */}
        {points.map((d) => {
          const color = TYPE_DOT_COLOR[d.type] || "#4B6DA8";
          const isSel = selected?.id === d.id;
          const isHov = hover?.id === d.id;
          return (
            <PulsingPin
              key={d.id}
              x={d._x}
              y={d._y}
              color={color}
              r={5}
              isSelected={isSel}
              isHovered={isHov}
              onClick={(e) => { e.stopPropagation(); if (!dragRef.current.moved) handleSelect(d); }}
              onEnter={() => setHover(d)}
              onLeave={() => setHover((h) => (h?.id === d.id ? null : h))}
            />
          );
        })}

        {/* Hover tooltip (only when not selected) */}
        {hover && !selected && (
          <TooltipBox d={hover} W={W} darkMode={darkMode} />
        )}

        {/* Equator label */}
        <text
          x={14}
          y={eqY - 4}
          fontSize="8.5"
          fill={theme.subtleText}
          fontFamily="inherit"
          opacity="0.8"
        >
          Equator
        </text>
      </svg>

      {/* Legend */}
      {typeColors.length > 0 && (
        <div
          className="absolute left-3 bottom-14 flex flex-col gap-1 px-2.5 py-2 rounded-xl"
          style={{
            background: theme.badge.bg,
            border: `0.8px solid ${theme.badge.border}`,
            backdropFilter: "blur(8px)",
          }}
        >
          {typeColors.map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 5px ${color}88`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10, color: theme.text, textTransform: "capitalize", fontWeight: 500 }}>
                {type}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
        {[
          { label: "+", action: handleZoomIn, aria: "Zoom in" },
          { label: "−", action: handleZoomOut, aria: "Zoom out" },
          { label: "⟲", action: handleReset, aria: "Reset view", small: true },
        ].map(({ label, action, aria, small }) => (
          <button
            key={aria}
            type="button"
            onClick={action}
            aria-label={aria}
            style={{
              width: 34, height: 34,
              borderRadius: 10,
              background: theme.badge.bg,
              border: `0.8px solid ${theme.badge.border}`,
              color: theme.text,
              fontSize: small ? 11 : 18,
              fontWeight: 600,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "opacity 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Destination count badge */}
      <div
        className="absolute left-3 top-3 px-3 py-1.5 rounded-xl flex items-center gap-2"
        style={{
          background: theme.badge.bg,
          border: `0.8px solid ${theme.badge.border}`,
          backdropFilter: "blur(8px)",
          fontSize: 11,
          fontWeight: 600,
          color: theme.text,
        }}
      >
        <span
          style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#22d3ee",
            boxShadow: "0 0 6px #22d3ee",
            display: "inline-block",
          }}
        />
        {points.length} destination{points.length !== 1 ? "s" : ""}
      </div>

      {/* Selected destination card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute"
            style={{
              right: 12,
              bottom: 52,
              width: 288,
              zIndex: 20,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                border: `0.8px solid ${theme.badge.border}`,
                background: darkMode ? "rgba(8,16,36,0.96)" : "rgba(255,255,255,0.97)",
                boxShadow: darkMode
                  ? "0 12px 40px rgba(0,5,20,0.6)"
                  : "0 12px 40px rgba(40,80,160,0.18)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 130 }}>
                <img
                  src={selected.image}
                  alt={selected.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
                  }}
                />
                {/* Type badge */}
                {selected.type && (
                  <div
                    style={{
                      position: "absolute", top: 8, left: 10,
                      background: TYPE_DOT_COLOR[selected.type] || "#4B6DA8",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 20,
                      textTransform: "capitalize",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {selected.type}
                  </div>
                )}
                {/* Close */}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  style={{
                    position: "absolute", top: 8, right: 8,
                    width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(0,0,0,0.45)",
                    border: "none",
                    color: "#fff",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  ✕
                </button>
                {/* Name on image */}
                <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                    {selected.name}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, color: theme.subtleText }}>📍 {selected.location}</span>
                  {selected.duration && (
                    <>
                      <span style={{ color: theme.subtleText, fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 10.5, color: theme.subtleText }}>🕐 {selected.duration}</span>
                    </>
                  )}
                  {selected.rating && (
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#f59e0b" }}>
                      ★ {typeof selected.rating === "number" ? selected.rating.toFixed(1) : selected.rating}
                    </span>
                  )}
                </div>

                {selected.description && (
                  <p style={{
                    fontSize: 11.5,
                    lineHeight: 1.6,
                    color: darkMode ? "#8aabcc" : "#4a6080",
                    marginBottom: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {selected.description}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: theme.subtleText, fontWeight: 500, marginBottom: 1 }}>Starting from</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: darkMode ? "#7dd3fc" : "#1a5fa8", letterSpacing: "-0.02em" }}>
                      ₹{(selected.price || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <a
                    href={`/tour/${selected.id}`}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: 24,
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      textDecoration: "none",
                      letterSpacing: "0.01em",
                      boxShadow: "0 2px 10px rgba(37,99,235,0.35)",
                    }}
                  >
                    View tour →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}