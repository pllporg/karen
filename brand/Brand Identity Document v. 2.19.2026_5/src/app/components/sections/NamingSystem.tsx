import { SectionHeader, SubSection } from "../SectionHeader";
import { LICModuleTag } from "../LICLogo";

const modules = [
  {
    name: "LIC / INTAKE",
    code: "INTK",
    description: "New matters, conflicts intake packet, summaries",
    operator: "Operator 01",
    operatorRole: "Intake",
  },
  {
    name: "LIC / EVAL",
    code: "EVAL",
    description: "Initial case evaluation memos, claim mapping",
    operator: "Operator 02",
    operatorRole: "Evaluation",
  },
  {
    name: "LIC / DRAFT",
    code: "DRFT",
    description: "Pleadings, motions, letters, outlines",
    operator: "Operator 03",
    operatorRole: "Drafting",
  },
  {
    name: "LIC / DISCOVERY",
    code: "DISC",
    description: "Requests, responses, depo kits, exhibit indexes",
    operator: "Operator 04",
    operatorRole: "Discovery",
  },
  {
    name: "LIC / DOCKET",
    code: "DCKT",
    description: "Deadlines, next-step prompts, task pushing",
    operator: "Operator 05",
    operatorRole: "Docket",
  },
  {
    name: "LIC / CLIENT",
    code: "CLNT",
    description: "Status updates, monthly reports, timelines",
    operator: "Operator 06",
    operatorRole: "Client Updates",
  },
];

export function NamingSystem() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="05"
        title="Naming & Architecture"
        subtitle="Product modules, agent designations, and the code system. Everything reads like a standards manual—not a feature list."
      />

      <SubSection label="Naming Convention">
        <div className="border border-ink bg-white p-8 mb-6">
          <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
            FORMAT
          </div>
          <div className="font-mono text-ink tracking-wide" style={{ fontSize: "1.5rem" }}>
            LIC / [MODULE]
          </div>
          <div className="mt-3 font-mono text-[13px] text-slate tracking-wide">
            or LIC–[CODE]
          </div>
        </div>
        <p className="text-[13px] text-slate max-w-lg leading-relaxed">
          The module + code system mirrors internal catalog conventions. It
          signals structure, not marketing. Each module has a full name and a
          four-character abbreviated code for UI tags, file labels, and print
          contexts.
        </p>
      </SubSection>

      <SubSection label="Product Modules">
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {modules.map((m) => (
            <div
              key={m.code}
              className="p-5 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
            >
              <div className="md:col-span-4">
                <LICModuleTag module={m.name.split("/ ")[1]} code={m.code} />
              </div>
              <div className="md:col-span-5">
                <p className="text-[13px] text-graphite">{m.description}</p>
              </div>
              <div className="md:col-span-3">
                <div className="font-mono text-[10px] text-slate tracking-wider">
                  {m.operator}
                </div>
                <div className="font-mono text-[11px] text-ink">
                  {m.operatorRole}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Module Codes — Quick Reference">
        <div className="flex flex-wrap gap-4">
          {modules.map((m) => (
            <div key={m.code} className="border border-ink bg-white px-6 py-4 text-center min-w-[100px]">
              <div className="font-mono text-ink tracking-[0.2em]" style={{ fontSize: "1.25rem" }}>
                {m.code}
              </div>
              <div className="font-mono text-[9px] text-slate tracking-wider mt-1">
                {m.name.split("/ ")[1]}
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      <SubSection label="Agent Naming Convention">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Agents are designated by role title and unit number. No personality
          names. No mascots. No buddy names. This reads like a controlled
          workforce roster, not a consumer product.
        </p>
        <div className="border border-ink bg-ink text-paper">
          <div className="px-6 py-3 border-b border-graphite">
            <div className="font-mono text-[10px] tracking-[0.3em] text-silver">
              OPERATOR REGISTRY
            </div>
          </div>
          {modules.map((m, i) => (
            <div
              key={m.code}
              className={`px-6 py-4 flex items-baseline gap-6 ${
                i < modules.length - 1 ? "border-b border-graphite" : ""
              }`}
            >
              <span className="font-mono text-[11px] text-silver w-20">
                {m.operator.replace("Operator ", "OP–")}
              </span>
              <span className="font-mono text-[13px] text-paper tracking-wide flex-1">
                {m.operatorRole}
              </span>
              <span className="font-mono text-[10px] text-slate tracking-wider">
                {m.code}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 font-mono text-[9px] text-slate tracking-wider">
          FIG. 5.1 — OPERATOR REGISTRY, COMPLETE ROSTER
        </div>
      </SubSection>

      <SubSection label="File Labeling Convention">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          All generated work product carries a standardized label in the
          header or footer. Format:
        </p>
        <div className="border border-ink bg-white p-6 font-mono text-[12px] text-ink tracking-wide space-y-2">
          <div>LIC–DRFT–2026.02.18–001</div>
          <div className="text-[10px] text-slate tracking-wider">
            ↑ ORG — ↑ MODULE — ↑ DATE — ↑ SEQUENCE
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <p className="text-[12px] text-graphite">
            <span className="font-mono text-ink">LIC–INTK–2026.02.18–003</span>{" "}
            — Third intake packet, Feb 18 2026
          </p>
          <p className="text-[12px] text-graphite">
            <span className="font-mono text-ink">LIC–DISC–2026.01.05–012</span>{" "}
            — Twelfth discovery output, Jan 5 2026
          </p>
          <p className="text-[12px] text-graphite">
            <span className="font-mono text-ink">LIC–CLNT–2026.03.01–001</span>{" "}
            — First client update, Mar 1 2026
          </p>
        </div>
      </SubSection>

      <SubSection label="Naming Prohibitions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-filing-red/30 bg-filing-red/5 p-6">
            <div className="font-mono text-[10px] text-filing-red tracking-wider mb-3">
              NEVER USE
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Personality names (e.g., "Max," "Aria," "Scout")</li>
              <li>— Cutesy abbreviations</li>
              <li>— Anthropomorphic language</li>
              <li>— "Smart," "genius," or "intelligent" as product names</li>
              <li>— Exclamation points in product names</li>
            </ul>
          </div>
          <div className="border border-ledger/30 bg-ledger/5 p-6">
            <div className="font-mono text-[10px] text-ledger tracking-wider mb-3">
              ALWAYS USE
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Module / code naming convention</li>
              <li>— Operator + unit number for agents</li>
              <li>— Four-character codes for abbreviated contexts</li>
              <li>— ISO-style date formats (YYYY.MM.DD)</li>
              <li>— Sequential numbering (zero-padded)</li>
            </ul>
          </div>
        </div>
      </SubSection>
    </div>
  );
}
