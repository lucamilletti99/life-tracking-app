"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
  onQuickAdd?: () => void;
}

export function TopBar({ title, onQuickAdd }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
      <h1 className="text-base font-semibold text-neutral-900">{title}</h1>
      {onQuickAdd && (
        <Button size="sm" onClick={onQuickAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New
        </Button>
      )}
    </header>
  );
}
