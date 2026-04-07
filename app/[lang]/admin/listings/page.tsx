"use client";

import { Suspense } from 'react';
import { ListingList } from "@/components/host/ListingList";
import AdminPageHeader from '@/components/AdminPageHeader';

function ListingsContent() {
    return (
        <>
            <AdminPageHeader
                title="My Listings"
                subtitle="Manage your property listings"
            />
            <ListingList />
        </>
    );
}

export default function ListingPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ListingsContent />
        </Suspense>
    );
}