import { SectionHeader, SubSection } from "../SectionHeader";

export function BrandFoundation() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="01"
        title="Brand Foundation"
        subtitle="Positioning, promise, audience, personality, and values. The strategic framework that governs all communications."
      />

      <SubSection label="Positioning">
        <div className="border border-ink p-8 bg-white mb-6">
          <p
            className="font-mono text-ink tracking-wide"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            "Operations-grade casework."
          </p>
        </div>
        <p className="text-[14px] leading-relaxed text-graphite max-w-xl">
          LIC is not "AI that helps lawyers brainstorm." LIC is a procedural
          engine—staffing and case movement as a system. The distinction is
          critical: LIC provides a workforce, not a tool.
        </p>
      </SubSection>

      <SubSection label="Brand Promise">
        <div className="border-l-2 border-ink pl-6 py-2">
          <p
            className="font-serif italic text-ink"
            style={{ fontSize: "1.25rem", lineHeight: 1.4 }}
          >
            Every case advances.
          </p>
          <p className="font-mono text-[12px] text-slate mt-2 tracking-wide">
            Not eventually. Not when someone remembers. Continuously.
          </p>
        </div>
      </SubSection>

      <SubSection label="Audience">
        <div className="grid gap-px bg-ink">
          {[
            {
              role: "Litigation firm partners",
              concern: "Cost, leverage, risk, throughput",
            },
            {
              role: "Practice ops / firm administrators",
              concern: "Process, staffing, SOP compliance",
            },
            {
              role: "Senior associates",
              concern: "Drafting volume, discovery grind, client comms",
            },
          ].map((a) => (
            <div key={a.role} className="bg-paper p-5 flex flex-col md:flex-row md:items-baseline gap-2">
              <span className="font-mono text-[12px] tracking-wide text-ink w-64 shrink-0">
                {a.role}
              </span>
              <span className="text-[13px] text-slate">{a.concern}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Personality">
        <p className="text-[13px] text-slate mb-6 max-w-lg">
          The "corporation" in the name is real. LIC communicates with the
          measured confidence of an established institution.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {[
            { trait: "Stoic", desc: "No hype, no evangelism" },
            { trait: "Exacting", desc: "Procedural, evidence-minded" },
            { trait: "Dry", desc: "Documentation beats adjectives" },
            { trait: "Conservative", desc: "Stability > novelty" },
            { trait: "Unshowy", desc: "Authority without ornament" },
          ].map((p) => (
            <div key={p.trait} className="flex items-baseline gap-4 border-b border-fog pb-3">
              <span className="font-mono text-[13px] tracking-wide text-ink">
                {p.trait}
              </span>
              <span className="text-[12px] text-slate">{p.desc}</span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Values">
        <div className="space-y-0">
          {[
            "Procedural clarity",
            "Accountability & audit trails",
            "Discretion",
            "Throughput with control",
            "Work product standards",
          ].map((v, i) => (
            <div
              key={v}
              className="flex items-baseline gap-4 py-3 border-b border-fog"
            >
              <span className="font-mono text-[10px] text-silver w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-[13px] tracking-wide text-ink">
                {v}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="What LIC Is">
        <p className="text-[14px] leading-relaxed text-graphite max-w-xl">
          Legal Intelligence Corporation provides litigation firms with an
          agentic workforce that executes and advances casework: intake, case
          evaluation, drafting, discovery, matter management, and client
          updates—proactively, continuously, and with auditability.
        </p>
      </SubSection>
    </div>
  );
}
