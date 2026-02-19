import { useState } from "react";
import { SectionHeader, SubSection } from "../SectionHeader";
import { LICModuleTag, LICWordmark } from "../LICLogo";

/* ─────────────────────── tiny helpers ─────────────────────── */
function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[9px] text-silver tracking-wider mb-3">{label}</div>
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  );
}

function StateLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[9px] text-silver tracking-wider text-center mt-2">
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   §11 — APPLICATION UI KIT
   ═══════════════════════════════════════════════════════════════ */
export function AppUIKit() {
  const [activeTab, setActiveTab] = useState(0);
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [checkA, setCheckA] = useState(true);
  const [checkB, setCheckB] = useState(false);
  const [radioVal, setRadioVal] = useState("a");
  const [sliderVal, setSliderVal] = useState(65);

  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="11"
        title="Application UI Kit"
        subtitle="The living component catalog for the LIC product application. Every specimen is a 1 : 1 reference implementation. If it appears on this page, it may appear in the product. If it does not appear on this page, it must not be invented ad hoc."
      />

      {/* ───── Philosophy ───── */}
      <SubSection label="Kit Philosophy">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment">
          <div className="font-serif italic text-ink" style={{ fontSize: "1.5rem", lineHeight: 1.3 }}>
            This is the complete parts list. If a component is not in the kit, the answer is not to design a new one—it is to compose an existing one differently.
          </div>
        </div>
        <p className="text-[14px] text-graphite mt-6 max-w-xl leading-relaxed">
          The LIC application UI is deliberately constrained. A small number of components, used consistently, creates the institutional uniformity the brand requires. Engineers and designers reference this page—not Figma mockups—as the source of truth for component API, visual states, and spacing.
        </p>
      </SubSection>

      {/* ═══════════ BUTTONS ═══════════ */}
      <SubSection label="Buttons — Complete State Matrix">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every button variant in every interactive state. No border-radius. No shadows. No easing transitions. State changes are instantaneous.
        </p>

        {/* Primary */}
        <div className="border border-ink bg-white p-8 space-y-8">
          <Swatch label="PRIMARY">
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink">
                Default
              </button>
              <StateLabel>DEFAULT</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-graphite text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-graphite">
                Hover
              </button>
              <StateLabel>HOVER</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border-2 border-institutional ring-1 ring-institutional">
                Focus
              </button>
              <StateLabel>FOCUS</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-graphite text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-graphite scale-[0.98] origin-center">
                Active
              </button>
              <StateLabel>ACTIVE</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-ink/40 text-paper/60 font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink/40 cursor-not-allowed">
                Disabled
              </button>
              <StateLabel>DISABLED</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink flex items-center gap-3">
                <span className="inline-block w-3 h-3 border-2 border-paper/60 border-t-transparent animate-spin" />
                Loading
              </button>
              <StateLabel>LOADING</StateLabel>
            </div>
          </Swatch>

          {/* Secondary */}
          <Swatch label="SECONDARY">
            <div className="text-center">
              <button className="bg-paper text-ink font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink">
                Default
              </button>
              <StateLabel>DEFAULT</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-parchment text-ink font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink">
                Hover
              </button>
              <StateLabel>HOVER</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-paper text-ink font-mono text-[11px] tracking-widest px-8 py-3 uppercase border-2 border-institutional ring-1 ring-institutional">
                Focus
              </button>
              <StateLabel>FOCUS</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-paper/60 text-ink/40 font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink/30 cursor-not-allowed">
                Disabled
              </button>
              <StateLabel>DISABLED</StateLabel>
            </div>
          </Swatch>

          {/* Ghost */}
          <Swatch label="GHOST">
            <div className="text-center">
              <button className="bg-transparent text-ink font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-transparent">
                Default
              </button>
              <StateLabel>DEFAULT</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-transparent text-ink font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink">
                Hover
              </button>
              <StateLabel>HOVER</StateLabel>
            </div>
          </Swatch>

          {/* Destructive */}
          <Swatch label="DESTRUCTIVE">
            <div className="text-center">
              <button className="bg-filing-red text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-filing-red">
                Default
              </button>
              <StateLabel>DEFAULT</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-filing-red/80 text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-filing-red/80">
                Hover
              </button>
              <StateLabel>HOVER</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-filing-red/40 text-paper/60 font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-filing-red/40 cursor-not-allowed">
                Disabled
              </button>
              <StateLabel>DISABLED</StateLabel>
            </div>
          </Swatch>

          {/* Sizes */}
          <Swatch label="SIZES">
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-1.5 uppercase border border-ink">
                Small
              </button>
              <StateLabel>SM · 24px</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-8 py-3 uppercase border border-ink">
                Medium
              </button>
              <StateLabel>MD · 40px</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[12px] tracking-widest px-10 py-4 uppercase border border-ink">
                Large
              </button>
              <StateLabel>LG · 48px</StateLabel>
            </div>
          </Swatch>

          {/* Icon buttons */}
          <Swatch label="ICON BUTTONS">
            <div className="text-center">
              <button className="bg-ink text-paper font-mono text-[14px] w-10 h-10 flex items-center justify-center border border-ink">
                +
              </button>
              <StateLabel>ADD</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-paper text-ink font-mono text-[14px] w-10 h-10 flex items-center justify-center border border-ink">
                ×
              </button>
              <StateLabel>CLOSE</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-paper text-ink font-mono text-[14px] w-10 h-10 flex items-center justify-center border border-ink">
                ↑
              </button>
              <StateLabel>EXPAND</StateLabel>
            </div>
            <div className="text-center">
              <button className="bg-paper text-ink font-mono text-[12px] w-10 h-10 flex items-center justify-center border border-ink">
                ⋮
              </button>
              <StateLabel>MORE</StateLabel>
            </div>
          </Swatch>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.1 — BUTTON SYSTEM, COMPLETE STATE MATRIX
        </div>
      </SubSection>

      {/* ═══════════ FORM CONTROLS ═══════════ */}
      <SubSection label="Form Controls — Complete Set">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every input type available in the application. Labels above, never inside. 1px Ink border, no radius. Focus state: Institutional Blue border. Error state: Filing Red border + inline message.
        </p>

        <div className="border border-ink bg-white p-8 space-y-10">
          {/* Text inputs */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">TEXT INPUTS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">MATTER TITLE</label>
                <input
                  type="text"
                  defaultValue="Williams v. Apex Industrial Corp."
                  className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide focus:outline-none focus:border-institutional"
                />
                <div className="font-mono text-[9px] text-silver tracking-wider">DEFAULT · FILLED</div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">CASE NUMBER</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-CV-01847"
                  className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional"
                />
                <div className="font-mono text-[9px] text-silver tracking-wider">DEFAULT · EMPTY</div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-institutional block">JURISDICTION</label>
                <input
                  type="text"
                  defaultValue="Northern District of California"
                  className="w-full border-2 border-institutional bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide outline-none"
                />
                <div className="font-mono text-[9px] text-institutional tracking-wider">FOCUS STATE</div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-filing-red block">FILING DEADLINE</label>
                <input
                  type="text"
                  defaultValue=""
                  className="w-full border-2 border-filing-red bg-filing-red/5 px-4 py-3 font-mono text-[13px] text-ink tracking-wide outline-none"
                />
                <div className="font-mono text-[10px] text-filing-red tracking-wider">Required. Enter a valid deadline.</div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate/50 block">ARCHIVED REFERENCE</label>
                <input
                  type="text"
                  defaultValue="LIC–ARCH–2025.11.04"
                  disabled
                  className="w-full border border-ink/30 bg-parchment px-4 py-3 font-mono text-[13px] text-ink/40 tracking-wide cursor-not-allowed"
                />
                <div className="font-mono text-[9px] text-silver tracking-wider">DISABLED</div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">SEARCH MATTERS</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or keyword…"
                    className="w-full border border-ink bg-white px-4 py-3 pr-10 font-mono text-[13px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[14px] text-silver">⌕</span>
                </div>
                <div className="font-mono text-[9px] text-silver tracking-wider">SEARCH INPUT</div>
              </div>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">TEXTAREA</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">CASE NOTES</label>
                <textarea
                  defaultValue="Discovery deficiency identified in second interrogatory set. Meet-and-confer letters sent January 15 and February 3. No response from opposing counsel."
                  className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide focus:outline-none focus:border-institutional h-28 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">REVISION INSTRUCTIONS</label>
                <textarea
                  placeholder="Enter specific revision instructions for the agent…"
                  className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional h-28 resize-none"
                />
                <div className="flex justify-between">
                  <div className="font-mono text-[9px] text-silver tracking-wider">OPTIONAL</div>
                  <div className="font-mono text-[9px] text-silver tracking-wider">0 / 2000</div>
                </div>
              </div>
            </div>
          </div>

          {/* Select */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">SELECT / DROPDOWN</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">PRACTICE AREA</label>
                <div className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide flex items-center justify-between cursor-pointer">
                  <span>Commercial Litigation</span>
                  <span className="text-slate text-[10px]">▼</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">ASSIGN AGENT</label>
                <div className="w-full border border-ink bg-white px-4 py-3 font-mono text-[13px] text-silver tracking-wide flex items-center justify-between cursor-pointer">
                  <span>Select operator…</span>
                  <span className="text-slate text-[10px]">▼</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">PRIORITY</label>
                <div className="w-full border-2 border-institutional bg-white px-4 py-3 font-mono text-[13px] text-ink tracking-wide">
                  <div className="flex items-center justify-between">
                    <span>Standard</span>
                    <span className="text-institutional text-[10px]">▲</span>
                  </div>
                  <div className="mt-2 border-t border-fog pt-2 -mx-4 -mb-3 px-4 pb-0">
                    {["Critical", "High", "Standard", "Low"].map((p, i) => (
                      <div
                        key={p}
                        className={`px-0 py-2 font-mono text-[12px] tracking-wide cursor-pointer ${i === 2 ? "text-institutional bg-institutional/5 -mx-4 px-4" : "text-ink hover:bg-parchment -mx-4 px-4"}`}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="font-mono text-[9px] text-institutional tracking-wider">OPEN STATE</div>
              </div>
            </div>
          </div>

          {/* Checkboxes & Radios */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">CHECKBOXES & RADIO BUTTONS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block mb-2">
                  DOCUMENT TYPES (MULTI-SELECT)
                </label>
                {[
                  { label: "Motions", checked: checkA, toggle: () => setCheckA(!checkA) },
                  { label: "Discovery", checked: checkB, toggle: () => setCheckB(!checkB) },
                  { label: "Correspondence", checked: false, toggle: () => {} },
                  { label: "Court Orders", checked: true, toggle: () => {} },
                ].map((c) => (
                  <label key={c.label} className="flex items-center gap-3 cursor-pointer" onClick={c.toggle}>
                    <div className={`w-4 h-4 border border-ink flex items-center justify-center shrink-0 ${c.checked ? "bg-ink" : "bg-white"}`}>
                      {c.checked && <div className="w-2 h-0.5 bg-paper" />}
                    </div>
                    <span className="font-mono text-[12px] text-ink tracking-wide">{c.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                <label className="font-mono text-[10px] tracking-[0.2em] text-slate block mb-2">
                  REVIEW URGENCY (SINGLE-SELECT)
                </label>
                {[
                  { label: "Immediate", val: "a" },
                  { label: "End of day", val: "b" },
                  { label: "Within 48 hours", val: "c" },
                  { label: "No deadline", val: "d" },
                ].map((r) => (
                  <label key={r.val} className="flex items-center gap-3 cursor-pointer" onClick={() => setRadioVal(r.val)}>
                    <div className="w-4 h-4 border border-ink flex items-center justify-center shrink-0 bg-white">
                      {radioVal === r.val && <div className="w-2 h-2 bg-ink" />}
                    </div>
                    <span className="font-mono text-[12px] text-ink tracking-wide">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">TOGGLES</div>
            <div className="flex flex-wrap gap-8">
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setToggleA(!toggleA)}>
                  <div className={`w-10 h-5 border border-ink flex items-center px-0.5 transition-none ${toggleA ? "bg-ink" : "bg-fog"}`}>
                    <div className={`w-4 h-4 ${toggleA ? "bg-paper ml-auto" : "bg-ink"}`} />
                  </div>
                  <span className="font-mono text-[12px] text-ink tracking-wide">Auto-audit enabled</span>
                </label>
                <StateLabel>{toggleA ? "ON" : "OFF"}</StateLabel>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setToggleB(!toggleB)}>
                  <div className={`w-10 h-5 border border-ink flex items-center px-0.5 transition-none ${toggleB ? "bg-ink" : "bg-fog"}`}>
                    <div className={`w-4 h-4 ${toggleB ? "bg-paper ml-auto" : "bg-ink"}`} />
                  </div>
                  <span className="font-mono text-[12px] text-ink tracking-wide">Daily briefing</span>
                </label>
                <StateLabel>{toggleB ? "ON" : "OFF"}</StateLabel>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-not-allowed opacity-40">
                  <div className="w-10 h-5 border border-ink/40 bg-fog flex items-center px-0.5">
                    <div className="w-4 h-4 bg-ink/40" />
                  </div>
                  <span className="font-mono text-[12px] text-ink tracking-wide">Monitoring</span>
                </label>
                <StateLabel>DISABLED</StateLabel>
              </div>
            </div>
          </div>

          {/* Range slider */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">RANGE / SLIDER</div>
            <div className="max-w-sm space-y-2">
              <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">CONFIDENCE THRESHOLD</label>
              <div className="relative h-5 flex items-center">
                <div className="w-full h-px bg-ink" />
                <div
                  className="absolute w-4 h-4 bg-ink border border-ink cursor-grab"
                  style={{ left: `calc(${sliderVal}% - 8px)` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full opacity-0 h-5 -mt-5 cursor-pointer relative z-10"
              />
              <div className="flex justify-between font-mono text-[9px] text-silver tracking-wider">
                <span>LOW</span>
                <span>{sliderVal}%</span>
                <span>HIGH</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.2 — FORM CONTROLS, COMPLETE INPUT SET
        </div>
      </SubSection>

      {/* ═══════════ NAVIGATION ═══════════ */}
      <SubSection label="Navigation Components">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Navigation patterns for wayfinding within the application. Tabs for in-page views, breadcrumbs for hierarchy, pagination for data sets.
        </p>

        <div className="space-y-8">
          {/* Tabs */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-3 bg-parchment border-b border-ink">
              <div className="font-mono text-[9px] text-silver tracking-wider">TAB BAR</div>
            </div>
            <div className="px-6 pt-0">
              <div className="flex gap-0 border-b border-ink">
                {["Overview", "Documents", "Timeline", "Agents", "Activity"].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`font-mono text-[11px] tracking-wider px-6 py-3 border-b-2 transition-none ${
                      activeTab === i
                        ? "border-ink text-ink"
                        : "border-transparent text-silver hover:text-ink"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="py-6">
                <p className="font-mono text-[12px] text-slate tracking-wide">
                  Content for: {["Overview", "Documents", "Timeline", "Agents", "Activity"][activeTab]}
                </p>
              </div>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="border border-ink bg-white p-6 space-y-4">
            <div className="font-mono text-[9px] text-silver tracking-wider">BREADCRUMBS</div>
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider">
              <span className="text-institutional cursor-pointer hover:underline">Matters</span>
              <span className="text-silver">/</span>
              <span className="text-institutional cursor-pointer hover:underline">Williams v. Apex Corp</span>
              <span className="text-silver">/</span>
              <span className="text-ink">Motion to Compel</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider">
              <span className="text-institutional cursor-pointer hover:underline">Dashboard</span>
              <span className="text-silver">/</span>
              <span className="text-institutional cursor-pointer hover:underline">Agent Status</span>
              <span className="text-silver">/</span>
              <span className="text-ink">OP–03</span>
            </div>
          </div>

          {/* Pagination */}
          <div className="border border-ink bg-white p-6 space-y-4">
            <div className="font-mono text-[9px] text-silver tracking-wider">PAGINATION</div>
            <div className="flex items-center gap-1">
              <button className="w-10 h-10 border border-ink text-silver font-mono text-[11px] flex items-center justify-center hover:bg-parchment">
                ←
              </button>
              {[1, 2, 3, "…", 12, 13, 14].map((p, i) => (
                <button
                  key={i}
                  className={`w-10 h-10 border font-mono text-[11px] flex items-center justify-center ${
                    p === 3
                      ? "border-ink bg-ink text-paper"
                      : p === "…"
                      ? "border-transparent text-silver cursor-default"
                      : "border-ink text-ink hover:bg-parchment"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="w-10 h-10 border border-ink text-ink font-mono text-[11px] flex items-center justify-center hover:bg-parchment">
                →
              </button>
              <span className="ml-4 font-mono text-[10px] text-silver tracking-wider">
                PAGE 3 OF 14 · 274 RESULTS
              </span>
            </div>
          </div>

          {/* Stepper */}
          <div className="border border-ink bg-white p-6 space-y-4">
            <div className="font-mono text-[9px] text-silver tracking-wider">PROCESS STEPPER</div>
            <div className="flex items-center gap-0">
              {[
                { label: "Intake", status: "complete" },
                { label: "Assignment", status: "complete" },
                { label: "Drafting", status: "active" },
                { label: "Audit", status: "pending" },
                { label: "Review", status: "pending" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] border ${
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
                      className={`font-mono text-[9px] tracking-wider ${
                        step.status === "active" ? "text-institutional" : step.status === "complete" ? "text-ink" : "text-silver"
                      }`}
                    >
                      {step.label.toUpperCase()}
                    </span>
                  </div>
                  {i < 4 && (
                    <div className={`h-px flex-1 min-w-[16px] -mt-5 ${step.status === "complete" ? "bg-ink" : "bg-fog"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.3 — NAVIGATION COMPONENTS
        </div>
      </SubSection>

      {/* ═══════════ DATA DISPLAY ═══════════ */}
      <SubSection label="Data Display Components">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Components for presenting structured data: key-value pairs, stat blocks, metadata bars, and data tables with interactive column headers.
        </p>

        <div className="space-y-8">
          {/* Key-value pairs */}
          <div className="border border-ink bg-white p-6 space-y-4">
            <div className="font-mono text-[9px] text-silver tracking-wider">KEY-VALUE PAIR (STACKED)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { k: "MATTER ID", v: "LIC–2026–01847" },
                { k: "STATUS", v: "Active" },
                { k: "LEAD ATTORNEY", v: "K. Aldridge" },
                { k: "OPENED", v: "2026.01.12" },
              ].map((kv) => (
                <div key={kv.k}>
                  <div className="font-mono text-[8px] text-silver tracking-wider">{kv.k}</div>
                  <div className="font-mono text-[13px] text-ink tracking-wide mt-0.5">{kv.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key-value inline */}
          <div className="border border-ink bg-white p-6 space-y-3">
            <div className="font-mono text-[9px] text-silver tracking-wider">KEY-VALUE PAIR (INLINE)</div>
            {[
              { k: "Case Number", v: "2026-CV-01847" },
              { k: "Court", v: "Northern District of California" },
              { k: "Judge", v: "Hon. Maria Cortez" },
              { k: "Filed", v: "January 12, 2026" },
            ].map((kv) => (
              <div key={kv.k} className="flex items-baseline gap-4 border-b border-fog pb-2 last:border-0 last:pb-0">
                <span className="font-mono text-[11px] text-slate tracking-wider w-36 shrink-0">{kv.k}</span>
                <span className="font-mono text-[12px] text-ink tracking-wide">{kv.v}</span>
              </div>
            ))}
          </div>

          {/* Stat blocks */}
          <div className="border border-ink bg-white p-6 space-y-4">
            <div className="font-mono text-[9px] text-silver tracking-wider">STAT BLOCKS</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active matters", value: "24", change: "+3 this week", changeColor: "text-ink" },
                { label: "Pending reviews", value: "7", change: "↓ 2 from yesterday", changeColor: "text-ledger" },
                { label: "Overdue items", value: "2", change: "Needs attention", changeColor: "text-filing-red" },
                { label: "Agents working", value: "5", change: "of 8 deployed", changeColor: "text-silver" },
              ].map((s) => (
                <div key={s.label} className="border border-ink p-4">
                  <div className="font-mono text-[9px] text-silver tracking-wider">{s.label.toUpperCase()}</div>
                  <div className="font-mono text-ink mt-1" style={{ fontSize: "1.75rem", lineHeight: 1 }}>{s.value}</div>
                  <div className={`font-mono text-[10px] ${s.changeColor} tracking-wider mt-2`}>{s.change}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive table */}
          <div className="border border-ink overflow-x-auto">
            <div className="px-4 py-2 bg-parchment border-b border-ink flex items-center justify-between">
              <div className="font-mono text-[9px] text-silver tracking-wider">DATA TABLE — SORTABLE</div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] text-silver tracking-wider">5 OF 24 MATTERS</span>
                <button className="font-mono text-[9px] text-institutional tracking-wider">FILTER</button>
                <button className="font-mono text-[9px] text-institutional tracking-wider">EXPORT</button>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-ink text-paper">
                  {["MATTER", "TYPE", "STATUS", "AGENT", "DEADLINE", "UPDATED"].map((h) => (
                    <th key={h} className="font-mono text-[10px] tracking-[0.15em] text-left px-4 py-3 cursor-pointer select-none">
                      <span className="flex items-center gap-1">
                        {h}
                        <span className="text-silver/60 text-[8px]">↕</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink">
                {[
                  { matter: "Williams v. Apex Corp", type: "Commercial", status: "Active", statusColor: "bg-ledger", agent: "OP–03", deadline: "Feb 20", updated: "2h ago" },
                  { matter: "Chen v. Metro Health", type: "Medical", status: "Critical", statusColor: "bg-filing-red", agent: "OP–09", deadline: "Feb 19", updated: "38m ago" },
                  { matter: "Park v. Consolidated", type: "Contract", status: "Active", statusColor: "bg-ledger", agent: "OP–07", deadline: "Mar 04", updated: "4h ago" },
                  { matter: "Rodriguez v. Pacific Mutual", type: "Insurance", status: "Intake", statusColor: "bg-institutional", agent: "OP–03", deadline: "—", updated: "1d ago" },
                  { matter: "Thornton v. Bancroft", type: "Employment", status: "Review", statusColor: "bg-ink", agent: "OP–04", deadline: "Mar 12", updated: "6h ago" },
                ].map((row, i) => (
                  <tr key={row.matter} className={`${i % 2 === 0 ? "bg-white" : "bg-parchment"} hover:bg-institutional/5 cursor-pointer`}>
                    <td className="font-mono text-[12px] text-ink tracking-wide px-4 py-3">{row.matter}</td>
                    <td className="font-mono text-[11px] text-slate tracking-wider px-4 py-3">{row.type}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`${row.statusColor} w-1.5 h-1.5 shrink-0`} />
                        <span className="font-mono text-[11px] text-ink tracking-wide">{row.status}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[11px] text-slate tracking-wider px-4 py-3">{row.agent}</td>
                    <td className="font-mono text-[11px] text-ink tracking-wider px-4 py-3">{row.deadline}</td>
                    <td className="font-mono text-[11px] text-silver tracking-wider px-4 py-3">{row.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.4 — DATA DISPLAY COMPONENTS
        </div>
      </SubSection>

      {/* ═══════════ CARDS ═══════════ */}
      <SubSection label="Card System">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Cards are the primary container for discrete work items. Every card type follows the same vertical structure: header (module tag + timestamp), body (title + summary), footer (metadata). Variants differ by content, not by structure.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matter card */}
          <div className="border border-ink bg-white">
            <div className="px-5 py-3 border-b border-fog flex items-center justify-between">
              <LICModuleTag module="MATTER" code="MTTR" />
              <div className="flex items-center gap-2">
                <div className="bg-ledger w-1.5 h-1.5" />
                <span className="font-mono text-[10px] text-ink tracking-wider">Active</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <h3 className="font-mono text-ink tracking-wide" style={{ fontSize: "0.875rem" }}>
                Williams v. Apex Industrial Corp.
              </h3>
              <p className="text-[12px] text-slate mt-2 leading-relaxed">
                Commercial litigation. Discovery phase. 3 active agents, 2 pending reviews.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["ESI", "Rule 37", "N.D. Cal."].map((tag) => (
                  <span key={tag} className="font-mono text-[9px] text-slate tracking-wider border border-fog px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-5 py-2.5 border-t border-fog bg-parchment flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate tracking-wider">2026-CV-01847</span>
              <span className="font-mono text-[9px] text-silver tracking-wider">Updated 2h ago</span>
            </div>
          </div>

          {/* Agent task card */}
          <div className="border border-ink bg-white">
            <div className="px-5 py-3 border-b border-fog flex items-center justify-between">
              <LICModuleTag module="DRAFT" code="DRFT" />
              <span className="font-mono text-[10px] text-silver tracking-wider">OP–03</span>
            </div>
            <div className="px-5 py-4">
              <h3 className="font-mono text-ink tracking-wide" style={{ fontSize: "0.875rem" }}>
                Motion to Compel — Draft
              </h3>
              <p className="text-[12px] text-slate mt-2 leading-relaxed">
                14 pages · 3 exhibits · 2 citations flagged for verification.
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[9px] text-silver tracking-wider">PROGRESS</span>
                  <span className="font-mono text-[9px] text-silver tracking-wider">85%</span>
                </div>
                <div className="w-full h-1 bg-fog">
                  <div className="h-1 bg-ink" style={{ width: "85%" }} />
                </div>
              </div>
            </div>
            <div className="px-5 py-2.5 border-t border-fog bg-parchment flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate tracking-wider">ETA ~45 min</span>
              <span className="font-mono text-[9px] text-silver tracking-wider">Started 2h 14m ago</span>
            </div>
          </div>

          {/* Report card */}
          <div className="border border-ink bg-white">
            <div className="px-5 py-3 border-b border-ink bg-ink text-paper flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider">Daily Briefing</span>
              <span className="font-mono text-[9px] text-silver tracking-wider">ANLS · OP–07</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-filing-red w-1.5 h-1.5" />
                <span className="font-mono text-[10px] text-filing-red tracking-wider">3 CRITICAL FLAGS</span>
              </div>
              <p className="text-[12px] text-slate leading-relaxed">
                12 active matters reviewed. Williams deadline in 48h. Chen discovery deficiency. Park amended complaint analysis pending.
              </p>
            </div>
            <div className="px-5 py-2.5 border-t border-fog bg-parchment flex items-center justify-between">
              <span className="font-mono text-[9px] text-slate tracking-wider">Filed 06:00 UTC</span>
              <span className="font-mono text-[9px] text-institutional tracking-wider cursor-pointer">REVIEW →</span>
            </div>
          </div>

          {/* Compact list card */}
          <div className="border border-ink bg-white">
            <div className="px-5 py-3 border-b border-fog bg-parchment">
              <div className="font-mono text-[9px] text-silver tracking-wider">COMPACT LIST CARD</div>
            </div>
            {[
              { title: "Citation check complete", agent: "AUDT", time: "12m ago", status: "bg-ledger" },
              { title: "Discovery response drafted", agent: "ASSOC", time: "1h ago", status: "bg-ink" },
              { title: "Privilege screen running", agent: "AUDT", time: "Active", status: "bg-institutional" },
              { title: "Client update scheduled", agent: "ASSOC", time: "Queued", status: "bg-fog" },
            ].map((item) => (
              <div key={item.title} className="px-5 py-3 border-b border-fog last:border-0 flex items-center gap-3 hover:bg-parchment cursor-pointer">
                <div className={`${item.status} w-1.5 h-1.5 shrink-0`} />
                <span className="font-mono text-[11px] text-ink tracking-wide flex-1">{item.title}</span>
                <span className="font-mono text-[9px] text-slate tracking-wider">{item.agent}</span>
                <span className="font-mono text-[9px] text-silver tracking-wider">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.5 — CARD SYSTEM, FOUR VARIANTS
        </div>
      </SubSection>

      {/* ═══════════ BADGES & TAGS ═══════════ */}
      <SubSection label="Badges, Tags & Status Indicators">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Inline indicators for status, categorization, and metadata. All use monospace type. No rounded pills—square edges only.
        </p>

        <div className="border border-ink bg-white p-8 space-y-8">
          {/* Status badges */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">STATUS BADGES</div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Active", bg: "bg-ledger", text: "text-paper" },
                { label: "Pending", bg: "bg-institutional", text: "text-paper" },
                { label: "Critical", bg: "bg-filing-red", text: "text-paper" },
                { label: "Complete", bg: "bg-ink", text: "text-paper" },
                { label: "Draft", bg: "bg-slate", text: "text-paper" },
                { label: "Queued", bg: "bg-fog", text: "text-ink" },
                { label: "Blocked", bg: "bg-filing-red/20", text: "text-filing-red" },
                { label: "Archived", bg: "bg-parchment", text: "text-slate" },
              ].map((b) => (
                <span key={b.label} className={`${b.bg} ${b.text} font-mono text-[10px] tracking-widest px-3 py-1 uppercase`}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Category tags */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">CATEGORY TAGS</div>
            <div className="flex flex-wrap gap-2">
              {["Commercial", "Discovery", "ESI", "Rule 37", "N.D. Cal.", "Sanctions", "Privilege", "Deposition"].map((tag) => (
                <span key={tag} className="font-mono text-[10px] text-ink tracking-wider border border-ink px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Dismissible tags */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">FILTER TAGS (DISMISSIBLE)</div>
            <div className="flex flex-wrap gap-2">
              {["Status: Active", "Agent: OP–03", "Type: Motion"].map((tag) => (
                <span key={tag} className="font-mono text-[10px] text-ink tracking-wider border border-ink px-3 py-1 flex items-center gap-2 bg-parchment">
                  {tag}
                  <span className="text-slate cursor-pointer hover:text-ink">×</span>
                </span>
              ))}
              <span className="font-mono text-[10px] text-institutional tracking-wider px-1 py-1 cursor-pointer">
                Clear all
              </span>
            </div>
          </div>

          {/* Agent identifiers */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">AGENT IDENTIFIERS</div>
            <div className="flex flex-wrap gap-3">
              {[
                { op: "OP–03", cls: "ASSOC", status: "bg-ledger" },
                { op: "OP–07", cls: "ANLS", status: "bg-ink" },
                { op: "OP–09", cls: "AUDT", status: "bg-ledger" },
                { op: "OP–04", cls: "ASSOC", status: "bg-fog" },
              ].map((a) => (
                <div key={a.op} className="border border-ink px-3 py-2 flex items-center gap-3">
                  <div className={`${a.status} w-1.5 h-1.5 shrink-0`} />
                  <span className="font-mono text-[11px] text-ink tracking-wide">{a.op}</span>
                  <span className="font-mono text-[9px] text-silver tracking-wider">{a.cls}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress indicators */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">PROGRESS BARS</div>
            <div className="space-y-4 max-w-md">
              {[
                { label: "Draft completion", pct: 85, color: "bg-ink" },
                { label: "Citation audit", pct: 100, color: "bg-ledger" },
                { label: "Review queue", pct: 30, color: "bg-institutional" },
                { label: "Upload processing", pct: 60, color: "bg-ink" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate tracking-wider">{p.label.toUpperCase()}</span>
                    <span className="font-mono text-[10px] text-silver tracking-wider">{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-fog">
                    <div className={`h-1.5 ${p.color}`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.6 — BADGES, TAGS & INDICATORS
        </div>
      </SubSection>

      {/* ═══════════ MODALS & DIALOGS ═══════════ */}
      <SubSection label="Modals & Dialogs">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Modals are interrupting by design—they should only appear when the system genuinely needs a decision. Three variants: Confirmation, Destructive, and Informational. No decorative use.
        </p>

        <div className="space-y-6">
          {/* Confirmation modal */}
          <div className="border border-ink bg-ink/5 p-8 flex items-center justify-center">
            <div className="border border-ink bg-white w-full max-w-md shadow-[4px_4px_0px_0px_rgba(11,11,11,0.1)]">
              <div className="px-6 py-4 border-b border-ink flex items-center justify-between">
                <span className="font-mono text-[11px] text-ink tracking-wider">CONFIRM ACTION</span>
                <button className="text-slate hover:text-ink font-mono text-[14px]">×</button>
              </div>
              <div className="px-6 py-6">
                <p className="text-[13px] text-ink leading-relaxed">
                  Assign Associate OP–03 to draft Motion to Compel for Williams v. Apex Corp? This will create a new task in the production queue.
                </p>
              </div>
              <div className="px-6 py-4 border-t border-fog bg-parchment flex items-center justify-end gap-3">
                <button className="bg-paper text-ink font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                  Cancel
                </button>
                <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                  Confirm
                </button>
              </div>
            </div>
          </div>

          {/* Destructive modal */}
          <div className="border border-ink bg-ink/5 p-8 flex items-center justify-center">
            <div className="border-2 border-filing-red bg-white w-full max-w-md shadow-[4px_4px_0px_0px_rgba(139,37,0,0.1)]">
              <div className="px-6 py-4 border-b border-filing-red bg-filing-red text-paper flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wider">DESTRUCTIVE ACTION</span>
                <button className="text-paper/60 hover:text-paper font-mono text-[14px]">×</button>
              </div>
              <div className="px-6 py-6">
                <p className="text-[13px] text-ink leading-relaxed">
                  Permanently remove the draft of Motion to Compel (LIC–DRFT–2026.02.18–004)? This action cannot be undone. The document and its audit trail will be archived.
                </p>
                <div className="mt-4 space-y-2">
                  <label className="font-mono text-[10px] tracking-[0.2em] text-filing-red block">TYPE "REMOVE" TO CONFIRM</label>
                  <input
                    type="text"
                    placeholder="REMOVE"
                    className="w-full border-2 border-filing-red/30 bg-white px-4 py-2.5 font-mono text-[13px] text-ink tracking-widest focus:outline-none focus:border-filing-red"
                    readOnly
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-filing-red/20 bg-filing-red/5 flex items-center justify-end gap-3">
                <button className="bg-paper text-ink font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                  Cancel
                </button>
                <button className="bg-filing-red text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-filing-red opacity-50 cursor-not-allowed">
                  Remove permanently
                </button>
              </div>
            </div>
          </div>

          {/* Info modal */}
          <div className="border border-ink bg-ink/5 p-8 flex items-center justify-center">
            <div className="border border-institutional bg-white w-full max-w-md shadow-[4px_4px_0px_0px_rgba(43,76,126,0.1)]">
              <div className="px-6 py-4 border-b border-institutional bg-institutional text-paper flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-wider">SYSTEM INFORMATION</span>
                <button className="text-paper/60 hover:text-paper font-mono text-[14px]">×</button>
              </div>
              <div className="px-6 py-6">
                <p className="text-[13px] text-ink leading-relaxed">
                  Agent OP–03 is currently assigned to 3 active tasks. Assigning an additional task may increase delivery time by approximately 2 hours.
                </p>
                <div className="mt-4 border border-fog bg-parchment p-3">
                  <div className="font-mono text-[9px] text-slate tracking-wider mb-2">CURRENT QUEUE</div>
                  <div className="space-y-1 font-mono text-[11px] text-ink tracking-wide">
                    <div>1. Williams motion to compel — 85% complete</div>
                    <div>2. Rodriguez intake processing — Queued</div>
                    <div>3. Park analysis review — Queued</div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-fog bg-parchment flex items-center justify-end gap-3">
                <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.7 — MODAL VARIANTS: CONFIRMATION, DESTRUCTIVE, INFORMATIONAL
        </div>
      </SubSection>

      {/* ═══════════ ALERTS & NOTIFICATIONS ═══════════ */}
      <SubSection label="Alerts, Toasts & Banners">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Notification patterns for system-to-user communication. Banners are persistent and page-level. Toasts are ephemeral and viewport-anchored. Inline alerts are contextual within content areas.
        </p>

        <div className="space-y-6">
          {/* Page banner */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-3">PAGE BANNERS</div>
            <div className="space-y-3">
              <div className="bg-filing-red text-paper px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-widest">CRITICAL</span>
                  <span className="text-[12px] text-paper/90">Williams v. Apex response deadline in 48 hours. Draft pending review.</span>
                </div>
                <button className="font-mono text-[10px] text-paper/60 hover:text-paper tracking-wider">DISMISS</button>
              </div>
              <div className="bg-institutional text-paper px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-widest">NOTICE</span>
                  <span className="text-[12px] text-paper/90">System maintenance scheduled for 2026.02.22 02:00–04:00 UTC.</span>
                </div>
                <button className="font-mono text-[10px] text-paper/60 hover:text-paper tracking-wider">DISMISS</button>
              </div>
              <div className="bg-ink text-paper px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-widest">SYSTEM</span>
                  <span className="text-[12px] text-paper/90">3 new reports filed since your last session. View work queue.</span>
                </div>
                <button className="font-mono text-[10px] text-paper/60 hover:text-paper tracking-wider">VIEW</button>
              </div>
            </div>
          </div>

          {/* Toast notifications */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-3">TOAST NOTIFICATIONS</div>
            <div className="flex flex-col gap-3 max-w-sm ml-auto">
              <div className="border border-ink bg-white p-4 shadow-[2px_2px_0px_0px_rgba(11,11,11,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] text-ink tracking-wider">TASK COMPLETE</div>
                    <p className="text-[12px] text-slate mt-1">Motion to Compel draft filed. Ready for review.</p>
                  </div>
                  <button className="text-silver hover:text-ink font-mono text-[12px] shrink-0">×</button>
                </div>
                <div className="mt-2 w-full h-0.5 bg-fog">
                  <div className="h-0.5 bg-ink" style={{ width: "70%" }} />
                </div>
              </div>
              <div className="border border-ledger/30 bg-ledger/5 p-4 shadow-[2px_2px_0px_0px_rgba(45,106,58,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] text-ledger tracking-wider">SUCCESS</div>
                    <p className="text-[12px] text-slate mt-1">Review approved. Document cleared for filing.</p>
                  </div>
                  <button className="text-silver hover:text-ink font-mono text-[12px] shrink-0">×</button>
                </div>
              </div>
              <div className="border border-filing-red/30 bg-filing-red/5 p-4 shadow-[2px_2px_0px_0px_rgba(139,37,0,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[10px] text-filing-red tracking-wider">ERROR</div>
                    <p className="text-[12px] text-slate mt-1">Could not locate January 15 correspondence. Upload manually.</p>
                  </div>
                  <button className="text-silver hover:text-ink font-mono text-[12px] shrink-0">×</button>
                </div>
              </div>
            </div>
          </div>

          {/* Inline alerts */}
          <div>
            <div className="font-mono text-[9px] text-silver tracking-wider mb-3">INLINE ALERTS</div>
            <div className="space-y-3">
              {[
                { type: "SYSTEM", border: "border-ink", bg: "bg-white", bar: "bg-ink", text: "text-ink", msg: "Draft ready for attorney review. LIC–DRFT–2026.02.18–004." },
                { type: "INFO", border: "border-institutional/30", bg: "bg-institutional/5", bar: "bg-institutional", text: "text-institutional", msg: "Agent OP–07 has filed the daily briefing. 3 items flagged." },
                { type: "WARNING", border: "border-filing-red/30", bg: "bg-filing-red/5", bar: "bg-filing-red", text: "text-filing-red", msg: "Citation not verified: Pinnacle Partners v. Thornton (2024). Manual check recommended." },
                { type: "SUCCESS", border: "border-ledger/30", bg: "bg-ledger/5", bar: "bg-ledger", text: "text-ledger", msg: "All citations verified. Formatting audit passed. Document cleared." },
              ].map((a) => (
                <div key={a.type} className={`border ${a.border} ${a.bg} p-5 flex items-start gap-4`}>
                  <div className={`${a.bar} w-1 self-stretch shrink-0`} />
                  <div>
                    <div className={`font-mono text-[10px] ${a.text} tracking-[0.2em] mb-1`}>{a.type}</div>
                    <p className="text-[13px] text-graphite leading-relaxed">{a.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.8 — ALERTS, TOASTS & BANNERS
        </div>
      </SubSection>

      {/* ═══════════ EMPTY STATES ═══════════ */}
      <SubSection label="Empty & Loading States">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Empty states communicate absence without creating alarm. Loading states communicate activity without simulating progress. Every state is honest about what is happening.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* No data */}
          <div className="border border-ink bg-white p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="font-mono text-[10px] text-silver tracking-[0.2em] mb-3">NO ACTIVE MATTERS</div>
            <p className="text-[12px] text-slate max-w-xs">No matters are currently assigned to your workspace. Use the Universal Interface or create a new matter to begin.</p>
            <button className="mt-6 bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
              New matter
            </button>
          </div>

          {/* No results */}
          <div className="border border-ink bg-white p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="font-mono text-[10px] text-silver tracking-[0.2em] mb-3">NO RESULTS</div>
            <p className="text-[12px] text-slate max-w-xs">No documents match your current filters. Try adjusting your search criteria or clearing filters.</p>
            <button className="mt-6 bg-paper text-ink font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
              Clear filters
            </button>
          </div>

          {/* Loading */}
          <div className="border border-ink bg-white p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-block w-4 h-4 border-2 border-ink border-t-transparent animate-spin" />
              <span className="font-mono text-[10px] text-ink tracking-[0.2em]">LOADING</span>
            </div>
            <p className="text-[12px] text-slate">Retrieving matter data…</p>
          </div>

          {/* Skeleton */}
          <div className="border border-ink bg-white p-6 min-h-[200px]">
            <div className="font-mono text-[9px] text-silver tracking-wider mb-4">SKELETON STATE</div>
            <div className="space-y-4 animate-pulse">
              <div className="h-3 bg-fog w-1/3" />
              <div className="h-2 bg-fog w-full" />
              <div className="h-2 bg-fog w-5/6" />
              <div className="h-2 bg-fog w-4/6" />
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="h-16 bg-fog" />
                <div className="h-16 bg-fog" />
                <div className="h-16 bg-fog" />
              </div>
            </div>
          </div>

          {/* Error state */}
          <div className="border-2 border-filing-red bg-filing-red/5 p-8 flex flex-col items-center justify-center text-center min-h-[200px] md:col-span-2">
            <div className="font-mono text-[10px] text-filing-red tracking-[0.2em] mb-3">SYSTEM ERROR</div>
            <p className="text-[13px] text-ink max-w-md">Could not load matter data. The operations service is temporarily unavailable. Your work is saved. This issue is being investigated.</p>
            <div className="mt-4 flex gap-3">
              <button className="bg-ink text-paper font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                Retry
              </button>
              <button className="bg-paper text-ink font-mono text-[10px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                Report issue
              </button>
            </div>
            <div className="mt-4 font-mono text-[9px] text-filing-red/60 tracking-wider">
              ERR–SVC–4012 · 2026.02.19 14:32 UTC
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.9 — EMPTY, LOADING & ERROR STATES
        </div>
      </SubSection>

      {/* ═══════════ TOOLTIPS & POPOVERS ═══════════ */}
      <SubSection label="Tooltips & Popovers">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Tooltips appear on hover to clarify interface elements. Popovers appear on click to show supplementary content. Neither should be used for primary information.
        </p>

        <div className="border border-ink bg-white p-8">
          <div className="flex flex-wrap gap-12 items-start">
            {/* Tooltip specimen */}
            <div className="space-y-2 text-center">
              <div className="font-mono text-[9px] text-silver tracking-wider">TOOLTIP</div>
              <div className="relative inline-block">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-ink text-paper px-3 py-1.5 font-mono text-[10px] tracking-wide whitespace-nowrap">
                  Operator 03 · Associate
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink" />
                </div>
                <span className="font-mono text-[12px] text-institutional tracking-wide underline decoration-dotted cursor-help">
                  OP–03
                </span>
              </div>
            </div>

            {/* Popover specimen */}
            <div className="space-y-2">
              <div className="font-mono text-[9px] text-silver tracking-wider">POPOVER</div>
              <div className="relative inline-block">
                <div className="absolute -top-[140px] left-0 border border-ink bg-white p-4 w-64 shadow-[2px_2px_0px_0px_rgba(11,11,11,0.08)]">
                  <div className="font-mono text-[10px] text-ink tracking-wider mb-2">AGENT DETAIL</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-slate">Status</span>
                      <span className="font-mono text-ink flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-ledger inline-block" /> Working</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-slate">Task</span>
                      <span className="font-mono text-ink">Williams draft</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="font-mono text-slate">Elapsed</span>
                      <span className="font-mono text-ink">2h 14m</span>
                    </div>
                  </div>
                  <div className="absolute left-6 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink" />
                </div>
                <button className="font-mono text-[11px] text-institutional tracking-wide border border-institutional px-3 py-1.5 mt-[120px]">
                  OP–03 Detail ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ═══════════ LAYOUT SHELL ═══════════ */}
      <SubSection label="Application Layout Shell">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The canonical layout for the LIC application. Fixed sidebar, scrollable content area, persistent header. The sidebar you are viewing this document in is itself a reference implementation.
        </p>

        {/* Wireframe */}
        <div className="border-2 border-ink overflow-hidden">
          <div className="flex" style={{ height: 360 }}>
            {/* Sidebar */}
            <div className="w-[180px] shrink-0 bg-ink text-paper flex flex-col">
              <div className="px-4 py-4 border-b border-graphite">
                <div className="font-mono text-[9px] text-silver tracking-[0.2em]">LIC</div>
              </div>
              <div className="flex-1 py-2">
                {["Dashboard", "Matters", "Agents", "Reports", "Settings"].map((item, i) => (
                  <div
                    key={item}
                    className={`px-4 py-2 font-mono text-[10px] tracking-wider cursor-pointer ${
                      i === 1 ? "text-paper bg-paper/10 border-l-2 border-paper" : "text-silver hover:text-paper hover:bg-paper/5"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-graphite">
                <div className="font-mono text-[8px] text-slate tracking-wider">K. ALDRIDGE</div>
              </div>
            </div>

            {/* Main area */}
            <div className="flex-1 flex flex-col bg-paper">
              {/* Top bar */}
              <div className="px-6 py-3 border-b border-ink flex items-center justify-between bg-white">
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate tracking-wider">
                  <span className="text-institutional cursor-pointer">Matters</span>
                  <span>/</span>
                  <span className="text-ink">Williams v. Apex</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[9px] text-silver tracking-wider">3 AGENTS ACTIVE</span>
                  <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-1.5 uppercase">
                    New Task
                  </button>
                </div>
              </div>

              {/* Content area */}
              <div className="flex-1 p-6 overflow-auto">
                <div className="space-y-3">
                  <div className="h-3 bg-ink/10 w-1/3" />
                  <div className="h-2 bg-fog w-2/3" />
                  <div className="h-2 bg-fog w-1/2" />
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="border border-fog bg-white p-3">
                        <div className="h-2 bg-fog w-1/2 mb-2" />
                        <div className="h-2 bg-fog/60 w-full" />
                        <div className="h-2 bg-fog/60 w-3/4 mt-1" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 border border-fog bg-white p-3">
                    <div className="h-2 bg-fog w-full mb-2" />
                    <div className="h-2 bg-fog w-full mb-2" />
                    <div className="h-2 bg-fog w-4/5" />
                  </div>
                </div>
              </div>

              {/* Universal Interface bar */}
              <div className="px-6 py-3 border-t border-ink bg-white">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border border-ink bg-paper px-3 py-2 font-mono text-[10px] text-silver tracking-wide">
                    Type an instruction…
                  </div>
                  <button className="bg-ink text-paper font-mono text-[9px] tracking-widest px-4 py-2 uppercase">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.10 — APPLICATION LAYOUT SHELL, CANONICAL WIREFRAME
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { zone: "Sidebar", specs: "280px fixed · Ink Black · Monospace nav · Section codes · Active state: Paper/10 bg + left border" },
            { zone: "Top bar", specs: "48px height · White bg · 1px bottom border · Breadcrumb left · Actions right · Sticky" },
            { zone: "Content area", specs: "Fluid width · Paper bg · 32px padding · Scrollable · Max content width 960px" },
          ].map((z) => (
            <div key={z.zone} className="border border-ink bg-white p-4">
              <div className="font-mono text-[11px] text-ink tracking-wider mb-2">{z.zone.toUpperCase()}</div>
              <p className="text-[11px] text-slate leading-relaxed">{z.specs}</p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* ═══════════ FILTER BAR ═══════════ */}
      <SubSection label="Filter & Search Bar">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The filter bar sits above data tables and list views. It combines search, filter controls, and view toggles into a single, compact toolbar.
        </p>

        <div className="border border-ink bg-white">
          <div className="px-4 py-3 flex flex-col md:flex-row items-start md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search matters…"
                className="w-full border border-ink bg-paper px-4 py-2 pr-8 font-mono text-[11px] text-ink placeholder:text-silver tracking-wide focus:outline-none focus:border-institutional"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-silver">⌕</span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              {["Status ▼", "Agent ▼", "Type ▼"].map((f) => (
                <button key={f} className="font-mono text-[10px] text-ink tracking-wider border border-ink px-3 py-2 hover:bg-parchment">
                  {f}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-ink">
              <button className="font-mono text-[10px] text-paper bg-ink tracking-wider px-3 py-2">
                Table
              </button>
              <button className="font-mono text-[10px] text-ink tracking-wider px-3 py-2 hover:bg-parchment">
                Cards
              </button>
            </div>

            {/* Actions */}
            <button className="font-mono text-[10px] text-institutional tracking-wider px-3 py-2">
              Export
            </button>
          </div>

          {/* Active filters */}
          <div className="px-4 py-2 border-t border-fog flex items-center gap-2">
            <span className="font-mono text-[9px] text-silver tracking-wider">ACTIVE:</span>
            {["Status: Active", "Agent: OP–03"].map((f) => (
              <span key={f} className="font-mono text-[9px] text-ink tracking-wider border border-ink px-2 py-0.5 flex items-center gap-1.5 bg-parchment">
                {f} <span className="text-slate cursor-pointer">×</span>
              </span>
            ))}
            <span className="font-mono text-[9px] text-institutional tracking-wider cursor-pointer">Clear</span>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.11 — FILTER & SEARCH BAR, CANONICAL PATTERN
        </div>
      </SubSection>

      {/* ═══════════ COMPONENT RULES ═══════════ */}
      <SubSection label="Component Rules — Summary">
        <div className="border border-ink bg-ink text-paper p-8 md:p-12">
          <div className="space-y-6">
            {[
              "No border-radius on any element. All corners are square. No exceptions.",
              "No box-shadows for elevation. Use 1px borders for containment and offset shadows (2px or 4px) only on floating elements (modals, toasts, popovers).",
              "No CSS transitions or easing. State changes are instantaneous. The only permitted animation is the loading spinner.",
              "All interactive elements have visible focus states using Institutional Blue. Tab order is logical and tested.",
              "Every form control has a visible label above it. Placeholder text supplements but never replaces the label.",
              "Destructive actions require explicit confirmation. The confirmation mechanism scales with severity: button → modal → typed confirmation.",
              "All colors are drawn from the brand palette. No hex codes outside the design token set. No opacity hacks to create new colors.",
              "Touch targets are 44×44px minimum. Dense interfaces may use 36×36px with documented accessibility justification.",
              "Loading states are honest. Never simulate progress. Use spinners for indeterminate waits and progress bars only when real progress data exists.",
              "Text is always legible. Minimum 4.5:1 contrast ratio for body text, 3:1 for large text. Test against WCAG 2.1 AA.",
              "Components compose—they do not nest. A card may contain a badge but not another card. A modal may contain a form but not another modal.",
              "The component kit is closed. New components require a design review. The default answer is: use an existing component differently.",
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-graphite pb-4 last:border-0 last:pb-0">
                <span className="font-mono text-[10px] text-silver w-6 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[13px] text-paper tracking-wide leading-relaxed">
                  {r}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 11.12 — COMPONENT RULES, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>
    </div>
  );
}
