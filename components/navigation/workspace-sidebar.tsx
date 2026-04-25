"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  LogOut,
  Megaphone,
  Wallet,
  Bell,
} from "lucide-react";

export interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface WorkspaceSidebarProps {
  sectionLabel: string;
  identityName: string;
  identitySubtext: string;
  identityMark: string;
  navItems: WorkspaceNavItem[];
  utilityHref: string;
  utilityLabel: string;
  utilityIcon: LucideIcon;
  onLogout: () => void;
  accent: "creator" | "company";
  footerEyebrow?: string;
  footerValue?: string;
  footerCaption?: string;
  footerActionLabel?: string;
  footerActionHref?: string;
  // New footer props
  footerAnnouncements?: string;
  footerBalance?: string;
  footerBrandName?: string;
}

function isItemActive(pathname: string, item: WorkspaceNavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

function MobileBottomNav({ navItems }: { navItems: WorkspaceNavItem[] }) {
  const pathname = usePathname();
  const columns = Math.max(3, Math.min(navItems.length, 4));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#E4E4EA] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur lg:hidden">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] px-2 text-center transition-colors",
                active
                  ? "bg-[#EEF4FF] text-[#0047FF]"
                  : "text-[#7A7E8A] hover:bg-[#F7F8FB] hover:text-[#0F0F14]",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function WorkspaceSidebar({
  sectionLabel,
  identityName,
  identitySubtext,
  identityMark,
  navItems,
  utilityHref,
  utilityLabel,
  utilityIcon: UtilityIcon,
  onLogout,
  accent,
  footerEyebrow,
  footerValue,
  footerCaption,
  footerActionLabel,
  footerActionHref,
  footerAnnouncements,
  footerBalance,
  footerBrandName,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const useNewFooter = footerAnnouncements || footerBalance || footerBrandName;

  return (
    <>
      <aside className="hidden lg:flex lg:w-[310px] lg:shrink-0">
        <div className="sticky top-0 flex h-screen w-full flex-col border-r border-[#E4E4EA] bg-[linear-gradient(180deg,#FFFFFF_0%,#FAFBFE_100%)] px-5 py-5">
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#E7ECF6] bg-white p-4 shadow-[0_10px_24px_rgba(15,15,20,0.05)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9898AA]">
                {sectionLabel}
              </p>
              <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-[#0F0F14] font-display">
                Navigation
              </p>
            </div>

            <div className="space-y-2 rounded-[20px] border border-[#E7ECF6] bg-white p-2 shadow-[0_10px_24px_rgba(15,15,20,0.05)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(pathname, item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                      active
                        ? accent === "creator"
                          ? "bg-[linear-gradient(90deg,#EEF4FF_0%,#DCE8FF_100%)] text-[#0047FF] shadow-[0_12px_22px_rgba(0,71,255,0.12)]"
                          : "bg-[linear-gradient(90deg,#0047FF_0%,#2E84FF_100%)] text-white shadow-[0_14px_24px_rgba(0,71,255,0.20)]"
                        : "text-[#5F6472] hover:bg-[#F4F6FA] hover:text-[#0F0F14]",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[12px] transition-colors",
                        active
                          ? accent === "creator"
                            ? "bg-white text-[#0047FF]"
                            : "bg-white/16 text-white"
                          : "bg-[#F9FAFD] text-[#5F6472] group-hover:bg-white group-hover:text-[#0047FF]",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <div className="space-y-2 rounded-[20px] border border-[#E7ECF6] bg-white p-2 shadow-[0_10px_24px_rgba(15,15,20,0.05)]">
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9898AA]">
                Actions
              </p>
              <Link
                href={utilityHref}
                className="flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm font-semibold text-[#5F6472] transition-colors hover:bg-[#F4F6FA] hover:text-[#0F0F14]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F9FAFD] text-[#5F6472]">
                  <UtilityIcon className="h-[18px] w-[18px]" />
                </div>
                <span>{utilityLabel}</span>
              </Link>

              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-[14px] px-3.5 py-3 text-left text-sm font-semibold text-[#5F6472] transition-colors hover:bg-[#FDF1F2] hover:text-[#D14343]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F9FAFD] text-current">
                  <LogOut className="h-[18px] w-[18px]" />
                </div>
                <span>Deconnexion</span>
              </button>
            </div>

            <div className="rounded-[24px] border border-[#E4E4EA] bg-white p-4 shadow-[0_10px_24px_rgba(15,15,20,0.05)] space-y-3">
              {/* Annonces */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EEF4FF]">
                  <Megaphone className="h-4 w-4 text-[#0047FF]" />
                </div>
                <span className="text-sm font-semibold text-[#0047FF]">
                  Annonces
                </span>
              </div>

              {/* Solde */}
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F0F0F0]">
                  <Wallet className="h-4 w-4 text-[#5F6472]" />
                </div>
                <span className="text-sm font-semibold text-[#4A4A5A]">
                  Solde : {footerBalance}
                </span>
              </div>

              {/* Nom de marque + notification */}
              <div className="flex items-center justify-between pt-1 border-t border-[#E4E4EA]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#6366F1]/10">
                    <span className="text-xs font-bold text-[#6366F1]">
                      {(footerBrandName?.[0] || "?").toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#0F0F14]">
                    {footerBrandName}
                  </span>
                </div>
                <button className="h-7 w-7 rounded-[8px] hover:bg-[#F4F4F6] flex items-center justify-center transition-colors">
                  <Bell className="h-4 w-4 text-[#4A4A5A]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-20 border-b border-[#E4E4EA] bg-white/92 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold",
                accent === "creator"
                  ? "bg-[linear-gradient(135deg,#EEF4FF_0%,#DCE8FF_100%)] text-[#0047FF]"
                  : "bg-[linear-gradient(135deg,#0047FF_0%,#2E84FF_100%)] text-white",
              )}
            >
              {identityMark}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#0F0F14] font-display">
                {identityName}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9898AA]">
                {identitySubtext}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={utilityHref}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4EA] bg-white text-[#5F6472]"
              aria-label={utilityLabel}
            >
              <UtilityIcon className="h-[18px] w-[18px]" />
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E4EA] bg-white text-[#5F6472]"
              aria-label="Deconnexion"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <MobileBottomNav navItems={navItems} />
    </>
  );
}
