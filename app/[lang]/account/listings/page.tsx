"use client";

import { Suspense, use } from 'react';
import { ListingList } from "@/components/host/ListingList";
import AccountLayout from '@/components/AccountLayout';
import type { Locale } from '@/i18n/config';

function ListingsContent({ lang }: { lang: Locale }) {
    return (
        <AccountLayout 
            lang={lang}
            title="My Listings"
            subtitle="Manage your property listings"
        >
            <ListingList />
        </AccountLayout>
    );
}

export default function ListingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = use(params);
    const langParam = lang as Locale;

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ListingsContent lang={langParam} />
        </Suspense>
    );
}