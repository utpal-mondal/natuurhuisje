"use client";

import { Suspense, use } from 'react';
import { ListingList } from "@/components/host/ListingList";
import type { Locale } from '@/i18n/config';

function ListingsContent({ lang }: { lang: Locale }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                <p className="mt-2 text-gray-600">Manage your property listings</p>
            </div>
            <ListingList />
        </div>
    );
}

export default function ListingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = use(params);
    const langParam = lang as Locale;

    return (
        <Suspense fallback={
            <div className="space-y-6 animate-pulse">
                <div>
                    <div className="h-9 w-40 bg-gray-200 rounded" />
                    <div className="mt-2 h-5 w-72 bg-gray-200 rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="h-48 bg-gray-200" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                                <div className="flex items-center justify-between pt-2">
                                    <div className="h-6 w-20 bg-gray-200 rounded" />
                                    <div className="h-4 w-16 bg-gray-200 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        }>
            <ListingsContent lang={langParam} />
        </Suspense>
    );
}