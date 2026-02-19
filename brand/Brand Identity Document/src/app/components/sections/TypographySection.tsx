import { SectionHeader, SubSection } from "../SectionHeader";

export function TypographySection() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="04"
        title="Typography"
        subtitle="Three typefaces from the IBM Plex family. Each has a defined role. No substitutions."
      />

      <SubSection label="Type System Overview">
        <p className="text-[13px] text-slate mb-8 max-w-lg leading-relaxed">
          The IBM Plex family was chosen for its direct lineage to IBM's
          corporate identity program—the same design tradition that informs
          this identity. Plex is geometric, legible, and unemotional.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          <div className="p-6 bg-white">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              PRIMARY — IBM PLEX MONO
            </div>
            <div className="font-mono text-ink tracking-wide" style={{ fontSize: "2rem" }}>
              Casework, continuous.
            </div>
            <p className="text-[12px] text-slate mt-3">
              Used for: headings, labels, codes, module tags, UI elements,
              navigation, and any text that requires institutional authority.
            </p>
          </div>
          <div className="p-6 bg-white">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              SECONDARY — IBM PLEX SANS
            </div>
            <div className="font-sans text-ink" style={{ fontSize: "2rem" }}>
              Every case advances.
            </div>
            <p className="text-[12px] text-slate mt-3">
              Used for: body copy, descriptions, documentation prose, and
              extended reading contexts.
            </p>
          </div>
          <div className="p-6 bg-white">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              TERTIARY — IBM PLEX SERIF
            </div>
            <div className="font-serif text-ink italic" style={{ fontSize: "2rem" }}>
              Litigation work. Executed.
            </div>
            <p className="text-[12px] text-slate mt-3">
              Used for: pull quotes, emphasis, formal statements, and
              occasional contrast. Use sparingly.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection label="Type Scale">
        <div className="space-y-0 divide-y divide-fog">
          {[
            { label: "Display", size: "2.5rem", weight: "500", font: "font-mono", sample: "LIC / INTAKE" },
            { label: "H1", size: "2rem", weight: "500", font: "font-mono", sample: "Brand Foundation" },
            { label: "H2", size: "1.5rem", weight: "500", font: "font-mono", sample: "Color System" },
            { label: "H3", size: "1.125rem", weight: "500", font: "font-mono", sample: "Module Tags" },
            { label: "Body", size: "1rem", weight: "400", font: "font-sans", sample: "Legal Intelligence Corporation provides litigation firms with an agentic workforce." },
            { label: "Caption", size: "0.8125rem", weight: "400", font: "font-sans", sample: "FIG. 4.1 — TYPE SPECIMEN, COMPLETE SCALE" },
            { label: "Code / Label", size: "0.6875rem", weight: "400", font: "font-mono", sample: "INTK · EVAL · DRFT · DISC · DCKT · CLNT" },
            { label: "Micro", size: "0.5625rem", weight: "400", font: "font-mono", sample: "REV. 2026 — CONFIDENTIAL — INTERNAL USE ONLY" },
          ].map((t) => (
            <div key={t.label} className="py-5 flex flex-col md:flex-row md:items-baseline gap-2">
              <div className="w-32 shrink-0">
                <div className="font-mono text-[10px] text-slate tracking-wider">
                  {t.label}
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-0.5">
                  {t.size} / {t.weight}
                </div>
              </div>
              <div
                className={`${t.font} text-ink flex-1`}
                style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: 1.4 }}
              >
                {t.sample}
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Weight Specimens">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              IBM PLEX MONO
            </div>
            {[
              { w: "300", label: "Light" },
              { w: "400", label: "Regular" },
              { w: "500", label: "Medium" },
              { w: "600", label: "SemiBold" },
              { w: "700", label: "Bold" },
            ].map((wt) => (
              <div
                key={wt.w}
                className="font-mono text-ink py-1"
                style={{ fontSize: "1.25rem", fontWeight: wt.w }}
              >
                Aa Bb Cc 01 23
                <span className="text-[10px] text-slate ml-3">{wt.label} ({wt.w})</span>
              </div>
            ))}
          </div>
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              IBM PLEX SANS
            </div>
            {[
              { w: "300", label: "Light" },
              { w: "400", label: "Regular" },
              { w: "500", label: "Medium" },
              { w: "600", label: "SemiBold" },
              { w: "700", label: "Bold" },
            ].map((wt) => (
              <div
                key={wt.w}
                className="font-sans text-ink py-1"
                style={{ fontSize: "1.25rem", fontWeight: wt.w }}
              >
                Aa Bb Cc 01 23
                <span className="text-[10px] text-slate ml-3">{wt.label} ({wt.w})</span>
              </div>
            ))}
          </div>
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              IBM PLEX SERIF
            </div>
            {[
              { w: "300", label: "Light" },
              { w: "400", label: "Regular" },
              { w: "500", label: "Medium" },
              { w: "600", label: "SemiBold" },
              { w: "700", label: "Bold" },
            ].map((wt) => (
              <div
                key={wt.w}
                className="font-serif text-ink py-1"
                style={{ fontSize: "1.25rem", fontWeight: wt.w }}
              >
                Aa Bb Cc 01 23
                <span className="text-[10px] text-slate ml-3">{wt.label} ({wt.w})</span>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      <SubSection label="Character Set">
        <div className="border border-ink bg-white p-8">
          <div
            className="font-mono text-ink leading-loose tracking-widest break-all"
            style={{ fontSize: "1.25rem" }}
          >
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </div>
          <div
            className="font-mono text-ink leading-loose tracking-widest break-all mt-2"
            style={{ fontSize: "1.25rem" }}
          >
            abcdefghijklmnopqrstuvwxyz
          </div>
          <div
            className="font-mono text-ink leading-loose tracking-widest break-all mt-2"
            style={{ fontSize: "1.25rem" }}
          >
            0123456789
          </div>
          <div
            className="font-mono text-slate leading-loose tracking-widest break-all mt-2"
            style={{ fontSize: "1.25rem" }}
          >
            {"§ · — / ( ) [ ] { } # @ & % $ ¶"}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 4.2 — IBM PLEX MONO, FULL CHARACTER SET
        </div>
      </SubSection>

      <SubSection label="Tracking & Leading">
        <div className="space-y-6">
          <div className="border-b border-fog pb-4">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
              HEADINGS
            </div>
            <p className="text-[13px] text-graphite">
              Tracking: 0.01em–0.02em. Leading: 1.1–1.3. Tight but legible.
            </p>
          </div>
          <div className="border-b border-fog pb-4">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
              LABELS & CODES
            </div>
            <p className="text-[13px] text-graphite">
              Tracking: 0.15em–0.4em. All-caps. Widely spaced for legibility at small sizes.
            </p>
          </div>
          <div className="border-b border-fog pb-4">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
              BODY COPY
            </div>
            <p className="text-[13px] text-graphite">
              Tracking: normal. Leading: 1.6–1.7. Generous line height for extended reading.
            </p>
          </div>
        </div>
      </SubSection>
    </div>
  );
}
