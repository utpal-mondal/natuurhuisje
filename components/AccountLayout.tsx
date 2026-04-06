"use client";

import { ReactNode } from 'react';
import AccountSidebar from '@/components/AccountSidebar';
import type { Locale } from '@/i18n/config';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AccountLayoutProps {
  children: ReactNode;
  lang: Locale;
  title?: string;
  subtitle?: string;
  backButton?: {
    href: string;
    label?: string;
  };
}

export default function AccountLayout({ 
  children, 
  lang, 
  title, 
  subtitle,
  backButton 
}: AccountLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className=" mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="shrink-0">
            <AccountSidebar lang={lang} />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            {(title || subtitle || backButton) && (
              <div className="mb-8">
                {/* Back Button */}
                {backButton && (
                  <div className="mb-4">
                    <Link
                      href={backButton.href}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {backButton.label || "Back"}
                    </Link>
                  </div>
                )}
                
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
