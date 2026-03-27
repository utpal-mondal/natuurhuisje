"use client";

import { useState, useEffect, Suspense, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getBookingDictionary } from '@/i18n/get-booking-dictionary';
import { createBooking, testBookingsTable } from '@/lib/supabase-bookings';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function BookingConfirmContent({ lang }: { lang: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [t, setT] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    bookingId?: string;
    error?: string;
  } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Extract booking data from URL params
  const bookingData = {
    houseId: searchParams.get('houseId') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '2',
    firstName: searchParams.get('firstName') || '',
    lastName: searchParams.get('lastName') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    specialRequests: searchParams.get('specialRequests') || '',
    totalPrice: parseFloat(searchParams.get('totalPrice') || '0')
  };

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getBookingDictionary(lang);
      setT(translations);
      setLoading(false);
    };
    loadTranslations();
  }, [lang]);

  useEffect(() => {
    const submitBooking = async () => {
      if (!bookingData.houseId || !bookingData.checkIn || !bookingData.checkOut) {
        setResult({
          success: false,
          error: 'Missing required booking information'
        });
        return;
      }

      setSubmitting(true);

      try {
        // Check if user is authenticated
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          setResult({
            success: false,
            error: 'You must be logged in to make a booking'
          });
          return;
        }

        // Test database connection and bookings table
        console.log('Testing database connection...');
        const dbTest = await testBookingsTable();
        if (!dbTest.success) {
          console.error('Database test failed:', dbTest);
          
          // Provide specific error message based on the test result
          let errorMessage = dbTest.error || 'Database connection failed';
          
          if (dbTest.needsMigration) {
            errorMessage += '\n\nTo fix this issue:\n1. Go to your Supabase dashboard\n2. Navigate to SQL Editor\n3. Run the migration from DATABASE-MIGRATION.md\n4. Try booking again';
          }
          
          setResult({
            success: false,
            error: errorMessage
          });
          return;
        }

        console.log('Database test passed, creating booking...');
        
        // Create the booking
        const bookingResult = await createBooking({
          ...bookingData,
          houseId: parseInt(bookingData.houseId)
        });

        if (bookingResult.success) {
          setResult({
            success: true,
            bookingId: (bookingResult.data as any)?.id
          });
        } else {
          setResult({
            success: false,
            error: bookingResult.error
          });
        }
      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create booking'
        });
      } finally {
        setSubmitting(false);
      }
    };

    // Auto-submit booking when component loads (only once)
    if (!loading && !result && !hasSubmitted) {
      setHasSubmitted(true);
      submitBooking();
    }
  }, [loading, result, hasSubmitted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Creating your booking...</p>
          <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {result.success ? (
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {result.success 
                ? t?.confirmation?.bookingConfirmed || 'Booking Confirmed!'
                : t?.confirmation?.bookingFailed || 'Booking Failed'
              }
            </h1>
            <p className="text-gray-600">
              {result.success 
                ? t?.confirmation?.bookingSuccessMessage || 'Your booking has been successfully created and is now pending confirmation.'
                : result.error || 'An error occurred while processing your booking.'
              }
            </p>
          </div>

          {/* Booking Details */}
          {result.success && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t?.confirmation?.bookingDetails || 'Booking Details'}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">#{result.bookingId?.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">{new Date(bookingData.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">{new Date(bookingData.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-medium">{bookingData.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-medium">€{bookingData.totalPrice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {result.success ? (
              <>
                <button
                  onClick={() => router.push(`/${lang}/account/bookings`)}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  {t?.confirmation?.viewBookings || 'View My Bookings'}
                </button>
                <button
                  onClick={() => router.push(`/${lang}/search`)}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t?.confirmation?.continueSearching || 'Continue Searching'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.back()}
                  className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  {t?.confirmation?.tryAgain || 'Try Again'}
                </button>
                <button
                  onClick={() => router.push(`/${lang}/search`)}
                  className="flex-1 bg-gray-200 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  {t?.confirmation?.continueSearching || 'Continue Searching'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmPage({ params }: { params: Promise<{ lang: string }> }) {
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
      <BookingConfirmContent lang={langParam} />
    </Suspense>
  );
}
