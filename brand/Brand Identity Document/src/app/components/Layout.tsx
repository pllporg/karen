import { NavLink, Outlet } from "react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const sections = [
  { path: "/", label: "Cover", code: "00" },
  { path: "/foundation", label: "Brand Foundation", code: "01" },
  { path: "/logo", label: "Logo & Marks", code: "02" },
  { path: "/color", label: "Color System", code: "03" },
  { path: "/typography", label: "Typography", code: "04" },
  { path: "/naming", label: "Naming & Architecture", code: "05" },
  { path: "/messaging", label: "Messaging & Voice", code: "06" },
  { path: "/grid", label: "Grid & Components", code: "07" },
  { path: "/interaction", label: "Interaction Design", code: "08" },
  { path: "/ai", label: "AI Interaction", code: "09" },
  { path: "/marketing", label: "Marketing Site", code: "10" },
  { path: "/uikit", label: "Application UI Kit", code: "11" },
];

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] min-w-[280px] bg-ink text-paper border-r border-graphite h-full">
        <SidebarContent onNavigate={() => {}} />
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-ink text-paper p-2 border border-graphite"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-ink/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-ink text-paper z-50 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-paper/60 hover:text-paper"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <div className="px-6 py-8 border-b border-graphite">
        <div className="font-mono tracking-[0.3em] text-[11px] text-silver mb-1">
          STANDARDS MANUAL
        </div>
        <div className="font-mono tracking-[0.15em] text-[13px]">
          LIC / IDENTITY
        </div>
        <div className="font-mono text-[10px] text-slate mt-2 tracking-wider">
          REV. 2026 — CONFIDENTIAL
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {sections.map((s) => (
          <NavLink
            key={s.path}
            to={s.path}
            end={s.path === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-baseline gap-3 px-6 py-2.5 font-mono text-[12px] tracking-wide transition-colors ${
                isActive
                  ? "bg-paper/10 text-paper border-l-2 border-paper"
                  : "text-silver hover:text-paper hover:bg-paper/5 border-l-2 border-transparent"
              }`
            }
          >
            <span className="text-slate text-[10px] w-5 shrink-0">
              §{s.code}
            </span>
            <span className="uppercase">{s.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-6 border-t border-graphite">
        <div className="font-mono text-[9px] text-slate tracking-widest leading-relaxed">
          LEGAL INTELLIGENCE CORPORATION
          <br />
          INTERNAL DOCUMENT
          <br />
          NOT FOR DISTRIBUTION
        </div>
      </div>
    </>
  );
}