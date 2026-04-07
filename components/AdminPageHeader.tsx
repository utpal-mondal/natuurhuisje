"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: {
    href: string;
    label?: string;
  };
}

export default function AdminPageHeader({
  title,
  subtitle,
  backButton,
}: AdminPageHeaderProps) {

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        {backButton && (
          <div>
            <Link
              href={backButton.href}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {backButton.label || "Back"}
            </Link>
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <div className="flex items-center gap-2 text-sm text-slate-500 sm:text-base">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <p>{subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
}
