import { SectionHeader, SubSection } from "../SectionHeader";
import { LICLogoMark, LICWordmark, LICModuleTag } from "../LICLogo";

export function LogoMarks() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="02"
        title="Logo & Marks"
        subtitle="The LIC identity is built on geometry, striped letterforms, and strict reproduction rules. Every mark must convey institutional permanence."
      />

      <SubSection label="Primary Mark — Light Background">
        <div className="border border-ink bg-paper p-12 flex items-center justify-center">
          <LICLogoMark size="large" />
        </div>
        <div className="mt-4 font-mono text-[10px] text-slate tracking-wider">
          FIG. 2.1 — PRIMARY MARK, STANDARD APPLICATION
        </div>
      </SubSection>

      <SubSection label="Primary Mark — Dark Background">
        <div className="border border-ink bg-ink p-12 flex items-center justify-center">
          <LICLogoMark size="large" inverted />
        </div>
        <div className="mt-4 font-mono text-[10px] text-slate tracking-wider">
          FIG. 2.2 — PRIMARY MARK, REVERSED APPLICATION
        </div>
      </SubSection>

      <SubSection label="Mark Sizes">
        <div className="space-y-8">
          {(["xlarge", "large", "medium", "small"] as const).map((s) => (
            <div key={s} className="flex items-end gap-6">
              <LICLogoMark size={s} />
              <span className="font-mono text-[10px] text-slate tracking-wider uppercase">
                {s}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Construction Notes">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-mono text-[12px] tracking-wider text-ink">
              STRIPED TREATMENT
            </h4>
            <p className="text-[13px] text-slate leading-relaxed">
              The horizontal knockout lines through the letterforms are a direct
              reference to the IBM striped identity system. Three stripes at
              consistent vertical intervals create rhythm and pattern
              recognition at any scale.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-mono text-[12px] tracking-wider text-ink">
              CLEAR SPACE
            </h4>
            <p className="text-[13px] text-slate leading-relaxed">
              Minimum clear space around the mark equals the height of the "I"
              letterform. No other graphic elements, type, or page edges may
              intrude into this zone.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-mono text-[12px] tracking-wider text-ink">
              REPRODUCTION
            </h4>
            <p className="text-[13px] text-slate leading-relaxed">
              The mark must only appear in Ink Black on Paper White, or Paper
              White on Ink Black. No gradients, shadows, outlines, or color
              variations are permitted.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-mono text-[12px] tracking-wider text-ink">
              MINIMUM SIZE
            </h4>
            <p className="text-[13px] text-slate leading-relaxed">
              The mark must not be reproduced smaller than 80px wide in digital
              or 20mm wide in print. Below this threshold, the stripe detail is
              lost.
            </p>
          </div>
        </div>
      </SubSection>

      <SubSection label="Wordmark">
        <div className="border border-ink bg-paper p-8">
          <LICWordmark />
        </div>
        <div className="mt-4 border border-ink bg-ink p-8">
          <LICWordmark inverted />
        </div>
        <div className="mt-4 font-mono text-[10px] text-slate tracking-wider">
          FIG. 2.3 — WORDMARK, STANDARD AND REVERSED
        </div>
        <p className="text-[13px] text-slate mt-4 max-w-lg leading-relaxed">
          The wordmark uses IBM Plex Mono at 14px with 0.25em letter spacing.
          Used in contexts where the striped mark is too small or when a text-only
          treatment is required.
        </p>
      </SubSection>

      <SubSection label="Module Tags">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Module tags are used in UI, file labels, and print collateral to
          identify product modules. Format: LIC / [MODULE] with abbreviated
          code.
        </p>
        <div className="flex flex-wrap gap-3">
          <LICModuleTag module="INTAKE" code="INTK" />
          <LICModuleTag module="EVAL" code="EVAL" />
          <LICModuleTag module="DRAFT" code="DRFT" />
          <LICModuleTag module="DISCOVERY" code="DISC" />
          <LICModuleTag module="DOCKET" code="DCKT" />
          <LICModuleTag module="CLIENT" code="CLNT" />
        </div>
      </SubSection>

      <SubSection label="Prohibited Uses">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            "Do not rotate or skew the mark",
            "Do not apply color to the mark",
            "Do not add drop shadows or effects",
            "Do not stretch or compress",
            "Do not place on busy backgrounds",
            "Do not rearrange mark elements",
          ].map((rule, i) => (
            <div
              key={i}
              className="border border-filing-red/30 bg-filing-red/5 p-4"
            >
              <div className="font-mono text-[10px] text-filing-red tracking-wider mb-2">
                ✕
              </div>
              <p className="text-[12px] text-slate">{rule}</p>
            </div>
          ))}
        </div>
      </SubSection>
    </div>
  );
}
