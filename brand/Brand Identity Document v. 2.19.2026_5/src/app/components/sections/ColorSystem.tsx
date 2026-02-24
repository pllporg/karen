import { SectionHeader, SubSection } from "../SectionHeader";

const primaryColors = [
  {
    name: "Ink Black",
    hex: "#0B0B0B",
    rgb: "11, 11, 11",
    usage: "Primary text, marks, rules, borders",
    swatch: "bg-ink",
    light: false,
  },
  {
    name: "Paper White",
    hex: "#F7F5F0",
    rgb: "247, 245, 240",
    usage: "Primary background, reversed text",
    swatch: "bg-paper",
    light: true,
  },
];

const secondaryColors = [
  {
    name: "Graphite",
    hex: "#3A3A3A",
    rgb: "58, 58, 58",
    usage: "Body text, secondary headings",
    swatch: "bg-graphite",
    light: false,
  },
  {
    name: "Slate",
    hex: "#6B6B6B",
    rgb: "107, 107, 107",
    usage: "Captions, labels, metadata",
    swatch: "bg-slate",
    light: false,
  },
  {
    name: "Silver",
    hex: "#A8A8A8",
    rgb: "168, 168, 168",
    usage: "Disabled states, tertiary text",
    swatch: "bg-silver",
    light: true,
  },
  {
    name: "Fog",
    hex: "#D4D2CD",
    rgb: "212, 210, 205",
    usage: "Dividers, light borders",
    swatch: "bg-fog",
    light: true,
  },
  {
    name: "Parchment",
    hex: "#ECEAE4",
    rgb: "236, 234, 228",
    usage: "Subtle backgrounds, cards",
    swatch: "bg-parchment",
    light: true,
  },
];

const functionalColors = [
  {
    name: "Institutional Blue",
    hex: "#2B4C7E",
    rgb: "43, 76, 126",
    usage: "Links, active states, focus rings",
    swatch: "bg-institutional",
    light: false,
  },
  {
    name: "Filing Red",
    hex: "#8B2500",
    rgb: "139, 37, 0",
    usage: "Errors, destructive actions, warnings",
    swatch: "bg-filing-red",
    light: false,
  },
  {
    name: "Ledger Green",
    hex: "#2D5F3A",
    rgb: "45, 95, 58",
    usage: "Success, approval, completion",
    swatch: "bg-ledger",
    light: false,
  },
];

function ColorSwatch({
  color,
}: {
  color: (typeof primaryColors)[0];
}) {
  return (
    <div className="border border-ink">
      <div
        className={`${color.swatch} h-24 border-b border-ink`}
      />
      <div className="p-4 bg-white">
        <div className="font-mono text-[13px] tracking-wide text-ink mb-1">
          {color.name}
        </div>
        <div className="font-mono text-[10px] text-slate tracking-wider mb-0.5">
          HEX {color.hex}
        </div>
        <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
          RGB {color.rgb}
        </div>
        <div className="text-[11px] text-slate leading-relaxed">
          {color.usage}
        </div>
      </div>
    </div>
  );
}

export function ColorSystem() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="03"
        title="Color System"
        subtitle="A matte, ink-on-paper palette. No gradients, no transparency effects. Color serves function, not decoration."
      />

      <SubSection label="Primary Palette">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The identity is fundamentally two-tone. Ink Black and Paper White form
          the backbone of all communications. Paper White has a warm undertone
          (not blue-white) to evoke the feel of quality stock.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {primaryColors.map((c) => (
            <ColorSwatch key={c.hex} color={c} />
          ))}
        </div>
      </SubSection>

      <SubSection label="Neutral Scale">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Five intermediate values between Ink and Paper. Each has a defined
          role. Do not interpolate additional values.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {secondaryColors.map((c) => (
            <ColorSwatch key={c.hex} color={c} />
          ))}
        </div>
      </SubSection>

      <SubSection label="Functional Colors">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Used sparingly and only for functional purposes. These are never
          decorative. Each is muted and desaturated to maintain the conservative
          palette.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {functionalColors.map((c) => (
            <ColorSwatch key={c.hex} color={c} />
          ))}
        </div>
      </SubSection>

      <SubSection label="Contrast Pairings">
        <div className="space-y-4">
          {[
            {
              label: "Primary text on paper",
              bg: "bg-paper",
              text: "text-ink",
              ratio: "19.2:1",
            },
            {
              label: "Paper text on ink",
              bg: "bg-ink",
              text: "text-paper",
              ratio: "19.2:1",
            },
            {
              label: "Slate text on paper",
              bg: "bg-paper",
              text: "text-slate",
              ratio: "5.1:1",
            },
            {
              label: "Institutional on paper",
              bg: "bg-paper",
              text: "text-institutional",
              ratio: "7.8:1",
            },
            {
              label: "Filing Red on paper",
              bg: "bg-paper",
              text: "text-filing-red",
              ratio: "8.9:1",
            },
          ].map((pair) => (
            <div
              key={pair.label}
              className={`${pair.bg} border border-ink p-5 flex items-center justify-between`}
            >
              <span className={`${pair.text} font-mono text-[13px] tracking-wide`}>
                {pair.label}
              </span>
              <span className="font-mono text-[10px] text-slate tracking-wider">
                WCAG {pair.ratio}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Color Application Rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-mono text-[12px] tracking-wider text-ink mb-3">
              DO
            </h4>
            <ul className="space-y-2">
              {[
                "Use Ink/Paper as the dominant pairing",
                "Reserve functional colors for their stated purpose",
                "Maintain WCAG AA contrast ratios minimum",
                "Use the neutral scale for hierarchy",
              ].map((rule) => (
                <li
                  key={rule}
                  className="text-[12px] text-graphite flex items-start gap-2"
                >
                  <span className="text-ledger mt-0.5">—</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[12px] tracking-wider text-ink mb-3">
              DO NOT
            </h4>
            <ul className="space-y-2">
              {[
                "Apply gradients or transparency",
                "Use functional colors decoratively",
                "Create new color values",
                "Use bright or saturated accent colors",
              ].map((rule) => (
                <li
                  key={rule}
                  className="text-[12px] text-graphite flex items-start gap-2"
                >
                  <span className="text-filing-red mt-0.5">✕</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SubSection>

      <SubSection label="Full Spectrum">
        <div className="flex h-16 border border-ink overflow-hidden">
          <div className="flex-1 bg-ink" />
          <div className="flex-1 bg-graphite" />
          <div className="flex-1 bg-slate" />
          <div className="flex-1 bg-silver" />
          <div className="flex-1 bg-fog" />
          <div className="flex-1 bg-parchment" />
          <div className="flex-1 bg-paper" />
          <div className="flex-1 bg-institutional" />
          <div className="flex-1 bg-filing-red" />
          <div className="flex-1 bg-ledger" />
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 3.1 — COMPLETE COLOR SPECTRUM, LEFT TO RIGHT: INK, GRAPHITE,
          SLATE, SILVER, FOG, PARCHMENT, PAPER, INSTITUTIONAL, FILING RED,
          LEDGER
        </div>
      </SubSection>
    </div>
  );
}
