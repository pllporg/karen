import { SectionHeader, SubSection } from "../SectionHeader";
import { LICModuleTag, LICWordmark } from "../LICLogo";

export function GridComponents() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="07"
        title="Grid, Layout & Components"
        subtitle="Spatial discipline, component patterns, and UI conventions. Every layout must feel governed—structured like a systems manual, not decorated like a brochure."
      />

      {/* Grid System */}
      <SubSection label="Grid System">
        <p className="text-[13px] text-slate mb-8 max-w-lg leading-relaxed">
          All layouts use a 12-column grid with consistent gutters. Content
          areas are left-aligned. Maximum content width is 960px. Margins
          scale with viewport but never fall below 32px.
        </p>
        <div className="border border-ink bg-white p-6">
          <div className="grid grid-cols-12 gap-1 mb-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-institutional/10 border border-institutional/20 h-20 flex items-center justify-center"
              >
                <span className="font-mono text-[9px] text-institutional tracking-wider">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-12 gap-1">
            <div className="col-span-4 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">4 COL</span>
            </div>
            <div className="col-span-8 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">8 COL</span>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-12 gap-1">
            <div className="col-span-3 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">3 COL</span>
            </div>
            <div className="col-span-6 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">6 COL</span>
            </div>
            <div className="col-span-3 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">3 COL</span>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-12 gap-1">
            <div className="col-span-12 bg-ink/5 border border-ink/10 h-10 flex items-center justify-center">
              <span className="font-mono text-[9px] text-slate">12 COL — FULL WIDTH</span>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 7.1 — 12-COLUMN GRID WITH STANDARD BREAKPOINTS
        </div>
      </SubSection>

      {/* Spacing System */}
      <SubSection label="Spacing Scale">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Spacing follows an 8px base unit. All margins, padding, and gaps
          use multiples of this base. This creates consistent vertical rhythm
          and predictable layout behavior.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            { token: "space-1", value: "4px", multiple: "0.5×" },
            { token: "space-2", value: "8px", multiple: "1×" },
            { token: "space-3", value: "16px", multiple: "2×" },
            { token: "space-4", value: "24px", multiple: "3×" },
            { token: "space-5", value: "32px", multiple: "4×" },
            { token: "space-6", value: "48px", multiple: "6×" },
            { token: "space-7", value: "64px", multiple: "8×" },
            { token: "space-8", value: "96px", multiple: "12×" },
          ].map((s) => (
            <div key={s.token} className="p-4 bg-white flex items-center gap-6">
              <span className="font-mono text-[11px] text-ink w-20 shrink-0 tracking-wide">
                {s.token}
              </span>
              <div
                className="bg-institutional/20 h-3 shrink-0"
                style={{ width: s.value }}
              />
              <span className="font-mono text-[10px] text-slate tracking-wider">
                {s.value}
              </span>
              <span className="font-mono text-[10px] text-silver tracking-wider">
                {s.multiple}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Border & Rule System */}
      <SubSection label="Borders & Rules">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Rules and borders are the primary visual organizing tool. They
          replace color blocks and cards as the primary means of grouping
          content.
        </p>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-px bg-ink w-full" />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-slate tracking-wider">1px — INK BLACK</span>
              <span className="font-mono text-[10px] text-silver tracking-wider">PRIMARY DIVIDER</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-[2px] bg-ink w-full" />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-slate tracking-wider">2px — INK BLACK</span>
              <span className="font-mono text-[10px] text-silver tracking-wider">SECTION DIVIDER</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-px bg-fog w-full" />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-slate tracking-wider">1px — FOG</span>
              <span className="font-mono text-[10px] text-silver tracking-wider">SUBTLE DIVIDER</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="border-l-2 border-ink h-12 w-full" />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-slate tracking-wider">2px LEFT — INK BLACK</span>
              <span className="font-mono text-[10px] text-silver tracking-wider">PULL QUOTE / EMPHASIS</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-ink h-12 w-full" />
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-slate tracking-wider">4px LEFT — INK BLACK</span>
              <span className="font-mono text-[10px] text-silver tracking-wider">FEATURE CALLOUT</span>
            </div>
          </div>
        </div>
      </SubSection>

      {/* UI Components */}
      <SubSection label="Button System">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Buttons are rectangular. No border-radius. Transitions are
          instant—no easing animations. Labels are monospaced, uppercase,
          and tracked.
        </p>
        <div className="space-y-8">
          {/* Primary buttons */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              PRIMARY
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="bg-ink text-paper font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-ink hover:bg-graphite transition-none">
                Submit
              </button>
              <button className="bg-ink text-paper font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-ink opacity-50 cursor-not-allowed">
                Disabled
              </button>
            </div>
          </div>
          {/* Secondary buttons */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              SECONDARY
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="bg-paper text-ink font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-ink hover:bg-parchment transition-none">
                Cancel
              </button>
              <button className="bg-paper text-ink font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-ink opacity-50 cursor-not-allowed">
                Disabled
              </button>
            </div>
          </div>
          {/* Ghost buttons */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              GHOST
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="bg-transparent text-ink font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-transparent hover:border-ink transition-none">
                Details
              </button>
            </div>
          </div>
          {/* Destructive */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              DESTRUCTIVE
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="bg-filing-red text-paper font-mono text-[12px] tracking-widest px-8 py-3 uppercase border border-filing-red transition-none">
                Remove
              </button>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Form Elements */}
      <SubSection label="Form Elements">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Inputs follow the same no-radius, no-shadow rule. Borders are 1px
          Ink Black. Focus states use Institutional Blue. Labels are always
          above the input.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
              MATTER ID
            </label>
            <input
              type="text"
              placeholder="LIC–DRFT–2026.02.18–001"
              className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional"
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
              STATUS
            </label>
            <div className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide flex items-center justify-between">
              <span>Active</span>
              <span className="text-[10px] text-slate">▼</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
              NOTES
            </label>
            <textarea
              placeholder="Enter case notes..."
              className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional h-24 resize-none"
              readOnly
            />
          </div>
          <div className="space-y-4">
            <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
              MODULE ASSIGNMENT
            </label>
            <div className="space-y-3">
              {["INTAKE", "EVAL", "DRAFT"].map((mod, i) => (
                <label key={mod} className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 border border-ink flex items-center justify-center ${i === 0 ? "bg-ink" : "bg-white"}`}>
                    {i === 0 && (
                      <div className="w-2 h-2 bg-paper" />
                    )}
                  </div>
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    LIC / {mod}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      {/* Status Indicators */}
      <SubSection label="Status Indicators">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Status indicators use the functional color palette. Format is
          always: colored rule + monospaced label. No icons, no badges.
        </p>
        <div className="space-y-4">
          {[
            { label: "ACTIVE", color: "bg-ledger", textColor: "text-ledger", desc: "Task is in progress" },
            { label: "PENDING REVIEW", color: "bg-institutional", textColor: "text-institutional", desc: "Awaiting attorney review" },
            { label: "OVERDUE", color: "bg-filing-red", textColor: "text-filing-red", desc: "Past deadline" },
            { label: "COMPLETE", color: "bg-ink", textColor: "text-ink", desc: "Work product delivered" },
            { label: "DRAFT", color: "bg-slate", textColor: "text-slate", desc: "Not yet submitted" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 border border-fog bg-white p-4">
              <div className={`${s.color} w-2 h-2 shrink-0`} />
              <span className={`font-mono text-[11px] tracking-[0.2em] ${s.textColor} w-40 shrink-0`}>
                {s.label}
              </span>
              <span className="text-[12px] text-slate">
                {s.desc}
              </span>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Card Pattern */}
      <SubSection label="Card Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Cards use 1px Ink borders. No rounded corners. No shadows. Content
          follows a strict vertical hierarchy: module tag → title →
          metadata → body.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard card */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-4 border-b border-fog flex items-center justify-between">
              <LICModuleTag module="DRAFT" code="DRFT" />
              <span className="font-mono text-[10px] text-silver tracking-wider">
                4H AGO
              </span>
            </div>
            <div className="px-6 py-5">
              <h3 className="font-mono text-ink tracking-wide" style={{ fontSize: "0.875rem" }}>
                Motion to Compel — Williams v. Apex Corp
              </h3>
              <p className="text-[12px] text-slate mt-3 leading-relaxed">
                Draft complete. 14 pages. Three exhibits attached. Issues
                flagged: privilege concern on Exhibit B.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-fog bg-parchment">
              <div className="font-mono text-[10px] text-slate tracking-wider">
                OP–03 · DRFT · LIC–DRFT–2026.02.18–004
              </div>
            </div>
          </div>

          {/* Dark card */}
          <div className="border border-ink bg-ink text-paper">
            <div className="px-6 py-4 border-b border-graphite flex items-center justify-between">
              <LICModuleTag module="DOCKET" code="DCKT" inverted />
              <span className="font-mono text-[10px] text-silver tracking-wider">
                URGENT
              </span>
            </div>
            <div className="px-6 py-5">
              <h3 className="font-mono text-paper tracking-wide" style={{ fontSize: "0.875rem" }}>
                Response Deadline — Chen v. Metro Health
              </h3>
              <p className="text-[12px] text-silver mt-3 leading-relaxed">
                Deadline approaching: response due in 72 hours. Discovery
                responses pending final review. No extensions filed.
              </p>
            </div>
            <div className="px-6 py-3 border-t border-graphite bg-graphite/30">
              <div className="font-mono text-[10px] text-slate tracking-wider">
                OP–05 · DCKT · LIC–DCKT–2026.02.18–012
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Table Pattern */}
      <SubSection label="Table / Data Grid">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Tables use full-width Ink borders with alternating Paper/Parchment
          row backgrounds. Headers are always monospace, uppercase, tracked.
        </p>
        <div className="border border-ink overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-ink text-paper">
                <th className="font-mono text-[10px] tracking-[0.2em] text-left px-4 py-3">
                  MATTER ID
                </th>
                <th className="font-mono text-[10px] tracking-[0.2em] text-left px-4 py-3">
                  MODULE
                </th>
                <th className="font-mono text-[10px] tracking-[0.2em] text-left px-4 py-3">
                  STATUS
                </th>
                <th className="font-mono text-[10px] tracking-[0.2em] text-left px-4 py-3">
                  OPERATOR
                </th>
                <th className="font-mono text-[10px] tracking-[0.2em] text-left px-4 py-3">
                  LAST ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink">
              {[
                { id: "LIC–DRFT–001", module: "DRFT", status: "Active", op: "OP–03", time: "2h ago" },
                { id: "LIC–DISC–012", module: "DISC", status: "Pending", op: "OP–04", time: "4h ago" },
                { id: "LIC–INTK–003", module: "INTK", status: "Complete", op: "OP–01", time: "1d ago" },
                { id: "LIC–EVAL–007", module: "EVAL", status: "Active", op: "OP–02", time: "6h ago" },
                { id: "LIC–CLNT–002", module: "CLNT", status: "Sent", op: "OP–06", time: "3h ago" },
              ].map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? "bg-white" : "bg-parchment"}>
                  <td className="font-mono text-[12px] text-ink tracking-wide px-4 py-3">
                    {row.id}
                  </td>
                  <td className="font-mono text-[11px] text-slate tracking-wider px-4 py-3">
                    {row.module}
                  </td>
                  <td className="font-mono text-[11px] text-ink tracking-wide px-4 py-3">
                    {row.status}
                  </td>
                  <td className="font-mono text-[11px] text-slate tracking-wider px-4 py-3">
                    {row.op}
                  </td>
                  <td className="font-mono text-[11px] text-silver tracking-wider px-4 py-3">
                    {row.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 7.2 — DATA TABLE, STANDARD PATTERN
        </div>
      </SubSection>

      {/* Notification / Alert Patterns */}
      <SubSection label="Alert & Notification Patterns">
        <div className="space-y-4">
          <div className="border border-ink bg-white p-5 flex items-start gap-4">
            <div className="w-1 h-full min-h-[40px] bg-ink shrink-0" />
            <div>
              <div className="font-mono text-[10px] text-ink tracking-[0.2em] mb-1">
                SYSTEM NOTICE
              </div>
              <p className="text-[13px] text-graphite leading-relaxed">
                Draft ready for attorney review. LIC–DRFT–2026.02.18–004.
              </p>
            </div>
          </div>
          <div className="border border-institutional/30 bg-institutional/5 p-5 flex items-start gap-4">
            <div className="w-1 h-full min-h-[40px] bg-institutional shrink-0" />
            <div>
              <div className="font-mono text-[10px] text-institutional tracking-[0.2em] mb-1">
                INFORMATIONAL
              </div>
              <p className="text-[13px] text-graphite leading-relaxed">
                Discovery responses assembled. Issues flagged for review.
              </p>
            </div>
          </div>
          <div className="border border-filing-red/30 bg-filing-red/5 p-5 flex items-start gap-4">
            <div className="w-1 h-full min-h-[40px] bg-filing-red shrink-0" />
            <div>
              <div className="font-mono text-[10px] text-filing-red tracking-[0.2em] mb-1">
                CRITICAL
              </div>
              <p className="text-[13px] text-graphite leading-relaxed">
                Deadline approaching: response due in 72 hours. No extensions filed.
              </p>
            </div>
          </div>
          <div className="border border-ledger/30 bg-ledger/5 p-5 flex items-start gap-4">
            <div className="w-1 h-full min-h-[40px] bg-ledger shrink-0" />
            <div>
              <div className="font-mono text-[10px] text-ledger tracking-[0.2em] mb-1">
                CONFIRMATION
              </div>
              <p className="text-[13px] text-graphite leading-relaxed">
                Client update sent. Timeline attached. Next update scheduled: Mar 1.
              </p>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Document Header Pattern */}
      <SubSection label="Document Header Pattern">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          All generated work product uses a standardized header. This is the
          canonical pattern for internal documents, client-facing memos, and
          system-generated reports.
        </p>
        <div className="border border-ink bg-white">
          <div className="px-8 py-6 border-b border-ink flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <LICWordmark />
              <div className="mt-3 font-mono text-[10px] text-slate tracking-wider">
                CONFIDENTIAL — ATTORNEY WORK PRODUCT
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-slate tracking-wider">
                LIC–DRFT–2026.02.18–004
              </div>
              <div className="font-mono text-[10px] text-silver tracking-wider mt-1">
                OPERATOR 03 · DRAFTING
              </div>
            </div>
          </div>
          <div className="px-8 py-8">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-2">
              MOTION TO COMPEL DISCOVERY
            </div>
            <h2
              className="font-serif text-ink"
              style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
            >
              Williams v. Apex Industrial Corp.
            </h2>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "CASE NO.", value: "2026-CV-01847" },
                { label: "PAGES", value: "14" },
                { label: "EXHIBITS", value: "3" },
                { label: "TURNAROUND", value: "4h 12m" },
              ].map((m) => (
                <div key={m.label}>
                  <div className="font-mono text-[9px] text-silver tracking-wider">
                    {m.label}
                  </div>
                  <div className="font-mono text-[13px] text-ink tracking-wide mt-0.5">
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-8 py-3 border-t border-fog bg-parchment flex items-center justify-between">
            <div className="font-mono text-[9px] text-slate tracking-wider">
              GENERATED BY LIC / DRAFT · OP–03
            </div>
            <div className="font-mono text-[9px] text-slate tracking-wider">
              2026.02.18 · 14:32 UTC
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 7.3 — DOCUMENT HEADER, CANONICAL PATTERN
        </div>
      </SubSection>

      {/* Page Furniture */}
      <SubSection label="Page Furniture & Navigation">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Sidebars, headers, and footers follow consistent placement rules.
          Navigation uses monospace labels with section codes. The sidebar
          you see on this page is itself an implementation reference.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              SIDEBAR RULES
            </div>
            <ul className="space-y-2">
              {[
                "Fixed width: 280px",
                "Ink Black background, Paper White text",
                "Section codes prefix all labels (§01, §02…)",
                "Active state: Paper/10 background, Paper left border",
                "Hover state: Paper/5 background",
                "Footer contains document classification",
              ].map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12px] text-graphite">
                  <span className="text-ink mt-0.5">—</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              FOOTER RULES
            </div>
            <ul className="space-y-2">
              {[
                "Full-width, Parchment or Paper background",
                "Monospace, 9px, tracked, all-caps",
                "Left: generator credit (module + operator)",
                "Right: timestamp in ISO format",
                "Separated from content by 1px Fog rule",
                "Always include document classification",
              ].map((r) => (
                <li key={r} className="flex items-start gap-2 text-[12px] text-graphite">
                  <span className="text-ink mt-0.5">—</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SubSection>

      {/* Iconography */}
      <SubSection label="Iconography">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC does not use icons as decoration. When icons are necessary for
          functional UI (navigation, status, actions), they must be:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {[
            "Single-weight, 1.5px stroke",
            "Geometric and rectilinear preferred",
            "Ink Black only (or Paper White on dark)",
            "16×16px or 20×20px—no other sizes",
            "Never used as decoration or illustration",
            "Always accompanied by a text label",
          ].map((r) => (
            <div key={r} className="flex items-start gap-3 border-b border-fog pb-3">
              <span className="font-mono text-[10px] text-silver mt-0.5">—</span>
              <span className="text-[12px] text-graphite">{r}</span>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Photography & Imagery */}
      <SubSection label="Photography & Imagery">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Photography is not a primary element of the LIC identity. When
          required (investor materials, recruitment), images must meet these
          criteria:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="font-mono text-[10px] text-ledger tracking-wider mb-3">
              PERMITTED
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Muted, desaturated color grading</li>
              <li>— Architectural / institutional subjects</li>
              <li>— Document and workspace imagery</li>
              <li>— Black-and-white treatment preferred</li>
              <li>— High contrast, sharp focus</li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] text-filing-red tracking-wider mb-3">
              PROHIBITED
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Stock photography with forced smiles</li>
              <li>— Neon / futuristic imagery</li>
              <li>— Illustrations or cartoons</li>
              <li>— Abstract "AI" visuals (neural nets, brains)</li>
              <li>— Saturated color treatment</li>
            </ul>
          </div>
        </div>
      </SubSection>

      {/* Design Principles Summary */}
      <SubSection label="Design Principles — Summary">
        <div className="border border-ink bg-ink text-paper p-8 md:p-12">
          <div className="space-y-8">
            {[
              {
                num: "01",
                principle: "Structure over decoration",
                desc: "Grids, rules, and spacing do the work. Ornament is absent.",
              },
              {
                num: "02",
                principle: "Matte over gloss",
                desc: "No gradients, no shadows, no transparency. Flat, opaque, ink-on-paper.",
              },
              {
                num: "03",
                principle: "Monospace over display",
                desc: "IBM Plex Mono leads. Every label reads like a systems manual.",
              },
              {
                num: "04",
                principle: "Ink and Paper dominate",
                desc: "Color is functional and rare. The palette is fundamentally two-tone.",
              },
              {
                num: "05",
                principle: "Rectangles only",
                desc: "No border-radius. No circles. No curves. Every element is rectilinear.",
              },
              {
                num: "06",
                principle: "Documentation aesthetic",
                desc: "Everything looks like it belongs in a standards manual or internal memo.",
              },
            ].map((p) => (
              <div key={p.num} className="flex items-start gap-6">
                <span className="font-mono text-[11px] text-silver tracking-wider w-6 shrink-0 mt-0.5">
                  {p.num}
                </span>
                <div>
                  <div className="font-mono text-[14px] text-paper tracking-wide">
                    {p.principle}
                  </div>
                  <div className="text-[13px] text-silver mt-1 leading-relaxed">
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 7.4 — DESIGN PRINCIPLES, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>

      {/* Colophon */}
      <div className="mt-16 pt-8 border-t border-ink">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <LICWordmark />
            <div className="mt-4 font-mono text-[10px] text-slate tracking-wider leading-relaxed">
              BRAND IDENTITY & VISUAL STANDARDS
              <br />
              REVISION 2026.02
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[9px] text-slate tracking-[0.3em] leading-relaxed">
              DOCUMENT CLASS: BRAND / IDENTITY
              <br />
              CLASSIFICATION: CONFIDENTIAL
              <br />
              PAGES: §00 – §09
              <br />
              PREPARED FOR INTERNAL USE ONLY
            </div>
          </div>
        </div>
        <div className="mt-8 h-[2px] bg-ink w-full" />
        <div className="mt-4 font-mono text-[9px] text-silver tracking-widest text-center">
          END OF DOCUMENT
        </div>
      </div>
    </div>
  );
}