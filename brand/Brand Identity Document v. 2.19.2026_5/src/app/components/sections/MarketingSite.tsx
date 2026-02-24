import { SectionHeader, SubSection } from "../SectionHeader";
import { LICLogoMark, LICWordmark } from "../LICLogo";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export function MarketingSite() {
  return (
    <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
      <SectionHeader
        code="10"
        title="Marketing Site"
        subtitle="Design brief and specimen reference for the public-facing LIC marketing site. The site presents the corporation to prospective law firm clients. It must project institutional authority without performing it—calm, factual, and unhurried. This is not a startup landing page."
      />

      {/* Design Brief */}
      <SubSection label="Design Brief">
        <div className="border-l-4 border-ink pl-8 py-4 bg-parchment">
          <div
            className="font-serif italic text-ink"
            style={{ fontSize: "1.5rem", lineHeight: 1.3 }}
          >
            The site should feel like receiving a capabilities presentation from a white-shoe firm—not like visiting a SaaS product page.
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-4">
              AUDIENCE
            </div>
            <div className="space-y-3 text-[13px] text-graphite leading-relaxed">
              <p>
                Managing partners, practice group leaders, and operations directors at mid-size to large law firms (50–500 attorneys). Secondary: general counsel at corporations evaluating outside litigation support.
              </p>
              <p>
                These are senior professionals who distrust hype, recognize quality by its restraint, and make purchasing decisions based on competence signals—not feature checklists.
              </p>
            </div>
          </div>
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-4">
              STRATEGIC INTENT
            </div>
            <div className="space-y-3 text-[13px] text-graphite leading-relaxed">
              <p>
                Communicate that LIC is an institutional-grade litigation workforce—not an AI tool, not a legal tech startup. The site must convey: we are already here, we are already working, you simply haven't engaged us yet.
              </p>
              <p>
                Primary conversion: schedule a capabilities briefing. Secondary: download the operational overview document. No free trials. No self-serve signup.
              </p>
            </div>
          </div>
        </div>

        {/* Tone positioning */}
        <div className="mt-8 border border-ink bg-ink text-paper p-8">
          <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
            TONE POSITIONING
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="font-mono text-[10px] text-ledger tracking-wider mb-2">
                THE SITE IS
              </div>
              <div className="space-y-2 text-[12px] text-silver">
                <div>— Authoritative</div>
                <div>— Measured</div>
                <div>— Factual</div>
                <div>— Unhurried</div>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-ledger tracking-wider mb-2">
                IT FEELS LIKE
              </div>
              <div className="space-y-2 text-[12px] text-silver">
                <div>— A corporate annual report</div>
                <div>— An IBM brochure, 1972</div>
                <div>— A partner's office</div>
                <div>— A well-set table</div>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-filing-red tracking-wider mb-2">
                IT IS NOT
              </div>
              <div className="space-y-2 text-[12px] text-slate">
                <div className="line-through">— Exciting</div>
                <div className="line-through">— Playful</div>
                <div className="line-through">— Urgent</div>
                <div className="line-through">— Trendy</div>
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] text-filing-red tracking-wider mb-2">
                IT NEVER FEELS LIKE
              </div>
              <div className="space-y-2 text-[12px] text-slate">
                <div className="line-through">— A Y Combinator demo</div>
                <div className="line-through">— A product hunt launch</div>
                <div className="line-through">— A chatbot sales page</div>
                <div className="line-through">— A countdown timer</div>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Site Architecture */}
      <SubSection label="Site Architecture">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The marketing site is deliberately small. Fewer pages, each doing more work. No blog, no resource center, no gated content library. The site exists to establish credibility and initiate a conversation.
        </p>
        <div className="border border-ink divide-y divide-ink">
          {[
            {
              page: "Landing / Home",
              path: "/",
              purpose: "Establish positioning, introduce the workforce concept, drive to contact.",
              sections: "Hero, Value proposition, Operational model, Social proof, CTA",
            },
            {
              page: "Capabilities",
              path: "/capabilities",
              purpose: "Detail what the workforce does across litigation phases.",
              sections: "Module overview, Deliverable examples, Integration model",
            },
            {
              page: "How It Works",
              path: "/how-it-works",
              purpose: "Explain the engagement model, onboarding, and operational cadence.",
              sections: "Engagement timeline, Security & compliance, Pricing philosophy",
            },
            {
              page: "About",
              path: "/about",
              purpose: "Institutional credibility. Leadership, backing, mission.",
              sections: "Company overview, Leadership, Institutional backing",
            },
            {
              page: "Contact",
              path: "/contact",
              purpose: "Schedule a capabilities briefing. Single form.",
              sections: "Contact form, Office locations, Response commitment",
            },
          ].map((p, i) => (
            <div key={p.path} className={`p-5 ${i % 2 === 0 ? "bg-white" : "bg-parchment"}`}>
              <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-ink tracking-wide">
                    {p.page}
                  </span>
                  <span className="font-mono text-[10px] text-silver tracking-wider">
                    {p.path}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-slate leading-relaxed mb-1">
                {p.purpose}
              </p>
              <div className="font-mono text-[10px] text-silver tracking-wider">
                {p.sections}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.1 — SITE ARCHITECTURE, COMPLETE PAGE MAP
        </div>
      </SubSection>

      {/* Typography for Marketing */}
      <SubSection label="Typography Adjustments — Marketing Context">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The marketing site uses the same typeface families as the product, but adjusts the hierarchy for a public-facing reading context. IBM Plex Serif leads headlines. IBM Plex Sans carries body copy. IBM Plex Mono is reserved for labels, data, and UI elements.
        </p>
        <div className="space-y-8">
          <div className="border border-ink bg-white p-8">
            <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-6">
              MARKETING TYPE HIERARCHY
            </div>
            <div className="space-y-8">
              <div className="border-b border-fog pb-6">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  H1 — HERO HEADLINE · PLEX SERIF · 48–56px
                </div>
                <div className="font-serif text-ink" style={{ fontSize: "3rem", lineHeight: 1.05 }}>
                  Your litigation<br />workforce, operational.
                </div>
              </div>
              <div className="border-b border-fog pb-6">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  H2 — SECTION HEADLINE · PLEX SERIF · 28–32px
                </div>
                <div className="font-serif text-ink" style={{ fontSize: "1.875rem", lineHeight: 1.15 }}>
                  Agentic operators for every phase of litigation.
                </div>
              </div>
              <div className="border-b border-fog pb-6">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  H3 — CARD / FEATURE HEADLINE · PLEX SANS · 18–20px
                </div>
                <div className="font-sans text-ink" style={{ fontSize: "1.25rem", lineHeight: 1.3 }}>
                  Draft production at associate-grade quality, delivered overnight.
                </div>
              </div>
              <div className="border-b border-fog pb-6">
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  BODY — PLEX SANS · 16px · 1.6 LINE HEIGHT
                </div>
                <p className="font-sans text-graphite" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
                  LIC deploys an agentic litigation workforce that operates within your existing workflows. Associates draft. Auditors review. Analysts brief. Every deliverable is filed, attributed, and subject to attorney oversight.
                </p>
              </div>
              <div>
                <div className="font-mono text-[9px] text-silver tracking-wider mb-2">
                  LABEL / CAPTION — PLEX MONO · 10–12px · TRACKED
                </div>
                <div className="font-mono text-[11px] text-slate tracking-[0.2em]">
                  CASE STUDY · LITIGATION SUPPORT · 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* ====== HERO SPECIMEN ====== */}
      <SubSection label="Hero Section — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The hero section is the first thing a prospective client sees. It must communicate three things in five seconds: what LIC is, what it does, and that it is serious. No animation, no video background, no auto-playing anything.
        </p>

        {/* Full hero specimen */}
        <div className="border border-ink overflow-hidden">
          {/* Nav bar specimen */}
          <div className="bg-ink text-paper px-8 py-5 flex items-center justify-between">
            <LICLogoMark size="small" inverted />
            <div className="hidden md:flex items-center gap-8">
              {["Capabilities", "How It Works", "About", "Contact"].map((item) => (
                <span
                  key={item}
                  className="font-mono text-[11px] text-silver tracking-wider hover:text-paper cursor-pointer"
                >
                  {item}
                </span>
              ))}
              <button className="font-mono text-[10px] text-paper tracking-widest px-5 py-2 uppercase border border-paper/40 hover:bg-paper/10">
                Schedule Briefing
              </button>
            </div>
          </div>

          {/* Hero content */}
          <div className="bg-ink text-paper">
            <div className="px-8 md:px-16 py-16 md:py-24">
              <div className="max-w-2xl">
                <div className="font-mono text-[10px] text-silver tracking-[0.4em] mb-6">
                  LEGAL INTELLIGENCE CORPORATION
                </div>
                <h1
                  className="font-serif text-paper"
                  style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.05 }}
                >
                  Your litigation<br />
                  workforce, operational.
                </h1>
                <div className="mt-8 h-px bg-paper/20 w-24" />
                <p
                  className="font-sans text-silver mt-8 max-w-md"
                  style={{ fontSize: "1.0625rem", lineHeight: 1.65 }}
                >
                  An agentic workforce of Associates, Auditors, and Analysts—deployed to your matters, operating within your workflows, filing work product for attorney review.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                  <button className="bg-paper text-ink font-mono text-[11px] tracking-widest px-8 py-3.5 uppercase">
                    Schedule a Briefing
                  </button>
                  <button className="text-silver font-mono text-[11px] tracking-widest px-8 py-3.5 uppercase border border-silver/30 hover:border-paper/60 hover:text-paper">
                    Read the Overview
                  </button>
                </div>
              </div>
            </div>

            {/* Trust bar */}
            <div className="px-8 md:px-16 py-6 border-t border-graphite">
              <div className="font-mono text-[9px] text-slate tracking-[0.3em] mb-4">
                TRUSTED BY LITIGATION TEAMS AT
              </div>
              <div className="flex flex-wrap items-center gap-8 md:gap-12">
                {[
                  "Morrison & Whitfield LLP",
                  "Calloway Stern",
                  "Bancroft Davis & Cole",
                  "Thornton Park Group",
                  "Whitaker & Associates",
                ].map((firm) => (
                  <span
                    key={firm}
                    className="font-mono text-[12px] text-silver/60 tracking-wide"
                  >
                    {firm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.2 — HERO SECTION, FULL-WIDTH SPECIMEN
        </div>

        {/* Hero rules */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              HERO RULES
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Ink Black background. Always.</div>
              <div>— Headline is serif, never more than two lines</div>
              <div>— Subhead is sans-serif, Silver, max 2 sentences</div>
              <div>— Primary CTA is Paper on Ink (inverted button)</div>
              <div>— Secondary CTA is ghost with Silver border</div>
              <div>— No background images, no gradients</div>
              <div>— No animation, no typed-out text effect</div>
              <div>— Trust bar at bottom, monospace, understated</div>
            </div>
          </div>
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              NAVIGATION BAR RULES
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Ink Black background, continuous with hero</div>
              <div>— Logo mark at left, small variant</div>
              <div>— Nav links: monospace, Silver, tracked</div>
              <div>— CTA button at right, bordered, not filled</div>
              <div>— Mobile: hamburger menu, no animation on open</div>
              <div>— Sticky on scroll, with 1px bottom border</div>
              <div>— Max 5 nav items including CTA</div>
              <div>— No dropdowns, no mega-menus</div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Value Proposition Section */}
      <SubSection label="Value Proposition Section — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The value proposition section explains what LIC does in operational terms. No abstract promises, no aspirational language. Concrete deliverables, concrete roles, concrete outcomes.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-paper px-8 md:px-16 py-16">
            <div className="font-mono text-[10px] text-slate tracking-[0.3em] mb-4">
              WHAT WE DEPLOY
            </div>
            <h2
              className="font-serif text-ink max-w-lg"
              style={{ fontSize: "1.875rem", lineHeight: 1.15 }}
            >
              Three operator classes. One unified workforce.
            </h2>
            <div className="mt-4 h-px bg-ink w-16" />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink">
              {[
                {
                  role: "Associate",
                  code: "ASSOC",
                  desc: "Drafts motions, memos, discovery responses, and client communications. Delivers complete first-draft documents ready for attorney review.",
                  output: "14-page motion in 4 hours",
                },
                {
                  role: "Auditor",
                  code: "AUDT",
                  desc: "Reviews every document for citation accuracy, formatting compliance, and procedural correctness. Automated quality control before human review.",
                  output: "Full audit in 12 minutes",
                },
                {
                  role: "Analyst",
                  code: "ANLS",
                  desc: "Synthesizes case intelligence, monitors opposing activity, and delivers daily docket briefings. Your morning situation report, filed before you arrive.",
                  output: "Daily briefing at 6:00 AM",
                },
              ].map((r, i) => (
                <div
                  key={r.code}
                  className={`p-8 ${i < 2 ? "md:border-r md:border-ink" : ""} ${i > 0 ? "border-t md:border-t-0 border-ink" : ""}`}
                >
                  <div className="font-mono text-[10px] text-institutional tracking-[0.2em] mb-3">
                    {r.code}
                  </div>
                  <h3
                    className="font-sans text-ink"
                    style={{ fontSize: "1.25rem", lineHeight: 1.3 }}
                  >
                    {r.role}
                  </h3>
                  <p className="font-sans text-[14px] text-slate mt-4 leading-relaxed">
                    {r.desc}
                  </p>
                  <div className="mt-6 pt-4 border-t border-fog">
                    <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                      REPRESENTATIVE OUTPUT
                    </div>
                    <div className="font-mono text-[12px] text-ink tracking-wide">
                      {r.output}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.3 — VALUE PROPOSITION, THREE-COLUMN OPERATOR LAYOUT
        </div>
      </SubSection>

      {/* Operational Model Section */}
      <SubSection label="Operational Model Section — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          This section explains how engagement works. It must project simplicity and institutional process in equal measure. The visual pattern is a numbered sequence with generous spacing.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-parchment px-8 md:px-16 py-16">
            <div className="font-mono text-[10px] text-slate tracking-[0.3em] mb-4">
              HOW IT WORKS
            </div>
            <h2
              className="font-serif text-ink max-w-lg"
              style={{ fontSize: "1.875rem", lineHeight: 1.15 }}
            >
              Engagement is structured. Onboarding is measured in days, not months.
            </h2>
            <div className="mt-4 h-px bg-ink w-16" />

            <div className="mt-12 space-y-0">
              {[
                {
                  num: "01",
                  title: "Capabilities briefing",
                  desc: "A 45-minute session with our operations team. We learn your practice areas, case volume, and workflow requirements. You see live examples of agent output on cases comparable to yours.",
                  timeline: "Day 1",
                },
                {
                  num: "02",
                  title: "Matter onboarding",
                  desc: "Your first matters are entered into the system. We configure agents for your jurisdiction, practice area, and document standards. Your team reviews calibration outputs and provides feedback.",
                  timeline: "Days 2–5",
                },
                {
                  num: "03",
                  title: "Supervised operation",
                  desc: "Agents begin producing work product under heightened review protocols. Every output is reviewed by your attorneys. We tune quality based on your feedback. This phase is deliberately conservative.",
                  timeline: "Weeks 2–4",
                },
                {
                  num: "04",
                  title: "Full deployment",
                  desc: "Standard operating cadence. Agents file reports daily. Associates draft on demand. Auditors review automatically. Your attorneys review and approve, as with any team member.",
                  timeline: "Week 5+",
                },
              ].map((s, i) => (
                <div
                  key={s.num}
                  className={`flex items-start gap-8 py-8 ${i > 0 ? "border-t border-ink" : ""}`}
                >
                  <div className="shrink-0 w-16">
                    <span
                      className="font-serif text-ink/10"
                      style={{ fontSize: "3rem", lineHeight: 1 }}
                    >
                      {s.num}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-4">
                      <h3
                        className="font-sans text-ink"
                        style={{ fontSize: "1.125rem", lineHeight: 1.3 }}
                      >
                        {s.title}
                      </h3>
                      <span className="font-mono text-[10px] text-institutional tracking-wider">
                        {s.timeline}
                      </span>
                    </div>
                    <p className="font-sans text-[14px] text-slate mt-3 leading-relaxed max-w-md">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.4 — OPERATIONAL MODEL, FOUR-STEP SEQUENCE
        </div>
      </SubSection>

      {/* Social Proof */}
      <SubSection label="Social Proof — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Social proof on the LIC site takes the form of attributed professional testimonials—never star ratings, never "X% faster" statistics without context, never unattributed praise. Each testimonial identifies the speaker by title and firm.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-ink text-paper px-8 md:px-16 py-16">
            <div className="font-mono text-[10px] text-silver tracking-[0.3em] mb-12">
              WHAT OUR CLIENTS REPORT
            </div>

            <div className="space-y-12">
              {[
                {
                  quote: "We deployed LIC on our largest products liability matter. Within two weeks, our overnight draft capacity doubled without adding headcount. The quality is associate-grade—genuinely reviewable first drafts, not AI output that needs to be rewritten.",
                  name: "Katherine Aldridge",
                  title: "Managing Partner",
                  firm: "Morrison & Whitfield LLP",
                },
                {
                  quote: "The daily docket briefings alone justify the engagement. I arrive each morning to a comprehensive situation report across all active matters. My Analysts know what opposing counsel filed before I do.",
                  name: "David Okafor",
                  title: "Head of Litigation",
                  firm: "Calloway Stern",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="border-l-2 border-paper/20 pl-8"
                >
                  <p
                    className="font-serif text-paper/90 italic max-w-lg"
                    style={{ fontSize: "1.125rem", lineHeight: 1.5 }}
                  >
                    "{t.quote}"
                  </p>
                  <div className="mt-6 flex items-baseline gap-3">
                    <span className="font-mono text-[12px] text-paper tracking-wide">
                      {t.name}
                    </span>
                    <span className="font-mono text-[10px] text-silver tracking-wider">
                      {t.title}, {t.firm}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.5 — TESTIMONIAL SECTION, DARK VARIANT
        </div>

        <div className="mt-8 border border-ink bg-white p-6">
          <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
            TESTIMONIAL RULES
          </div>
          <div className="space-y-2 text-[12px] text-graphite">
            <div>— Every quote is attributed: name, title, firm. No anonymous testimonials.</div>
            <div>— Quotes describe operational outcomes, not emotional reactions.</div>
            <div>— No star ratings, NPS scores, or quantitative satisfaction metrics.</div>
            <div>— Maximum two testimonials per section. Quality over volume.</div>
            <div>— Serif italic for quote text. Monospace for attribution.</div>
            <div>— Left border-rule (2px, Paper/20 on dark or Ink/20 on light) for visual anchoring.</div>
            <div>— No headshot photos. Names carry sufficient authority in this context.</div>
          </div>
        </div>
      </SubSection>

      {/* CTA Patterns */}
      <SubSection label="Call-to-Action Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The LIC marketing site has exactly two conversion actions. They are presented with quiet authority—never urgency, never scarcity, never countdown timers. The user is a senior professional making a considered decision.
        </p>

        <div className="space-y-6">
          {/* Primary CTA specimen */}
          <div className="border border-ink overflow-hidden">
            <div className="bg-paper px-8 md:px-16 py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="font-mono text-[10px] text-slate tracking-[0.3em] mb-4">
                  NEXT STEP
                </div>
                <h2
                  className="font-serif text-ink"
                  style={{ fontSize: "1.75rem", lineHeight: 1.15 }}
                >
                  Schedule a capabilities briefing.
                </h2>
                <p className="font-sans text-[14px] text-slate mt-4 leading-relaxed">
                  A 45-minute session with our operations team. No sales presentation. We show you live agent output on cases comparable to yours.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-10 py-3.5 uppercase">
                    Schedule Briefing
                  </button>
                  <button className="text-ink font-mono text-[11px] tracking-widest px-10 py-3.5 uppercase border border-ink">
                    Download Overview
                  </button>
                </div>
                <div className="mt-6 font-mono text-[10px] text-silver tracking-wider">
                  Response within one business day.
                </div>
              </div>
            </div>
          </div>
          <div className="font-mono text-[9px] text-slate tracking-wider">
            FIG. 10.6 — PRIMARY CTA SECTION, CENTERED VARIANT
          </div>

          {/* CTA rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-ink bg-white p-6">
              <div className="font-mono text-[10px] text-ledger tracking-wider mb-3">
                PERMITTED CTA LANGUAGE
              </div>
              <div className="space-y-2 text-[12px] text-graphite">
                <div>— "Schedule a briefing"</div>
                <div>— "Download the overview"</div>
                <div>— "Contact our operations team"</div>
                <div>— "Request a capabilities presentation"</div>
                <div>— "Learn more" (for secondary, internal links only)</div>
              </div>
            </div>
            <div className="border border-filing-red/30 bg-filing-red/5 p-6">
              <div className="font-mono text-[10px] text-filing-red tracking-wider mb-3">
                PROHIBITED CTA LANGUAGE
              </div>
              <div className="space-y-2 text-[12px] text-graphite">
                <div className="line-through">— "Get started free"</div>
                <div className="line-through">— "Try it now"</div>
                <div className="line-through">— "Book a demo"</div>
                <div className="line-through">— "Sign up today"</div>
                <div className="line-through">— "Don't miss out"</div>
                <div className="line-through">— "Limited availability"</div>
              </div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Imagery Direction */}
      <SubSection label="Imagery & Photography Direction">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Photography on the marketing site is used sparingly and only in supporting roles—never as hero backgrounds, never as full-bleed sections. When used, images project institutional permanence: architecture, workspace, materiality. All images are desaturated and high-contrast.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-ink overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden grayscale contrast-125">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1598139384902-5a8217874645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZXJuJTIwbGF3JTIwb2ZmaWNlJTIwYXJjaGl0ZWN0dXJlJTIwbWluaW1hbHxlbnwxfHx8fDE3NzE0NTg0MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Institutional architecture"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-4 py-3 bg-parchment">
              <div className="font-mono text-[9px] text-slate tracking-wider">
                ARCHITECTURAL · INSTITUTIONAL
              </div>
            </div>
          </div>
          <div className="border border-ink overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden grayscale contrast-125">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1770566858245-51c7cff6c4a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBidWlsZGluZyUyMGV4dGVyaW9yJTIwbW9ub2Nocm9tZXxlbnwxfHx8fDE3NzE0NTg0Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Corporate architecture"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-4 py-3 bg-parchment">
              <div className="font-mono text-[9px] text-slate tracking-wider">
                STRUCTURAL · PERMANENCE
              </div>
            </div>
          </div>
          <div className="border border-ink overflow-hidden">
            <div className="aspect-[4/3] overflow-hidden grayscale contrast-125">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1705417272217-490f4511abeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbml6ZWQlMjB3b3Jrc3BhY2UlMjBkb2N1bWVudHMlMjBtaW5pbWFsfGVufDF8fHx8MTc3MTQ1ODQyOXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Organized workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="px-4 py-3 bg-parchment">
              <div className="font-mono text-[9px] text-slate tracking-wider">
                WORKSPACE · MATERIALITY
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              IMAGE TREATMENT RULES
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— All images converted to grayscale (CSS filter or pre-processed)</div>
              <div>— Contrast increased to 125% minimum</div>
              <div>— Never used as background images behind text</div>
              <div>— Always contained in bordered frames (1px Ink)</div>
              <div>— Captioned with monospace labels below</div>
              <div>— Maximum 3 images per page</div>
              <div>— Aspect ratio: 4:3 or 3:2 only</div>
            </div>
          </div>
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              SUBJECT DIRECTION
            </div>
            <div className="space-y-2 text-[12px] text-graphite">
              <div>— Institutional architecture (courthouses, offices, libraries)</div>
              <div>— Workspace materiality (paper, desks, bookshelves)</div>
              <div>— Abstract structure (grids, filing systems, typography)</div>
              <div>— No people in marketing photography</div>
              <div>— No screens showing the product (screenshot tours are separate)</div>
              <div>— No stock imagery of "AI" (neural networks, glowing brains, robots)</div>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Contact / Form Pattern */}
      <SubSection label="Contact Form — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The contact form is minimal. It asks for exactly what is needed to schedule a briefing. No company size dropdown, no "how did you hear about us," no marketing qualification fields. Respect the user's time.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-paper px-8 md:px-16 py-16">
            <div className="max-w-md">
              <div className="font-mono text-[10px] text-slate tracking-[0.3em] mb-4">
                CONTACT
              </div>
              <h2
                className="font-serif text-ink"
                style={{ fontSize: "1.75rem", lineHeight: 1.15 }}
              >
                Schedule a capabilities briefing.
              </h2>
              <div className="mt-2 h-px bg-ink w-12" />

              <div className="mt-10 space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
                    NAME
                  </label>
                  <input
                    type="text"
                    className="w-full border border-ink bg-white px-4 py-3 font-sans text-[15px] text-ink focus:outline-none focus:border-institutional"
                    placeholder="Katherine Aldridge"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
                    FIRM
                  </label>
                  <input
                    type="text"
                    className="w-full border border-ink bg-white px-4 py-3 font-sans text-[15px] text-ink focus:outline-none focus:border-institutional"
                    placeholder="Morrison & Whitfield LLP"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    className="w-full border border-ink bg-white px-4 py-3 font-sans text-[15px] text-ink focus:outline-none focus:border-institutional"
                    placeholder="kaldridge@morrisonwhitfield.com"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-[10px] tracking-[0.2em] text-slate block">
                    BRIEF NOTE (OPTIONAL)
                  </label>
                  <textarea
                    className="w-full border border-ink bg-white px-4 py-3 font-sans text-[15px] text-ink focus:outline-none focus:border-institutional h-24 resize-none"
                    placeholder="Practice areas of interest, current case volume, or specific questions."
                    readOnly
                  />
                </div>
                <button className="bg-ink text-paper font-mono text-[11px] tracking-widest px-10 py-3.5 uppercase w-full">
                  Submit Request
                </button>
                <div className="font-mono text-[10px] text-silver tracking-wider text-center">
                  Response within one business day. No automated follow-up sequences.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.7 — CONTACT FORM, CANONICAL PATTERN
        </div>

        <div className="mt-6 border border-ink bg-white p-6">
          <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
            FORM RULES
          </div>
          <div className="space-y-2 text-[12px] text-graphite">
            <div>— Maximum 4 fields plus submit. No field is required except email.</div>
            <div>— Labels are monospace, uppercase, tracked. Above the field, never inside.</div>
            <div>— Placeholder text shows format examples, not instructions.</div>
            <div>— Sans-serif for input text (this is the one context where users type in sans).</div>
            <div>— Submit button is full-width on the form, Ink Black.</div>
            <div>— Confirmation message replaces the form inline. No redirect, no modal.</div>
            <div>— No CAPTCHA visible by default. Use invisible verification only.</div>
            <div>— Privacy note in footer: "Your information is used solely to schedule this briefing."</div>
          </div>
        </div>
      </SubSection>

      {/* Footer Pattern */}
      <SubSection label="Site Footer — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The footer is the site's institutional signature. It reinforces the corporate identity with the same restrained authority as the rest of the site. Minimal links, full legal notice, no social media icons.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-ink text-paper px-8 md:px-16 py-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div>
                <LICLogoMark size="small" inverted />
                <div className="mt-4 font-mono text-[10px] text-silver tracking-wider leading-relaxed">
                  Agentic litigation workforce<br />for institutional law firms.
                </div>
              </div>
              <div className="flex gap-12">
                <div>
                  <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-3">
                    PAGES
                  </div>
                  <div className="space-y-2">
                    {["Capabilities", "How It Works", "About", "Contact"].map((link) => (
                      <div key={link} className="font-mono text-[11px] text-silver tracking-wider cursor-pointer hover:text-paper">
                        {link}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[9px] text-slate tracking-[0.2em] mb-3">
                    CONTACT
                  </div>
                  <div className="space-y-2 font-mono text-[11px] text-silver tracking-wider">
                    <div>contact@lic.law</div>
                    <div>New York, NY</div>
                    <div>Washington, DC</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-6 border-t border-graphite flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="font-mono text-[9px] text-slate tracking-wider">
                © 2026 LEGAL INTELLIGENCE CORPORATION. ALL RIGHTS RESERVED.
              </div>
              <div className="flex gap-6">
                <span className="font-mono text-[9px] text-slate tracking-wider cursor-pointer hover:text-silver">
                  Privacy
                </span>
                <span className="font-mono text-[9px] text-slate tracking-wider cursor-pointer hover:text-silver">
                  Terms
                </span>
                <span className="font-mono text-[9px] text-slate tracking-wider cursor-pointer hover:text-silver">
                  Security
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.8 — SITE FOOTER, CANONICAL PATTERN
        </div>
      </SubSection>

      {/* Metrics & Data Display */}
      <SubSection label="Metrics Display — Specimen">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          When quantitative claims appear on the marketing site, they are presented as large-format data points with specific attribution. No vanity metrics, no unverifiable claims, no "10x" multipliers.
        </p>

        <div className="border border-ink overflow-hidden">
          <div className="bg-paper px-8 md:px-16 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-ink divide-x divide-y md:divide-y-0 divide-ink">
              {[
                { value: "4.2h", label: "Average motion draft turnaround", source: "Q4 2025 operations data" },
                { value: "12min", label: "Full citation audit completion", source: "Median across 1,400 documents" },
                { value: "99.1%", label: "Citation verification accuracy", source: "Independent audit, Jan 2026" },
                { value: "06:00", label: "Daily briefing delivery time", source: "UTC, 7-day average" },
              ].map((m) => (
                <div key={m.label} className="p-6">
                  <div
                    className="font-mono text-ink"
                    style={{ fontSize: "2rem", lineHeight: 1 }}
                  >
                    {m.value}
                  </div>
                  <div className="font-sans text-[13px] text-graphite mt-3 leading-snug">
                    {m.label}
                  </div>
                  <div className="font-mono text-[9px] text-silver tracking-wider mt-2">
                    {m.source}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[9px] text-slate tracking-wider">
          FIG. 10.9 — METRICS DISPLAY, FOUR-COLUMN WITH ATTRIBUTION
        </div>

        <div className="mt-6 border border-ink bg-white p-6">
          <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
            METRICS RULES
          </div>
          <div className="space-y-2 text-[12px] text-graphite">
            <div>— Every number includes its source and measurement period.</div>
            <div>— Monospace for the number. Sans-serif for the label. Mono for the source.</div>
            <div>— No animated counters. Numbers are static.</div>
            <div>— No relative claims ("10x faster") without a stated baseline.</div>
            <div>— Maximum 4 metrics per display. Restraint signals confidence.</div>
            <div>— Numbers represent operational data, not survey results or projections.</div>
          </div>
        </div>
      </SubSection>

      {/* Color & Surface */}
      <SubSection label="Surface & Color Application">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The marketing site alternates between three surface treatments. The rhythm creates visual pacing without introducing new colors or decorative elements.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-ink bg-ink text-paper p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="font-mono text-[10px] text-silver tracking-[0.2em] mb-2">
                  SURFACE: INK
                </div>
                <p className="text-[12px] text-silver leading-relaxed">
                  Hero, testimonials, footer. The "institutional voice" surface. Maximum 40% of total page area.
                </p>
              </div>
              <div className="font-mono text-[9px] text-slate tracking-wider mt-4">
                #0B0B0B
              </div>
            </div>
            <div className="border border-ink bg-paper p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-2">
                  SURFACE: PAPER
                </div>
                <p className="text-[12px] text-graphite leading-relaxed">
                  Primary content sections, CTAs, forms. The "working" surface. Majority of page area.
                </p>
              </div>
              <div className="font-mono text-[9px] text-silver tracking-wider mt-4">
                #F7F5F0
              </div>
            </div>
            <div className="border border-ink bg-parchment p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="font-mono text-[10px] text-slate tracking-[0.2em] mb-2">
                  SURFACE: PARCHMENT
                </div>
                <p className="text-[12px] text-graphite leading-relaxed">
                  Process sections, secondary information. The "contextual" surface. Used for visual pacing between Paper sections.
                </p>
              </div>
              <div className="font-mono text-[9px] text-silver tracking-wider mt-4">
                #ECEAE4
              </div>
            </div>
          </div>
          <div className="border border-ink bg-white p-6">
            <div className="font-mono text-[10px] text-slate tracking-wider mb-3">
              SECTION RHYTHM PATTERN
            </div>
            <div className="flex items-center gap-1">
              {[
                { label: "NAV", bg: "bg-ink", text: "text-paper" },
                { label: "HERO", bg: "bg-ink", text: "text-paper" },
                { label: "VALUE", bg: "bg-paper", text: "text-ink" },
                { label: "PROCESS", bg: "bg-parchment", text: "text-ink" },
                { label: "PROOF", bg: "bg-ink", text: "text-paper" },
                { label: "CTA", bg: "bg-paper", text: "text-ink" },
                { label: "FOOTER", bg: "bg-ink", text: "text-paper" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${s.bg} ${s.text} flex-1 py-3 flex items-center justify-center border border-ink`}
                >
                  <span className="font-mono text-[8px] tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="font-mono text-[9px] text-silver tracking-wider mt-2">
              RECOMMENDED SURFACE ALTERNATION PATTERN
            </div>
          </div>
        </div>
      </SubSection>

      {/* Responsive Behavior */}
      <SubSection label="Responsive Behavior">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          Unlike the product application, the marketing site must be fully responsive down to mobile viewports. It is the public front door and may be accessed from any device.
        </p>
        <div className="border border-ink divide-y divide-ink">
          {[
            {
              breakpoint: "≥ 1280px",
              label: "DESKTOP",
              notes: "Full layout. Multi-column sections. Side-by-side testimonials. Full metrics row. Navigation visible.",
            },
            {
              breakpoint: "1024–1279px",
              label: "COMPACT DESKTOP",
              notes: "Slight padding reduction. Metrics may wrap to 2×2 grid. Operator cards remain 3-column.",
            },
            {
              breakpoint: "768–1023px",
              label: "TABLET",
              notes: "Single-column layout. Operator cards stack. Metrics wrap to 2×2. Hamburger navigation. Hero headline scales down.",
            },
            {
              breakpoint: "< 768px",
              label: "MOBILE",
              notes: "Full single-column. Metrics stack vertically. CTA buttons full-width. Footer collapses to stacked layout. Touch targets ≥ 48px.",
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
                {bp.notes}
              </p>
            </div>
          ))}
        </div>
      </SubSection>

      {/* Marketing Anti-Patterns */}
      <SubSection label="Marketing Site Anti-Patterns">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The following patterns are common in legal tech and SaaS marketing. They are explicitly prohibited on the LIC marketing site. Every prohibition has a reason rooted in the audience and brand positioning.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              pattern: "Animated hero with typed text",
              reason: "Implies the product is novel or surprising. LIC is established and operational. Static authority outperforms animated novelty.",
            },
            {
              pattern: "Feature comparison table vs. competitors",
              reason: "Positions LIC as one option among many. We do not compete on feature checklists. We are not a tool—we are a workforce.",
            },
            {
              pattern: "Self-serve pricing page",
              reason: "LIC engagements are scoped to the client. Published pricing invites unqualified leads and signals commodity positioning.",
            },
            {
              pattern: "Free trial or sandbox",
              reason: "LIC agents operate on real matters with real data. A \"sandbox\" misrepresents how the workforce functions and cheapens the service.",
            },
            {
              pattern: "Blog / content marketing hub",
              reason: "Content marketing signals thought leadership aspiration. LIC does not need to establish expertise—it demonstrates it in capabilities briefings.",
            },
            {
              pattern: "Video testimonials",
              reason: "Video production implies sales investment. Written testimonials with full attribution are more credible in professional services contexts.",
            },
            {
              pattern: "Chatbot / live chat widget",
              reason: "A floating chat bubble contradicts the institutional aesthetic. Contact is through the form. Response is within one business day.",
            },
            {
              pattern: "Social media feed integration",
              reason: "LIC does not maintain public social media. The brand communicates through direct client engagement, not broadcast channels.",
            },
            {
              pattern: "\"As seen in\" press logos",
              reason: "Press coverage is secondary social proof. Client testimonials from named partners carry more weight than media logos.",
            },
            {
              pattern: "Exit-intent popups",
              reason: "Desperate retention tactics contradict institutional authority. If the visitor leaves, they leave. The site's content either worked or it didn't.",
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

      {/* Page Weight & Performance */}
      <SubSection label="Performance & Technical Standards">
        <p className="text-[13px] text-slate mb-6 max-w-lg leading-relaxed">
          The marketing site must load fast and feel substantial. Speed is a brand signal—it communicates operational efficiency. These are non-negotiable performance requirements.
        </p>
        <div className="border border-ink bg-ink text-paper p-8">
          <div className="font-mono text-[10px] tracking-[0.3em] text-silver mb-6">
            PERFORMANCE REQUIREMENTS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { metric: "First Contentful Paint", target: "< 1.2s", note: "Above fold renders immediately" },
              { metric: "Largest Contentful Paint", target: "< 2.0s", note: "Hero fully loaded" },
              { metric: "Total Page Weight", target: "< 500KB", note: "Including fonts and images" },
              { metric: "Lighthouse Performance", target: "≥ 95", note: "Mobile and desktop" },
            ].map((p) => (
              <div key={p.metric}>
                <div className="font-mono text-[9px] text-silver tracking-wider mb-1">
                  {p.metric}
                </div>
                <div
                  className="font-mono text-paper"
                  style={{ fontSize: "1.5rem", lineHeight: 1 }}
                >
                  {p.target}
                </div>
                <div className="font-mono text-[10px] text-slate tracking-wider mt-2">
                  {p.note}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3 text-[12px] text-graphite">
          <div className="flex items-start gap-2">
            <span className="text-ink mt-0.5">—</span>
            No JavaScript frameworks that exceed 100KB gzipped. Static rendering preferred.
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ink mt-0.5">—</span>
            Fonts: IBM Plex Mono (400, 500), IBM Plex Sans (400), IBM Plex Serif (400 italic, 400). Subset to Latin only.
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ink mt-0.5">—</span>
            Images: WebP format, lazy-loaded below fold, max 3 per page, compressed to under 80KB each.
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ink mt-0.5">—</span>
            No third-party tracking scripts, analytics widgets, or cookie consent banners. Server-side analytics only.
          </div>
          <div className="flex items-start gap-2">
            <span className="text-ink mt-0.5">—</span>
            Fully accessible: WCAG 2.1 AA. Keyboard navigable. Screen reader tested. Reduced motion respected.
          </div>
        </div>
      </SubSection>

      {/* Summary Doctrine */}
      <SubSection label="Summary Doctrine">
        <div className="border border-ink bg-white p-8 md:p-12">
          <div className="space-y-6">
            {[
              "The marketing site is a capabilities presentation, not a product page.",
              "The audience is senior attorneys. They distrust hype and recognize quality by its restraint.",
              "Serif headlines, sans-serif body, monospace labels. The hierarchy projects institutional literacy.",
              "Three surfaces only: Ink, Paper, Parchment. No new colors for marketing.",
              "Photography is grayscale, architectural, and contained. Never decorative, never dominant.",
              "Social proof comes from named partners at real firms. No anonymous praise, no vanity metrics.",
              "Two conversion actions: schedule a briefing, download the overview. Nothing else.",
              "No chatbots, no popups, no countdown timers, no free trials. The site is confident enough to let people leave.",
              "Performance is a brand signal. Under 500KB. Under 2 seconds. No exceptions.",
              "Every quantitative claim includes its source and measurement period.",
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
          FIG. 10.10 — MARKETING SITE DOCTRINE, AUTHORITATIVE SUMMARY
        </div>
      </SubSection>
    </div>
  );
}
