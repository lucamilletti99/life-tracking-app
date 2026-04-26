import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface DeepDiveEntryCardProps {
  title: string;
  description: string;
  href: string;
}

export function DeepDiveEntryCard({ title, description, href }: DeepDiveEntryCardProps) {
  return (
    <Link
      href={href}
      className="surface-card group flex items-center justify-between gap-4 rounded-xl p-4 transition-chrome hover:border-ember hover:bg-ember-soft focus-visible:border-ember"
    >
      <div>
        <p className="text-[14px] font-medium text-ink">{title}</p>
        <p className="mt-1 text-[12px] leading-5 text-ink-muted">{description}</p>
      </div>

      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-ink-subtle transition-colors group-hover:text-ink">
        <span>Open</span>
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
