/**
 * LIC Logo Mark
 *
 * A geometric, reductive mark inspired by Paul Rand's IBM identity.
 * Horizontal stripes through the letterforms—procedural, institutional, controlled.
 */

export function LICLogoMark({
  size = "medium",
  inverted = false,
}: {
  size?: "small" | "medium" | "large" | "xlarge";
  inverted?: boolean;
}) {
  const scales = {
    small: 0.4,
    medium: 0.7,
    large: 1,
    xlarge: 1.5,
  };
  const scale = scales[size];
  const fg = inverted ? "#F7F5F0" : "#0B0B0B";
  const bg = inverted ? "#0B0B0B" : "#F7F5F0";

  const w = 320 * scale;
  const h = 80 * scale;

  return (
    <div className="inline-flex flex-col items-start">
      <svg
        width={w}
        height={h}
        viewBox="0 0 320 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="320" height="80" fill={bg} />

        {/* L */}
        <rect x="20" y="10" width="12" height="60" fill={fg} />
        <rect x="20" y="58" width="50" height="12" fill={fg} />

        {/* I */}
        <rect x="90" y="10" width="50" height="12" fill={fg} />
        <rect x="108" y="10" width="12" height="60" fill={fg} />
        <rect x="90" y="58" width="50" height="12" fill={fg} />

        {/* C */}
        <rect x="160" y="10" width="50" height="12" fill={fg} />
        <rect x="160" y="10" width="12" height="60" fill={fg} />
        <rect x="160" y="58" width="50" height="12" fill={fg} />

        {/* Horizontal stripes (knockout lines) */}
        {[26, 38, 50].map((y) => (
          <rect key={y} x="0" y={y} width="320" height="4" fill={bg} />
        ))}

        {/* Separator line */}
        <rect x="228" y="10" width="1" height="60" fill={fg} opacity={0.3} />

        {/* Small registration text area */}
        <text
          x="244"
          y="38"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="8"
          fill={fg}
          opacity={0.5}
          letterSpacing="0.15em"
        >
          LEGAL
        </text>
        <text
          x="244"
          y="50"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="8"
          fill={fg}
          opacity={0.5}
          letterSpacing="0.15em"
        >
          INTELLIGENCE
        </text>
        <text
          x="244"
          y="62"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="8"
          fill={fg}
          opacity={0.5}
          letterSpacing="0.15em"
        >
          CORPORATION
        </text>
      </svg>
    </div>
  );
}

export function LICWordmark({
  inverted = false,
}: {
  inverted?: boolean;
}) {
  const color = inverted ? "#F7F5F0" : "#0B0B0B";
  return (
    <div
      className="font-mono tracking-[0.25em] select-none"
      style={{ color, fontSize: "14px" }}
    >
      LEGAL INTELLIGENCE CORPORATION
    </div>
  );
}

export function LICModuleTag({
  module,
  code,
  inverted = false,
}: {
  module: string;
  code: string;
  inverted?: boolean;
}) {
  const fg = inverted ? "#F7F5F0" : "#0B0B0B";
  const border = inverted ? "#F7F5F0" : "#0B0B0B";
  return (
    <div
      className="inline-flex items-center font-mono tracking-widest border"
      style={{
        borderColor: border,
        color: fg,
        fontSize: "11px",
        padding: "4px 12px",
      }}
    >
      <span>LIC / {module}</span>
      <span
        className="ml-3 pl-3 border-l"
        style={{ borderColor: `${border}40`, fontSize: "9px", opacity: 0.6 }}
      >
        {code}
      </span>
    </div>
  );
}
