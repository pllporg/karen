import { LICLogoMark } from "../LICLogo";

export function CoverPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-ink text-paper p-8 md:p-16">
      {/* Top bar */}
      <div className="flex justify-between items-start">
        <div className="font-mono text-[10px] tracking-[0.4em] text-silver">
          STANDARDS MANUAL
        </div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-slate">
          REV. 2026.02
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col justify-center items-start max-w-3xl py-20">
        <LICLogoMark size="large" inverted />

        <div className="mt-16 h-px bg-paper/20 w-full max-w-md" />

        <h2
          className="font-mono text-paper/90 mt-8 tracking-wide"
          style={{ fontSize: "1.125rem" }}
        >
          Brand Identity &<br />
          Visual Standards
        </h2>

        <p className="font-mono text-[13px] text-silver mt-6 max-w-md leading-relaxed">
          A conservative corporate identity system for an agentic litigation
          workforce. Minimal, matte, procedural, conservative.
        </p>

        <p className="font-serif text-[14px] text-slate mt-8 max-w-md leading-relaxed italic">
          "Mid-century systems design, not AI startup."
        </p>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="font-mono text-[9px] tracking-[0.3em] text-slate leading-relaxed">
          LEGAL INTELLIGENCE CORPORATION
          <br />
          CONFIDENTIAL — INTERNAL USE ONLY
        </div>
        <div className="font-mono text-[9px] tracking-[0.3em] text-slate text-right">
          DOCUMENT CLASS: BRAND / IDENTITY
          <br />
          PAGES: §00 – §11
        </div>
      </div>
    </div>
  );
}