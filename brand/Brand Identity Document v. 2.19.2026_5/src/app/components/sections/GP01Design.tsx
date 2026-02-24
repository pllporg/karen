import { useState } from "react";
import { SectionHeader, SubSection } from "../SectionHeader";
import { LICModuleTag } from "../LICLogo";

/* ─── tiny reusable helpers ─── */
const Dot = ({ color }: { color: string }) => (
  <div className={`${color} w-1.5 h-1.5 shrink-0`} />
);

const Badge = ({ label, bg, text }: { label: string; bg: string; text: string }) => (
  <span className={`${bg} ${text} font-mono text-[9px] tracking-widest px-2.5 py-0.5 uppercase`}>
    {label}
  </span>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="font-mono text-[10px] tracking-[0.2em] text-slate block mb-1.5">
    {children}
  </label>
);

const MockInput = ({
  label,
  value,
  placeholder,
  className = "",
}: {
  label: string;
  value?: string;
  placeholder?: string;
  className?: string;
}) => (
  <div className={className}>
    <FieldLabel>{label}</FieldLabel>
    <input
      readOnly
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      className="w-full border border-ink bg-white px-3 py-2.5 font-mono text-[12px] text-ink placeholder:text-silver tracking-wide focus:outline-none"
    />
  </div>
);

const MockSelect = ({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className={className}>
    <FieldLabel>{label}</FieldLabel>
    <div className="w-full border border-ink bg-white px-3 py-2.5 font-mono text-[12px] text-ink tracking-wide flex items-center justify-between cursor-pointer">
      <span>{value}</span>
      <span className="text-slate text-[9px]">▼</span>
    </div>
  </div>
);

/* ═════════════════════════════════════════════════════════
   §12 — GP-01 DESIGN: LEAD INTAKE → MATTER
   ═════════════════════════════════════════════════════════ */
export function GP01Design() {
  const [activeStep] = useState(2);

  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="12"
        title="GP-01: Intake to Matter"
        subtitle="Complete screen designs for the core acquisition-to-case-activation workflow. Seven screens, one guided flow: Universal Inbox → Lead Intake Wizard → Lead Detail + AI Summary → Conflict Check → Engagement → Convert to Matter → Matter Overview."
      />

      {/* ───── OVERVIEW ───── */}
      <SubSection label="Workflow Overview">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment mb-8">
          <div
            className="font-serif italic text-ink"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            Take a potential client from "new lead" to "active matter" through a single, guided, auditable flow.
          </div>
        </div>

        {/* PRD reference block */}
        <div className="border border-ink bg-white p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <LICModuleTag module="PROCESS" code="GP-01" />
            <span className="font-mono text-[9px] text-silver tracking-wider">
              PRD-GP-01 · DRAFT · 2026-02-19
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { k: "PRIMARY USERS", v: "Intake Specialist, Attorney" },
              { k: "TRIGGER", v: "Intake Queue / Portal Submission" },
              { k: "END STATE", v: "Active matter with seeded tasks" },
              { k: "SCREENS", v: "7 (linear flow with gates)" },
            ].map((kv) => (
              <div key={kv.k}>
                <div className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</div>
                <div className="font-mono text-[12px] text-ink tracking-wide mt-0.5">{kv.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Flow diagram */}
        <div className="border border-ink bg-ink text-paper p-6 md:p-8 overflow-x-auto">
          <div className="font-mono text-[9px] text-silver tracking-[0.3em] mb-6">
            PROCESS FLOW — GP-01
          </div>
          <div className="flex items-start gap-0 min-w-[700px]">
            {[
              { num: "01", label: "Inbox", sub: "Queue", color: "border-paper/30" },
              { num: "02", label: "Intake", sub: "Wizard", color: "border-paper/30" },
              { num: "03", label: "Detail", sub: "+AI", color: "border-paper/30" },
              { num: "04", label: "Conflict", sub: "Check", color: "border-filing-red/60" },
              { num: "05", label: "Engage", sub: "eSign", color: "border-paper/30" },
              { num: "06", label: "Convert", sub: "Wizard", color: "border-paper/30" },
              { num: "07", label: "Matter", sub: "Overview", color: "border-ledger/60" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`border ${s.color} px-4 py-3 text-center min-w-[80px]`}>
                  <div className="font-mono text-[9px] text-silver tracking-wider">{s.num}</div>
                  <div className="font-mono text-[12px] text-paper tracking-wide mt-1">{s.label}</div>
                  <div className="font-mono text-[9px] text-silver tracking-wider">{s.sub}</div>
                </div>
                {i < 6 && (
                  <div className="flex items-center px-1">
                    <div className="w-4 h-px bg-paper/30" />
                    <div className="text-paper/40 text-[8px]">→</div>
                    <div className="w-4 h-px bg-paper/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-filing-red/60" />
              <span className="font-mono text-[8px] text-silver tracking-wider">GATING STEP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-ledger/60" />
              <span className="font-mono text-[8px] text-silver tracking-wider">END STATE</span>
            </div>
          </div>
        </div>

        {/* Status model */}
        <div className="mt-6 border border-ink bg-white p-6">
          <div className="font-mono text-[9px] text-silver tracking-[0.2em] mb-4">STATUS MODEL</div>
          <div className="space-y-3">
            <div>
              <div className="font-mono text-[10px] text-slate tracking-wider mb-2">LEAD STATUS</div>
              <div className="flex flex-wrap gap-2">
                {["Draft", "Submitted", "In Review", "Conflict Hold", "Engaged Pending", "Ready to Convert", "Converted"].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <Badge
                      label={s}
                      bg={s === "Conflict Hold" ? "bg-filing-red/20" : s === "Converted" ? "bg-ledger" : "bg-parchment"}
                      text={s === "Conflict Hold" ? "text-filing-red" : s === "Converted" ? "text-paper" : "text-ink"}
                    />
                    {i < 6 && <span className="text-silver text-[8px]">→</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate tracking-wider mb-2">CONFLICT CHECK</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { s: "Not Started", bg: "bg-fog", t: "text-ink" },
                  { s: "In Progress", bg: "bg-institutional", t: "text-paper" },
                  { s: "Cleared", bg: "bg-ledger", t: "text-paper" },
                  { s: "Potential Conflict", bg: "bg-filing-red/20", t: "text-filing-red" },
                  { s: "Confirmed Conflict", bg: "bg-filing-red", t: "text-paper" },
                ].map((x) => (
                  <Badge key={x.s} label={x.s} bg={x.bg} text={x.t} />
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate tracking-wider mb-2">ENGAGEMENT</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { s: "Draft", bg: "bg-slate", t: "text-paper" },
                  { s: "In Review", bg: "bg-institutional", t: "text-paper" },
                  { s: "Sent", bg: "bg-ink", t: "text-paper" },
                  { s: "Viewed", bg: "bg-ink", t: "text-paper" },
                  { s: "Signed", bg: "bg-ledger", t: "text-paper" },
                  { s: "Declined", bg: "bg-filing-red", t: "text-paper" },
                  { s: "Expired", bg: "bg-fog", t: "text-ink" },
                ].map((x) => (
                  <Badge key={x.s} label={x.s} bg={x.bg} text={x.t} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.1 — GP-01 FLOW DIAGRAM + STATUS MODEL
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════
          SCREEN 01 — UNIVERSAL INBOX / INTAKE QUEUE
          ═══════════════════════════════════════════ */}
      <SubSection label="Screen 01 — Universal Inbox / Intake Queue">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The intake specialist's primary workspace. Shows all leads across stages with filtering, source indicators, and quick actions. Portal submissions are visually distinguished. FR-A1 through FR-A4.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* App shell header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] text-paper tracking-wider">LIC</span>
              <span className="text-graphite">│</span>
              <div className="flex items-center gap-2 font-mono text-[10px] text-silver tracking-wider">
                <span className="text-paper">Intake Queue</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] text-silver tracking-wider">K. ALDRIDGE</span>
              <button className="bg-paper text-ink font-mono text-[9px] tracking-widest px-4 py-1.5 uppercase">
                + New Lead
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-white px-5 py-3 border-b border-ink flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <input
                readOnly
                type="text"
                placeholder="Search leads…"
                className="w-full border border-ink bg-paper px-3 py-2 pr-8 font-mono text-[10px] text-ink placeholder:text-silver tracking-wide focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-silver">⌕</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["All", "New", "Needs Review", "Waiting on Client", "Conflict Hold", "Engaged", "Ready"].map((f, i) => (
                <button
                  key={f}
                  className={`font-mono text-[9px] tracking-wider px-3 py-1.5 border ${
                    i === 0 ? "bg-ink text-paper border-ink" : "bg-white text-ink border-ink hover:bg-parchment"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-parchment">
                  {["LEAD", "SOURCE", "STAGE", "DISPUTE TYPE", "ASSIGNED", "NEXT ACTION", "UPDATED"].map((h) => (
                    <th key={h} className="font-mono text-[9px] tracking-[0.15em] text-slate text-left px-4 py-2.5">
                      <span className="flex items-center gap-1">
                        {h}
                        <span className="text-silver/60 text-[7px]">↕</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink">
                {[
                  { name: "Garcia, Maria", source: "Portal", sourceColor: "bg-institutional", stage: "New", stageColor: "bg-institutional", dispute: "Payment Dispute", assigned: "—", next: "Start intake", time: "4m ago", highlight: true },
                  { name: "Chen Construction LLC", source: "Internal", sourceColor: "bg-ink", stage: "In Review", stageColor: "bg-ink", dispute: "Defective Work", assigned: "M. Torres", next: "Run conflict check", time: "2h ago", highlight: false },
                  { name: "Whitfield Developers", source: "Internal", sourceColor: "bg-ink", stage: "Conflict Hold", stageColor: "bg-filing-red", dispute: "Lien Foreclosure", assigned: "K. Aldridge", next: "Resolve conflict", time: "1d ago", highlight: false },
                  { name: "Pacific Ridge Homes", source: "Portal", sourceColor: "bg-institutional", stage: "Engaged Pending", stageColor: "bg-slate", dispute: "Delay Damages", assigned: "D. Okafor", next: "Awaiting signature", time: "3d ago", highlight: false },
                  { name: "Summit Excavation Co", source: "Import", sourceColor: "bg-slate", stage: "Ready to Convert", stageColor: "bg-ledger", dispute: "Contract Breach", assigned: "K. Aldridge", next: "Convert to matter", time: "6h ago", highlight: false },
                ].map((row) => (
                  <tr
                    key={row.name}
                    className={`${row.highlight ? "bg-institutional/5 border-l-2 border-l-institutional" : "bg-white"} hover:bg-parchment cursor-pointer`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12px] text-ink tracking-wide">{row.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={row.source} bg={row.sourceColor} text="text-paper" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Dot color={row.stageColor} />
                        <span className="font-mono text-[10px] text-ink tracking-wide">{row.stage}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] text-slate tracking-wider px-4 py-3">{row.dispute}</td>
                    <td className="font-mono text-[10px] text-slate tracking-wider px-4 py-3">{row.assigned}</td>
                    <td className="font-mono text-[10px] text-institutional tracking-wider px-4 py-3">{row.next}</td>
                    <td className="font-mono text-[10px] text-silver tracking-wider px-4 py-3">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="bg-parchment px-5 py-2.5 border-t border-ink flex items-center justify-between">
            <span className="font-mono text-[9px] text-slate tracking-wider">5 LEADS · 2 REQUIRE ACTION</span>
            <div className="flex items-center gap-1">
              {["←", "1", "→"].map((p) => (
                <button key={p} className="w-7 h-7 border border-ink font-mono text-[9px] flex items-center justify-center bg-white hover:bg-parchment">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.2 — SCREEN 01: UNIVERSAL INBOX / INTAKE QUEUE
        </div>

        {/* Annotations */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-ink bg-white p-5">
            <div className="font-mono text-[9px] text-slate tracking-wider mb-2">DESIGN NOTES</div>
            <div className="space-y-1.5 text-[11px] text-graphite">
              <div>— Portal leads get left accent + tinted row (FR-A4)</div>
              <div>— Source badges: Portal (Institutional), Internal (Ink), Import (Slate)</div>
              <div>— "Next Action" column in Institutional Blue — clickable, routes to the relevant step</div>
              <div>— "+ New Lead" in header creates draft immediately and opens wizard (FR-A3)</div>
              <div>— Filters are mutual-exclusive view tabs, not additive (FR-A2)</div>
            </div>
          </div>
          <div className="border border-ink bg-white p-5">
            <div className="font-mono text-[9px] text-slate tracking-wider mb-2">GUARDRAILS</div>
            <div className="space-y-1.5 text-[11px] text-graphite">
              <div>— Role-based visibility: intake specialists see all; attorneys see assigned only</div>
              <div>— Portal leads are protected from destructive actions (no bulk delete)</div>
              <div>— Rate-limit portal submissions to prevent spam</div>
              <div>— Autosave on all draft leads</div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════
          SCREEN 02 — LEAD INTAKE WIZARD
          ═══════════════════════════════════════ */}
      <SubSection label="Screen 02 — Lead Intake Wizard">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          A progressive stepper wizard that captures essential facts with minimal required fields. Supports save-as-draft and resume at any step. Duplicate contact detection inline. FR-B1 through FR-B5.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* Wizard header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="font-mono text-[10px] text-silver tracking-wider hover:text-paper">← Back to Queue</button>
              <span className="text-graphite">│</span>
              <span className="font-mono text-[11px] text-paper tracking-wider">New Lead Intake</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge label="Draft" bg="bg-slate" text="text-paper" />
              <span className="font-mono text-[9px] text-silver tracking-wider">Autosaved 12s ago</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-white px-5 py-4 border-b border-ink">
            <div className="flex items-center gap-0">
              {[
                { label: "Contact", status: "complete" },
                { label: "Property", status: "complete" },
                { label: "Dispute", status: "active" },
                { label: "Uploads", status: "pending" },
                { label: "Review", status: "pending" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-6 h-6 flex items-center justify-center font-mono text-[9px] border ${
                        step.status === "complete"
                          ? "bg-ink text-paper border-ink"
                          : step.status === "active"
                          ? "bg-institutional text-paper border-institutional"
                          : "bg-white text-silver border-fog"
                      }`}
                    >
                      {step.status === "complete" ? "✓" : i + 1}
                    </div>
                    <span
                      className={`font-mono text-[8px] tracking-wider ${
                        step.status === "active" ? "text-institutional" : step.status === "complete" ? "text-ink" : "text-silver"
                      }`}
                    >
                      {step.label.toUpperCase()}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className={`h-px flex-1 min-w-[12px] -mt-4 ${step.status === "complete" ? "bg-ink" : "bg-fog"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form content — Step 3: Dispute */}
          <div className="bg-paper px-5 md:px-8 py-8">
            <div className="max-w-lg">
              <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-1">STEP 3 OF 5</div>
              <h2 className="font-mono text-ink tracking-wide mb-6" style={{ fontSize: "1.125rem" }}>
                Dispute Information
              </h2>

              <div className="space-y-5">
                <MockSelect label="DISPUTE TYPE" value="Payment Dispute" />

                <MockSelect label="DISPUTE SUBTYPE" value="Nonpayment for Completed Work" />

                <div>
                  <FieldLabel>APPROXIMATE AMOUNT IN DISPUTE</FieldLabel>
                  <div className="flex gap-3">
                    <input
                      readOnly
                      type="text"
                      defaultValue="$340,000"
                      className="flex-1 border border-ink bg-white px-3 py-2.5 font-mono text-[12px] text-ink tracking-wide focus:outline-none"
                    />
                    <MockSelect label="" value="USD" className="w-24" />
                  </div>
                </div>

                <div>
                  <FieldLabel>BRIEF DESCRIPTION</FieldLabel>
                  <textarea
                    readOnly
                    defaultValue="General contractor completed Phase II of the Highland Park project per contract specifications. Owner has withheld final payment citing alleged defective work on the HVAC system. Contractor disputes all deficiency claims and has provided independent inspection report."
                    className="w-full border border-ink bg-white px-3 py-2.5 font-mono text-[12px] text-ink tracking-wide focus:outline-none h-24 resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="font-mono text-[9px] text-silver tracking-wider">REQUIRED</span>
                    <span className="font-mono text-[9px] text-silver tracking-wider">312 / 2000</span>
                  </div>
                </div>

                <div>
                  <FieldLabel>KEY DATES (OPTIONAL)</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <MockInput label="" value="2025-08-15" placeholder="Contract date" />
                    <MockInput label="" value="2026-01-10" placeholder="Dispute arose" />
                  </div>
                </div>

                {/* Missing info detection */}
                <div className="border border-institutional/30 bg-institutional/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 self-stretch bg-institutional shrink-0" />
                    <div>
                      <div className="font-mono text-[9px] text-institutional tracking-[0.2em] mb-2">SUGGESTED MISSING INFORMATION</div>
                      <div className="space-y-1.5 font-mono text-[11px] text-graphite tracking-wide">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-ink bg-white shrink-0" />
                          <span>Statute of limitations date</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-ink bg-white shrink-0" />
                          <span>Prior demand letter sent (Y/N)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border border-ink bg-white shrink-0" />
                          <span>Bond or insurance involved</span>
                        </div>
                      </div>
                      <div className="mt-2 font-mono text-[9px] text-silver tracking-wider">
                        FR-B5 · These items will generate tasks if left incomplete.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wizard footer */}
          <div className="bg-white px-5 md:px-8 py-4 border-t border-ink flex items-center justify-between">
            <button className="font-mono text-[10px] text-slate tracking-widest px-4 py-2 uppercase border border-ink hover:bg-parchment">
              ← Previous
            </button>
            <div className="flex items-center gap-3">
              <button className="font-mono text-[10px] text-slate tracking-widest px-4 py-2 uppercase hover:text-ink">
                Save Draft
              </button>
              <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2 uppercase border border-ink">
                Continue →
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.3 — SCREEN 02: LEAD INTAKE WIZARD (STEP 3 — DISPUTE)
        </div>

        {/* Upload dropzone specimen (Step 4 preview) */}
        <div className="mt-6 border border-ink bg-white p-6">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-4">STEP 4 SPECIMEN — UPLOAD DROPZONE (FR-B3)</div>
          <div className="border-2 border-dashed border-ink/30 bg-parchment p-8 text-center">
            <div className="font-mono text-[10px] text-ink tracking-wider mb-2">
              DROP FILES HERE OR CLICK TO BROWSE
            </div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">
              PDF, DOCX, JPG, PNG, HEIC · Max 25MB per file
            </div>
            <button className="bg-paper text-ink font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">
              Browse Files
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { name: "Highland_Park_Contract_Phase_II.pdf", size: "2.4 MB", cat: "Contract", status: "complete" },
              { name: "HVAC_Inspection_Report.pdf", size: "1.1 MB", cat: "Inspection", status: "complete" },
              { name: "Site_Photos_Jan2026.zip", size: "18.6 MB", cat: "Photos", status: "uploading" },
            ].map((f) => (
              <div key={f.name} className="flex items-center gap-3 border border-ink bg-white px-4 py-2.5">
                <div className="font-mono text-[11px] text-ink tracking-wide flex-1 truncate">{f.name}</div>
                <span className="font-mono text-[9px] text-silver tracking-wider">{f.size}</span>
                <Badge
                  label={f.cat}
                  bg="bg-parchment"
                  text="text-ink"
                />
                {f.status === "complete" ? (
                  <span className="font-mono text-[9px] text-ledger tracking-wider">✓</span>
                ) : (
                  <div className="w-16 h-1 bg-fog">
                    <div className="h-1 bg-institutional" style={{ width: "60%" }} />
                  </div>
                )}
                <button className="font-mono text-[11px] text-slate hover:text-ink">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Duplicate detection specimen */}
        <div className="mt-4 border border-ink bg-white p-6">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-4">INLINE PATTERN — DUPLICATE CONTACT DETECTION (FR-B4)</div>
          <div className="border border-filing-red/30 bg-filing-red/5 p-4">
            <div className="flex items-start gap-3">
              <div className="w-1 self-stretch bg-filing-red shrink-0" />
              <div className="flex-1">
                <div className="font-mono text-[9px] text-filing-red tracking-[0.2em] mb-2">POSSIBLE DUPLICATE FOUND</div>
                <p className="text-[12px] text-graphite">
                  "Maria Garcia" matches an existing contact: <span className="text-ink">Maria L. Garcia (ID: CON-2841)</span> — Pacific Ridge Homes, (415) 555-0192.
                </p>
                <div className="mt-3 flex gap-3">
                  <button className="font-mono text-[9px] text-paper bg-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                    Link Existing Contact
                  </button>
                  <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                    Create New Contact
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════
          SCREEN 03 — LEAD DETAIL + AI INTAKE SUMMARY
          ═══════════════════════════════════════════ */}
      <SubSection label="Screen 03 — Lead Detail + AI Intake Summary">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The complete lead record view with tabbed sections, AI-generated summary artifact, task management, and attorney assignment. The AI summary is always marked Draft with citations. FR-C1 through FR-C5.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* Header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
              <span className="text-silver cursor-pointer hover:text-paper">Queue</span>
              <span className="text-graphite">/</span>
              <span className="text-paper">Garcia, Maria — Payment Dispute</span>
            </div>
            <Badge label="In Review" bg="bg-institutional" text="text-paper" />
          </div>

          {/* Lead header bar */}
          <div className="bg-white px-5 py-4 border-b border-ink">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="font-mono text-ink tracking-wide" style={{ fontSize: "1.125rem" }}>
                  Garcia, Maria — Payment Dispute
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {[
                    { k: "SOURCE", v: "Portal" },
                    { k: "CREATED", v: "2026.02.19 09:14" },
                    { k: "DISPUTE", v: "Payment Dispute" },
                    { k: "VALUE", v: "$340,000" },
                  ].map((kv) => (
                    <div key={kv.k} className="flex items-center gap-1.5">
                      <span className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</span>
                      <span className="font-mono text-[11px] text-ink tracking-wide">{kv.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <MockSelect label="" value="Assign Attorney…" className="w-48" />
                <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink h-[38px]">
                  Run AI Summary
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-ink px-5">
            <div className="flex gap-0">
              {["Summary", "Contacts", "Uploads", "Tasks", "Activity"].map((t, i) => (
                <button
                  key={t}
                  className={`font-mono text-[10px] tracking-wider px-5 py-2.5 border-b-2 ${
                    i === 0 ? "border-ink text-ink" : "border-transparent text-silver hover:text-ink"
                  }`}
                >
                  {t}
                  {t === "Tasks" && (
                    <span className="ml-1.5 bg-filing-red text-paper font-mono text-[8px] px-1.5 py-0.5 tracking-wider">3</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content — Summary tab with AI artifact */}
          <div className="bg-paper p-5 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main content — AI Summary */}
              <div className="md:col-span-2">
                {/* AI Artifact */}
                <div className="border border-ink bg-white">
                  <div className="px-5 py-3 border-b border-ink bg-parchment flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LICModuleTag module="AI INTAKE" code="ANLS" />
                      <Badge label="Draft" bg="bg-slate" text="text-paper" />
                    </div>
                    <span className="font-mono text-[8px] text-silver tracking-wider">GENERATED 2 min AGO</span>
                  </div>
                  <div className="px-5 py-5 space-y-5">
                    {/* Key Facts */}
                    <div>
                      <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-2">KEY FACTS</div>
                      <div className="space-y-2 text-[12px] text-graphite leading-relaxed">
                        <p>
                          <span className="font-mono text-[10px] text-ink tracking-wide">WHO:</span> Maria Garcia (general contractor, Garcia Construction LLC) vs. Highland Park Development Corp (property owner).
                          <button className="ml-1 font-mono text-[9px] text-institutional tracking-wider align-top">[1]</button>
                        </p>
                        <p>
                          <span className="font-mono text-[10px] text-ink tracking-wide">WHAT:</span> Withholding of $340,000 final payment for Phase II completion. Owner alleges defective HVAC installation. Contractor provides independent inspection clearing all work.
                          <button className="ml-1 font-mono text-[9px] text-institutional tracking-wider align-top">[2]</button>
                        </p>
                        <p>
                          <span className="font-mono text-[10px] text-ink tracking-wide">WHEN:</span> Contract executed Aug 15, 2025. Phase II completed Nov 30, 2025. Payment withheld since Jan 10, 2026.
                          <button className="ml-1 font-mono text-[9px] text-institutional tracking-wider align-top">[1]</button>
                        </p>
                        <p>
                          <span className="font-mono text-[10px] text-ink tracking-wide">WHERE:</span> Highland Park, San Francisco, CA. N.D. Cal jurisdiction likely.
                        </p>
                      </div>
                    </div>

                    {/* Dispute Hypothesis */}
                    <div>
                      <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-2">DISPUTE TYPE HYPOTHESIS</div>
                      <p className="text-[12px] text-graphite leading-relaxed">
                        Primary: <span className="text-ink">Payment Dispute — Nonpayment for Completed Work</span>. Secondary potential: <span className="text-ink">Defective Work Counterclaim</span> (owner may assert).
                        <button className="ml-1 font-mono text-[9px] text-institutional tracking-wider align-top">[2]</button>
                      </p>
                    </div>

                    {/* Missing info */}
                    <div className="border border-ink/30 bg-parchment p-4">
                      <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-2">MISSING INFORMATION</div>
                      <div className="space-y-2">
                        {[
                          { item: "Mechanics lien filed?", priority: "High" },
                          { item: "Performance bond or payment bond in place?", priority: "High" },
                          { item: "Prior demand letters sent?", priority: "Medium" },
                          { item: "Statute of limitations calculation", priority: "Medium" },
                        ].map((m) => (
                          <div key={m.item} className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[11px] text-ink tracking-wide">{m.item}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                label={m.priority}
                                bg={m.priority === "High" ? "bg-filing-red/20" : "bg-fog"}
                                text={m.priority === "High" ? "text-filing-red" : "text-ink"}
                              />
                              <button className="font-mono text-[8px] text-institutional tracking-wider border border-institutional px-2 py-0.5">
                                + TASK
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Citations */}
                    <div className="border-t border-fog pt-3">
                      <div className="font-mono text-[9px] text-silver tracking-[0.2em] mb-2">SOURCES</div>
                      <div className="space-y-1.5">
                        {[
                          { num: "1", doc: "Highland_Park_Contract_Phase_II.pdf", page: "pp. 1–4, 12" },
                          { num: "2", doc: "HVAC_Inspection_Report.pdf", page: "pp. 2–3, 7" },
                        ].map((c) => (
                          <div key={c.num} className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-institutional tracking-wider">[{c.num}]</span>
                            <span className="font-mono text-[10px] text-ink tracking-wide cursor-pointer hover:underline">{c.doc}</span>
                            <span className="font-mono text-[9px] text-silver tracking-wider">{c.page}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-2.5 border-t border-fog bg-parchment">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge label="AI-Generated" bg="bg-slate" text="text-paper" />
                        <span className="font-mono text-[9px] text-slate tracking-wider">REQUIRES ATTORNEY REVIEW</span>
                      </div>
                      <span className="font-mono text-[8px] text-silver tracking-wider">OP–07 · ANLS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar — Quick info */}
              <div className="space-y-4">
                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">ASSIGNMENT</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-mono text-[10px] text-slate">Attorney</span>
                      <span className="font-mono text-[10px] text-ink">K. Aldridge</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-[10px] text-slate">Intake</span>
                      <span className="font-mono text-[10px] text-ink">M. Torres</span>
                    </div>
                  </div>
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">CONTACTS</div>
                  {[
                    { name: "Maria Garcia", role: "Potential Client", org: "Garcia Construction LLC" },
                    { name: "Highland Park Dev Corp", role: "Opposing Party", org: "" },
                  ].map((c) => (
                    <div key={c.name} className="py-2 border-b border-fog last:border-0">
                      <div className="font-mono text-[11px] text-ink tracking-wide">{c.name}</div>
                      <div className="font-mono text-[9px] text-silver tracking-wider">{c.role}{c.org ? ` · ${c.org}` : ""}</div>
                    </div>
                  ))}
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">NEXT ACTIONS</div>
                  <div className="space-y-2">
                    <button className="w-full bg-ink text-paper font-mono text-[9px] tracking-widest px-3 py-2 uppercase">
                      Run Conflict Check →
                    </button>
                    <button className="w-full bg-paper text-ink font-mono text-[9px] tracking-widest px-3 py-2 uppercase border border-ink">
                      Create Task
                    </button>
                  </div>
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">UPLOADS (3)</div>
                  {["Highland_Park_Contract…pdf", "HVAC_Inspection…pdf", "Site_Photos_Jan2026.zip"].map((f) => (
                    <div key={f} className="py-1.5 font-mono text-[10px] text-institutional tracking-wide cursor-pointer hover:underline truncate">
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.4 — SCREEN 03: LEAD DETAIL WITH AI INTAKE SUMMARY ARTIFACT
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════
          SCREEN 04 — CONFLICT CHECK
          ═══════════════════════════════════════ */}
      <SubSection label="Screen 04 — Conflict Check">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Conflict search across all contacts, matters, participants, and organizations. Fuzzy matching with confidence scores and match reasons. Outcomes are recorded with an append-only audit trail. FR-D1 through FR-D5.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* Header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
              <span className="text-silver cursor-pointer hover:text-paper">Garcia, Maria</span>
              <span className="text-graphite">/</span>
              <span className="text-paper">Conflict Check</span>
            </div>
            <Badge label="In Progress" bg="bg-institutional" text="text-paper" />
          </div>

          {/* Search bar */}
          <div className="bg-white px-5 py-4 border-b border-ink">
            <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-3">CONFLICT SEARCH</div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  readOnly
                  type="text"
                  defaultValue="Garcia Construction LLC; Highland Park Development Corp; Maria Garcia"
                  className="w-full border border-ink bg-white px-3 py-2.5 font-mono text-[11px] text-ink tracking-wide focus:outline-none"
                />
              </div>
              <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-6 py-2 uppercase border border-ink">
                Search
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] text-silver tracking-wider">
              Searching: contacts, matters, participants, organizations · Fuzzy match enabled
            </div>
          </div>

          {/* Results */}
          <div className="bg-paper p-5 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] text-ink tracking-wider">3 POTENTIAL MATCHES FOUND</div>
              <div className="flex gap-2">
                {["All", "High", "Medium", "Low"].map((f, i) => (
                  <button key={f} className={`font-mono text-[9px] tracking-wider px-2 py-1 ${i === 0 ? "bg-ink text-paper" : "text-silver hover:text-ink"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {/* High match */}
              <div className="border-2 border-filing-red/40 bg-filing-red/5">
                <div className="px-5 py-3 border-b border-filing-red/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge label="High — 92%" bg="bg-filing-red" text="text-paper" />
                    <span className="font-mono text-[11px] text-ink tracking-wide">Highland Park Development Corp</span>
                  </div>
                  <span className="font-mono text-[9px] text-silver tracking-wider">MATTER · MTR-2024-0847</span>
                </div>
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    {[
                      { k: "MATCH TYPE", v: "Organization Name" },
                      { k: "EXISTING ROLE", v: "Client" },
                      { k: "MATTER", v: "Highland Park v. Summit Bldg" },
                      { k: "STATUS", v: "Closed (2024)" },
                    ].map((kv) => (
                      <div key={kv.k}>
                        <div className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</div>
                        <div className="font-mono text-[11px] text-ink tracking-wide mt-0.5">{kv.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="font-mono text-[9px] text-filing-red tracking-wider">
                    ⚠ Highland Park Dev Corp was previously a CLIENT of this firm. Now appearing as OPPOSING PARTY on the incoming lead.
                  </div>
                </div>
              </div>

              {/* Medium match */}
              <div className="border border-ink/40 bg-white">
                <div className="px-5 py-3 border-b border-fog flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge label="Medium — 68%" bg="bg-slate" text="text-paper" />
                    <span className="font-mono text-[11px] text-ink tracking-wide">Garcia, Miguel A.</span>
                  </div>
                  <span className="font-mono text-[9px] text-silver tracking-wider">CONTACT · CON-1923</span>
                </div>
                <div className="px-5 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { k: "MATCH REASON", v: "Name similarity (Garcia)" },
                      { k: "ORG", v: "Garcia & Sons Plumbing" },
                      { k: "EXISTING ROLE", v: "Witness" },
                      { k: "MATTER", v: "Summit v. Garcia (2023)" },
                    ].map((kv) => (
                      <div key={kv.k}>
                        <div className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</div>
                        <div className="font-mono text-[11px] text-ink tracking-wide mt-0.5">{kv.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low match */}
              <div className="border border-fog bg-white">
                <div className="px-5 py-3 border-b border-fog flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge label="Low — 34%" bg="bg-fog" text="text-ink" />
                    <span className="font-mono text-[11px] text-ink tracking-wide">Highland Homes Inc</span>
                  </div>
                  <span className="font-mono text-[9px] text-silver tracking-wider">ORG · ORG-0412</span>
                </div>
                <div className="px-5 py-3">
                  <div className="font-mono text-[10px] text-slate tracking-wide">
                    Name similarity only ("Highland"). Different entity — Highland Homes Inc, Los Angeles, CA.
                  </div>
                </div>
              </div>
            </div>

            {/* Record outcome */}
            <div className="mt-6 border-2 border-ink bg-white p-6">
              <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-4">RECORD CONFLICT CHECK OUTCOME</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Cleared", desc: "No conflict. Proceed.", color: "border-ledger", active: false },
                  { label: "Potential — Needs Review", desc: "Flagged for senior review.", color: "border-filing-red/40", active: true },
                  { label: "Confirmed Conflict", desc: "Cannot proceed. Lock lead.", color: "border-filing-red", active: false },
                ].map((o) => (
                  <div
                    key={o.label}
                    className={`border-2 ${o.color} p-4 cursor-pointer ${o.active ? "bg-filing-red/5 ring-1 ring-filing-red/40" : "bg-white"}`}
                  >
                    <div className="font-mono text-[11px] text-ink tracking-wider">{o.label}</div>
                    <div className="font-mono text-[9px] text-slate tracking-wider mt-1">{o.desc}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <FieldLabel>REVIEWER NOTES (REQUIRED)</FieldLabel>
                  <textarea
                    readOnly
                    defaultValue="Highland Park Dev Corp was a former client. Matter is closed. Reviewing engagement scope for potential adverse interest under RPC 1.9. Escalating to K. Aldridge for determination."
                    className="w-full border border-ink bg-white px-3 py-2.5 font-mono text-[11px] text-ink tracking-wide focus:outline-none h-20 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[9px] text-silver tracking-wider">
                    Reviewer: K. Aldridge · Append-only audit trail (FR-D4)
                  </div>
                  <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-6 py-2 uppercase border border-ink">
                    Record Outcome
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.5 — SCREEN 04: CONFLICT CHECK WITH MATCH RESULTS + OUTCOME RECORDING
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════
          SCREEN 05 — ENGAGEMENT LETTER
          ═══════════════════════════════════════ */}
      <SubSection label="Screen 05 — Engagement (Template + eSign)">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Generate, review, and send engagement letters with fee arrangement capture and eSign tracking. Draft → Review → Finalize workflow with recipient confirmation before sending. FR-E1 through FR-E6.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* Header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
              <span className="text-silver cursor-pointer hover:text-paper">Garcia, Maria</span>
              <span className="text-graphite">/</span>
              <span className="text-paper">Engagement Letter</span>
            </div>
            <Badge label="In Review" bg="bg-institutional" text="text-paper" />
          </div>

          <div className="bg-paper">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* Left — Document preview */}
              <div className="md:col-span-2 p-5 md:p-8 border-r border-ink">
                {/* Template + version header */}
                <div className="flex items-center justify-between mb-4">
                  <MockSelect label="" value="Standard Construction Litigation" className="w-64" />
                  <span className="font-mono text-[9px] text-silver tracking-wider">VERSION 2 · DRAFT</span>
                </div>

                {/* Document preview */}
                <div className="border border-ink bg-white p-6 md:p-8 min-h-[400px]">
                  <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-4">
                    ENGAGEMENT LETTER — PREVIEW
                  </div>
                  <div className="space-y-4 text-[13px] text-ink leading-relaxed">
                    <p className="font-mono text-[10px] text-slate tracking-wider">February 19, 2026</p>
                    <div>
                      <p>Maria Garcia</p>
                      <p>Garcia Construction LLC</p>
                      <p className="text-silver">[Address merge field]</p>
                    </div>
                    <p>Dear Ms. Garcia,</p>
                    <p>
                      Thank you for contacting our office regarding your payment dispute with Highland Park Development Corp. This letter confirms the terms under which we will represent you in this matter.
                    </p>
                    <p>
                      <span className="font-mono text-[10px] text-slate tracking-wider">SCOPE:</span> Representation in connection with recovery of approximately $340,000 in unpaid construction invoices for Phase II of the Highland Park project, including any counterclaims asserted by the opposing party.
                    </p>
                    <div className="border border-institutional/30 bg-institutional/5 px-4 py-3">
                      <span className="font-mono text-[9px] text-institutional tracking-wider">MERGE FIELDS:</span>
                      <span className="text-institutional"> {"{"}client_name{"}"}, {"{"}dispute_amount{"}"}, {"{"}project_name{"}"}</span>
                      <span className="font-mono text-[9px] text-silver ml-2">— Auto-populated from lead record</span>
                    </div>
                    <p className="text-silver italic">
                      [Fee arrangement section, signature block, and terms continue below…]
                    </p>
                  </div>
                </div>

                {/* Document actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-2 uppercase border border-ink hover:bg-parchment">
                      Edit Draft
                    </button>
                    <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-2 uppercase border border-ink hover:bg-parchment">
                      Download PDF
                    </button>
                  </div>
                  <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-6 py-2 uppercase border border-ink">
                    Finalize for Sending →
                  </button>
                </div>
              </div>

              {/* Right — Settings + status */}
              <div className="p-5 space-y-5">
                <div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">FEE ARRANGEMENT (FR-E2)</div>
                  <div className="space-y-3">
                    <MockSelect label="FEE TYPE" value="Hourly" />
                    <MockInput label="HOURLY RATE" value="$425 / hour" />
                    <MockInput label="TRUST RETAINER" value="$10,000" />
                    <MockSelect label="BILLING FREQUENCY" value="Monthly" />
                  </div>
                </div>

                <div className="border-t border-fog pt-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">RECIPIENTS</div>
                  <div className="border border-ink bg-white p-3 mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[11px] text-ink tracking-wide">Maria Garcia</div>
                        <div className="font-mono text-[9px] text-silver tracking-wider">m.garcia@garciaconstruction.com</div>
                      </div>
                      <Badge label="Signer" bg="bg-ink" text="text-paper" />
                    </div>
                  </div>
                  <div className="border border-institutional/30 bg-institutional/5 p-3 font-mono text-[9px] text-institutional tracking-wider">
                    ⓘ Confirm recipients before sending (FR-E5). Mis-send prevention check will appear on finalize.
                  </div>
                </div>

                <div className="border-t border-fog pt-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">ESIGN STATUS TRACKING</div>
                  <div className="space-y-2">
                    {[
                      { status: "Draft", time: "Feb 19 09:45", active: false, done: true },
                      { status: "In Review", time: "Feb 19 10:20", active: true, done: false },
                      { status: "Sent", time: "—", active: false, done: false },
                      { status: "Viewed", time: "—", active: false, done: false },
                      { status: "Signed", time: "—", active: false, done: false },
                    ].map((s) => (
                      <div key={s.status} className="flex items-center gap-3">
                        <div className={`w-4 h-4 flex items-center justify-center font-mono text-[8px] border ${
                          s.done ? "bg-ink text-paper border-ink" : s.active ? "border-institutional bg-institutional/10" : "border-fog bg-white"
                        }`}>
                          {s.done && "✓"}
                        </div>
                        <span className={`font-mono text-[10px] tracking-wide flex-1 ${s.active ? "text-institutional" : s.done ? "text-ink" : "text-silver"}`}>
                          {s.status}
                        </span>
                        <span className="font-mono text-[9px] text-silver tracking-wider">{s.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-fog pt-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-2">AUDIT TRAIL</div>
                  <div className="space-y-1 font-mono text-[9px] text-slate tracking-wider">
                    <div>09:45 · Draft created · M. Torres</div>
                    <div>10:15 · Fee terms added · M. Torres</div>
                    <div>10:20 · Sent for attorney review · K. Aldridge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.6 — SCREEN 05: ENGAGEMENT LETTER — TEMPLATE, PREVIEW, FEE ARRANGEMENT, ESIGN TRACKING
        </div>

        {/* Recipient confirmation modal */}
        <div className="mt-6 border border-ink bg-ink/5 p-8 flex items-center justify-center">
          <div className="border border-ink bg-white w-full max-w-md shadow-[4px_4px_0px_0px_rgba(11,11,11,0.1)]">
            <div className="px-6 py-4 border-b border-ink flex items-center justify-between">
              <span className="font-mono text-[11px] text-ink tracking-wider">CONFIRM RECIPIENTS</span>
              <button className="text-slate hover:text-ink font-mono text-[14px]">×</button>
            </div>
            <div className="px-6 py-5">
              <p className="text-[12px] text-graphite mb-4">
                This engagement letter will be sent to the following recipients for electronic signature. Please verify before sending.
              </p>
              <div className="border border-ink bg-parchment p-3 mb-4">
                <div className="font-mono text-[11px] text-ink tracking-wide">Maria Garcia</div>
                <div className="font-mono text-[10px] text-slate tracking-wider">m.garcia@garciaconstruction.com</div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-1">Role: Signer · Document: Engagement Letter v2</div>
              </div>
              <div className="border border-filing-red/30 bg-filing-red/5 p-3 font-mono text-[10px] text-filing-red tracking-wider">
                ⚠ This action cannot be undone. A sent engagement letter creates a versioned record.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-fog bg-parchment flex items-center justify-end gap-3">
              <button className="bg-paper text-ink font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                Cancel
              </button>
              <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                Send for Signature
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.6b — RECIPIENT CONFIRMATION MODAL (FR-E5, MIS-SEND PREVENTION)
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════
          SCREEN 06 — CONVERT TO MATTER WIZARD
          ═══════════════════════════════════════ */}
      <SubSection label="Screen 06 — Convert to Matter Wizard">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The critical conversion step. Creates a matter with the correct participant model (client, opposing party, opposing counsel as distinct entities with representation links), matter type selection, optional ethical wall, and seeded structure. FR-F1 through FR-F6.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* Header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
              <span className="text-silver">Garcia, Maria</span>
              <span className="text-graphite">/</span>
              <span className="text-paper">Convert to Matter</span>
            </div>
            <span className="font-mono text-[9px] text-silver tracking-wider">STEP 2 OF 3</span>
          </div>

          {/* Stepper */}
          <div className="bg-white px-5 py-3 border-b border-ink">
            <div className="flex items-center gap-0 max-w-md mx-auto">
              {[
                { label: "Matter Type", done: true },
                { label: "Participants", active: true },
                { label: "Seeding + Review", pending: true },
              ].map((s, i) => (
                <div key={s.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-6 h-6 flex items-center justify-center font-mono text-[9px] border ${
                      s.done ? "bg-ink text-paper border-ink" : s.active ? "bg-institutional text-paper border-institutional" : "bg-white text-silver border-fog"
                    }`}>
                      {s.done ? "✓" : i + 1}
                    </div>
                    <span className={`font-mono text-[8px] tracking-wider ${s.active ? "text-institutional" : s.done ? "text-ink" : "text-silver"}`}>
                      {s.label.toUpperCase()}
                    </span>
                  </div>
                  {i < 2 && <div className={`h-px flex-1 min-w-[12px] -mt-4 ${s.done ? "bg-ink" : "bg-fog"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Participant model editor */}
          <div className="bg-paper p-5 md:p-8">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-1">STEP 2 OF 3</div>
            <h2 className="font-mono text-ink tracking-wide mb-6" style={{ fontSize: "1.125rem" }}>
              Participant Model
            </h2>

            {/* Participant graph */}
            <div className="border border-ink bg-white p-6 mb-6">
              <div className="font-mono text-[9px] text-silver tracking-wider mb-4">PARTICIPANT GRAPH (FR-F2)</div>
              <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-16 py-4">
                {/* Our side */}
                <div className="text-center space-y-3">
                  <div className="font-mono text-[9px] text-ledger tracking-[0.2em]">OUR SIDE</div>
                  <div className="border-2 border-ledger bg-ledger/5 px-6 py-4">
                    <div className="font-mono text-[12px] text-ink tracking-wide">Maria Garcia</div>
                    <div className="font-mono text-[9px] text-slate tracking-wider">Garcia Construction LLC</div>
                    <Badge label="Client" bg="bg-ledger" text="text-paper" />
                  </div>
                  <div className="font-mono text-[9px] text-silver">represented by</div>
                  <div className="border border-ink bg-white px-6 py-3">
                    <div className="font-mono text-[11px] text-ink tracking-wide">Morrison & Whitfield LLP</div>
                    <div className="font-mono text-[9px] text-silver tracking-wider">K. Aldridge, lead attorney</div>
                  </div>
                </div>

                {/* VS divider */}
                <div className="flex flex-col items-center justify-center gap-2 shrink-0 py-6">
                  <div className="w-px h-8 bg-ink/20 hidden md:block" />
                  <div className="font-mono text-[10px] text-silver tracking-widest">VS</div>
                  <div className="w-px h-8 bg-ink/20 hidden md:block" />
                </div>

                {/* Their side */}
                <div className="text-center space-y-3">
                  <div className="font-mono text-[9px] text-filing-red tracking-[0.2em]">THEIR SIDE</div>
                  <div className="border-2 border-filing-red/40 bg-filing-red/5 px-6 py-4">
                    <div className="font-mono text-[12px] text-ink tracking-wide">Highland Park Dev Corp</div>
                    <div className="font-mono text-[9px] text-slate tracking-wider">Property Owner</div>
                    <Badge label="Opposing Party" bg="bg-filing-red/20" text="text-filing-red" />
                  </div>
                  <div className="font-mono text-[9px] text-silver">represented by</div>
                  <div className="border border-ink bg-white px-6 py-3">
                    <div className="font-mono text-[11px] text-ink tracking-wide">Calloway Stern</div>
                    <div className="font-mono text-[9px] text-silver tracking-wider">Opposing counsel (if known)</div>
                    <Badge label="Opp. Counsel" bg="bg-slate" text="text-paper" />
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-fog pt-3 font-mono text-[9px] text-institutional tracking-wider text-center">
                FR-F1: Roles ≠ Tags. Opposing Counsel is a distinct participant type linked to the Opposing Party via representation.
              </div>
            </div>

            {/* Participant table */}
            <div className="border border-ink overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="bg-ink text-paper">
                    {["PARTICIPANT", "ROLE", "SIDE", "REPRESENTS", "ORG / FIRM", ""].map((h) => (
                      <th key={h} className="font-mono text-[9px] tracking-[0.15em] text-left px-3 py-2.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink">
                  {[
                    { name: "Maria Garcia", role: "Client", side: "Ours", represents: "—", org: "Garcia Construction LLC", sideColor: "bg-ledger" },
                    { name: "Highland Park Dev Corp", role: "Opposing Party", side: "Theirs", represents: "—", org: "—", sideColor: "bg-filing-red" },
                    { name: "Calloway Stern", role: "Opposing Counsel", side: "Theirs", represents: "Highland Park Dev Corp", org: "Calloway Stern LLP", sideColor: "bg-filing-red" },
                  ].map((p) => (
                    <tr key={p.name} className="bg-white hover:bg-parchment">
                      <td className="font-mono text-[11px] text-ink tracking-wide px-3 py-2.5">{p.name}</td>
                      <td className="px-3 py-2.5"><Badge label={p.role} bg="bg-parchment" text="text-ink" /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <Dot color={p.sideColor} />
                          <span className="font-mono text-[10px] text-ink tracking-wide">{p.side}</span>
                        </div>
                      </td>
                      <td className="font-mono text-[10px] text-slate tracking-wide px-3 py-2.5">{p.represents}</td>
                      <td className="font-mono text-[10px] text-slate tracking-wider px-3 py-2.5">{p.org}</td>
                      <td className="px-3 py-2.5">
                        <button className="font-mono text-[9px] text-institutional tracking-wider">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="font-mono text-[10px] text-institutional tracking-widest px-4 py-2 uppercase border border-institutional">
              + Add Participant
            </button>

            {/* Ethical wall toggle */}
            <div className="mt-6 border-2 border-ink bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-5 border border-ink flex items-center px-0.5 bg-fog cursor-pointer shrink-0 mt-0.5">
                  <div className="w-4 h-4 bg-ink" />
                </div>
                <div>
                  <div className="font-mono text-[11px] text-ink tracking-wider">Enable Ethical Wall (FR-F4)</div>
                  <p className="font-mono text-[10px] text-slate tracking-wide mt-1">
                    Restrict matter access to assigned team members only. Requires at least one responsible attorney. Access changes are logged. This cannot be easily reversed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-5 md:px-8 py-4 border-t border-ink flex items-center justify-between">
            <button className="font-mono text-[10px] text-slate tracking-widest px-4 py-2 uppercase border border-ink hover:bg-parchment">
              ← Previous
            </button>
            <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2 uppercase border border-ink">
              Continue to Seeding →
            </button>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.7 — SCREEN 06: CONVERT TO MATTER — PARTICIPANT MODEL + ETHICAL WALL
        </div>

        {/* Seeding step specimen */}
        <div className="mt-6 border border-ink bg-white p-6">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-4">STEP 3 SPECIMEN — SEEDING CONFIGURATION (FR-F5)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="font-mono text-[10px] text-slate tracking-wider mb-3">MATTER SECTIONS TO SEED</div>
              <div className="space-y-2">
                {["Property / Project Details", "Contract Summary", "Defects / Deficiencies", "Damages Analysis", "Timeline / Key Events", "Correspondence Log"].map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <div className="w-4 h-4 border border-ink bg-ink flex items-center justify-center shrink-0">
                      <div className="w-2 h-0.5 bg-paper" />
                    </div>
                    <span className="font-mono text-[11px] text-ink tracking-wide">{s}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-slate tracking-wider mb-3">STARTER TASKS</div>
              <div className="space-y-2">
                {[
                  "Review engagement letter",
                  "Confirm client contact information",
                  "Request missing documents",
                  "Set up document folders",
                  "Schedule client orientation call",
                  "Review statute of limitations",
                ].map((t) => (
                  <label key={t} className="flex items-center gap-3 cursor-pointer">
                    <div className="w-4 h-4 border border-ink bg-ink flex items-center justify-center shrink-0">
                      <div className="w-2 h-0.5 bg-paper" />
                    </div>
                    <span className="font-mono text-[11px] text-ink tracking-wide">{t}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════
          SCREEN 07 — MATTER OVERVIEW
          ═══════════════════════════════════════ */}
      <SubSection label="Screen 07 — Matter Overview + Setup Checklist">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The newly created matter's home screen. Shows the header with key metadata, participant summary, setup checklist (driving next actions), upcoming tasks, and recent activity. FR-G1 through FR-G3.
        </p>

        <div className="border-2 border-ink overflow-hidden">
          {/* App header */}
          <div className="bg-ink text-paper px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider">
              <span className="text-silver cursor-pointer hover:text-paper">Matters</span>
              <span className="text-graphite">/</span>
              <span className="text-paper">Garcia v. Highland Park Dev Corp</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge label="Active" bg="bg-ledger" text="text-paper" />
              <button className="font-mono text-[9px] text-silver tracking-wider border border-silver/30 px-3 py-1.5 hover:text-paper hover:border-paper/40">
                ⋮ Actions
              </button>
            </div>
          </div>

          {/* Matter header */}
          <div className="bg-white px-5 py-5 border-b border-ink">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="font-mono text-ink tracking-wide" style={{ fontSize: "1.25rem" }}>
                  Garcia v. Highland Park Dev Corp
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {[
                    { k: "MATTER ID", v: "MTR-2026-0193" },
                    { k: "TYPE", v: "Construction Litigation" },
                    { k: "STAGE", v: "Pre-Litigation" },
                    { k: "OPENED", v: "2026.02.19" },
                  ].map((kv) => (
                    <div key={kv.k} className="flex items-center gap-1.5">
                      <span className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</span>
                      <span className="font-mono text-[11px] text-ink tracking-wide">{kv.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">
                  + New Task
                </button>
                <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-2 uppercase border border-ink hover:bg-parchment">
                  Upload
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-ink px-5">
            <div className="flex gap-0 overflow-x-auto">
              {["Overview", "Participants", "Documents", "Timeline", "Tasks", "Financials", "Activity"].map((t, i) => (
                <button
                  key={t}
                  className={`font-mono text-[10px] tracking-wider px-4 py-2.5 border-b-2 whitespace-nowrap ${
                    i === 0 ? "border-ink text-ink" : "border-transparent text-silver hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Overview content */}
          <div className="bg-paper p-5 md:p-8">
            {/* Success banner */}
            <div className="bg-ledger text-paper px-5 py-3 mb-6 flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-widest">✓ MATTER CREATED</span>
              <span className="text-[12px] text-paper/90">Converted from lead: Garcia, Maria — Payment Dispute. Setup checklist ready.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main — Setup Checklist */}
              <div className="md:col-span-2 space-y-6">
                {/* Setup checklist */}
                <div className="border border-ink bg-white">
                  <div className="px-5 py-3 border-b border-ink flex items-center justify-between bg-parchment">
                    <div className="font-mono text-[10px] text-ink tracking-wider">SETUP CHECKLIST</div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-fog">
                        <div className="h-1.5 bg-ink" style={{ width: "33%" }} />
                      </div>
                      <span className="font-mono text-[9px] text-silver tracking-wider">2 / 6</span>
                    </div>
                  </div>
                  <div className="divide-y divide-fog">
                    {[
                      { item: "Review engagement letter", tab: "Documents", done: true, priority: "" },
                      { item: "Confirm client contact details", tab: "Participants", done: true, priority: "" },
                      { item: "Upload construction contract", tab: "Documents", done: false, priority: "High" },
                      { item: "Add opposing counsel details", tab: "Participants", done: false, priority: "High" },
                      { item: "Set up document folders", tab: "Documents", done: false, priority: "Medium" },
                      { item: "Schedule client orientation call", tab: "Tasks", done: false, priority: "Medium" },
                    ].map((c) => (
                      <div key={c.item} className="px-5 py-3 flex items-center gap-3 hover:bg-parchment cursor-pointer">
                        <div className={`w-4 h-4 border shrink-0 flex items-center justify-center ${
                          c.done ? "bg-ink border-ink" : "bg-white border-ink"
                        }`}>
                          {c.done && <div className="w-2 h-0.5 bg-paper" />}
                        </div>
                        <span className={`font-mono text-[11px] tracking-wide flex-1 ${c.done ? "text-silver line-through" : "text-ink"}`}>
                          {c.item}
                        </span>
                        {c.priority && (
                          <Badge
                            label={c.priority}
                            bg={c.priority === "High" ? "bg-filing-red/20" : "bg-fog"}
                            text={c.priority === "High" ? "text-filing-red" : "text-ink"}
                          />
                        )}
                        <span className="font-mono text-[9px] text-institutional tracking-wider">
                          {c.tab} →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming tasks */}
                <div className="border border-ink bg-white">
                  <div className="px-5 py-3 border-b border-fog bg-parchment">
                    <div className="font-mono text-[10px] text-ink tracking-wider">TASKS DUE SOON</div>
                  </div>
                  {[
                    { task: "Request missing documents from client", due: "Feb 21", assigned: "M. Torres", status: "bg-institutional" },
                    { task: "Review statute of limitations", due: "Feb 24", assigned: "K. Aldridge", status: "bg-ink" },
                    { task: "Complete property detail section", due: "Feb 26", assigned: "Paralegal TBD", status: "bg-fog" },
                  ].map((t) => (
                    <div key={t.task} className="px-5 py-3 border-b border-fog last:border-0 flex items-center gap-3 hover:bg-parchment cursor-pointer">
                      <Dot color={t.status} />
                      <span className="font-mono text-[11px] text-ink tracking-wide flex-1">{t.task}</span>
                      <span className="font-mono text-[9px] text-slate tracking-wider">{t.assigned}</span>
                      <span className="font-mono text-[9px] text-silver tracking-wider">{t.due}</span>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="border border-ink bg-white">
                  <div className="px-5 py-3 border-b border-fog bg-parchment">
                    <div className="font-mono text-[10px] text-ink tracking-wider">RECENT ACTIVITY</div>
                  </div>
                  <div className="px-5 py-3 space-y-3">
                    {[
                      { time: "10:42", event: "Matter created from lead (Garcia, Maria — Payment Dispute)", actor: "System" },
                      { time: "10:42", event: "Engagement letter linked (Signed)", actor: "System" },
                      { time: "10:42", event: "3 participants added (Client, Opposing Party, Opposing Counsel)", actor: "System" },
                      { time: "10:42", event: "6 starter tasks created", actor: "System" },
                      { time: "10:42", event: "Document folders seeded (6 categories)", actor: "System" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="font-mono text-[9px] text-silver tracking-wider shrink-0 w-10">{a.time}</span>
                        <span className="font-mono text-[10px] text-ink tracking-wide">{a.event}</span>
                        <span className="font-mono text-[9px] text-silver tracking-wider shrink-0">{a.actor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">KEY PARTICIPANTS</div>
                  {[
                    { name: "Maria Garcia", role: "Client", color: "bg-ledger" },
                    { name: "Highland Park Dev Corp", role: "Opposing Party", color: "bg-filing-red" },
                    { name: "Calloway Stern", role: "Opp. Counsel", color: "bg-filing-red" },
                  ].map((p) => (
                    <div key={p.name} className="py-2 border-b border-fog last:border-0">
                      <div className="flex items-center gap-2">
                        <Dot color={p.color} />
                        <span className="font-mono text-[11px] text-ink tracking-wide">{p.name}</span>
                      </div>
                      <div className="font-mono text-[9px] text-silver tracking-wider ml-3.5">{p.role}</div>
                    </div>
                  ))}
                  <button className="w-full mt-3 font-mono text-[9px] text-institutional tracking-widest py-1.5 uppercase">
                    View All Participants →
                  </button>
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">MATTER TEAM</div>
                  <div className="space-y-2">
                    {[
                      { name: "K. Aldridge", role: "Lead Attorney" },
                      { name: "M. Torres", role: "Intake Specialist" },
                      { name: "TBD", role: "Paralegal" },
                    ].map((m) => (
                      <div key={m.name} className="flex justify-between">
                        <span className="font-mono text-[10px] text-ink tracking-wide">{m.name}</span>
                        <span className="font-mono text-[9px] text-silver tracking-wider">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">QUICK STATS</div>
                  <div className="space-y-2">
                    {[
                      { k: "Documents", v: "3" },
                      { k: "Tasks", v: "6 (0 complete)" },
                      { k: "Conflict", v: "Cleared" },
                      { k: "Engagement", v: "Signed" },
                      { k: "Ethical Wall", v: "Off" },
                    ].map((s) => (
                      <div key={s.k} className="flex justify-between">
                        <span className="font-mono text-[10px] text-slate tracking-wide">{s.k}</span>
                        <span className="font-mono text-[10px] text-ink tracking-wide">{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-ink bg-white p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider mb-3">ORIGIN</div>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate tracking-wide">
                    <div>Source: Portal Intake</div>
                    <div>Lead ID: LEAD-2026-0847</div>
                    <div>Converted: Feb 19, 2026 10:42</div>
                    <div>By: K. Aldridge</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.8 — SCREEN 07: MATTER OVERVIEW WITH SETUP CHECKLIST + SEEDED WORKSPACE
        </div>
      </SubSection>

      {/* ═══════════ EDGE CASES & STATES ═══════════ */}
      <SubSection label="Edge Case UI Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          UI specimens for the critical edge cases defined in the PRD. Each pattern handles failure, ambiguity, or gating gracefully within the LIC design system.
        </p>

        <div className="space-y-4">
          {/* Conflict found after engagement */}
          <div className="border border-filing-red/30 bg-filing-red/5 p-5 flex items-start gap-4">
            <div className="w-1 self-stretch bg-filing-red shrink-0" />
            <div>
              <div className="font-mono text-[9px] text-filing-red tracking-[0.2em] mb-2">CONFLICT FOUND — ENGAGEMENT BLOCKED</div>
              <p className="text-[12px] text-graphite leading-relaxed mb-3">
                A potential conflict has been identified after the engagement letter was drafted. Sending is blocked until the conflict is resolved or an authorized override is provided.
              </p>
              <div className="flex gap-2">
                <button className="font-mono text-[9px] text-paper bg-filing-red tracking-widest px-4 py-1.5 uppercase">
                  Review Conflict
                </button>
                <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                  Request Override
                </button>
              </div>
            </div>
          </div>

          {/* Engagement not signed — conversion blocked */}
          <div className="border border-ink bg-white p-5 flex items-start gap-4">
            <div className="w-1 self-stretch bg-ink shrink-0" />
            <div>
              <div className="font-mono text-[9px] text-ink tracking-[0.2em] mb-2">CONVERSION BLOCKED — ENGAGEMENT NOT SIGNED</div>
              <p className="text-[12px] text-graphite leading-relaxed mb-3">
                The engagement letter has been sent but not yet signed. Default configuration requires a signed engagement before matter creation. 
              </p>
              <div className="flex gap-2">
                <button className="font-mono text-[9px] text-ink tracking-widest px-4 py-1.5 uppercase border border-ink">
                  Send Reminder
                </button>
                <span className="font-mono text-[9px] text-silver tracking-wider py-1.5">Firm-configurable override available</span>
              </div>
            </div>
          </div>

          {/* Ethical wall without team */}
          <div className="border-2 border-ink bg-white p-5 flex items-start gap-4">
            <div className="w-1 self-stretch bg-institutional shrink-0" />
            <div>
              <div className="font-mono text-[9px] text-institutional tracking-[0.2em] mb-2">ETHICAL WALL — TEAM REQUIRED</div>
              <p className="text-[12px] text-graphite leading-relaxed mb-3">
                Ethical wall cannot be enabled without at least one responsible attorney assigned to the matter team. Add an attorney before enabling access restrictions.
              </p>
              <button className="font-mono text-[9px] text-paper bg-institutional tracking-widest px-4 py-1.5 uppercase">
                Assign Attorney
              </button>
            </div>
          </div>

          {/* Portal intake — missing info */}
          <div className="border border-ink bg-parchment p-5 flex items-start gap-4">
            <div className="w-1 self-stretch bg-slate shrink-0" />
            <div>
              <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-2">PORTAL INTAKE — INCOMPLETE SUBMISSION</div>
              <p className="text-[12px] text-graphite leading-relaxed mb-3">
                This lead was submitted via the client portal with missing required information. 4 follow-up tasks have been auto-generated. Lead is in "Needs Review" status.
              </p>
              <div className="flex gap-2">
                <Badge label="4 Tasks Created" bg="bg-ink" text="text-paper" />
                <Badge label="Needs Review" bg="bg-institutional" text="text-paper" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.9 — EDGE CASE UI PATTERNS
        </div>
      </SubSection>

      {/* ═══════════ ANALYTICS EVENTS ═══════════ */}
      <SubSection label="Analytics Event Map">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Events instrumented across the GP-01 flow. Each event maps to a screen and captures the context needed for conversion analysis and workflow optimization.
        </p>
        <div className="border border-ink overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ink text-paper">
                {["EVENT", "SCREEN", "CONTEXT"].map((h) => (
                  <th key={h} className="font-mono text-[9px] tracking-[0.15em] text-left px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink">
              {[
                { event: "lead_created", screen: "01 Inbox", ctx: "source: internal | portal | import" },
                { event: "lead_draft_saved", screen: "02 Wizard", ctx: "step, fields_complete" },
                { event: "upload_added", screen: "02 Wizard", ctx: "type, category, size" },
                { event: "ai_intake_summary_run", screen: "03 Detail", ctx: "sources_count" },
                { event: "ai_citation_opened", screen: "03 Detail", ctx: "document_id, page" },
                { event: "attorney_assigned", screen: "03 Detail", ctx: "attorney_id" },
                { event: "conflict_check_run", screen: "04 Conflict", ctx: "matches_count" },
                { event: "conflict_result_recorded", screen: "04 Conflict", ctx: "result: cleared | potential | confirmed" },
                { event: "engagement_generated", screen: "05 Engage", ctx: "template_id" },
                { event: "engagement_sent", screen: "05 Engage", ctx: "recipients_count" },
                { event: "engagement_signed", screen: "05 Engage", ctx: "time_to_sign" },
                { event: "lead_converted_to_matter", screen: "06 Convert", ctx: "ethical_wall_enabled, participants_count" },
                { event: "setup_checklist_item_clicked", screen: "07 Overview", ctx: "item, target_tab" },
              ].map((e) => (
                <tr key={e.event} className="bg-white hover:bg-parchment">
                  <td className="font-mono text-[11px] text-ink tracking-wide px-4 py-2">{e.event}</td>
                  <td className="font-mono text-[10px] text-slate tracking-wider px-4 py-2">{e.screen}</td>
                  <td className="font-mono text-[10px] text-silver tracking-wider px-4 py-2">{e.ctx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.10 — ANALYTICS EVENT MAP
        </div>
      </SubSection>

      {/* ═══════════ SUMMARY DOCTRINE ═══════════ */}
      <SubSection label="GP-01 Design Doctrine">
        <div className="border border-ink bg-ink text-paper p-8 md:p-12">
          <div className="space-y-6">
            {[
              "The flow is linear and gated. Each screen has a clear entry condition and exit state. No shortcuts bypass conflict check or engagement.",
              "Participant modeling distinguishes between opposing party and opposing counsel. Roles are structural, not tags. Representation links are explicit.",
              "AI summaries are always draft. They include citations that link to source documents. They never leave the system without attorney review.",
              "Conflict search is fuzzy and transparent. Match confidence, match reasons, and linked records are shown. Outcomes are append-only audit records.",
              "Engagement letters follow Draft → Review → Finalize. Recipient confirmation prevents mis-sends. eSign status is tracked through the full lifecycle.",
              "Conversion creates a matter seeded with structure, tasks, and document folders. The setup checklist drives immediate next actions.",
              "Save-as-draft is available at every step with data entry. No work is lost. The system respects the user's time and attention.",
              "Portal submissions are visually distinguished and protected. Missing information generates follow-up tasks, not rejection.",
              "Ethical walls are an explicit, confirmed decision. They require a responsible attorney. Access changes are logged immediately.",
              "Every screen in this flow uses the components defined in §11. No new component types were introduced for GP-01.",
            ].map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-4 border-b border-graphite pb-4 last:border-0 last:pb-0"
              >
                <span className="font-mono text-[10px] text-silver w-6 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[13px] text-paper tracking-wide leading-relaxed">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.11 — GP-01 DESIGN DOCTRINE, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>
    </div>
  );
}
