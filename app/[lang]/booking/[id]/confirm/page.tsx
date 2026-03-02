"use client";

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getBookingDictionary } from '@/i18n/get-booking-dictionary';
import { Star, MapPin, Calendar, Users, Mail, Phone, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

function ConfirmationContent({ lang, id }: { lang: Locale; id: string }) {
  const searchParams = useSearchParams();
  const [t, setT] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingData = {
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '2',
    firstName: searchParams.get('firstName') || '',
    lastName: searchParams.get('lastName') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
  };

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getBookingDictionary(lang);
      setT(translations);
    };
    loadTranslations();
  }, [lang]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/data/listings-${lang}.json`);
        const data = await response.json();
        const foundListing = data.featuredListings.find((l: any) => l.id === id);
        
        if (foundListing) {
          foundListing.reviews_count = 24;
          setListing(foundListing);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [lang, id]);

  if (loading || !t || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const calculateNights = () => {
    if (!bookingData.checkIn || !bookingData.checkOut) return 5;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const cleaningFee = 25;
  const serviceFee = 35;
  const totalPrice = listing.price_per_night * nights + cleaningFee + serviceFee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-16">
      <div className="container-custom max-w-4xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t.success.title}</h1>
          <p className="text-lg text-gray-600 mb-2">{t.success.message}</p>
          <p className="text-sm text-gray-500">Booking reference: #{id.toUpperCase()}-{Date.now().toString().slice(-6)}</p>
        </div>

        {/* Booking Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Property Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-24 h-24 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{listing.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
                {listing.avg_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{listing.avg_rating}</span>
                    <span className="text-sm text-gray-600">({listing.reviews_count || 0} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">{t.bookingDetails.title}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t.bookingDetails.checkIn}</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.checkIn || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t.bookingDetails.checkOut}</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.checkOut || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t.bookingDetails.guests}</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.guests} {t.bookingDetails.guests}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">{t.guestInfo.title}</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.firstName} {bookingData.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t.guestInfo.email}</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">{t.guestInfo.phone}</p>
                    <p className="text-sm font-medium text-gray-900">{bookingData.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">{t.pricing.total}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">€{listing.price_per_night} x {nights} {t.pricing.nights}</span>
                <span className="text-gray-900">€{listing.price_per_night * nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.pricing.cleaningFee}</span>
                <span className="text-gray-900">€{cleaningFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t.pricing.serviceFee}</span>
                <span className="text-gray-900">€{serviceFee}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-3 border-t border-gray-300">
                <span>{t.pricing.total}</span>
                <span className="text-purple-600">€{totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${lang}`}
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
          >
            {t.success.backHome}
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-block bg-white text-purple-600 border-2 border-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-center"
          >
            Print Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: langParam, id } = use(params);
  const lang = langParam as Locale;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    }>
      <ConfirmationContent lang={lang} id={id} />
    </Suspense>
  );
}
