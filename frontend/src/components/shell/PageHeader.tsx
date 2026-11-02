import Link from "next/link";
import clsx from "clsx";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  actions?: React.ReactNode;
  tabs?: Array<{ label: string; href: string; active?: boolean }>;
}

export default function PageHeader({ title, subtitle, badge, actions, tabs }: PageHeaderProps) {
  return (
    <div className="pb-4 mb-6 border-b border-[#e3ded0]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14211a] tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-900 border border-amber-500/30">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#4a5a50] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1 mt-4 pt-2 border-t border-[#e3ded0]/60 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all focus-ring",
                tab.active
                  ? "bg-[#0e2412] text-[#faf8f2] shadow-xs"
                  : "text-[#4a5a50] hover:text-[#14211a] hover:bg-black/5"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

