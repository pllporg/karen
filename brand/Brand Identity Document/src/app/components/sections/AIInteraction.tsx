import { SectionHeader, SubSection } from "../SectionHeader";

export function AIInteraction() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="09"
        title="AI Interaction"
        subtitle="How the user works with machine intelligence. LIC deploys two interaction paradigms: structured agents that file deliverables on schedule, and a Universal Interface through which the user directs any operation. Both are governed by the same principle: AI is workforce, not feature."
      />

      {/* Governing Philosophy */}
      <SubSection label="Governing Philosophy">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment">
          <div
            className="font-serif italic text-ink"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            The AI is not an assistant. It is an employee—one that files reports, follows procedure, and submits its work for review.
          </div>
        </div>
        <p className="text-[14px] text-graphite mt-6 max-w-xl leading-relaxed">
          LIC's agentic workforce operates within the same chain of accountability as a human team. Agents hold roles. They produce work product. They follow protocols. They are supervised. The interface must reflect this: the user is not "chatting with AI"—they are managing a department.
        </p>
        <div className="mt-8 border border-ink bg-white p-8">
          <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-6">
            THE FOUR PRINCIPLES
          </div>
          <div className="space-y-6">
            {[
              {
                num: "I",
                rule: "AI is workforce, not magic.",
                elaboration:
                  "Every AI output is a work product—a draft, a report, an analysis. It is filed, timestamped, attributed to an operator, and subject to review. There is no \"AI generated this\" mystique. It is simply the work.",
              },
              {
                num: "II",
                rule: "Every output has provenance.",
                elaboration:
                  "The user must always know: which agent produced this, when, from what inputs, under what instructions, and with what confidence. Provenance is metadata, not a feature toggle.",
              },
              {
                num: "III",
                rule: "The human reviews. The machine produces.",
                elaboration:
                  "No AI output goes to a client, a court, or a filing without human review. The interface enforces review gates—not as guardrails, but as workflow steps. The attorney is the final authority.",
              },
              {
                num: "IV",
                rule: "Uncertainty is stated, never hidden.",
                elaboration:
                  "When an agent is unsure, it says so—in plain language, at the point of uncertainty, with a recommended next step. Confidence is not a percentage. It is a professional judgment: \"This citation requires verification.\"",
              },
            ].map((r) => (
              <div
                key={r.num}
                className="flex items-start gap-6 border-b border-fog pb-6 last:border-0 last:pb-0"
              >
                <span
                  className="font-serif text-ink italic w-8 shrink-0"
                  style={{ fontSize: "1.25rem" }}
                >
                  {r.num}
                </span>
                <div>
                  <div className="font-mono text-[14px] text-ink tracking-wide">
                    {r.rule}
                  </div>
                  <p className="text-[13px] text-slate mt-2 leading-relaxed max-w-lg">
                    {r.elaboration}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Agent Taxonomy */}
      <SubSection label="Agent Taxonomy">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC deploys three agent archetypes. Each has a defined role, output type, operational cadence, and reporting structure. Agents are referred to by role, never by technology. They are operators—not models, not bots, not copilots.
        </p>
        <div className="space-y-6">
          {/* Associate */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-4 border-b border-ink bg-ink text-paper flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[18px] tracking-wide">Associate</span>
                <span className="font-mono text-[10px] text-silver tracking-[0.2em] border border-silver/30 px-3 py-1">
                  AGENT CLASS: ASSOC
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate tracking-wider">
                PRODUCTION ROLE
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    PRIMARY FUNCTION
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Drafts work product. Motions, memos, discovery responses, client updates, contract reviews. Produces complete first-draft documents ready for attorney review.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    OUTPUT TYPE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Structured documents filed under a matter ID. Each output includes a cover sheet, issue flags, citation list, and confidence annotations.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    CADENCE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    On demand or scheduled. Typical: assigned a task, delivers within hours. May also run daily production cycles for recurring deliverables.
                  </p>
                </div>
              </div>
              <div className="border-t border-fog pt-4">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  EXAMPLE DELIVERABLES
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Motion to Compel",
                    "Discovery Response Set",
                    "Case Summary Memo",
                    "Client Status Update",
                    "Contract Redline",
                    "Deposition Outline",
                  ].map((d) => (
                    <span
                      key={d}
                      className="font-mono text-[11px] text-ink tracking-wide border border-ink px-3 py-1.5"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auditor */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-4 border-b border-ink bg-ink text-paper flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[18px] tracking-wide">Auditor</span>
                <span className="font-mono text-[10px] text-silver tracking-[0.2em] border border-silver/30 px-3 py-1">
                  AGENT CLASS: AUDT
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate tracking-wider">
                OVERSIGHT ROLE
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    PRIMARY FUNCTION
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Reviews work product for compliance, accuracy, and completeness. Checks citations, validates formatting, flags inconsistencies, and verifies procedural requirements.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    OUTPUT TYPE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Audit reports filed against a source document. Itemized findings with severity ratings (Critical, Warning, Note). Pass/fail determination.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    CADENCE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Triggered automatically on document submission. Also runs daily sweeps across active matters. Can be invoked on demand for targeted review.
                  </p>
                </div>
              </div>
              <div className="border-t border-fog pt-4">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  EXAMPLE DELIVERABLES
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Citation Verification Report",
                    "Compliance Checklist",
                    "Formatting Audit",
                    "Deadline Conformance Review",
                    "Privilege Screen Report",
                    "Cross-Reference Validation",
                  ].map((d) => (
                    <span
                      key={d}
                      className="font-mono text-[11px] text-ink tracking-wide border border-ink px-3 py-1.5"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Analyst */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-4 border-b border-ink bg-ink text-paper flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[18px] tracking-wide">Analyst</span>
                <span className="font-mono text-[10px] text-silver tracking-[0.2em] border border-silver/30 px-3 py-1">
                  AGENT CLASS: ANLS
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate tracking-wider">
                INTELLIGENCE ROLE
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    PRIMARY FUNCTION
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Synthesizes information across matters, dockets, and external sources. Produces situation reports, risk assessments, timeline analyses, and strategic summaries.
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    OUTPUT TYPE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Analytical reports with structured findings, data tables, and recommended actions. May include visualizations (timeline charts, relationship maps).
                  </p>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                    CADENCE
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed">
                    Daily briefings filed each morning. On-demand deep analyses when assigned. Continuous monitoring reports for high-priority matters.
                  </p>
                </div>
              </div>
              <div className="border-t border-fog pt-4">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  EXAMPLE DELIVERABLES
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Daily Docket Briefing",
                    "Opposing Counsel Profile",
                    "Case Risk Assessment",
                    "Precedent Analysis",
                    "Timeline Reconstruction",
                    "Settlement Range Analysis",
                  ].map((d) => (
                    <span
                      key={d}
                      className="font-mono text-[11px] text-ink tracking-wide border border-ink px-3 py-1.5"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.1 — AGENT TAXONOMY, THREE ARCHETYPES
        </div>
      </SubSection>

      {/* Agent Report Format */}
      <SubSection label="Agent Report Format">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every agent files its output as a structured report. The format is uniform across all agent classes. Reports are documents, not messages—they are filed, not sent.
        </p>

        {/* Report specimen */}
        <div className="border border-ink bg-white">
          <div className="px-8 py-4 border-b border-ink bg-parchment">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
              AGENT REPORT — SPECIMEN
            </div>
          </div>

          {/* Report header */}
          <div className="px-8 py-6 border-b border-fog">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-2">
                  DAILY DOCKET BRIEFING
                </div>
                <div
                  className="font-mono text-ink tracking-wide"
                  style={{ fontSize: "1.125rem" }}
                >
                  Morning Intelligence Report — All Active Matters
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="font-mono text-[10px] text-slate tracking-wider">
                  LIC–ANLS–2026.02.18–001
                </div>
                <div className="font-mono text-[10px] text-silver tracking-wider">
                  ANALYST · OP–07
                </div>
              </div>
            </div>
          </div>

          {/* Report metadata bar */}
          <div className="px-8 py-3 border-b border-fog bg-parchment/50 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "FILED", value: "06:00 UTC" },
              { label: "MATTERS", value: "12 active" },
              { label: "FLAGS", value: "3 critical" },
              { label: "CONFIDENCE", value: "High" },
              { label: "REVIEW", value: "Pending" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono text-[8px] text-silver tracking-wider">
                  {m.label}
                </div>
                <div className="font-mono text-[12px] text-ink tracking-wide">
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Report body summary */}
          <div className="px-8 py-6 space-y-4">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-3">
              EXECUTIVE SUMMARY
            </div>
            <p className="text-[13px] text-graphite leading-relaxed max-w-lg">
              Three matters require immediate attention. Williams v. Apex Corp response deadline in 48 hours—draft complete, pending review. Chen v. Metro Health discovery deficiency identified by Auditor OP–09; remediation drafted. New matter intake: Rodriguez v. Pacific Mutual assigned to Associate OP–03.
            </p>

            {/* Flagged items */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
                FLAGGED ITEMS
              </div>
              {[
                {
                  severity: "CRITICAL",
                  color: "bg-filing-red",
                  borderColor: "border-filing-red/30",
                  bgColor: "bg-filing-red/5",
                  matter: "Williams v. Apex Corp",
                  note: "Response deadline in 48 hours. Draft filed but not reviewed.",
                },
                {
                  severity: "CRITICAL",
                  color: "bg-filing-red",
                  borderColor: "border-filing-red/30",
                  bgColor: "bg-filing-red/5",
                  matter: "Chen v. Metro Health",
                  note: "Discovery deficiency identified. Remediation requires attorney decision.",
                },
                {
                  severity: "WARNING",
                  color: "bg-institutional",
                  borderColor: "border-institutional/30",
                  bgColor: "bg-institutional/5",
                  matter: "Park v. Consolidated",
                  note: "Opposing counsel filed amended complaint. Analysis in progress.",
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`border ${f.borderColor} ${f.bgColor} p-4 flex items-start gap-4`}
                >
                  <div className={`${f.color} w-1.5 h-full min-h-[36px] shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-ink tracking-wider">
                        {f.severity}
                      </span>
                      <span className="font-mono text-[11px] text-slate">
                        {f.matter}
                      </span>
                    </div>
                    <p className="text-[12px] text-graphite mt-1">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report footer */}
          <div className="px-8 py-3 border-t border-fog bg-parchment flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="font-mono text-[9px] text-slate tracking-wider">
              GENERATED BY LIC / ANALYST · OP–07 · AUTOMATED DAILY BRIEFING
            </div>
            <div className="font-mono text-[9px] text-slate tracking-wider">
              2026.02.18 · 06:00 UTC · REVIEW GATE: PENDING
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.2 — AGENT REPORT, CANONICAL FORMAT
        </div>

        {/* Report anatomy */}
        <div className="mt-8 border border-ink divide-y divide-ink">
          {[
            {
              element: "Report header",
              required: true,
              content: "Report type label, title, document ID, agent class, operator number.",
            },
            {
              element: "Metadata bar",
              required: true,
              content: "Filing timestamp, scope metrics, flag count, confidence level, review status.",
            },
            {
              element: "Executive summary",
              required: true,
              content: "2–4 sentences. What happened, what needs attention, what changed since last report.",
            },
            {
              element: "Flagged items",
              required: false,
              content: "Itemized findings with severity (Critical / Warning / Note). Each links to source.",
            },
            {
              element: "Detail sections",
              required: false,
              content: "Full analysis, data tables, citations, supporting evidence. Agent-class specific.",
            },
            {
              element: "Confidence annotations",
              required: true,
              content: "Inline markers on any statement where the agent's certainty is below threshold.",
            },
            {
              element: "Report footer",
              required: true,
              content: "Generator credit, timestamp, review gate status. Identical format to document headers.",
            },
          ].map((el) => (
            <div key={el.element} className="p-5 bg-white flex items-start gap-6">
              <div className="w-40 shrink-0">
                <span className="font-mono text-[12px] text-ink tracking-wide">
                  {el.element}
                </span>
                <div className="mt-1">
                  <span
                    className={`font-mono text-[9px] tracking-wider ${el.required ? "text-filing-red" : "text-silver"}`}
                  >
                    {el.required ? "REQUIRED" : "CONDITIONAL"}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-slate leading-relaxed flex-1">
                {el.content}
              </p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Agent Delivery Patterns */}
      <SubSection label="Agent Delivery & Cadence Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Agents file reports according to defined schedules or in response to triggers. The user does not "ask the AI" for a report—they receive it as they would from a junior team member. Reports appear in the work queue, not in a chat window.
        </p>
        <div className="border border-ink">
          {/* Header */}
          <div className="bg-ink text-paper grid grid-cols-4 gap-0">
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              DELIVERY MODE
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              TRIGGER
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              DESTINATION
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              EXAMPLE
            </div>
          </div>
          {[
            {
              mode: "Scheduled",
              trigger: "Time-based (daily, weekly)",
              dest: "Work queue, filed under matter",
              example: "Daily docket briefing at 06:00 UTC",
            },
            {
              mode: "On demand",
              trigger: "User assigns task",
              dest: "Work queue, filed under matter",
              example: "\"Draft motion to compel for Williams\"",
            },
            {
              mode: "Triggered",
              trigger: "System event (new filing, deadline)",
              dest: "Alert queue + filed report",
              example: "Amended complaint filed → analysis generated",
            },
            {
              mode: "Continuous",
              trigger: "Monitoring loop",
              dest: "Dashboard + periodic reports",
              example: "Opposing counsel activity monitoring",
            },
            {
              mode: "Cascaded",
              trigger: "Output of another agent",
              dest: "Filed under source document",
              example: "Associate draft → Auditor review auto-triggered",
            },
          ].map((d, i) => (
            <div
              key={d.mode}
              className={`grid grid-cols-4 gap-0 border-t border-ink ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}
            >
              <div className="px-4 py-3 font-mono text-[11px] text-ink tracking-wide">
                {d.mode}
              </div>
              <div className="px-4 py-3 text-[12px] text-slate">{d.trigger}</div>
              <div className="px-4 py-3 text-[12px] text-slate">{d.dest}</div>
              <div className="px-4 py-3 font-mono text-[11px] text-silver">
                {d.example}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.3 — AGENT DELIVERY MODES
        </div>
      </SubSection>

      {/* Agent Status & Oversight */}
      <SubSection label="Agent Status & Oversight">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The user supervises agents the way a partner supervises associates: through status reports, work-in-progress visibility, and periodic review. Agents are never invisible. Their current state is always knowable.
        </p>

        {/* Agent status board specimen */}
        <div className="border border-ink bg-white">
          <div className="px-6 py-3 border-b border-ink bg-ink text-paper">
            <div className="font-mono text-[10px] tracking-[0.2em]">
              AGENT STATUS BOARD — SPECIMEN
            </div>
          </div>
          <div className="divide-y divide-ink">
            {[
              {
                op: "OP–03",
                class: "ASSOC",
                task: "Drafting: Williams motion to compel",
                status: "Working",
                statusColor: "bg-ledger",
                elapsed: "2h 14m",
                eta: "~45 min",
              },
              {
                op: "OP–07",
                class: "ANLS",
                task: "Daily briefing compilation",
                status: "Filed",
                statusColor: "bg-ink",
                elapsed: "12m",
                eta: "—",
              },
              {
                op: "OP–09",
                class: "AUDT",
                task: "Citation check: Chen discovery response",
                status: "Working",
                statusColor: "bg-ledger",
                elapsed: "38m",
                eta: "~20 min",
              },
              {
                op: "OP–03",
                class: "ASSOC",
                task: "Intake processing: Rodriguez v. Pacific Mutual",
                status: "Queued",
                statusColor: "bg-institutional",
                elapsed: "—",
                eta: "Awaiting OP–03",
              },
              {
                op: "OP–09",
                class: "AUDT",
                task: "Formatting audit: Park amended complaint analysis",
                status: "Blocked",
                statusColor: "bg-filing-red",
                elapsed: "—",
                eta: "Needs input",
              },
            ].map((a, i) => (
              <div
                key={`${a.op}-${a.task}`}
                className={`px-6 py-4 grid grid-cols-12 gap-3 items-center ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}
              >
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-[11px] text-ink tracking-wide">
                    {a.op}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <span className="font-mono text-[10px] text-slate tracking-wider">
                    {a.class}
                  </span>
                </div>
                <div className="col-span-8 md:col-span-5">
                  <span className="text-[12px] text-ink">{a.task}</span>
                </div>
                <div className="col-span-4 md:col-span-2 flex items-center gap-2">
                  <div className={`${a.statusColor} w-1.5 h-1.5 shrink-0`} />
                  <span className="font-mono text-[11px] text-ink tracking-wide">
                    {a.status}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-1">
                  <span className="font-mono text-[10px] text-silver tracking-wider">
                    {a.elapsed}
                  </span>
                </div>
                <div className="col-span-4 md:col-span-2">
                  <span className="font-mono text-[10px] text-silver tracking-wider">
                    {a.eta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.4 — AGENT STATUS BOARD, OPERATIONAL VIEW
        </div>

        {/* Agent states */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { state: "Idle", color: "bg-fog", desc: "No active task" },
            { state: "Queued", color: "bg-institutional", desc: "Task assigned, awaiting execution" },
            { state: "Working", color: "bg-ledger", desc: "Actively producing output" },
            { state: "Blocked", color: "bg-filing-red", desc: "Requires human input to proceed" },
            { state: "Filed", color: "bg-ink", desc: "Output delivered, awaiting review" },
          ].map((s) => (
            <div key={s.state} className="border border-ink bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`${s.color} w-2 h-2 shrink-0`} />
                <span className="font-mono text-[12px] text-ink tracking-wide">
                  {s.state}
                </span>
              </div>
              <p className="text-[11px] text-slate">{s.desc}</p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Review Gates */}
      <SubSection label="Review Gates & Approval">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          No agent output reaches a client, a court, or any external party without passing through a review gate. Review gates are workflow checkpoints, not optional features. The interface enforces them structurally.
        </p>
        <div className="border border-ink bg-white">
          <div className="px-8 py-6 border-b border-fog">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-4">
              REVIEW GATE FLOW
            </div>
            {/* Flow diagram */}
            <div className="flex flex-col md:flex-row items-stretch gap-0">
              {[
                { step: "01", label: "Agent produces", detail: "Work product filed", bg: "bg-parchment" },
                { step: "02", label: "Auto-audit", detail: "Auditor agent reviews", bg: "bg-institutional/5" },
                { step: "03", label: "Human review", detail: "Attorney examines", bg: "bg-parchment" },
                { step: "04", label: "Approved", detail: "Cleared for use", bg: "bg-ledger/5" },
              ].map((s, i) => (
                <div key={s.step} className="flex items-stretch flex-1">
                  <div className={`${s.bg} border border-ink p-4 flex-1`}>
                    <div className="font-mono text-[10px] text-silver tracking-wider mb-2">
                      STEP {s.step}
                    </div>
                    <div className="font-mono text-[12px] text-ink tracking-wide">
                      {s.label}
                    </div>
                    <div className="text-[11px] text-slate mt-1">{s.detail}</div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex items-center px-2 text-slate text-[14px]">
                      →
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 space-y-4">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-3">
              REVIEW ACTIONS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  action: "Approve",
                  desc: "Output cleared. May be used, filed, or sent as appropriate.",
                  button: "bg-ledger text-paper border-ledger",
                },
                {
                  action: "Approve with edits",
                  desc: "Attorney modifies output before clearance. Edits are tracked.",
                  button: "bg-ink text-paper border-ink",
                },
                {
                  action: "Return for revision",
                  desc: "Output sent back to originating agent with specific instructions.",
                  button: "bg-institutional text-paper border-institutional",
                },
                {
                  action: "Reject",
                  desc: "Output discarded. Reason logged. Agent may be reassigned.",
                  button: "bg-filing-red text-paper border-filing-red",
                },
              ].map((a) => (
                <div key={a.action} className="border border-fog p-4">
                  <button
                    className={`${a.button} font-mono text-[10px] tracking-widest px-4 py-2 uppercase border mb-3`}
                  >
                    {a.action}
                  </button>
                  <p className="text-[12px] text-slate leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      {/* Confidence & Uncertainty */}
      <SubSection label="Confidence & Uncertainty Communication">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Agents must communicate uncertainty in professional terms. No percentages. No color-coded confidence meters. The agent annotates its own work the way a careful attorney would: with specific caveats, flagged assumptions, and recommended verification steps.
        </p>

        <div className="space-y-6">
          {/* Annotation specimen */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-3 border-b border-fog bg-parchment">
              <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
                CONFIDENCE ANNOTATION — SPECIMEN (INLINE)
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-[14px] text-ink leading-relaxed max-w-lg">
                Defendant's failure to produce the requested documents within the 30-day period constitutes a violation of Rule 37(a)(3)(B).
                <span className="border-b-2 border-institutional/40 bg-institutional/5 px-1 mx-1">
                  The court in <em>Pinnacle Partners v. Thornton</em> (2024) applied a similar standard, though the holding was limited to electronically stored information.
                </span>
              </p>
              <div className="mt-4 border-l-2 border-institutional pl-4 py-2">
                <div className="font-mono text-[10px] text-institutional tracking-wider mb-1">
                  AGENT NOTE — VERIFICATION RECOMMENDED
                </div>
                <p className="text-[12px] text-slate leading-relaxed">
                  The <em>Pinnacle Partners</em> citation is contextually relevant but may not be directly on point for physical document production. Recommend attorney verify applicability to this motion's scope.
                </p>
              </div>
            </div>
          </div>

          {/* Uncertainty vocabulary */}
          <div className="border border-ink bg-ink text-paper p-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
              UNCERTAINTY VOCABULARY — PERMITTED LANGUAGE
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-[10px] text-ledger tracking-wider mb-3">
                  USE
                </div>
                <div className="space-y-3 text-[12px] text-silver">
                  <div>— "This citation requires verification."</div>
                  <div>— "Based on available case law; additional research may be warranted."</div>
                  <div>— "This analysis assumes [specific assumption]."</div>
                  <div>— "Applicable authority is limited. Consider [alternative]."</div>
                  <div>— "This fact could not be independently confirmed."</div>
                  <div>— "Recommend attorney review before reliance."</div>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-filing-red tracking-wider mb-3">
                  NEVER USE
                </div>
                <div className="space-y-3 text-[12px] text-slate">
                  <div className="line-through">— "I'm 85% confident that…"</div>
                  <div className="line-through">— "I think this might be…"</div>
                  <div className="line-through">— "I'm not sure, but…"</div>
                  <div className="line-through">— "This could be wrong."</div>
                  <div className="line-through">— "As an AI, I may make mistakes."</div>
                  <div className="line-through">— "Please double-check everything."</div>
                </div>
              </div>
            </div>
          </div>

          {/* Annotation levels */}
          <div className="border border-ink divide-y divide-ink">
            {[
              {
                level: "Verified",
                marker: "No annotation",
                meaning: "Agent has confirmed this against primary sources. No caveat needed.",
                color: "text-ink",
              },
              {
                level: "Standard",
                marker: "No annotation",
                meaning: "Agent's normal operating confidence. Routine work product. Review gate applies.",
                color: "text-ink",
              },
              {
                level: "Flag: Verify",
                marker: "Inline highlight + margin note",
                meaning: "Specific element requires human verification. Agent has identified the reason.",
                color: "text-institutional",
              },
              {
                level: "Flag: Assumption",
                marker: "Footnote-style annotation",
                meaning: "Analysis depends on a stated assumption. If assumption is wrong, conclusion changes.",
                color: "text-institutional",
              },
              {
                level: "Flag: Insufficient data",
                marker: "Block-level callout",
                meaning: "Agent cannot complete analysis with available information. States what is needed.",
                color: "text-filing-red",
              },
            ].map((l, i) => (
              <div
                key={l.level}
                className={`p-5 ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}
              >
                <div className="flex items-baseline gap-4 mb-1">
                  <span className={`font-mono text-[12px] tracking-wide ${l.color}`}>
                    {l.level}
                  </span>
                  <span className="font-mono text-[10px] text-silver tracking-wider">
                    {l.marker}
                  </span>
                </div>
                <p className="text-[12px] text-slate leading-relaxed">
                  {l.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* === UNIVERSAL INTERFACE === */}
      <div className="mt-16 mb-12">
        <div className="h-[2px] bg-ink w-full" />
        <div className="mt-6 font-mono text-[10px] tracking-[0.4em] text-slate">
          PART II — UNIVERSAL INTERFACE
        </div>
      </div>

      {/* Universal Interface Philosophy */}
      <SubSection label="The Universal Interface">
        <div className="border-l-4 border-institutional pl-8 py-4 bg-institutional/5">
          <div
            className="font-serif italic text-ink"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            One surface from which the user can do anything. Not a chatbot—a command interface with natural language input.
          </div>
        </div>
        <p className="text-[14px] text-graphite mt-6 max-w-xl leading-relaxed">
          The Universal Interface is the primary surface through which a user directs LIC operations. It accepts natural language but operates with the rigor of a command terminal. From this single interface, the user can assign tasks to agents, query matter status, request analyses, modify workflows, review work product, and execute any operation the system supports—including complex, multi-step agent-level tasks.
        </p>
        <p className="text-[13px] text-slate mt-4 max-w-xl leading-relaxed">
          It is not a chatbot. It does not say "Sure!" or "Great question!" It acknowledges instructions, confirms scope, executes, and reports. The conversational model is: attorney dictating to a senior paralegal, not a consumer talking to a virtual assistant.
        </p>

        <div className="mt-8 border border-ink bg-white p-8">
          <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-6">
            DESIGN TENETS
          </div>
          <div className="space-y-4">
            {[
              {
                tenet: "Input is natural language. Output is structured.",
                detail: "The user speaks normally. The system responds with structured documents, status updates, tables, and filed reports—not conversational prose.",
              },
              {
                tenet: "Every instruction produces an auditable action.",
                detail: "\"Draft a motion\" creates a task assigned to an Associate. \"Check that citation\" dispatches an Auditor. Every instruction maps to an operation, logged and traceable.",
              },
              {
                tenet: "Complex tasks decompose visibly.",
                detail: "When a request requires multiple steps or agents, the system shows its execution plan before proceeding. The user approves the plan, not just the result.",
              },
              {
                tenet: "The interface remembers context.",
                detail: "\"Do the same for Chen\" works. The system maintains matter context, recent operations, and user preferences across the session.",
              },
              {
                tenet: "Clarification is explicit, not assumed.",
                detail: "If the system cannot determine intent, it asks—once, specifically. It does not guess. It does not proceed with assumptions it hasn't stated.",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-4 border-b border-fog pb-4 last:border-0 last:pb-0"
              >
                <span className="font-mono text-[10px] text-silver w-6 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="font-mono text-[13px] text-ink tracking-wide">
                    {t.tenet}
                  </div>
                  <p className="text-[12px] text-slate mt-1 leading-relaxed max-w-lg">
                    {t.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* UI Anatomy */}
      <SubSection label="Universal Interface — Anatomy">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The Universal Interface occupies a fixed panel in the application layout. It is always accessible but never intrusive. It does not float, pop up, or overlay content. It is infrastructure.
        </p>

        {/* Interface specimen */}
        <div className="border border-ink bg-parchment">
          <div className="px-6 py-3 border-b border-ink bg-ink text-paper flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[12px] tracking-wide">
                UNIVERSAL INTERFACE
              </span>
              <span className="font-mono text-[9px] text-silver tracking-wider">
                MATTER: WILLIAMS V. APEX · LIC–2026–01847
              </span>
            </div>
            <span className="font-mono text-[9px] text-slate tracking-wider">
              3 AGENTS ACTIVE
            </span>
          </div>

          {/* Conversation area */}
          <div className="px-6 py-6 space-y-6 max-h-[480px] overflow-y-auto">
            {/* User input */}
            <div className="flex items-start gap-4">
              <div className="w-8 shrink-0">
                <div className="font-mono text-[9px] text-slate tracking-wider text-right">
                  YOU
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-white border border-ink p-4">
                  <p className="font-mono text-[13px] text-ink tracking-wide leading-relaxed">
                    Draft a motion to compel for Williams. They haven't produced the ESI we requested in our second set of interrogatories. Include the meet-and-confer history — I sent two letters, January 15 and February 3.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-1">
                  14:32 UTC
                </div>
              </div>
            </div>

            {/* System acknowledgment */}
            <div className="flex items-start gap-4">
              <div className="w-8 shrink-0">
                <div className="font-mono text-[9px] text-institutional tracking-wider text-right">
                  LIC
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-white border border-institutional/30 p-4 space-y-4">
                  <p className="text-[13px] text-ink leading-relaxed">
                    Understood. Assigning to Associate OP–03.
                  </p>
                  <div className="border border-fog bg-parchment p-4">
                    <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-3">
                      EXECUTION PLAN
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          step: "1",
                          action: "Retrieve matter file: Williams v. Apex Corp (LIC–2026–01847)",
                          agent: "System",
                        },
                        {
                          step: "2",
                          action: "Locate second interrogatory set and identify outstanding ESI requests",
                          agent: "ANLS OP–07",
                        },
                        {
                          step: "3",
                          action: "Retrieve meet-and-confer correspondence (Jan 15, Feb 3)",
                          agent: "System",
                        },
                        {
                          step: "4",
                          action: "Draft Motion to Compel under Rule 37(a), incorporating ESI deficiencies and meet-and-confer timeline",
                          agent: "ASSOC OP–03",
                        },
                        {
                          step: "5",
                          action: "Citation verification and formatting audit",
                          agent: "AUDT OP–09",
                        },
                        {
                          step: "6",
                          action: "File completed draft for attorney review",
                          agent: "System",
                        },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3">
                          <span className="font-mono text-[10px] text-silver w-4 shrink-0 mt-0.5">
                            {s.step}.
                          </span>
                          <div className="flex-1 flex items-start justify-between gap-4">
                            <span className="text-[12px] text-ink">
                              {s.action}
                            </span>
                            <span className="font-mono text-[10px] text-slate tracking-wider shrink-0">
                              {s.agent}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-ink">
                      Proceed with this plan?
                    </span>
                    <button className="font-mono text-[10px] text-paper bg-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                      Execute
                    </button>
                    <button className="font-mono text-[10px] text-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                      Modify
                    </button>
                  </div>
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-1">
                  14:32 UTC · PLAN PENDING APPROVAL
                </div>
              </div>
            </div>

            {/* User approval */}
            <div className="flex items-start gap-4">
              <div className="w-8 shrink-0">
                <div className="font-mono text-[9px] text-slate tracking-wider text-right">
                  YOU
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-white border border-ink p-4">
                  <p className="font-mono text-[13px] text-ink tracking-wide">
                    Execute. And when the draft is ready, also run a check on whether Apex has any prior sanctions history in this district.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-1">
                  14:33 UTC
                </div>
              </div>
            </div>

            {/* System execution confirmation */}
            <div className="flex items-start gap-4">
              <div className="w-8 shrink-0">
                <div className="font-mono text-[9px] text-institutional tracking-wider text-right">
                  LIC
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-white border border-institutional/30 p-4 space-y-3">
                  <p className="text-[13px] text-ink leading-relaxed">
                    Plan executing. Two tasks queued.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-ledger w-1.5 h-1.5 shrink-0" />
                      <span className="font-mono text-[11px] text-ink tracking-wide">
                        Motion to Compel draft — ASSOC OP–03 working
                      </span>
                      <span className="font-mono text-[10px] text-silver tracking-wider">
                        ETA ~2h
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-institutional w-1.5 h-1.5 shrink-0" />
                      <span className="font-mono text-[11px] text-ink tracking-wide">
                        Apex sanctions history search — ANLS OP–07 queued
                      </span>
                      <span className="font-mono text-[10px] text-silver tracking-wider">
                        After draft completes
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-slate">
                    Both outputs will be filed under Williams v. Apex Corp. You will be notified at the review gate.
                  </p>
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-1">
                  14:33 UTC · 2 TASKS DISPATCHED
                </div>
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="px-6 py-4 border-t border-ink bg-white">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  className="w-full border border-ink bg-paper px-4 py-3 font-mono text-[13px] text-ink tracking-wide resize-none focus:outline-none focus:border-institutional h-12"
                  placeholder="Type an instruction..."
                  readOnly
                />
              </div>
              <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-3 uppercase border border-ink shrink-0">
                Send
              </button>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <span className="font-mono text-[9px] text-silver tracking-wider">
                CONTEXT: WILLIAMS V. APEX CORP
              </span>
              <span className="font-mono text-[9px] text-silver tracking-wider">
                ·
              </span>
              <span className="font-mono text-[9px] text-silver tracking-wider">
                3 AGENTS AVAILABLE
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.5 — UNIVERSAL INTERFACE, COMPLETE INTERACTION SPECIMEN
        </div>
      </SubSection>

      {/* Instruction Patterns */}
      <SubSection label="Instruction Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The Universal Interface recognizes a range of instruction types. The system classifies each instruction, confirms its interpretation, and maps it to the appropriate operation. The user does not need to know these categories—they exist for system design, not for the user manual.
        </p>
        <div className="border border-ink divide-y divide-ink">
          {[
            {
              type: "Direct task",
              pattern: "\"Draft a [document] for [matter].\"",
              maps: "Creates task → assigns to Associate",
              example: "\"Draft a motion to compel for Williams.\"",
            },
            {
              type: "Query",
              pattern: "\"What is the status of [matter/task]?\"",
              maps: "Reads current state → returns structured response",
              example: "\"What's the status on the Chen discovery responses?\"",
            },
            {
              type: "Analysis request",
              pattern: "\"Analyze [subject] across [scope].\"",
              maps: "Creates task → assigns to Analyst",
              example: "\"Run a precedent analysis on ESI sanctions in the Northern District.\"",
            },
            {
              type: "Review request",
              pattern: "\"Check [document] for [criteria].\"",
              maps: "Creates task → assigns to Auditor",
              example: "\"Check the Williams draft for citation accuracy.\"",
            },
            {
              type: "Compound instruction",
              pattern: "\"Do [A], then [B], and also [C].\"",
              maps: "Generates multi-step execution plan → requests approval",
              example: "\"Draft the motion, run citations, and flag any privilege issues.\"",
            },
            {
              type: "Contextual follow-up",
              pattern: "\"Do the same for [other matter].\"",
              maps: "Inherits previous instruction → applies to new context",
              example: "\"Do the same for Chen v. Metro Health.\"",
            },
            {
              type: "Workflow modification",
              pattern: "\"Change [parameter] on [task].\"",
              maps: "Modifies active or queued operation",
              example: "\"Add the January correspondence to the Williams draft.\"",
            },
            {
              type: "System command",
              pattern: "\"Show [system state].\"",
              maps: "Returns operational data without creating a task",
              example: "\"Show all active agents.\" \"Show pending reviews.\"",
            },
          ].map((p, i) => (
            <div
              key={p.type}
              className={`p-5 ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}
            >
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-mono text-[12px] text-ink tracking-wide w-44 shrink-0">
                  {p.type}
                </span>
                <span className="font-mono text-[11px] text-silver tracking-wide">
                  {p.pattern}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-6 ml-0 md:ml-48">
                <span className="text-[12px] text-slate">
                  → {p.maps}
                </span>
                <span className="font-mono text-[11px] text-institutional">
                  {p.example}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.6 — INSTRUCTION PATTERN TAXONOMY
        </div>
      </SubSection>

      {/* Execution Plans */}
      <SubSection label="Execution Plans — Complex Task Decomposition">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          When an instruction requires multiple agents or sequential operations, the system generates an execution plan before proceeding. The plan is visible, modifiable, and requires explicit approval. The user sees how the system intends to fulfill their request and can adjust before any work begins.
        </p>
        <div className="space-y-6">
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-4">
              EXECUTION PLAN RULES
            </div>
            <div className="space-y-3 text-[12px] text-graphite">
              <div>— Plans are generated for any instruction involving 2+ agents or 3+ steps.</div>
              <div>— Each step identifies the responsible agent, the input it consumes, and the output it produces.</div>
              <div>— Dependencies between steps are explicit. Parallel steps are identified.</div>
              <div>— The user may approve the full plan, modify individual steps, or cancel entirely.</div>
              <div>— Once approved, the plan executes. Progress is reported on the status board.</div>
              <div>— If a step fails or is blocked, the system pauses and reports—it does not skip ahead.</div>
              <div>— Completed plans produce a summary that links to all generated outputs.</div>
            </div>
          </div>

          {/* Plan states */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { state: "Proposed", color: "bg-fog", desc: "Plan generated, awaiting approval" },
              { state: "Approved", color: "bg-institutional", desc: "User confirmed, execution beginning" },
              { state: "Executing", color: "bg-ledger", desc: "Steps actively in progress" },
              { state: "Complete", color: "bg-ink", desc: "All steps finished, outputs filed" },
            ].map((s) => (
              <div key={s.state} className="border border-ink bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${s.color} w-2 h-2 shrink-0`} />
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    {s.state}
                  </span>
                </div>
                <p className="text-[11px] text-slate">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Response Format */}
      <SubSection label="Response Format & Voice">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The Universal Interface responds in a specific register. It is professional, terse, and action-oriented. It does not explain itself unless asked. It does not emote. It does not hedge with politeness.
        </p>
        <div className="border border-ink bg-ink text-paper p-8">
          <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
            RESPONSE VOICE RULES
          </div>
          <div className="space-y-5">
            {[
              {
                rule: "Acknowledge, then act.",
                good: "\"Understood. Assigning to Associate OP–03. ETA 2 hours.\"",
                bad: "\"Sure! I'd be happy to help you with that. Let me draft a motion to compel for you!\"",
              },
              {
                rule: "State outcomes, not process.",
                good: "\"Draft filed. LIC–DRFT–2026.02.18–004. 14 pages, 3 exhibits. Review gate pending.\"",
                bad: "\"I've gone ahead and analyzed the case details, reviewed the relevant precedents, and put together a comprehensive draft for your review.\"",
              },
              {
                rule: "Ask once, specifically.",
                good: "\"Two interrogatory sets on file for Williams. Confirm: Second set, served January 8?\"",
                bad: "\"Could you clarify which interrogatory set you're referring to? There might be multiple sets, and I want to make sure I use the right one.\"",
              },
              {
                rule: "Report problems, not apologies.",
                good: "\"Cannot locate January 15 correspondence in matter file. Check manual uploads or provide document.\"",
                bad: "\"I'm sorry, but I wasn't able to find the letter you mentioned. I apologize for any inconvenience.\"",
              },
              {
                rule: "Never narrate the act of thinking.",
                good: "[Immediate structured response]",
                bad: "\"Let me think about that for a moment… Okay, so what I'm going to do is…\"",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="border-b border-graphite pb-5 last:border-0 last:pb-0"
              >
                <div className="font-mono text-[12px] text-paper tracking-wide mb-3">
                  {r.rule}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[9px] text-ledger tracking-wider mb-1">
                      CORRECT
                    </div>
                    <div className="font-mono text-[11px] text-silver leading-relaxed">
                      {r.good}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] text-filing-red tracking-wider mb-1">
                      INCORRECT
                    </div>
                    <div className="font-mono text-[11px] text-slate leading-relaxed line-through">
                      {r.bad}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Visual Differentiation */}
      <SubSection label="Visual Differentiation — Human vs. Machine">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The user must always be able to distinguish between human-authored content and machine-generated content. This distinction is made through structural formatting, never through badges, icons, or disclaimers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              USER INPUT
            </div>
            <div className="space-y-3 text-[12px] text-graphite">
              <div>— White background with Ink border</div>
              <div>— Monospace text at standard weight</div>
              <div>— Right-aligned attribution: "YOU"</div>
              <div>— Timestamp below in Silver</div>
              <div>— No decorative elements</div>
            </div>
            <div className="mt-4 bg-white border border-ink p-3">
              <p className="font-mono text-[12px] text-ink tracking-wide">
                Draft a summary memo for Chen.
              </p>
            </div>
          </div>
          <div className="border border-institutional/30 bg-institutional/5 p-6">
            <div className="font-mono text-[10px] text-institutional tracking-wider mb-4">
              SYSTEM RESPONSE
            </div>
            <div className="space-y-3 text-[12px] text-graphite">
              <div>— White background with Institutional Blue border</div>
              <div>— Sans-serif text for prose, mono for data</div>
              <div>— Right-aligned attribution: "LIC"</div>
              <div>— Timestamp + status label below in Silver</div>
              <div>— May contain structured elements (plans, tables, status)</div>
            </div>
            <div className="mt-4 bg-white border border-institutional/30 p-3">
              <p className="text-[12px] text-ink leading-relaxed">
                Understood. Assigning to Associate OP–03.
              </p>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Audit Trail */}
      <SubSection label="Audit Trail & Provenance">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every interaction through the Universal Interface produces a permanent record. Every agent output carries full provenance metadata. This is not a feature—it is the system's fundamental architecture. In litigation support, the chain of production is as important as the product itself.
        </p>
        <div className="border border-ink bg-white">
          <div className="px-6 py-3 border-b border-fog bg-parchment">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
              PROVENANCE RECORD — SPECIMEN
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
              {[
                { label: "DOCUMENT ID", value: "LIC–DRFT–2026.02.18–004" },
                { label: "ORIGINATING INSTRUCTION", value: "UI–SESSION–2026.02.18–14:32–UTC" },
                { label: "PRODUCING AGENT", value: "Associate OP–03 (ASSOC)" },
                { label: "AUDITING AGENT", value: "Auditor OP–09 (AUDT)" },
                { label: "SUPPORTING AGENT", value: "Analyst OP–07 (ANLS)" },
                { label: "EXECUTION PLAN", value: "PLAN–2026.02.18–004" },
                { label: "INPUT SOURCES", value: "Matter file, 2nd interrogatory set, correspondence (2)" },
                { label: "FILED", value: "2026.02.18 · 16:44 UTC" },
                { label: "REVIEW STATUS", value: "Pending attorney review" },
                { label: "VERSION", value: "v1.0 (initial draft)" },
                { label: "CONFIDENCE FLAGS", value: "2 citations flagged for verification" },
                { label: "CLASSIFICATION", value: "Attorney Work Product — Privileged" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="font-mono text-[8px] text-silver tracking-wider">
                    {p.label}
                  </div>
                  <div className="font-mono text-[12px] text-ink tracking-wide mt-0.5">
                    {p.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.7 — PROVENANCE RECORD, FULL METADATA
        </div>
      </SubSection>

      {/* Anti-Patterns */}
      <SubSection label="AI Interaction Anti-Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          These patterns are explicitly prohibited in LIC AI interfaces. They are common in consumer AI products and must be actively avoided.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              pattern: "Anthropomorphic language",
              reason: "The system does not \"think,\" \"feel,\" \"believe,\" or \"try.\" It executes operations and files reports.",
            },
            {
              pattern: "Streaming text animation",
              reason: "Text does not \"type out\" character by character. Responses are delivered complete. The system is not performing thought—it is delivering a result.",
            },
            {
              pattern: "Personality or persona",
              reason: "The system has no name, no avatar, no personality traits. It is identified as \"LIC\" and speaks in institutional voice.",
            },
            {
              pattern: "Suggested prompts",
              reason: "The user is an attorney. They know what they need. The interface does not suggest questions or offer conversation starters.",
            },
            {
              pattern: "Confidence percentages",
              reason: "\"87% confident\" is meaningless to a litigator. Professional uncertainty language only: \"Requires verification.\" \"Assumption stated.\"",
            },
            {
              pattern: "Optimistic UI for AI operations",
              reason: "Never show a draft as \"ready\" before the agent has actually completed it. Do not simulate progress. Wait for the real result.",
            },
            {
              pattern: "\"AI-generated\" badges",
              reason: "Everything in LIC is AI-generated. Labeling it is redundant. Instead, every document carries provenance metadata identifying its origin.",
            },
            {
              pattern: "Regenerate / retry buttons",
              reason: "If the output is inadequate, the user provides specific revision instructions. \"Try again\" without guidance produces the same result.",
            },
            {
              pattern: "Thumbs up / thumbs down feedback",
              reason: "Consumer feedback patterns have no place in professional tools. If output needs correction, the user specifies what's wrong.",
            },
            {
              pattern: "Conversational filler",
              reason: "No \"Sure!\", \"Great question!\", \"Absolutely!\", \"Of course!\". The system acknowledges instructions, not the person giving them.",
            },
          ].map((ap) => (
            <div
              key={ap.pattern}
              className="border border-filing-red/30 bg-filing-red/5 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] text-filing-red">✕</span>
                <span className="font-mono text-[12px] text-ink tracking-wide">
                  {ap.pattern}
                </span>
              </div>
              <p className="text-[11px] text-slate leading-relaxed">
                {ap.reason}
              </p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Summary Doctrine */}
      <SubSection label="Summary Doctrine">
        <div className="border border-ink bg-white p-8 md:p-12">
          <div className="space-y-6">
            {[
              "AI is workforce. It holds a role, produces deliverables, and is supervised.",
              "Agents file reports. They do not chat. Reports are documents with structure and provenance.",
              "The Universal Interface is a command surface, not a chatbot. Input is natural; output is structured.",
              "Complex tasks decompose into visible execution plans. The user approves the plan, not just the result.",
              "Every output has provenance: who produced it, when, from what, and with what confidence.",
              "Uncertainty is stated in professional language. No percentages, no hedging, no disclaimers.",
              "Review gates are mandatory. No AI output reaches a client or court without human approval.",
              "The system responds in institutional voice: terse, specific, action-oriented, never performative.",
              "Human-authored and machine-generated content are structurally distinguishable—always.",
              "The audit trail is the architecture. Every instruction, every output, every review is permanently recorded.",
            ].map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-4 border-b border-fog pb-4 last:border-0 last:pb-0"
              >
                <span className="font-mono text-[10px] text-silver w-6 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[14px] text-ink tracking-wide leading-relaxed">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 9.8 — AI INTERACTION DOCTRINE, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>
    </div>
  );
}
