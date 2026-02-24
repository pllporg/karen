import { SectionHeader, SubSection } from "../SectionHeader";

export function InteractionDesign() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="08"
        title="Interaction Design"
        subtitle="How the system behaves. Every transition, feedback loop, and state change is governed by the same principle: procedural clarity over expressive choreography. The interface is a controlled instrument, not a performance."
      />

      {/* Philosophy */}
      <SubSection label="Governing Philosophy">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment">
          <div
            className="font-serif italic text-ink"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            The interface should behave like a well-maintained filing system—predictable, immediate, and silent.
          </div>
        </div>
        <p className="text-[14px] text-graphite mt-6 max-w-xl leading-relaxed">
          LIC interaction design rejects the premise that software must "feel alive" or "delight" its users. Our users are attorneys managing active caseloads. They need an instrument that responds instantly, communicates state unambiguously, and never surprises. The interaction model is closer to a cockpit than a consumer app—every control is labeled, every state is visible, every action is reversible.
        </p>
        <div className="mt-8 border border-ink bg-white p-8">
          <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-6">
            THE THREE RULES
          </div>
          <div className="space-y-6">
            {[
              {
                num: "I",
                rule: "State is always visible.",
                elaboration:
                  "The user must never have to guess what the system is doing, has done, or will do next. If data is loading, say so. If an action succeeded, confirm it. If something failed, explain why and what to do.",
              },
              {
                num: "II",
                rule: "Actions are always reversible.",
                elaboration:
                  "No destructive action completes without explicit confirmation. Every write operation produces a record. Undo is a right, not a feature.",
              },
              {
                num: "III",
                rule: "The system never speaks first.",
                elaboration:
                  "No unsolicited modals, no pop-ups on entry, no tooltips that appear unbidden. The interface presents information; the user initiates action. Notifications are passive and peripheral.",
              },
            ].map((r) => (
              <div key={r.num} className="flex items-start gap-6 border-b border-fog pb-6 last:border-0 last:pb-0">
                <span className="font-serif text-ink italic w-8 shrink-0" style={{ fontSize: "1.25rem" }}>
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

      {/* Temporal Behavior */}
      <SubSection label="Temporal Behavior — Transitions & Timing">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC interfaces do not animate for aesthetic effect. Motion is permitted only when it serves a functional purpose: communicating spatial relationships or preserving context during state changes. When motion occurs, it is fast and linear.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            {
              property: "State changes",
              duration: "0ms",
              easing: "—",
              note: "Buttons, toggles, checkboxes, radio inputs. All instant.",
            },
            {
              property: "Hover feedback",
              duration: "0ms",
              easing: "—",
              note: "Background and border shifts are immediate. No fade-in.",
            },
            {
              property: "Panel open / close",
              duration: "120ms",
              easing: "linear",
              note: "Sidebars, drawers, expandable rows. Context-preserving only.",
            },
            {
              property: "Content reveal",
              duration: "80ms",
              easing: "linear",
              note: "Accordion content, detail panes. Height transition only.",
            },
            {
              property: "Page transitions",
              duration: "0ms",
              easing: "—",
              note: "No page-level animation. Content swaps are instant.",
            },
            {
              property: "Toast / notification entry",
              duration: "100ms",
              easing: "linear",
              note: "Slide from edge. No bounce, no overshoot, no spring physics.",
            },
            {
              property: "Loading indicators",
              duration: "continuous",
              easing: "linear",
              note: "Simple linear progress or determinate bar. No pulsing, no shimmer.",
            },
          ].map((t) => (
            <div
              key={t.property}
              className="p-5 bg-white grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
            >
              <div className="md:col-span-3">
                <span className="font-mono text-[12px] tracking-wide text-ink">
                  {t.property}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-mono text-[11px] text-institutional tracking-wider">
                  {t.duration}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-mono text-[11px] text-silver tracking-wider">
                  {t.easing}
                </span>
              </div>
              <div className="md:col-span-5">
                <span className="text-[12px] text-slate">{t.note}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 8.1 — TRANSITION TIMING TABLE, COMPLETE REFERENCE
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-filing-red/30 bg-filing-red/5 p-6">
            <div className="font-mono text-[10px] text-filing-red tracking-wider mb-3">
              PROHIBITED MOTION
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Spring / bounce physics</li>
              <li>— Parallax scrolling</li>
              <li>— Element entrance animations on page load</li>
              <li>— Staggered list animations</li>
              <li>— Morphing or shape transitions</li>
              <li>— Skeleton screens / shimmer loading</li>
              <li>— Confetti, particles, or celebratory effects</li>
              <li>— Easing curves (ease-in, ease-out, ease-in-out)</li>
            </ul>
          </div>
          <div className="border border-ledger/30 bg-ledger/5 p-6">
            <div className="font-mono text-[10px] text-ledger tracking-wider mb-3">
              PERMITTED MOTION
            </div>
            <ul className="space-y-2 text-[12px] text-graphite">
              <li>— Linear height transitions for expand/collapse</li>
              <li>— Linear slide for drawer open/close</li>
              <li>— Linear opacity for toast entry/exit</li>
              <li>— Deterministic progress bars</li>
              <li>— Cursor state changes (pointer, wait, not-allowed)</li>
              <li>— Focus ring appearance (instant)</li>
              <li>— Scroll-linked position (sticky headers)</li>
              <li>— System-native transitions (browser defaults)</li>
            </ul>
          </div>
        </div>
      </SubSection>

      {/* State Communication */}
      <SubSection label="State Communication">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every interactive element has exactly four states. Each state must be visually distinct without relying on color alone. The state model is uniform across all components—buttons, inputs, rows, cards.
        </p>
        <div className="border border-ink">
          {/* Header row */}
          <div className="bg-ink text-paper grid grid-cols-5 gap-0">
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              STATE
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              BORDER
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              BACKGROUND
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              TEXT
            </div>
            <div className="px-4 py-3 font-mono text-[10px] tracking-[0.2em]">
              CURSOR
            </div>
          </div>
          {/* Data rows */}
          {[
            {
              state: "Default",
              border: "Ink 1px",
              bg: "Paper",
              text: "Ink",
              cursor: "pointer",
            },
            {
              state: "Hover",
              border: "Ink 1px",
              bg: "Parchment",
              text: "Ink",
              cursor: "pointer",
            },
            {
              state: "Focus",
              border: "Institutional 2px",
              bg: "Paper",
              text: "Ink",
              cursor: "text / pointer",
            },
            {
              state: "Disabled",
              border: "Fog 1px",
              bg: "Parchment",
              text: "Silver",
              cursor: "not-allowed",
            },
            {
              state: "Active / Pressed",
              border: "Ink 2px",
              bg: "Ink",
              text: "Paper",
              cursor: "pointer",
            },
            {
              state: "Error",
              border: "Filing Red 2px",
              bg: "Filing Red/5",
              text: "Ink",
              cursor: "text",
            },
            {
              state: "Success",
              border: "Ledger 1px",
              bg: "Ledger/5",
              text: "Ink",
              cursor: "default",
            },
          ].map((s, i) => (
            <div
              key={s.state}
              className={`grid grid-cols-5 gap-0 border-t border-ink ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}
            >
              <div className="px-4 py-3 font-mono text-[11px] text-ink tracking-wide">
                {s.state}
              </div>
              <div className="px-4 py-3 font-mono text-[11px] text-slate tracking-wide">
                {s.border}
              </div>
              <div className="px-4 py-3 font-mono text-[11px] text-slate tracking-wide">
                {s.bg}
              </div>
              <div className="px-4 py-3 font-mono text-[11px] text-slate tracking-wide">
                {s.text}
              </div>
              <div className="px-4 py-3 font-mono text-[11px] text-silver tracking-wide">
                {s.cursor}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 8.2 — UNIVERSAL STATE MODEL
        </div>
      </SubSection>

      {/* Focus & Keyboard */}
      <SubSection label="Focus Management & Keyboard Navigation">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC applications must be fully operable by keyboard. Focus management is not an afterthought—it is a primary design constraint. Every interactive element participates in tab order. Focus is always visible.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          <div className="p-5 bg-white">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-2">
              Focus Ring Specification
            </div>
            <p className="text-[13px] text-slate leading-relaxed">
              2px solid Institutional Blue. Offset: 2px from element edge. No box-shadow substitute. No glow. The ring must be visible against both Ink and Paper backgrounds.
            </p>
            <div className="mt-4 flex items-center gap-6">
              <div className="border border-ink px-6 py-2 font-mono text-[11px] tracking-widest outline outline-2 outline-offset-2 outline-institutional">
                FOCUSED ELEMENT
              </div>
              <span className="font-mono text-[10px] text-silver">specimen</span>
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-2">
              Tab Order Rules
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-graphite">
              <div className="space-y-2">
                <div>— Follow visual reading order (top-left to bottom-right)</div>
                <div>— Sidebar navigation before main content</div>
                <div>— Form fields in document order</div>
                <div>— Modal traps focus within itself until dismissed</div>
              </div>
              <div className="space-y-2">
                <div>— Skip links provided for all page layouts</div>
                <div>— No tabindex values greater than 0</div>
                <div>— Dynamically added content receives focus when appropriate</div>
                <div>— Focus returns to trigger element when overlay closes</div>
              </div>
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-2">
              Keyboard Shortcuts
            </div>
            <p className="text-[12px] text-slate mb-4">
              Keyboard shortcuts are available for high-frequency actions. All shortcuts are discoverable via a help panel (Shift + ?).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { keys: "Esc", action: "Close overlay / cancel" },
                { keys: "Enter", action: "Submit / confirm" },
                { keys: "Tab", action: "Next focusable element" },
                { keys: "Shift+Tab", action: "Previous element" },
                { keys: "Space", action: "Toggle / select" },
                { keys: "Arrow ↑↓", action: "Navigate lists" },
              ].map((k) => (
                <div key={k.keys} className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] text-ink bg-parchment border border-fog px-2 py-0.5 tracking-wide">
                    {k.keys}
                  </span>
                  <span className="text-[11px] text-slate">{k.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      {/* Feedback Patterns */}
      <SubSection label="Feedback Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Every user action produces feedback. The form of feedback is determined by the action's severity and reversibility. LIC uses four feedback channels, applied according to a strict hierarchy.
        </p>
        <div className="space-y-8">
          {/* Feedback hierarchy */}
          <div className="border border-ink bg-ink text-paper p-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
              FEEDBACK HIERARCHY — ORDERED BY SEVERITY
            </div>
            <div className="space-y-0">
              {[
                {
                  level: "01",
                  channel: "Inline state change",
                  trigger: "Low-severity, reversible actions",
                  example: "Checkbox toggled, row selected, sort applied",
                  persistence: "Immediate, no duration",
                },
                {
                  level: "02",
                  channel: "Toast notification",
                  trigger: "Completed operations, status updates",
                  example: "\"Draft saved.\" \"Client update sent.\"",
                  persistence: "8 seconds, dismissible",
                },
                {
                  level: "03",
                  channel: "Inline alert banner",
                  trigger: "Warnings, validation errors, system notices",
                  example: "\"Required field.\" \"Deadline in 72 hours.\"",
                  persistence: "Until condition resolved",
                },
                {
                  level: "04",
                  channel: "Confirmation dialog",
                  trigger: "Destructive or irreversible actions",
                  example: "\"Remove matter? This cannot be undone.\"",
                  persistence: "Until user responds",
                },
              ].map((f) => (
                <div
                  key={f.level}
                  className="flex items-start gap-6 py-5 border-b border-graphite last:border-0"
                >
                  <span className="font-mono text-[11px] text-silver w-6 shrink-0 mt-0.5">
                    {f.level}
                  </span>
                  <div className="flex-1">
                    <div className="font-mono text-[13px] text-paper tracking-wide">
                      {f.channel}
                    </div>
                    <div className="text-[12px] text-silver mt-1">
                      Trigger: {f.trigger}
                    </div>
                    <div className="font-mono text-[11px] text-slate mt-1">
                      e.g. {f.example}
                    </div>
                    <div className="text-[11px] text-slate mt-1">
                      Persistence: {f.persistence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toast specification */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              TOAST SPECIFICATION
            </div>
            <div className="space-y-3">
              <div className="border border-ink bg-white p-4 flex items-center gap-4">
                <div className="w-1 h-8 bg-ink shrink-0" />
                <div className="flex-1">
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    Draft saved. LIC–DRFT–2026.02.18–004.
                  </span>
                </div>
                <span className="font-mono text-[10px] text-silver tracking-wider shrink-0">
                  DISMISS
                </span>
              </div>
              <div className="border border-filing-red/40 bg-filing-red/5 p-4 flex items-center gap-4">
                <div className="w-1 h-8 bg-filing-red shrink-0" />
                <div className="flex-1">
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    Validation failed. 3 required fields missing.
                  </span>
                </div>
                <span className="font-mono text-[10px] text-silver tracking-wider shrink-0">
                  DISMISS
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "POSITION", value: "Bottom-right" },
                { label: "WIDTH", value: "400px max" },
                { label: "DURATION", value: "8 seconds" },
                { label: "STACKING", value: "3 max visible" },
              ].map((spec) => (
                <div key={spec.label}>
                  <div className="font-mono text-[9px] text-silver tracking-wider">
                    {spec.label}
                  </div>
                  <div className="font-mono text-[12px] text-ink tracking-wide mt-0.5">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      {/* Confirmation & Destructive Actions */}
      <SubSection label="Confirmation & Destructive Actions">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Destructive actions require a two-step confirmation. The dialog is modal, focus-trapped, and uses explicit language—never "Are you sure?" Always state exactly what will happen.
        </p>
        <div className="border border-ink bg-white">
          {/* Dialog specimen */}
          <div className="border-b border-ink px-8 py-4 bg-parchment">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
              CONFIRMATION DIALOG — SPECIMEN
            </div>
          </div>
          <div className="px-8 py-8">
            <div className="font-mono text-[14px] text-ink tracking-wide mb-3">
              Remove matter from active docket
            </div>
            <p className="text-[13px] text-graphite leading-relaxed max-w-md">
              This will archive Williams v. Apex Corp (LIC–DRFT–2026.02.18–004) and halt all operator activity. Generated work product will be preserved. This action requires manual reactivation.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <button className="bg-filing-red text-paper font-mono text-[11px] tracking-widest px-6 py-2.5 uppercase border border-filing-red">
                Remove Matter
              </button>
              <button className="bg-paper text-ink font-mono text-[11px] tracking-widest px-6 py-2.5 uppercase border border-ink">
                Cancel
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 8.3 — DESTRUCTIVE ACTION DIALOG, CANONICAL PATTERN
        </div>

        <div className="mt-8 space-y-0 border border-ink divide-y divide-ink">
          <div className="p-5 bg-white">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-2">
              Dialog Copywriting Rules
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Title states the action, not a question. <span className="font-mono text-ink">"Remove matter"</span> not <span className="font-mono text-slate line-through">"Are you sure?"</span></div>
              <div>— Body explains consequences in plain, specific terms.</div>
              <div>— Primary button repeats the action verb. <span className="font-mono text-ink">"Remove Matter"</span> not <span className="font-mono text-slate line-through">"OK"</span> or <span className="font-mono text-slate line-through">"Yes"</span></div>
              <div>— Cancel is always secondary. Never absent.</div>
              <div>— Destructive button uses Filing Red. Cancel uses default.</div>
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-2">
              Confirmation Thresholds
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-graphite">
              <div className="space-y-2">
                <div className="font-mono text-[10px] text-slate tracking-wider mb-1">REQUIRES DIALOG</div>
                <div>— Deleting or archiving a matter</div>
                <div>— Removing an operator from a case</div>
                <div>— Overriding a review gate</div>
                <div>— Sending client-facing communications</div>
                <div>— Modifying filed work product</div>
              </div>
              <div className="space-y-2">
                <div className="font-mono text-[10px] text-slate tracking-wider mb-1">NO DIALOG NEEDED</div>
                <div>— Saving a draft (auto-save preferred)</div>
                <div>— Toggling table sort or filter</div>
                <div>— Expanding / collapsing a panel</div>
                <div>— Navigating between sections</div>
                <div>— Copying a reference ID</div>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Loading & Empty States */}
      <SubSection label="Loading & Empty States">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The system must communicate waiting honestly. No artificial delays, no optimistic rendering, no skeleton screens. If data is loading, say so. If there is no data, say that too.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loading state */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-3 border-b border-fog bg-parchment">
              <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
                LOADING STATE
              </div>
            </div>
            <div className="px-6 py-12 flex flex-col items-center justify-center">
              <div className="w-48 h-1 bg-fog overflow-hidden">
                <div className="h-full bg-ink w-1/3 animate-[slide_1.5s_linear_infinite]" />
              </div>
              <div className="font-mono text-[11px] text-slate tracking-wider mt-4">
                LOADING MATTER DATA…
              </div>
            </div>
          </div>

          {/* Empty state */}
          <div className="border border-ink bg-white">
            <div className="px-6 py-3 border-b border-fog bg-parchment">
              <div className="font-mono text-[10px] text-slate tracking-[0.2em]">
                EMPTY STATE
              </div>
            </div>
            <div className="px-6 py-12 flex flex-col items-center justify-center">
              <div className="font-mono text-[13px] text-ink tracking-wide">
                No active matters.
              </div>
              <div className="text-[12px] text-slate mt-2">
                Matters will appear here when assigned to this operator.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="font-mono text-[10px] text-slate tracking-wider mb-2">
            LOADING INDICATOR RULES
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
            {[
              "Use a determinate progress bar when duration is known",
              "Use an indeterminate bar (linear slide) when duration is unknown",
              "Always include a text label describing what is loading",
              "Position inline, in the content area—never as a full-page overlay",
              "No spinners. No pulsing dots. No circular loaders",
              "If load exceeds 10 seconds, add a time estimate or retry option",
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-graphite">
                <span className="text-ink mt-0.5">—</span>
                {r}
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Scroll Behavior */}
      <SubSection label="Scroll Behavior">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Scrolling is the primary navigation mechanism within views. It must be native, uninterrupted, and predictable.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            {
              rule: "Native scroll only",
              detail: "No custom scroll bars, no smooth-scroll JavaScript overrides, no scroll hijacking. The browser's native scroll behavior is correct.",
            },
            {
              rule: "Sticky headers permitted",
              detail: "Section headers and table headers may use position: sticky. They must not exceed 48px in height. They must have a bottom border (1px Ink) for visual separation.",
            },
            {
              rule: "No infinite scroll",
              detail: "Paginated data uses explicit pagination controls. The user must always know how much content exists and where they are within it.",
            },
            {
              rule: "Scroll position preserved",
              detail: "Navigating away from and returning to a view restores the previous scroll position. This is non-negotiable for long data tables.",
            },
            {
              rule: "No scroll-linked animations",
              detail: "No parallax. No element reveals on scroll. No progress indicators tied to scroll depth. Scroll is for reading, not performing.",
            },
          ].map((s) => (
            <div key={s.rule} className="p-5 bg-white">
              <div className="font-mono text-[12px] text-ink tracking-wide mb-1">
                {s.rule}
              </div>
              <p className="text-[12px] text-slate leading-relaxed max-w-lg">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Error Handling */}
      <SubSection label="Error Handling & Validation">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Errors are treated as system states, not failures. The interface must communicate what went wrong, why, and what the user should do—without drama, without blame.
        </p>

        <div className="space-y-6">
          {/* Validation model */}
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-4">
              VALIDATION MODEL
            </div>
            <div className="space-y-4">
              {[
                {
                  timing: "On blur",
                  scope: "Individual field",
                  example: "Field validated when user tabs away. Error appears immediately below field.",
                },
                {
                  timing: "On submit",
                  scope: "Entire form",
                  example: "All fields validated. Summary banner at top. Focus moves to first error field.",
                },
                {
                  timing: "On correction",
                  scope: "Individual field",
                  example: "Error clears as soon as input satisfies the rule. No submit needed.",
                },
              ].map((v) => (
                <div
                  key={v.timing}
                  className="flex items-start gap-6 border-b border-fog pb-4 last:border-0 last:pb-0"
                >
                  <span className="font-mono text-[11px] text-ink w-28 shrink-0 tracking-wide">
                    {v.timing}
                  </span>
                  <div>
                    <div className="font-mono text-[11px] text-slate tracking-wide">
                      Scope: {v.scope}
                    </div>
                    <div className="text-[12px] text-graphite mt-1">
                      {v.example}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field error specimen */}
          <div>
            <div className="font-mono text-[10px] text-slate tracking-wider mb-4">
              FIELD ERROR — SPECIMEN
            </div>
            <div className="max-w-sm space-y-2">
              <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
                MATTER ID
              </label>
              <input
                type="text"
                defaultValue="LIC–DRFT–"
                className="w-full border-2 border-filing-red bg-filing-red/5 px-4 py-3 font-mono text-[13px] text-ink tracking-wide focus:outline-none"
                readOnly
              />
              <div className="font-mono text-[11px] text-filing-red tracking-wide">
                Incomplete format. Required: LIC–[CODE]–YYYY.MM.DD–NNN
              </div>
            </div>
          </div>

          {/* Error message writing rules */}
          <div className="border border-ink bg-ink text-paper p-8">
            <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
              ERROR MESSAGE WRITING RULES
            </div>
            <div className="space-y-4">
              {[
                {
                  rule: "State the problem, then the fix.",
                  good: "\"Incomplete format. Required: LIC–[CODE]–YYYY.MM.DD–NNN\"",
                  bad: "\"Invalid input\"",
                },
                {
                  rule: "Be specific. Name the field, the constraint, the expected format.",
                  good: "\"Matter ID must include module code, date, and sequence number.\"",
                  bad: "\"Please check your input.\"",
                },
                {
                  rule: "Never blame the user.",
                  good: "\"Date format not recognized. Use YYYY.MM.DD.\"",
                  bad: "\"You entered an invalid date.\"",
                },
                {
                  rule: "No exclamation points. No apologetic language.",
                  good: "\"Connection lost. Retrying in 5 seconds.\"",
                  bad: "\"Oops! Something went wrong!\"",
                },
              ].map((r, i) => (
                <div
                  key={i}
                  className="border-b border-graphite pb-4 last:border-0 last:pb-0"
                >
                  <div className="font-mono text-[12px] text-paper tracking-wide mb-2">
                    {r.rule}
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-ledger text-[11px]">—</span>
                      <span className="font-mono text-[11px] text-silver">
                        {r.good}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-filing-red text-[11px]">✕</span>
                      <span className="font-mono text-[11px] text-slate line-through">
                        {r.bad}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SubSection>

      {/* Affordance & Signifiers */}
      <SubSection label="Affordance & Signifiers">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Interactive elements must be visually distinguishable from static content at rest—not only on hover. The user should never have to move their cursor to discover what is clickable.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            {
              element: "Clickable text",
              signifier: "Institutional Blue, underline on hover",
              note: "Never Ink Black for links. Color difference is the primary affordance.",
            },
            {
              element: "Buttons",
              signifier: "Filled background (Ink) or bordered container",
              note: "All-caps monospace label. Pointer cursor. Minimum 44×44px touch target.",
            },
            {
              element: "Table rows (actionable)",
              signifier: "Pointer cursor, Parchment hover background",
              note: "Visually identical to non-actionable rows at rest. Cursor is the signifier.",
            },
            {
              element: "Expandable sections",
              signifier: "Trailing disclosure indicator (▸), rotates on open",
              note: "Text label must also indicate expand/collapse state.",
            },
            {
              element: "Form inputs",
              signifier: "Ink border, text cursor on focus, placeholder text",
              note: "Visually distinct from display text via border and background.",
            },
            {
              element: "Disabled elements",
              signifier: "Fog border, Silver text, not-allowed cursor",
              note: "Opacity reduction is insufficient. Must change border and text color.",
            },
          ].map((a) => (
            <div key={a.element} className="p-5 bg-white">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-mono text-[12px] text-ink tracking-wide">
                  {a.element}
                </span>
              </div>
              <div className="text-[12px] text-graphite mb-1">
                Signifier: {a.signifier}
              </div>
              <div className="text-[11px] text-slate">
                {a.note}
              </div>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Data Interaction Patterns */}
      <SubSection label="Data Interaction Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC interfaces are data-dense by design. The following patterns govern how users navigate, filter, sort, and act on structured data.
        </p>
        <div className="grid grid-cols-1 gap-8">
          {/* Sorting */}
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-3">
              Sorting
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Columns are sortable when the header displays a sort indicator (▲▼).</div>
              <div>— Default sort state is always visible (e.g., "Date, descending").</div>
              <div>— Clicking a sorted column reverses direction. Clicking a new column resets to descending.</div>
              <div>— Sort is instant. No loading state unless server-side.</div>
              <div>— Only one sort column active at a time. No multi-column sort in default UI.</div>
            </div>
          </div>

          {/* Filtering */}
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-3">
              Filtering
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Active filters are always visible as a summary bar above the data.</div>
              <div>— Each filter displays its current value and a dismiss control (✕).</div>
              <div>— "Clear all filters" is always available when any filter is active.</div>
              <div>— Filter application is instant. Results update on selection, not on submit.</div>
              <div>— Empty filter results show the empty state pattern with the active filter summary.</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "MODULE", value: "DRFT" },
                { label: "STATUS", value: "Active" },
                { label: "OPERATOR", value: "OP–03" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 border border-ink bg-parchment px-3 py-1.5"
                >
                  <span className="font-mono text-[9px] text-slate tracking-wider">
                    {f.label}:
                  </span>
                  <span className="font-mono text-[11px] text-ink tracking-wide">
                    {f.value}
                  </span>
                  <span className="font-mono text-[10px] text-slate ml-1 cursor-pointer">
                    ✕
                  </span>
                </div>
              ))}
              <div className="flex items-center px-3 py-1.5">
                <span className="font-mono text-[10px] text-institutional tracking-wider cursor-pointer">
                  CLEAR ALL
                </span>
              </div>
            </div>
          </div>

          {/* Selection */}
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-3">
              Selection & Batch Actions
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Multi-select uses checkboxes in the leftmost column. Never implicit selection.</div>
              <div>— A selection count and batch action bar appear above the table when items are selected.</div>
              <div>— Batch actions are limited to non-destructive operations. Batch delete requires per-item confirmation.</div>
              <div>— "Select all" applies to the current page only, with an option to "select all N results."</div>
              <div>— Selection state persists across sort and filter changes within the same session.</div>
            </div>
          </div>

          {/* Pagination */}
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[12px] text-ink tracking-wide mb-3">
              Pagination
            </div>
            <div className="space-y-2 text-[12px] text-graphite mb-4">
              <div>— Always show total count, current page, and total pages.</div>
              <div>— Default page size: 25 rows. Configurable: 25 / 50 / 100.</div>
              <div>— Page controls at bottom-right of table. Format: "1–25 of 142"</div>
              <div>— No infinite scroll. No "load more" buttons.</div>
            </div>
            <div className="flex items-center justify-between border-t border-fog pt-4">
              <span className="font-mono text-[11px] text-slate tracking-wide">
                Showing 1–25 of 142 matters
              </span>
              <div className="flex items-center gap-1">
                <button className="font-mono text-[11px] text-silver tracking-wider px-3 py-1.5 border border-fog cursor-not-allowed">
                  PREV
                </button>
                <button className="font-mono text-[11px] text-paper tracking-wider px-3 py-1.5 border border-ink bg-ink">
                  1
                </button>
                <button className="font-mono text-[11px] text-ink tracking-wider px-3 py-1.5 border border-ink bg-white">
                  2
                </button>
                <button className="font-mono text-[11px] text-ink tracking-wider px-3 py-1.5 border border-ink bg-white">
                  3
                </button>
                <span className="font-mono text-[11px] text-silver px-1">…</span>
                <button className="font-mono text-[11px] text-ink tracking-wider px-3 py-1.5 border border-ink bg-white">
                  6
                </button>
                <button className="font-mono text-[11px] text-ink tracking-wider px-3 py-1.5 border border-ink bg-white">
                  NEXT
                </button>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Modal & Overlay Behavior */}
      <SubSection label="Modal & Overlay Behavior">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Modals are the most disruptive interaction pattern in the system. They are used only when the task requires full user attention and cannot proceed in context. Every modal must justify its existence.
        </p>
        <div className="space-y-0 border border-ink divide-y divide-ink">
          {[
            {
              rule: "Modal requires justification",
              detail: "Ask: can this be done inline? If yes, use inline editing or an expandable panel. Modals are reserved for confirmation dialogs, multi-step forms, and preview contexts.",
            },
            {
              rule: "Focus trap is mandatory",
              detail: "Tab cycling is contained within the modal. Background content is inert (aria-hidden). Focus moves to the first interactive element on open.",
            },
            {
              rule: "Backdrop: Ink at 60% opacity",
              detail: "Clicking the backdrop closes the modal only for non-destructive contexts. Destructive dialogs require explicit button interaction.",
            },
            {
              rule: "Escape key closes the modal",
              detail: "Always. No exceptions. This maps to the Cancel/Close action. If the modal contains unsaved changes, a nested confirmation may be shown.",
            },
            {
              rule: "No stacked modals",
              detail: "A modal may not open another modal. If a sub-task is needed, replace the modal content or use a stepped flow within the same modal frame.",
            },
            {
              rule: "Size: 480px or 640px wide",
              detail: "Two permitted widths. Small (480px) for confirmations and simple forms. Large (640px) for previews and multi-field forms. No full-screen modals.",
            },
          ].map((m) => (
            <div key={m.rule} className="p-5 bg-white">
              <div className="font-mono text-[12px] text-ink tracking-wide mb-1">
                {m.rule}
              </div>
              <p className="text-[12px] text-slate leading-relaxed max-w-lg">
                {m.detail}
              </p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Responsive Interaction */}
      <SubSection label="Responsive Interaction">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          LIC is a desktop-first application. Tablet support is a secondary concern. Phone support is explicitly out of scope. The following rules govern responsive behavior within the supported range.
        </p>
        <div className="border border-ink bg-white">
          <div className="divide-y divide-ink">
            {[
              {
                breakpoint: "≥ 1280px",
                label: "DESKTOP",
                behavior: "Full layout. Sidebar visible. Data tables at full width. 12-column grid active.",
              },
              {
                breakpoint: "1024–1279px",
                label: "COMPACT DESKTOP",
                behavior: "Sidebar collapses to icon rail or hamburger. Data tables may scroll horizontally. Grid reduces to 8 columns.",
              },
              {
                breakpoint: "768–1023px",
                label: "TABLET",
                behavior: "Sidebar becomes overlay drawer. Single-column content. Tables switch to card layout or scroll. Touch targets increase to 48px.",
              },
              {
                breakpoint: "< 768px",
                label: "UNSUPPORTED",
                behavior: "Display a notice: \"LIC is designed for desktop use. For the best experience, use a device with a screen width of 768px or greater.\"",
              },
            ].map((bp, i) => (
              <div key={bp.breakpoint} className={`p-5 ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    {bp.breakpoint}
                  </span>
                  <span className="font-mono text-[10px] text-institutional tracking-[0.2em]">
                    {bp.label}
                  </span>
                </div>
                <p className="text-[12px] text-slate leading-relaxed">
                  {bp.behavior}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 8.4 — RESPONSIVE BREAKPOINT TABLE
        </div>
      </SubSection>

      {/* Accessibility */}
      <SubSection label="Accessibility as Procedure">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Accessibility at LIC is not aspirational. It is procedural. Every component ships with the following requirements verified. Non-compliance is a defect, not a backlog item.
        </p>
        <div className="border border-ink bg-ink text-paper p-8 md:p-12">
          <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
            ACCESSIBILITY REQUIREMENTS — NON-NEGOTIABLE
          </div>
          <div className="space-y-6">
            {[
              {
                req: "WCAG 2.1 AA compliance",
                detail: "All text meets minimum contrast ratios. All interactive elements meet minimum target sizes. All content is navigable by keyboard.",
              },
              {
                req: "Semantic HTML",
                detail: "Use correct elements: button for actions, a for navigation, input for data entry, table for tabular data. No div-as-button patterns.",
              },
              {
                req: "ARIA landmarks and labels",
                detail: "All regions labeled. All form inputs have associated labels. All images have alt text. All icons have sr-only descriptions.",
              },
              {
                req: "Screen reader announcements",
                detail: "Dynamic content changes announced via aria-live regions. Toast notifications use role=\"status\". Error messages use role=\"alert\".",
              },
              {
                req: "Reduced motion support",
                detail: "When prefers-reduced-motion is active, all permitted transitions are disabled. The interface functions identically without any motion.",
              },
              {
                req: "Color is never the sole indicator",
                detail: "Status, errors, and state changes are communicated through text labels and/or iconography in addition to color. Color-blind users must receive identical information.",
              },
            ].map((a) => (
              <div key={a.req} className="border-b border-graphite pb-5 last:border-0 last:pb-0">
                <div className="font-mono text-[13px] text-paper tracking-wide mb-1">
                  {a.req}
                </div>
                <p className="text-[12px] text-silver leading-relaxed">
                  {a.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SubSection>

      {/* Anti-Patterns */}
      <SubSection label="Interaction Anti-Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          These patterns are explicitly prohibited in LIC products. They are listed here because they are common in contemporary software and may be proposed by well-meaning contributors.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              pattern: "Infinite scroll",
              reason: "Users cannot gauge dataset size or return to a known position. Use pagination.",
            },
            {
              pattern: "Skeleton loading screens",
              reason: "Implies content shape before content exists. Dishonest. Use a labeled progress bar.",
            },
            {
              pattern: "Drag-to-reorder",
              reason: "Inaccessible, fragile on touch, and hides the reorder mechanism. Use explicit up/down controls.",
            },
            {
              pattern: "Double-click to edit",
              reason: "Invisible affordance. No signifier at rest. Use an explicit edit button.",
            },
            {
              pattern: "Swipe gestures",
              reason: "Not discoverable. Not keyboard-accessible. Desktop-first application.",
            },
            {
              pattern: "Auto-advancing carousels",
              reason: "User does not control pace. Content is hidden. Use a static grid or list.",
            },
            {
              pattern: "Hover-only content",
              reason: "Inaccessible to keyboard and touch users. Content must be visible or explicitly toggled.",
            },
            {
              pattern: "Toasts for errors",
              reason: "Errors are too important to disappear. Use inline alerts that persist until resolved.",
            },
            {
              pattern: "Optimistic UI updates",
              reason: "Showing success before confirmation is dishonest. Wait for server acknowledgment.",
            },
            {
              pattern: "Smart defaults / predictive input",
              reason: "LIC operators fill legal documents. Autocomplete introduces liability. Explicit entry only.",
            },
          ].map((ap) => (
            <div key={ap.pattern} className="border border-filing-red/30 bg-filing-red/5 p-5">
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

      {/* Summary */}
      <SubSection label="Summary Doctrine">
        <div className="border border-ink bg-white p-8 md:p-12">
          <div className="space-y-6">
            {[
              "The interface is an instrument. It does not entertain.",
              "Every state is visible. The user never guesses.",
              "Every action is reversible. Destruction requires confirmation.",
              "Motion is linear, brief, and functional—or absent entirely.",
              "Feedback is honest. Loading says loading. Empty says empty. Errors explain.",
              "Accessibility is not optional. It is verified before ship.",
              "The system waits for the user. It does not interrupt.",
              "Data density is a feature. White space is for structure, not drama.",
              "If a pattern requires explanation, it is the wrong pattern.",
            ].map((d, i) => (
              <div key={i} className="flex items-start gap-4 border-b border-fog pb-4 last:border-0 last:pb-0">
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
          FIG. 8.5 — INTERACTION DESIGN DOCTRINE, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>
    </div>
  );
}
