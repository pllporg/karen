import { SectionHeader, SubSection } from "../SectionHeader";

export function MessagingVoice() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="06"
        title="Messaging & Voice"
        subtitle="How LIC speaks. Declarative. Dry. Documentation over adjectives. Numbers over claims."
      />

      <SubSection label="One-Line Descriptor">
        <div className="border border-ink bg-white p-8">
          <div className="font-mono text-ink tracking-wide" style={{ fontSize: "1.5rem" }}>
            Agentic litigation operations.
          </div>
        </div>
      </SubSection>

      <SubSection label="Primary Tagline">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment">
          <div className="font-serif italic text-ink" style={{ fontSize: "2rem", lineHeight: 1.2 }}>
            Casework, continuous.
          </div>
        </div>
        <div className="mt-6 font-mono text-[10px] text-slate tracking-wider mb-4">
          ALTERNATE CANDIDATES
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Litigation work. Executed.",
            "A workforce for the docket.",
            "Operational intelligence for litigation.",
            "Work product at scale.",
            "Move the matter forward.",
          ].map((t) => (
            <div
              key={t}
              className="border border-fog bg-white px-5 py-3 font-mono text-[13px] text-graphite tracking-wide"
            >
              {t}
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Messaging Pillars">
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            {
              pillar: "Throughput",
              message:
                "More work product per week without adding headcount.",
            },
            {
              pillar: "Continuity",
              message: "Cases move even when people are busy.",
            },
            {
              pillar: "Control",
              message:
                "Policies, review gates, and firm-defined standards.",
            },
            {
              pillar: "Traceability",
              message:
                "Every output attributable, timestamped, auditable.",
            },
            {
              pillar: "Client Confidence",
              message:
                "Predictable updates. Fewer 'just checking in' emails.",
            },
          ].map((p) => (
            <div
              key={p.pillar}
              className="p-5 bg-white flex flex-col md:flex-row md:items-baseline gap-2"
            >
              <span className="font-mono text-[12px] tracking-wider text-ink w-44 shrink-0 uppercase">
                {p.pillar}
              </span>
              <span className="font-serif text-[14px] text-graphite italic">
                "{p.message}"
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Tone of Voice Rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {[
            "Prefer declarative sentences.",
            "Prefer nouns and verbs over adjectives.",
            "Use labels, codes, and headings like internal documentation.",
            'No breathless futurism ("revolutionary," "magic," "game-changing").',
            "Use numbers when possible (cycles, deadlines, pages, turnarounds).",
            "Write as if for a standards manual, not a marketing page.",
          ].map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-fog pb-3"
            >
              <span className="font-mono text-[10px] text-silver mt-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[13px] text-graphite leading-relaxed">
                {r}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Voice Examples">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC communications read like system status messages. Short.
          Factual. Action-oriented. No hedging, no excitement.
        </p>
        <div className="space-y-0 border border-ink">
          {[
            "Draft ready for attorney review.",
            "Discovery responses assembled. Issues flagged.",
            "Next steps issued. Awaiting approval to file.",
            "Client update sent. Timeline attached.",
            "Intake packet complete. Conflicts check pending.",
            "Evaluation memo drafted. Risk factors indexed.",
            "Deadline approaching: response due in 72 hours.",
            "Matter status: active. Last action: 4 hours ago.",
          ].map((ex, i) => (
            <div
              key={i}
              className={`px-6 py-3 font-mono text-[13px] tracking-wide ${
                i % 2 === 0
                  ? "bg-white text-ink"
                  : "bg-parchment text-ink"
              }`}
            >
              {ex}
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 6.1 — SYSTEM VOICE SPECIMENS
        </div>
      </SubSection>

      <SubSection label="Vocabulary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="font-mono text-[10px] text-ledger tracking-wider mb-4">
              PREFERRED TERMS
            </div>
            <div className="space-y-2">
              {[
                ["Operator", "not assistant, helper, bot"],
                ["Workforce", "not tool, product, platform"],
                ["Casework", "not tasks, projects, workflows"],
                ["Work product", "not output, content, results"],
                ["Advance", "not accelerate, supercharge, boost"],
                ["Execute", "not handle, process, manage"],
                ["Procedural", "not automated, smart, intelligent"],
                ["Auditable", "not transparent, open, visible"],
              ].map(([term, note]) => (
                <div
                  key={term}
                  className="flex items-baseline gap-3 text-[12px]"
                >
                  <span className="font-mono text-ink tracking-wide w-28 shrink-0">
                    {term}
                  </span>
                  <span className="text-slate">{note}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-filing-red tracking-wider mb-4">
              PROHIBITED TERMS
            </div>
            <div className="space-y-2">
              {[
                "Revolutionary",
                "Game-changing",
                "Magic / magical",
                "Breakthrough",
                "Next-generation",
                "Cutting-edge",
                "Disruptive",
                "Superpower",
              ].map((term) => (
                <div
                  key={term}
                  className="flex items-baseline gap-2 text-[12px] text-slate"
                >
                  <span className="text-filing-red">✕</span>
                  <span className="line-through">{term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection label="Writing Samples — Before / After">
        <div className="space-y-6">
          {[
            {
              before:
                "Our revolutionary AI assistant helps lawyers work smarter and faster than ever before!",
              after:
                "LIC / DRAFT produces attorney-ready pleadings. Average turnaround: 4 hours.",
            },
            {
              before:
                "Say goodbye to boring discovery work forever with our magical AI platform!",
              after:
                "Discovery responses assembled and indexed. Issues flagged for review.",
            },
            {
              before:
                "Our cutting-edge technology is transforming the way law firms operate!",
              after:
                "Casework advances continuously. 6 modules. Auditable output.",
            },
          ].map((s, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="border border-filing-red/20 bg-filing-red/5 p-5">
                <div className="font-mono text-[9px] text-filing-red tracking-wider mb-2">
                  ✕ BEFORE
                </div>
                <p className="text-[13px] text-graphite leading-relaxed">
                  {s.before}
                </p>
              </div>
              <div className="border border-ledger/20 bg-ledger/5 p-5">
                <div className="font-mono text-[9px] text-ledger tracking-wider mb-2">
                  — AFTER
                </div>
                <p className="text-[13px] text-graphite leading-relaxed">
                  {s.after}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SubSection>
    </div>
  );
}
