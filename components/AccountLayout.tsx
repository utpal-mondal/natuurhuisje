"use client";

import { ReactNode } from 'react';
import AccountSidebar from '@/components/AccountSidebar';
import type { Locale } from '@/i18n/config';

interface AccountLayoutProps {
  children: ReactNode;
  lang: Locale;
  title?: string;
  subtitle?: string;
}

export default function AccountLayout({ 
  children, 
  lang, 
  title, 
  subtitle 
}: AccountLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="shrink-0">
            <AccountSidebar lang={lang} />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            {(title || subtitle) && (
              <div className="mb-8">
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
