import { useState } from "react";
import { SectionHeader, SubSection } from "../SectionHeader";

/* ═══════════════════════════════════════════════════════════
   REUSABLE MINI APP SHELL
   Wraps each screen specimen in the canonical layout.
   ═══════════════════════════════════════════════════════════ */
function AppShell({
  sidebarActive,
  breadcrumb,
  topBarRight,
  children,
  bottomBar,
}: {
  sidebarActive: string;
  breadcrumb: React.ReactNode;
  topBarRight?: React.ReactNode;
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
}) {
  const navItems = ["Dashboard", "Intake", "Matters", "Agents", "Reports", "Settings"];
  return (
    <div className="border-2 border-ink overflow-hidden flex" style={{ minHeight: 520 }}>
      {/* Sidebar */}
      <div className="w-[140px] md:w-[160px] shrink-0 bg-ink text-paper flex flex-col text-[10px]">
        <div className="px-3 py-3 border-b border-graphite">
          <div className="font-mono text-[8px] text-silver tracking-[0.2em]">LIC</div>
        </div>
        <div className="flex-1 py-1">
          {navItems.map((item) => (
            <div
              key={item}
              className={`px-3 py-1.5 font-mono tracking-wider cursor-default ${
                item === sidebarActive
                  ? "text-paper bg-paper/10 border-l-2 border-paper"
                  : "text-silver/60 border-l-2 border-transparent"
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-graphite">
          <div className="font-mono text-[7px] text-slate tracking-wider">K. ALDRIDGE</div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-paper min-w-0">
        {/* Top bar */}
        <div className="px-4 py-2 border-b border-ink flex items-center justify-between bg-white shrink-0">
          <div className="font-mono text-[10px] text-slate tracking-wider flex items-center gap-1.5">
            {breadcrumb}
          </div>
          {topBarRight && <div className="flex items-center gap-2">{topBarRight}</div>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>

        {/* Bottom bar */}
        {bottomBar && (
          <div className="px-4 py-2 border-t border-ink bg-white shrink-0">{bottomBar}</div>
        )}
      </div>
    </div>
  );
}

/* Tiny status badge */
function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "active" | "warning" | "critical" | "complete" | "pending" | "info";
}) {
  const styles: Record<string, string> = {
    default: "bg-fog text-ink",
    active: "bg-ledger text-paper",
    warning: "bg-[#d4a017] text-ink",
    critical: "bg-filing-red text-paper",
    complete: "bg-ink text-paper",
    pending: "bg-institutional text-paper",
    info: "bg-institutional/15 text-institutional",
  };
  return (
    <span className={`${styles[variant]} font-mono text-[8px] tracking-widest px-2 py-0.5 uppercase`}>
      {label}
    </span>
  );
}

/* Step indicator for wizards */
function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-5 h-5 flex items-center justify-center font-mono text-[8px] border ${
                i < current
                  ? "bg-ink text-paper border-ink"
                  : i === current
                  ? "bg-institutional text-paper border-institutional"
                  : "bg-white text-silver border-fog"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              className={`font-mono text-[7px] tracking-wider whitespace-nowrap ${
                i === current ? "text-institutional" : i < current ? "text-ink" : "text-silver"
              }`}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-4 md:w-8 -mt-3 mx-0.5 ${i < current ? "bg-ink" : "bg-fog"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   §12 — GP-01 SCREEN SPECIFICATIONS
   ═══════════════════════════════════════════════════════════ */
export function GP01Screens() {
  const [wizardStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="12"
        title="GP-01: Lead-to-Matter Screens"
        subtitle="Screen specifications for the core acquisition-to-case activation workflow. Seven screens, one guided flow. Every specimen adheres to the §11 UI Kit. No component on this page exists outside the approved parts list."
      />

      {/* ───── Overview ───── */}
      <SubSection label="Workflow Overview">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment mb-8">
          <div className="font-serif italic text-ink" style={{ fontSize: "1.25rem", lineHeight: 1.3 }}>
            A potential client enters. A matter exits. Everything between is audited, gated, and structured.
          </div>
        </div>

        {/* Flow diagram */}
        <div className="border border-ink bg-white p-6">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-4">PROCESS FLOW</div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-0 overflow-x-auto">
            {[
              { step: "01", label: "Intake Queue", screen: "GP-01-A" },
              { step: "02", label: "Intake Wizard", screen: "GP-01-B" },
              { step: "03", label: "Lead Detail", screen: "GP-01-C" },
              { step: "04", label: "Conflict Check", screen: "GP-01-D" },
              { step: "05", label: "Engagement", screen: "GP-01-E" },
              { step: "06", label: "Convert", screen: "GP-01-F" },
              { step: "07", label: "Matter Overview", screen: "GP-01-G" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center">
                <div className="border border-ink px-3 py-2 bg-paper min-w-[100px]">
                  <div className="font-mono text-[8px] text-institutional tracking-wider">{s.screen}</div>
                  <div className="font-mono text-[10px] text-ink tracking-wide mt-0.5">{s.label}</div>
                </div>
                {i < 6 && <div className="hidden md:block w-6 h-px bg-ink mx-0" />}
                {i < 6 && <div className="md:hidden h-4 w-px bg-ink mx-auto" />}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-6 font-mono text-[9px] text-slate tracking-wider">
            <span>GATE: Conflict cleared before engagement</span>
            <span>GATE: Signed before conversion</span>
          </div>
        </div>

        {/* Status lifecycle */}
        <div className="mt-6 border border-ink bg-ink text-paper p-6">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-3">LEAD STATUS LIFECYCLE</div>
          <div className="flex flex-wrap items-center gap-2">
            {["Draft", "Submitted", "In Review", "Conflict Hold", "Engaged Pending", "Ready to Convert", "Converted"].map(
              (s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-paper tracking-wide border border-graphite px-2 py-1">
                    {s}
                  </span>
                  {i < 6 && <span className="text-silver text-[10px]">→</span>}
                </div>
              )
            )}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.1 — GP-01 PROCESS FLOW & STATUS LIFECYCLE
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN A — UNIVERSAL INBOX / INTAKE QUEUE
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen A — Universal Inbox / Intake Queue">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          The starting point. All leads arrive here. The queue is a filterable data table with clear status indicators, source labels, and one-click lead creation. Portal submissions are visually distinguished.
        </p>
        <div className="space-y-2 text-[12px] text-graphite mb-6">
          <div>— <span className="font-mono text-[11px] text-ink">Primary role:</span> Intake Specialist</div>
          <div>— <span className="font-mono text-[11px] text-ink">Entry point:</span> Sidebar → Intake (default view)</div>
          <div>— <span className="font-mono text-[11px] text-ink">Key action:</span> Open lead or create new</div>
        </div>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={<><span className="text-ink">Intake Queue</span></>}
          topBarRight={
            <button className="bg-ink text-paper font-mono text-[8px] tracking-widest px-3 py-1.5 uppercase">
              + New Lead
            </button>
          }
        >
          <div className="p-4">
            {/* Filter bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[140px]">
                <input
                  type="text"
                  placeholder="Search leads…"
                  className="w-full border border-ink bg-paper px-3 py-1.5 pr-7 font-mono text-[10px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-silver">⌕</span>
              </div>
              <div className="flex items-center gap-1">
                {["All", "New", "In Review", "Conflict Hold", "Ready"].map((f, i) => (
                  <button
                    key={f}
                    className={`font-mono text-[8px] tracking-wider border px-2 py-1.5 ${
                      i === 0 ? "border-ink bg-ink text-paper" : "border-ink text-ink hover:bg-parchment"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Data table */}
            <div className="border border-ink overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ink text-paper">
                    {["LEAD", "SOURCE", "STAGE", "TYPE", "ATTORNEY", "CREATED", "NEXT ACTION"].map(
                      (h) => (
                        <th key={h} className="font-mono text-[8px] tracking-[0.15em] text-left px-3 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-0.5">{h}<span className="text-silver/40 text-[7px]">↕</span></span>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink">
                  {[
                    { name: "Martinez – Riverside Condos", source: "Portal", stage: "New", stageV: "warning" as const, type: "Defects", attorney: "—", created: "2h ago", action: "Start intake" },
                    { name: "Chen – Harbor Tower", source: "Internal", stage: "In Review", stageV: "pending" as const, type: "Payment", attorney: "K. Aldridge", created: "1d ago", action: "Assign attorney" },
                    { name: "Okonkwo – Summit Ridge", source: "Internal", stage: "Conflict Hold", stageV: "critical" as const, type: "Delay", attorney: "D. Okafor", created: "3d ago", action: "Resolve conflict" },
                    { name: "Park – Valley Industrial", source: "Portal", stage: "Engaged", stageV: "info" as const, type: "Defects", attorney: "K. Aldridge", created: "5d ago", action: "Awaiting signature" },
                    { name: "Thompson – Bayshore", source: "Import", stage: "Ready", stageV: "active" as const, type: "Lien", attorney: "M. Torres", created: "7d ago", action: "Convert to matter" },
                  ].map((row, i) => (
                    <tr key={row.name} className={`${i % 2 === 0 ? "bg-white" : "bg-parchment"} hover:bg-institutional/5 cursor-pointer`}>
                      <td className="px-3 py-2">
                        <div className="font-mono text-[10px] text-ink tracking-wide">{row.name}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-mono text-[8px] tracking-wider ${row.source === "Portal" ? "text-institutional" : "text-slate"}`}>
                          {row.source === "Portal" && "◆ "}{row.source}
                        </span>
                      </td>
                      <td className="px-3 py-2"><Badge label={row.stage} variant={row.stageV} /></td>
                      <td className="font-mono text-[9px] text-slate tracking-wider px-3 py-2">{row.type}</td>
                      <td className="font-mono text-[9px] text-ink tracking-wider px-3 py-2">{row.attorney}</td>
                      <td className="font-mono text-[9px] text-silver tracking-wider px-3 py-2">{row.created}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-[8px] text-institutional tracking-wider cursor-pointer">{row.action} →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[8px] text-silver tracking-wider">5 OF 23 LEADS</span>
              <div className="flex items-center gap-1">
                <button className="w-6 h-6 border border-ink text-silver font-mono text-[9px] flex items-center justify-center">←</button>
                <button className="w-6 h-6 border border-ink bg-ink text-paper font-mono text-[9px] flex items-center justify-center">1</button>
                <button className="w-6 h-6 border border-ink text-ink font-mono text-[9px] flex items-center justify-center">2</button>
                <button className="w-6 h-6 border border-ink text-ink font-mono text-[9px] flex items-center justify-center">→</button>
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.2 — GP-01-A: UNIVERSAL INBOX / INTAKE QUEUE
        </div>

        {/* Annotations */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-ink bg-white p-4">
            <div className="font-mono text-[9px] text-slate tracking-wider mb-2">KEY BEHAVIORS</div>
            <div className="space-y-1.5 text-[11px] text-graphite">
              <div>— Portal leads show ◆ indicator and cannot be bulk-deleted</div>
              <div>— "New Lead" opens wizard immediately (step B)</div>
              <div>— Clicking a row opens Lead Detail (step C)</div>
              <div>— Conflict Hold rows show red badge, block conversion</div>
              <div>— Autosave: draft leads persist without explicit save</div>
            </div>
          </div>
          <div className="border border-ink bg-white p-4">
            <div className="font-mono text-[9px] text-slate tracking-wider mb-2">DATA REQUIREMENTS</div>
            <div className="space-y-1.5 text-[11px] text-graphite">
              <div>— FR-A1: Queue columns as shown above</div>
              <div>— FR-A2: Filter tabs map to lead status enum</div>
              <div>— FR-A3: New Lead creates draft + opens wizard</div>
              <div>— FR-A4: Portal source visually distinguished</div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN B — LEAD INTAKE WIZARD
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen B — Lead Intake Wizard">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          A progressive, stepper-based wizard for capturing essential facts. Supports save-as-draft at every step. Minimal required fields—unknown is acceptable. Duplicate detection for contacts is inline.
        </p>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Intake</span>
              <span className="text-silver">/</span>
              <span className="text-ink">New Lead</span>
            </>
          }
          topBarRight={
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-silver tracking-wider">DRAFT · AUTOSAVED</span>
              <button className="bg-paper text-ink font-mono text-[8px] tracking-widest px-3 py-1 uppercase border border-ink">
                Save & Close
              </button>
            </div>
          }
        >
          <div className="p-4">
            {/* Stepper */}
            <div className="mb-6 flex justify-center">
              <StepIndicator
                steps={["CLIENT", "PROPERTY", "DISPUTE", "UPLOADS", "REVIEW"]}
                current={1}
              />
            </div>

            {/* Step 2: Property */}
            <div className="border border-ink bg-white">
              <div className="px-5 py-3 border-b border-fog bg-parchment flex items-center justify-between">
                <div className="font-mono text-[10px] text-ink tracking-wider">
                  STEP 2 OF 5 — PROPERTY / PROJECT
                </div>
                <div className="font-mono text-[8px] text-silver tracking-wider">REQUIRED FIELDS MARKED *</div>
              </div>

              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">PROJECT NAME *</label>
                    <input
                      type="text"
                      defaultValue="Harbor Tower Residences"
                      className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">PROJECT TYPE *</label>
                    <div className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide flex items-center justify-between cursor-pointer">
                      <span>Residential — Multi-family</span>
                      <span className="text-slate text-[8px]">▼</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">PROJECT ADDRESS</label>
                  <input
                    type="text"
                    defaultValue="450 Harbor Blvd, Long Beach, CA 90802"
                    className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">GENERAL CONTRACTOR</label>
                    <input
                      type="text"
                      defaultValue="Apex Builders Inc."
                      className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                    />
                    {/* Duplicate detection */}
                    <div className="border border-institutional/30 bg-institutional/5 p-2 flex items-start gap-2">
                      <div className="w-1 h-full min-h-[24px] bg-institutional shrink-0" />
                      <div>
                        <div className="font-mono text-[8px] text-institutional tracking-wider">POSSIBLE MATCH</div>
                        <div className="font-mono text-[9px] text-ink tracking-wide mt-0.5">Apex Builders Inc. — 3 existing matters</div>
                        <div className="flex gap-2 mt-1">
                          <button className="font-mono text-[7px] text-institutional tracking-wider underline">Link existing</button>
                          <button className="font-mono text-[7px] text-slate tracking-wider underline">Create new</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">YEAR BUILT</label>
                    <input
                      type="text"
                      defaultValue="2023"
                      className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">UNIT COUNT</label>
                    <input
                      type="text"
                      defaultValue="142"
                      className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">INITIAL NOTES</label>
                  <textarea
                    defaultValue="HOA reports extensive water intrusion in units 301–310 and parking structure P2. Multiple contractor warranty claims pending."
                    className="w-full border border-ink bg-white px-3 py-2 font-mono text-[11px] text-ink tracking-wide focus:outline-none focus:border-institutional h-16 resize-none"
                  />
                </div>
              </div>

              {/* Wizard footer */}
              <div className="px-5 py-3 border-t border-fog bg-parchment flex items-center justify-between">
                <button className="bg-paper text-ink font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">
                  ← Back
                </button>
                <div className="flex items-center gap-2">
                  <button className="bg-paper text-ink font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">
                    Save Draft
                  </button>
                  <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">
                    Continue →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.3 — GP-01-B: LEAD INTAKE WIZARD (STEP 2: PROPERTY)
        </div>

        {/* Upload step specimen */}
        <div className="mt-6 border border-ink bg-white p-5">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-3">STEP 4: UPLOAD DROPZONE SPECIMEN</div>
          <div className="border-2 border-dashed border-fog p-6 text-center bg-parchment">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
              DROP FILES HERE OR CLICK TO BROWSE
            </div>
            <div className="font-mono text-[9px] text-silver tracking-wider">
              PDF, DOC, JPG, PNG, HEIC · MAX 50MB PER FILE
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {[
              { name: "Harbor_Tower_Contract.pdf", size: "2.4 MB", cat: "Contract", status: "complete" },
              { name: "Invoice_Apex_Sept2025.pdf", size: "890 KB", cat: "Invoice", status: "complete" },
              { name: "Water_Intrusion_Photos.zip", size: "14.2 MB", cat: "Photos", status: "uploading" },
            ].map((f) => (
              <div key={f.name} className="flex items-center gap-3 border border-fog p-2">
                <div className={`w-1.5 h-1.5 ${f.status === "complete" ? "bg-ledger" : "bg-institutional"}`} />
                <span className="font-mono text-[10px] text-ink tracking-wide flex-1">{f.name}</span>
                <div className="w-full max-w-[60px] border border-ink bg-white px-1.5 py-0.5 font-mono text-[8px] text-ink tracking-wide flex items-center justify-between cursor-pointer">
                  <span>{f.cat}</span>
                  <span className="text-[7px] text-slate">▼</span>
                </div>
                <span className="font-mono text-[8px] text-silver tracking-wider">{f.size}</span>
                {f.status === "uploading" && (
                  <span className="inline-block w-2.5 h-2.5 border border-ink border-t-transparent animate-spin" />
                )}
                <button className="font-mono text-[9px] text-slate hover:text-ink">×</button>
              </div>
            ))}
          </div>
          <div className="mt-2 font-mono text-[8px] text-silver tracking-wider">
            SUGGESTED CATEGORIES: CONTRACT · INVOICE · PHOTOS · CORRESPONDENCE · OTHER
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN C — LEAD DETAIL + AI INTAKE SUMMARY
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen C — Lead Detail + AI Intake Summary">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          The lead detail view with summary, contacts, uploads, tasks, and AI intake analysis. The AI artifact panel is the distinguishing feature—marked Draft with citations.
        </p>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Intake</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Chen – Harbor Tower</span>
            </>
          }
          topBarRight={
            <div className="flex items-center gap-2">
              <Badge label="In Review" variant="pending" />
              <button className="bg-ink text-paper font-mono text-[8px] tracking-widest px-3 py-1 uppercase">
                Run Conflict Check
              </button>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row min-h-0">
            {/* Left: Lead info */}
            <div className="flex-1 p-4 overflow-auto border-r border-fog">
              {/* Tabs */}
              <div className="flex gap-0 border-b border-ink mb-4">
                {["Summary", "Contacts", "Documents", "Tasks", "Activity"].map((tab, i) => (
                  <button
                    key={tab}
                    className={`font-mono text-[9px] tracking-wider px-3 py-2 border-b-2 ${
                      i === 0 ? "border-ink text-ink" : "border-transparent text-silver"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Lead header */}
              <div className="mb-4">
                <div className="font-mono text-[8px] text-institutional tracking-wider mb-1">LEAD · CONSTRUCTION DEFECTS</div>
                <h2 className="font-mono text-ink tracking-wide" style={{ fontSize: "0.9375rem" }}>
                  Chen – Harbor Tower Residences
                </h2>
              </div>

              {/* Key-value metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { k: "CLIENT", v: "Harbor Tower HOA" },
                  { k: "OPPOSING", v: "Apex Builders Inc." },
                  { k: "PROJECT", v: "450 Harbor Blvd" },
                  { k: "DISPUTE TYPE", v: "Water intrusion" },
                  { k: "SOURCE", v: "Internal referral" },
                  { k: "ASSIGNED", v: "K. Aldridge" },
                  { k: "CREATED", v: "2026.02.18" },
                  { k: "EST. VALUE", v: "$2.4M" },
                ].map((kv) => (
                  <div key={kv.k}>
                    <div className="font-mono text-[7px] text-silver tracking-wider">{kv.k}</div>
                    <div className="font-mono text-[10px] text-ink tracking-wide mt-0.5">{kv.v}</div>
                  </div>
                ))}
              </div>

              {/* Tasks */}
              <div className="border border-ink">
                <div className="px-3 py-2 bg-parchment border-b border-fog flex items-center justify-between">
                  <span className="font-mono text-[8px] text-slate tracking-wider">TASKS (3)</span>
                  <button className="font-mono text-[7px] text-institutional tracking-wider">+ ADD TASK</button>
                </div>
                {[
                  { task: "Request full HOA meeting minutes", assignee: "K. Aldridge", due: "Feb 21", done: false },
                  { task: "Collect warranty documentation from HOA", assignee: "L. Pham", due: "Feb 22", done: false },
                  { task: "Upload contractor invoices", assignee: "Intake", due: "Feb 20", done: true },
                ].map((t) => (
                  <div key={t.task} className="px-3 py-2 border-b border-fog last:border-0 flex items-center gap-2">
                    <div className={`w-3 h-3 border border-ink flex items-center justify-center shrink-0 ${t.done ? "bg-ink" : "bg-white"}`}>
                      {t.done && <div className="w-1.5 h-0.5 bg-paper" />}
                    </div>
                    <span className={`font-mono text-[9px] text-ink tracking-wide flex-1 ${t.done ? "line-through text-silver" : ""}`}>{t.task}</span>
                    <span className="font-mono text-[7px] text-slate tracking-wider">{t.assignee}</span>
                    <span className="font-mono text-[7px] text-silver tracking-wider">{t.due}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: AI Intake panel */}
            <div className="w-full md:w-[280px] shrink-0 bg-white border-l border-ink overflow-auto">
              <div className="px-3 py-2 bg-ink text-paper flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-wider">AI INTAKE SUMMARY</span>
                <Badge label="Draft" variant="warning" />
              </div>
              <div className="p-3 space-y-3">
                {/* AI artifact */}
                <div className="border border-fog p-2 bg-parchment">
                  <div className="font-mono text-[7px] text-institutional tracking-wider mb-1">KEY FACTS</div>
                  <div className="text-[10px] text-ink leading-relaxed space-y-1.5">
                    <p>
                      Harbor Tower HOA alleges construction defects in 142-unit residential complex completed 2023.
                      <span className="font-mono text-[8px] text-institutional cursor-pointer ml-1">[1]</span>
                    </p>
                    <p>
                      Primary claims: water intrusion in units 301–310 and parking structure P2.
                      <span className="font-mono text-[8px] text-institutional cursor-pointer ml-1">[2]</span>
                    </p>
                    <p>
                      General contractor: Apex Builders Inc. Multiple subcontractors involved.
                      <span className="font-mono text-[8px] text-institutional cursor-pointer ml-1">[3]</span>
                    </p>
                  </div>
                </div>

                <div className="border border-fog p-2 bg-parchment">
                  <div className="font-mono text-[7px] text-institutional tracking-wider mb-1">DISPUTE TYPE HYPOTHESIS</div>
                  <div className="text-[10px] text-ink leading-relaxed">
                    Construction defects — water intrusion. Likely SB-800 and common law negligence claims.
                    <span className="font-mono text-[8px] text-institutional cursor-pointer ml-1">[1][2]</span>
                  </div>
                </div>

                <div className="border border-filing-red/20 bg-filing-red/5 p-2">
                  <div className="font-mono text-[7px] text-filing-red tracking-wider mb-1">MISSING INFORMATION</div>
                  <div className="space-y-1">
                    {["Expert inspection report", "Warranty claim correspondence", "HOA meeting minutes re: defects"].map((m) => (
                      <div key={m} className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-filing-red shrink-0" />
                        <span className="text-[9px] text-ink">{m}</span>
                        <button className="font-mono text-[7px] text-institutional tracking-wider ml-auto">+ Task</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-fog p-2 bg-parchment">
                  <div className="font-mono text-[7px] text-institutional tracking-wider mb-1">SUGGESTED ACTIONS</div>
                  <div className="space-y-1 text-[9px] text-graphite">
                    <div>1. Request expert inspection report</div>
                    <div>2. Review warranty claim history</div>
                    <div>3. Assess statute of limitations</div>
                  </div>
                </div>

                {/* Citations */}
                <div className="border-t border-fog pt-2 mt-2">
                  <div className="font-mono text-[7px] text-silver tracking-wider mb-1">SOURCES</div>
                  <div className="space-y-1">
                    {[
                      { id: "[1]", src: "Harbor_Tower_Contract.pdf, p. 4" },
                      { id: "[2]", src: "Water_Intrusion_Photos.zip (notes)" },
                      { id: "[3]", src: "Invoice_Apex_Sept2025.pdf, p. 1" },
                    ].map((c) => (
                      <div key={c.id} className="flex gap-1.5">
                        <span className="font-mono text-[8px] text-institutional tracking-wider shrink-0">{c.id}</span>
                        <span className="font-mono text-[8px] text-slate tracking-wide cursor-pointer hover:text-institutional">{c.src}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI safety notice */}
                <div className="bg-ink text-paper p-2">
                  <div className="font-mono text-[7px] text-silver tracking-wider leading-relaxed">
                    AI-GENERATED · DRAFT · NOT REVIEWED · CITATIONS REQUIRED FOR USE IN ANY EXTERNAL COMMUNICATION
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.4 — GP-01-C: LEAD DETAIL WITH AI INTAKE SUMMARY PANEL
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN D — CONFLICT CHECK
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen D — Conflict Check">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          Search across contacts, matters, and organizations. Results show fuzzy match confidence, match reasons, and linked records. The attorney records an outcome (Cleared, Potential Conflict, Confirmed Conflict) with an append-only audit trail.
        </p>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Intake</span>
              <span className="text-silver">/</span>
              <span className="text-institutional cursor-pointer">Chen – Harbor Tower</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Conflict Check</span>
            </>
          }
          topBarRight={<Badge label="In Progress" variant="pending" />}
        >
          <div className="p-4 space-y-4">
            {/* Search bar */}
            <div className="border border-ink bg-white p-3">
              <div className="font-mono text-[8px] text-slate tracking-wider mb-2">CONFLICT SEARCH</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue="Apex Builders; Harbor Tower HOA; Chen"
                  className="flex-1 border border-ink bg-paper px-3 py-2 font-mono text-[10px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                />
                <button className="bg-ink text-paper font-mono text-[8px] tracking-widest px-4 py-2 uppercase">
                  Search
                </button>
              </div>
              <div className="mt-2 flex gap-3">
                {["Contacts", "Matters", "Organizations", "All parties"].map((scope) => (
                  <label key={scope} className="flex items-center gap-1.5 cursor-pointer">
                    <div className="w-3 h-3 border border-ink flex items-center justify-center bg-ink">
                      <div className="w-1.5 h-0.5 bg-paper" />
                    </div>
                    <span className="font-mono text-[8px] text-ink tracking-wider">{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="font-mono text-[8px] text-slate tracking-wider">3 POTENTIAL MATCHES FOUND</div>

            <div className="space-y-3">
              {/* Match 1 — High */}
              <div className="border-2 border-filing-red/40 bg-filing-red/5">
                <div className="px-4 py-2 flex items-center justify-between border-b border-filing-red/20">
                  <div className="flex items-center gap-2">
                    <Badge label="High" variant="critical" />
                    <span className="font-mono text-[10px] text-ink tracking-wide">Apex Builders Inc.</span>
                  </div>
                  <span className="font-mono text-[9px] text-filing-red tracking-wider">92% CONFIDENCE</span>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-2">MATCH REASONS</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="font-mono text-[8px] text-ink tracking-wider border border-ink px-2 py-0.5">Name: exact</span>
                    <span className="font-mono text-[8px] text-ink tracking-wider border border-ink px-2 py-0.5">Phone: match</span>
                    <span className="font-mono text-[8px] text-ink tracking-wider border border-ink px-2 py-0.5">EIN: match</span>
                  </div>
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-1">LINKED RECORDS</div>
                  <div className="space-y-1">
                    <div className="font-mono text-[9px] text-ink tracking-wide">
                      Matter: <span className="text-institutional cursor-pointer">Park v. Apex Builders</span> (Active — client is opposing party)
                    </div>
                    <div className="font-mono text-[9px] text-ink tracking-wide">
                      Matter: <span className="text-institutional cursor-pointer">Riverside HOA v. Apex</span> (Closed 2024)
                    </div>
                  </div>
                </div>
              </div>

              {/* Match 2 — Low */}
              <div className="border border-fog bg-white">
                <div className="px-4 py-2 flex items-center justify-between border-b border-fog">
                  <div className="flex items-center gap-2">
                    <Badge label="Low" variant="default" />
                    <span className="font-mono text-[10px] text-ink tracking-wide">Harbor Properties LLC</span>
                  </div>
                  <span className="font-mono text-[9px] text-silver tracking-wider">34% CONFIDENCE</span>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-1">MATCH REASONS</div>
                  <div className="flex gap-2 mb-2">
                    <span className="font-mono text-[8px] text-ink tracking-wider border border-fog px-2 py-0.5">Name: partial ("Harbor")</span>
                  </div>
                  <div className="font-mono text-[9px] text-slate tracking-wide">
                    No linked matters. Different entity.
                  </div>
                </div>
              </div>

              {/* Match 3 — Medium */}
              <div className="border border-ink bg-white">
                <div className="px-4 py-2 flex items-center justify-between border-b border-fog">
                  <div className="flex items-center gap-2">
                    <Badge label="Medium" variant="warning" />
                    <span className="font-mono text-[10px] text-ink tracking-wide">Michael Chen (Attorney)</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#d4a017] tracking-wider">61% CONFIDENCE</span>
                </div>
                <div className="px-4 py-3">
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-1">MATCH REASONS</div>
                  <div className="flex gap-2 mb-2">
                    <span className="font-mono text-[8px] text-ink tracking-wider border border-ink px-2 py-0.5">Name: surname match</span>
                  </div>
                  <div className="font-mono text-[9px] text-slate tracking-wide">
                    Contact is attorney at Stern & Associates. Different individual from lead contact David Chen.
                  </div>
                </div>
              </div>
            </div>

            {/* Record outcome */}
            <div className="border-2 border-ink bg-white p-4">
              <div className="font-mono text-[9px] text-ink tracking-wider mb-3">RECORD OUTCOME</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { label: "Cleared", variant: "active" as const },
                  { label: "Potential Conflict", variant: "warning" as const },
                  { label: "Confirmed Conflict", variant: "critical" as const },
                ].map((o) => (
                  <button key={o.label} className="font-mono text-[9px] text-ink tracking-wider border border-ink px-3 py-2 hover:bg-parchment">
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[8px] tracking-[0.2em] text-slate block">REVIEWER NOTES</label>
                <textarea
                  placeholder="Document your analysis and reasoning…"
                  className="w-full border border-ink bg-paper px-3 py-2 font-mono text-[10px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional h-12 resize-none"
                />
              </div>
              <div className="mt-2 font-mono text-[7px] text-silver tracking-wider">
                APPEND-ONLY AUDIT · REVIEWER: K. ALDRIDGE · {new Date().toISOString().split("T")[0]}
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.5 — GP-01-D: CONFLICT CHECK WITH MATCH RESULTS
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN E — ENGAGEMENT LETTER
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen E — Engagement Letter">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          Template selection, merge field preview, fee arrangement capture, and eSign tracking. The document follows a Draft → Review → Finalize → Send flow with versioning. Recipient confirmation is mandatory before sending.
        </p>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Intake</span>
              <span className="text-silver">/</span>
              <span className="text-institutional cursor-pointer">Chen – Harbor Tower</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Engagement</span>
            </>
          }
          topBarRight={
            <div className="flex items-center gap-2">
              <Badge label="In Review" variant="pending" />
              <span className="font-mono text-[7px] text-silver tracking-wider">V2 · LAST SAVED 14:08</span>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row min-h-0">
            {/* Left: Document panel */}
            <div className="flex-1 p-4 overflow-auto">
              {/* Status bar */}
              <div className="mb-4">
                <StepIndicator
                  steps={["DRAFT", "REVIEW", "FINALIZE", "SEND", "SIGNED"]}
                  current={1}
                />
              </div>

              {/* Document preview */}
              <div className="border border-ink bg-white">
                <div className="px-4 py-2 bg-parchment border-b border-fog flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink tracking-wider">ENGAGEMENT LETTER — PREVIEW</span>
                  <button className="font-mono text-[7px] text-institutional tracking-wider">EDIT TEMPLATE</button>
                </div>
                <div className="p-5 space-y-3" style={{ fontFamily: "'IBM Plex Serif', serif", fontSize: "11px", lineHeight: 1.6 }}>
                  <div className="font-mono text-[9px] text-slate tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    February 19, 2026
                  </div>
                  <div>
                    <strong>Harbor Tower Homeowners Association</strong><br />
                    c/o David Chen, Board President<br />
                    450 Harbor Blvd<br />
                    Long Beach, CA 90802
                  </div>
                  <div>
                    Re: <strong>Engagement of Legal Services — Construction Defect Claims</strong>
                  </div>
                  <div className="text-graphite">
                    Dear Mr. Chen,
                  </div>
                  <div className="text-graphite">
                    Thank you for selecting our firm to represent Harbor Tower Homeowners Association in connection with construction defect claims related to the Harbor Tower Residences project…
                  </div>
                  <div className="bg-institutional/10 border border-institutional/20 px-2 py-1 inline-block">
                    <span className="font-mono text-[8px] text-institutional tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      {"MERGE: {{fee_arrangement}}"}
                    </span>
                  </div>
                  <div className="text-slate italic text-[10px]">
                    [Continued — 3 pages total]
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Controls panel */}
            <div className="w-full md:w-[240px] shrink-0 border-l border-ink bg-white overflow-auto">
              <div className="px-3 py-2 bg-ink text-paper">
                <span className="font-mono text-[9px] tracking-wider">ENGAGEMENT CONTROLS</span>
              </div>
              <div className="p-3 space-y-4">
                {/* Template */}
                <div className="space-y-1">
                  <label className="font-mono text-[8px] tracking-[0.2em] text-slate block">TEMPLATE</label>
                  <div className="w-full border border-ink bg-paper px-2 py-1.5 font-mono text-[9px] text-ink tracking-wide flex items-center justify-between cursor-pointer">
                    <span>Construction Defect — Standard</span>
                    <span className="text-[7px] text-slate">▼</span>
                  </div>
                </div>

                {/* Fee arrangement */}
                <div className="space-y-1">
                  <label className="font-mono text-[8px] tracking-[0.2em] text-slate block">FEE ARRANGEMENT</label>
                  <div className="space-y-1.5">
                    {["Hourly", "Contingency", "Hybrid"].map((f, i) => (
                      <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                        <div className="w-3 h-3 border border-ink flex items-center justify-center bg-white">
                          {i === 0 && <div className="w-1.5 h-1.5 bg-ink" />}
                        </div>
                        <span className="font-mono text-[9px] text-ink tracking-wide">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[8px] tracking-[0.2em] text-slate block">HOURLY RATE</label>
                  <input
                    type="text"
                    defaultValue="$475 / hour"
                    className="w-full border border-ink bg-paper px-2 py-1.5 font-mono text-[9px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[8px] tracking-[0.2em] text-slate block">TRUST RETAINER</label>
                  <input
                    type="text"
                    defaultValue="$15,000"
                    className="w-full border border-ink bg-paper px-2 py-1.5 font-mono text-[9px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                  />
                </div>

                {/* eSign status */}
                <div className="border-t border-fog pt-3">
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-2">eSIGN STATUS</div>
                  <div className="space-y-1.5">
                    {[
                      { status: "Draft", icon: "bg-fog", active: false },
                      { status: "Sent", icon: "bg-fog", active: false },
                      { status: "Viewed", icon: "bg-fog", active: false },
                      { status: "Signed", icon: "bg-fog", active: false },
                    ].map((s) => (
                      <div key={s.status} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 ${s.active ? "bg-ledger" : "bg-fog"}`} />
                        <span className={`font-mono text-[8px] tracking-wider ${s.active ? "text-ink" : "text-silver"}`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recipients */}
                <div className="border-t border-fog pt-3">
                  <div className="font-mono text-[8px] text-slate tracking-wider mb-2">RECIPIENTS</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-mono text-[8px] text-ink tracking-wide">
                      <div className="w-3 h-3 border border-ink flex items-center justify-center bg-ink">
                        <div className="w-1.5 h-0.5 bg-paper" />
                      </div>
                      david.chen@harbortower.org
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button className="w-full bg-ink text-paper font-mono text-[8px] tracking-widest px-3 py-2 uppercase">
                    Finalize & Send
                  </button>
                  <button className="w-full bg-paper text-ink font-mono text-[8px] tracking-widest px-3 py-2 uppercase border border-ink">
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.6 — GP-01-E: ENGAGEMENT LETTER WITH CONTROLS PANEL
        </div>

        {/* Recipient confirmation specimen */}
        <div className="mt-6 border border-ink bg-ink/5 p-6 flex items-center justify-center">
          <div className="border border-ink bg-white w-full max-w-sm shadow-[4px_4px_0px_0px_rgba(11,11,11,0.1)]">
            <div className="px-5 py-3 border-b border-ink flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink tracking-wider">CONFIRM RECIPIENTS</span>
              <button className="text-slate hover:text-ink font-mono text-[12px]">×</button>
            </div>
            <div className="px-5 py-4">
              <p className="text-[12px] text-graphite leading-relaxed mb-4">
                You are about to send the engagement letter. Please confirm the recipients below.
              </p>
              <div className="border border-ink p-3 bg-parchment mb-3">
                <div className="font-mono text-[9px] text-slate tracking-wider mb-1">TO:</div>
                <div className="font-mono text-[11px] text-ink tracking-wide">david.chen@harbortower.org</div>
                <div className="font-mono text-[9px] text-silver tracking-wider mt-0.5">David Chen · Board President · Harbor Tower HOA</div>
              </div>
              <div className="border border-institutional/20 bg-institutional/5 p-2 flex items-start gap-2">
                <div className="w-1 h-full min-h-[20px] bg-institutional shrink-0" />
                <div className="font-mono text-[8px] text-institutional tracking-wider leading-relaxed">
                  This document will be sent for electronic signature. Verify recipient before proceeding.
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-fog bg-parchment flex items-center justify-end gap-2">
              <button className="bg-paper text-ink font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">Cancel</button>
              <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-2 uppercase border border-ink">Confirm & Send</button>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.7 — GP-01-E: RECIPIENT CONFIRMATION MODAL (FR-E5)
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN F — CONVERT TO MATTER WIZARD
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen F — Convert to Matter Wizard">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          The conversion wizard creates a litigation-ready matter with correct participant modeling. The participant graph distinguishes parties, counsel, and representation links. Ethical wall toggle requires explicit confirmation.
        </p>

        <AppShell
          sidebarActive="Intake"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Intake</span>
              <span className="text-silver">/</span>
              <span className="text-institutional cursor-pointer">Chen – Harbor Tower</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Convert to Matter</span>
            </>
          }
          topBarRight={
            <div className="flex items-center gap-2">
              <Badge label="Conflict Cleared" variant="active" />
              <Badge label="Engagement Signed" variant="complete" />
            </div>
          }
        >
          <div className="p-4">
            {/* Stepper */}
            <div className="mb-5 flex justify-center">
              <StepIndicator
                steps={["MATTER TYPE", "PARTICIPANTS", "ETHICAL WALL", "SEEDING", "CONFIRM"]}
                current={1}
              />
            </div>

            {/* Step 2: Participants */}
            <div className="border border-ink bg-white">
              <div className="px-4 py-2 border-b border-fog bg-parchment flex items-center justify-between">
                <div className="font-mono text-[9px] text-ink tracking-wider">
                  STEP 2 OF 5 — PARTICIPANT MODEL
                </div>
                <button className="font-mono text-[7px] text-institutional tracking-wider">+ ADD PARTICIPANT</button>
              </div>

              <div className="p-4">
                {/* Participant graph */}
                <div className="border border-ink p-4 bg-parchment mb-4">
                  <div className="font-mono text-[8px] text-silver tracking-wider mb-3">PARTICIPANT GRAPH</div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                    {/* Our side */}
                    <div className="flex-1">
                      <div className="font-mono text-[7px] text-ledger tracking-widest mb-2">OUR SIDE</div>
                      <div className="border border-ledger/30 bg-ledger/5 p-3 space-y-2">
                        <div className="border border-ink bg-white p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-[7px] text-ledger tracking-wider">CLIENT</div>
                              <div className="font-mono text-[10px] text-ink tracking-wide">Harbor Tower HOA</div>
                            </div>
                            <button className="font-mono text-[7px] text-slate">⋮</button>
                          </div>
                        </div>
                        <div className="text-center font-mono text-[7px] text-silver">represented by ↓</div>
                        <div className="border border-ink bg-white p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-[7px] text-institutional tracking-wider">COUNSEL (US)</div>
                              <div className="font-mono text-[10px] text-ink tracking-wide">Morrison & Whitfield LLP</div>
                              <div className="font-mono text-[8px] text-silver tracking-wide">K. Aldridge, Lead</div>
                            </div>
                            <button className="font-mono text-[7px] text-slate">⋮</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-32 bg-ink" />
                    <div className="md:hidden h-px w-full bg-ink" />

                    {/* Their side */}
                    <div className="flex-1">
                      <div className="font-mono text-[7px] text-filing-red tracking-widest mb-2">THEIR SIDE</div>
                      <div className="border border-filing-red/30 bg-filing-red/5 p-3 space-y-2">
                        <div className="border border-ink bg-white p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-[7px] text-filing-red tracking-wider">OPPOSING PARTY</div>
                              <div className="font-mono text-[10px] text-ink tracking-wide">Apex Builders Inc.</div>
                            </div>
                            <button className="font-mono text-[7px] text-slate">⋮</button>
                          </div>
                        </div>
                        <div className="text-center font-mono text-[7px] text-silver">represented by ↓</div>
                        <div className="border border-ink bg-white p-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono text-[7px] text-filing-red/70 tracking-wider">OPPOSING COUNSEL</div>
                              <div className="font-mono text-[10px] text-ink tracking-wide">Calloway Stern</div>
                              <div className="font-mono text-[8px] text-silver tracking-wide">J. Calloway, Partner</div>
                            </div>
                            <button className="font-mono text-[7px] text-slate">⋮</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participant table */}
                <div className="border border-ink overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-ink text-paper">
                        {["NAME", "ROLE", "SIDE", "REPRESENTED BY", ""].map((h) => (
                          <th key={h} className="font-mono text-[8px] tracking-[0.12em] text-left px-3 py-1.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-fog">
                      {[
                        { name: "Harbor Tower HOA", role: "Client", side: "Ours", rep: "Morrison & Whitfield" },
                        { name: "Apex Builders Inc.", role: "Opposing Party", side: "Theirs", rep: "Calloway Stern" },
                        { name: "Calloway Stern", role: "Opposing Counsel", side: "Theirs", rep: "—" },
                        { name: "Morrison & Whitfield", role: "Counsel", side: "Ours", rep: "—" },
                      ].map((p) => (
                        <tr key={p.name} className="bg-white hover:bg-parchment">
                          <td className="font-mono text-[9px] text-ink tracking-wide px-3 py-2">{p.name}</td>
                          <td className="font-mono text-[8px] text-slate tracking-wider px-3 py-2">{p.role}</td>
                          <td className="px-3 py-2">
                            <span className={`font-mono text-[8px] tracking-widest px-1.5 py-0.5 ${p.side === "Ours" ? "bg-ledger/10 text-ledger" : "bg-filing-red/10 text-filing-red"}`}>
                              {p.side}
                            </span>
                          </td>
                          <td className="font-mono text-[8px] text-silver tracking-wider px-3 py-2">{p.rep}</td>
                          <td className="px-3 py-2">
                            <button className="font-mono text-[7px] text-slate hover:text-ink">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Wizard footer */}
              <div className="px-4 py-3 border-t border-fog bg-parchment flex items-center justify-between">
                <button className="bg-paper text-ink font-mono text-[8px] tracking-widest px-3 py-2 uppercase border border-ink">← Back</button>
                <button className="bg-ink text-paper font-mono text-[8px] tracking-widest px-3 py-2 uppercase border border-ink">Continue →</button>
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.8 — GP-01-F: CONVERT TO MATTER WIZARD (STEP 2: PARTICIPANTS)
        </div>

        {/* Ethical wall specimen */}
        <div className="mt-6 border border-ink bg-white p-5">
          <div className="font-mono text-[9px] text-silver tracking-wider mb-3">STEP 3: ETHICAL WALL TOGGLE SPECIMEN</div>
          <div className="border-2 border-ink p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-5 border border-ink flex items-center px-0.5 bg-fog cursor-pointer">
                <div className="w-4 h-4 bg-ink" />
              </div>
              <div>
                <div className="font-mono text-[11px] text-ink tracking-wide">Enable ethical wall</div>
                <p className="text-[11px] text-slate mt-1 leading-relaxed max-w-md">
                  Restricts matter access to assigned team members only. All access attempts are logged. This cannot be undone without administrator approval.
                </p>
              </div>
            </div>
            <div className="mt-3 border border-filing-red/20 bg-filing-red/5 p-3 flex items-start gap-2">
              <div className="w-1 h-full min-h-[20px] bg-filing-red shrink-0" />
              <div>
                <div className="font-mono text-[8px] text-filing-red tracking-wider">REQUIRES AT LEAST ONE ASSIGNED ATTORNEY</div>
                <p className="text-[10px] text-graphite mt-1">Assign a responsible attorney before enabling the ethical wall.</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <label className="font-mono text-[9px] tracking-[0.2em] text-slate block">ASSIGNED TEAM</label>
              <div className="flex gap-2">
                <span className="font-mono text-[9px] text-ink tracking-wider border border-ink px-2 py-1 bg-parchment flex items-center gap-1">
                  K. Aldridge <span className="text-slate cursor-pointer">×</span>
                </span>
                <button className="font-mono text-[8px] text-institutional tracking-wider border border-institutional/30 px-2 py-1">+ Add</button>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN G — MATTER OVERVIEW + SETUP CHECKLIST
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen G — Matter Overview + Setup Checklist">
        <p className="text-[13px] text-slate mb-4 max-w-lg leading-relaxed">
          The destination. After conversion, the attorney or paralegal lands here. The setup checklist drives next actions. Key participants, recent activity, and upcoming tasks are immediately visible. Each checklist item deep-links to the relevant section.
        </p>

        <AppShell
          sidebarActive="Matters"
          breadcrumb={
            <>
              <span className="text-institutional cursor-pointer">Matters</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Chen v. Apex Builders</span>
            </>
          }
          topBarRight={
            <div className="flex items-center gap-2">
              <Badge label="Active" variant="active" />
              <span className="font-mono text-[7px] text-silver tracking-wider">2026-CL-00847</span>
            </div>
          }
        >
          <div className="p-4 space-y-4">
            {/* Matter header */}
            <div className="border border-ink bg-white">
              <div className="px-4 py-3 border-b border-ink bg-ink text-paper flex items-center justify-between">
                <div>
                  <div className="font-mono text-[8px] text-silver tracking-wider">MATTER · CONSTRUCTION DEFECTS</div>
                  <div className="font-mono text-[12px] text-paper tracking-wide mt-0.5">Chen v. Apex Builders Inc.</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[8px] text-silver tracking-wider">HARBOR TOWER RESIDENCES</div>
                  <div className="font-mono text-[9px] text-silver/60 tracking-wider mt-0.5">Converted Feb 19, 2026</div>
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { k: "CLIENT", v: "Harbor Tower HOA" },
                    { k: "OPPOSING", v: "Apex Builders" },
                    { k: "LEAD ATTY", v: "K. Aldridge" },
                    { k: "TYPE", v: "Constr. Defects" },
                    { k: "STAGE", v: "Pre-litigation" },
                    { k: "VALUE", v: "$2.4M est." },
                  ].map((kv) => (
                    <div key={kv.k}>
                      <div className="font-mono text-[7px] text-silver tracking-wider">{kv.k}</div>
                      <div className="font-mono text-[9px] text-ink tracking-wide mt-0.5">{kv.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Setup checklist */}
              <div className="md:col-span-2 border border-ink bg-white">
                <div className="px-4 py-2 bg-parchment border-b border-fog flex items-center justify-between">
                  <span className="font-mono text-[9px] text-ink tracking-wider">SETUP CHECKLIST</span>
                  <span className="font-mono text-[8px] text-silver tracking-wider">3 OF 8 COMPLETE</span>
                </div>
                {/* Completeness bar */}
                <div className="px-4 pt-2">
                  <div className="w-full h-1 bg-fog">
                    <div className="h-1 bg-ink" style={{ width: "37.5%" }} />
                  </div>
                </div>
                <div className="divide-y divide-fog">
                  {[
                    { task: "Confirm participant model", link: "Participants →", done: true, priority: false },
                    { task: "Upload engagement letter", link: "Documents →", done: true, priority: false },
                    { task: "Verify conflict check clearance", link: "Compliance →", done: true, priority: false },
                    { task: "Complete property defect inventory", link: "Property →", done: false, priority: true },
                    { task: "Upload inspection reports", link: "Documents →", done: false, priority: true },
                    { task: "Set key deadlines (SOL, filing)", link: "Timeline →", done: false, priority: true },
                    { task: "Assign paralegal to matter", link: "Team →", done: false, priority: false },
                    { task: "Create initial document folders", link: "Documents →", done: false, priority: false },
                  ].map((t) => (
                    <div key={t.task} className="px-4 py-2 flex items-center gap-2 hover:bg-parchment">
                      <div className={`w-3 h-3 border border-ink flex items-center justify-center shrink-0 ${t.done ? "bg-ink" : "bg-white"}`}>
                        {t.done && <div className="w-1.5 h-0.5 bg-paper" />}
                      </div>
                      <span className={`font-mono text-[9px] text-ink tracking-wide flex-1 ${t.done ? "line-through text-silver" : ""}`}>
                        {t.task}
                      </span>
                      {t.priority && !t.done && (
                        <Badge label="Priority" variant="warning" />
                      )}
                      {!t.done && (
                        <span className="font-mono text-[7px] text-institutional tracking-wider cursor-pointer">{t.link}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Key participants */}
                <div className="border border-ink bg-white">
                  <div className="px-3 py-2 bg-parchment border-b border-fog">
                    <span className="font-mono text-[8px] text-slate tracking-wider">PARTICIPANTS</span>
                  </div>
                  {[
                    { name: "Harbor Tower HOA", role: "Client", side: "ledger" },
                    { name: "Apex Builders Inc.", role: "Opposing", side: "filing-red" },
                    { name: "Calloway Stern", role: "Opp. Counsel", side: "filing-red" },
                    { name: "K. Aldridge", role: "Lead Attorney", side: "ledger" },
                  ].map((p) => (
                    <div key={p.name} className="px-3 py-1.5 border-b border-fog last:border-0 flex items-center gap-2">
                      <div className={`w-1 h-1 bg-${p.side} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[9px] text-ink tracking-wide truncate">{p.name}</div>
                      </div>
                      <span className="font-mono text-[7px] text-silver tracking-wider shrink-0">{p.role}</span>
                    </div>
                  ))}
                </div>

                {/* Tasks due soon */}
                <div className="border border-ink bg-white">
                  <div className="px-3 py-2 bg-parchment border-b border-fog">
                    <span className="font-mono text-[8px] text-slate tracking-wider">TASKS DUE SOON</span>
                  </div>
                  {[
                    { task: "Request expert inspection", due: "Feb 21", assignee: "K.A." },
                    { task: "File prelim. notice", due: "Feb 24", assignee: "L.P." },
                    { task: "Collect warranty docs", due: "Feb 22", assignee: "K.A." },
                  ].map((t) => (
                    <div key={t.task} className="px-3 py-1.5 border-b border-fog last:border-0 flex items-center gap-2">
                      <span className="font-mono text-[9px] text-ink tracking-wide flex-1">{t.task}</span>
                      <span className="font-mono text-[7px] text-silver tracking-wider">{t.due}</span>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="border border-ink bg-white">
                  <div className="px-3 py-2 bg-parchment border-b border-fog">
                    <span className="font-mono text-[8px] text-slate tracking-wider">RECENT ACTIVITY</span>
                  </div>
                  {[
                    { event: "Matter created from lead", time: "Just now", actor: "System" },
                    { event: "Engagement signed", time: "2h ago", actor: "D. Chen" },
                    { event: "Conflict check cleared", time: "4h ago", actor: "K. Aldridge" },
                  ].map((a) => (
                    <div key={a.event} className="px-3 py-1.5 border-b border-fog last:border-0">
                      <div className="font-mono text-[8px] text-ink tracking-wide">{a.event}</div>
                      <div className="font-mono text-[7px] text-silver tracking-wider mt-0.5">
                        {a.actor} · {a.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Seeded sections */}
            <div className="border border-ink bg-white">
              <div className="px-4 py-2 bg-parchment border-b border-fog">
                <span className="font-mono text-[9px] text-ink tracking-wider">MATTER SECTIONS (SEEDED)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-fog">
                {[
                  { label: "Property", items: 0, ready: false },
                  { label: "Contract", items: 1, ready: false },
                  { label: "Defects", items: 0, ready: false },
                  { label: "Damages", items: 0, ready: false },
                  { label: "Documents", items: 3, ready: true },
                  { label: "Timeline", items: 0, ready: false },
                  { label: "Parties", items: 4, ready: true },
                  { label: "Compliance", items: 1, ready: true },
                ].map((s) => (
                  <div key={s.label} className="p-3 hover:bg-parchment cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] text-ink tracking-wider">{s.label}</span>
                      {s.ready && <div className="w-1.5 h-1.5 bg-ledger" />}
                    </div>
                    <span className="font-mono text-[8px] text-silver tracking-wider">
                      {s.items} items
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AppShell>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.9 — GP-01-G: MATTER OVERVIEW WITH SETUP CHECKLIST
        </div>
      </SubSection>

      {/* ═══════════════════════════════════════════════
         SCREEN INVENTORY & CROSS-REFERENCE
         ═══════════════════════════════════════════════ */}
      <SubSection label="Screen Inventory & Requirement Cross-Reference">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Complete mapping of PRD functional requirements to screen specimens. Every FR is addressed. If a requirement is implemented across multiple screens, all are listed.
        </p>

        <div className="border border-ink overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ink text-paper">
                {["REQ", "DESCRIPTION", "SCREEN", "FIG."].map((h) => (
                  <th key={h} className="font-mono text-[9px] tracking-[0.12em] text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {[
                { req: "FR-A1", desc: "Queue columns: name, created, source, stage, attorney, next action", screen: "GP-01-A", fig: "12.2" },
                { req: "FR-A2", desc: "Views/filters: New, In Review, Conflict Hold, etc.", screen: "GP-01-A", fig: "12.2" },
                { req: "FR-A3", desc: "New Lead creates draft + opens wizard", screen: "GP-01-A → B", fig: "12.2" },
                { req: "FR-A4", desc: "Portal leads visually distinguished (◆ indicator)", screen: "GP-01-A", fig: "12.2" },
                { req: "FR-B1", desc: "Progressive stepper wizard with save-as-draft", screen: "GP-01-B", fig: "12.3" },
                { req: "FR-B3", desc: "Upload dropzone with category suggestions", screen: "GP-01-B", fig: "12.3" },
                { req: "FR-B4", desc: "Duplicate detection for contacts", screen: "GP-01-B", fig: "12.3" },
                { req: "FR-C1", desc: "Lead detail: summary, contacts, uploads, tasks", screen: "GP-01-C", fig: "12.4" },
                { req: "FR-C2", desc: "AI artifact with key facts, hypothesis, missing info", screen: "GP-01-C", fig: "12.4" },
                { req: "FR-C3", desc: "AI output marked Draft with citations", screen: "GP-01-C", fig: "12.4" },
                { req: "FR-C4", desc: "One-click task creation from missing info", screen: "GP-01-C", fig: "12.4" },
                { req: "FR-D1", desc: "Conflict search across contacts/matters/orgs", screen: "GP-01-D", fig: "12.5" },
                { req: "FR-D2", desc: "Fuzzy match + confidence + match reasons", screen: "GP-01-D", fig: "12.5" },
                { req: "FR-D3", desc: "Record outcomes: Cleared, Potential, Confirmed", screen: "GP-01-D", fig: "12.5" },
                { req: "FR-D4", desc: "Append-only audit trail for conflict outcomes", screen: "GP-01-D", fig: "12.5" },
                { req: "FR-E1", desc: "Template picker with merge fields", screen: "GP-01-E", fig: "12.6" },
                { req: "FR-E2", desc: "Fee arrangement capture", screen: "GP-01-E", fig: "12.6" },
                { req: "FR-E4", desc: "eSign status tracking", screen: "GP-01-E", fig: "12.6" },
                { req: "FR-E5", desc: "Recipient confirmation before send", screen: "GP-01-E", fig: "12.7" },
                { req: "FR-F1", desc: "Participant model: role, side, representation", screen: "GP-01-F", fig: "12.8" },
                { req: "FR-F2", desc: "Participant graph preview", screen: "GP-01-F", fig: "12.8" },
                { req: "FR-F4", desc: "Ethical wall toggle with confirmation", screen: "GP-01-F", fig: "12.8" },
                { req: "FR-G1", desc: "Matter overview with checklist + tasks + activity", screen: "GP-01-G", fig: "12.9" },
                { req: "FR-G2", desc: "Checklist items deep-link to relevant sections", screen: "GP-01-G", fig: "12.9" },
                { req: "FR-G3", desc: "Completeness indicator (non-gamified)", screen: "GP-01-G", fig: "12.9" },
              ].map((r, i) => (
                <tr key={r.req} className={i % 2 === 0 ? "bg-white" : "bg-parchment"}>
                  <td className="font-mono text-[10px] text-institutional tracking-wider px-4 py-2">{r.req}</td>
                  <td className="text-[11px] text-graphite px-4 py-2">{r.desc}</td>
                  <td className="font-mono text-[10px] text-ink tracking-wider px-4 py-2">{r.screen}</td>
                  <td className="font-mono text-[10px] text-silver tracking-wider px-4 py-2">{r.fig}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.10 — FUNCTIONAL REQUIREMENT TO SCREEN CROSS-REFERENCE
        </div>
      </SubSection>

      {/* Design Decisions */}
      <SubSection label="Design Decisions & Rationale">
        <div className="border border-ink bg-ink text-paper p-6 md:p-10">
          <div className="space-y-5">
            {[
              {
                decision: "Participant graph uses side-by-side layout, not a network diagram.",
                rationale: "Litigation is adversarial. Ours vs. Theirs is the primary mental model. A node graph obscures this fundamental polarity.",
              },
              {
                decision: "AI intake summary is a sidebar panel, not a modal or separate page.",
                rationale: "The AI output exists in context of the lead data. Side-by-side viewing allows the attorney to cross-reference claims against uploaded documents without navigation.",
              },
              {
                decision: "Conflict check results are sorted by confidence, highest first.",
                rationale: "The highest-risk match demands immediate attention. Low-confidence matches are visible but de-emphasized. The attorney's time is directed to what matters most.",
              },
              {
                decision: "Engagement letter uses Draft → Review → Finalize → Send, not drag-and-drop.",
                rationale: "Legal documents require deliberate progression. Each status gate creates an audit point. Drag-and-drop implies casual rearrangement incompatible with legal practice.",
              },
              {
                decision: "Setup checklist items are not gamified (no points, no badges, no confetti).",
                rationale: "Attorneys are professionals completing professional tasks. A progress bar communicates completeness. Everything else is noise.",
              },
              {
                decision: "Ethical wall toggle cannot be undone without administrator approval.",
                rationale: "Access restrictions in litigation are compliance-critical. Easy toggling creates risk. The friction is intentional and proportionate to the consequence.",
              },
            ].map((d, i) => (
              <div key={i} className="border-b border-graphite pb-4 last:border-0 last:pb-0">
                <div className="font-mono text-[12px] text-paper tracking-wide leading-relaxed">
                  {d.decision}
                </div>
                <div className="text-[11px] text-silver mt-2 leading-relaxed">
                  {d.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 12.11 — DESIGN DECISIONS & RATIONALE
        </div>
      </SubSection>
    </div>
  );
}
