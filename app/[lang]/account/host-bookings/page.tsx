"use client";

import { useState, useEffect, Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-client-dictionary';
import { fallbackTranslations } from '@/i18n/fallback-translations';
import AccountLayout from '@/components/AccountLayout';
import { getHostBookings, updateBookingStatus } from '@/lib/supabase-bookings';
import { createClient } from '@/utils/supabase/client';
import { Calendar, MapPin, Users, Euro, Clock, CheckCircle, XCircle, AlertCircle, Eye, Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface BookingWithHouse {
  id: string;
  house_id: number;
  user_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
  house: {
    id: string;
    title: string;
    location: string;
    images: string[];
  };
}

function HostBookingsContent({ lang }: { lang: Locale }) {
  const router = useRouter();
  const [t, setT] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingWithHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        // Check if user is authenticated
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push(`/${lang}/login`);
          return;
        }

        // Load translations
        const translations = await getDictionary(lang);
        // Merge with fallback translations to ensure all keys exist
        const mergedTranslations = { ...fallbackTranslations, ...translations };
        setT(mergedTranslations);

        // Fetch host bookings with pagination
        const bookingsResult = await getHostBookings(user.id, currentPage, itemsPerPage);
        
        if (bookingsResult.success) {
          setBookings(bookingsResult.data || []);
          setTotalBookings(bookingsResult.total || 0);
        } else {
          setError(bookingsResult.error || 'Failed to load bookings');
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [lang, router, currentPage, itemsPerPage]);

  const handleStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    setUpdating(bookingId);
    
    try {
      const result = await updateBookingStatus(bookingId, newStatus);
      
      if (result.success) {
        // Update local state
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus }
            : booking
        ));
      } else {
        setError(result.error || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError('Failed to update booking status');
    } finally {
      setUpdating(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const totalPages = Math.ceil(totalBookings / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalBookings);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: t?.bookings?.status?.pending || 'Pending'
      },
      confirmed: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: t?.bookings?.status?.confirmed || 'Confirmed'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: t?.bookings?.status?.cancelled || 'Cancelled'
      },
      completed: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
        label: t?.bookings?.status?.completed || 'Completed'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  if (loading) {
    return (
      <AccountLayout lang={lang}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout 
      lang={lang}
      title={t?.bookings?.hostTitle || 'Manage Bookings'}
      subtitle={t?.bookings?.hostSubtitle || 'View and manage bookings for your properties'}
    >

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t?.bookings?.noBookings || 'No bookings yet'}
            </h3>
            <p className="text-gray-500">
              {t?.bookings?.noBookingsHostMessage || 'When guests book your properties, they will appear here'}
            </p>
          </div>
        ) : (
          <>
            {/* Pagination info */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                {totalBookings > 0 && (
                  <>
                    Showing {startItem} to {endItem} of {totalBookings} bookings
                  </>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="space-y-6">
              {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.house.title}
                        </h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.house.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        €{booking.total_price}
                      </div>
                      <div className="text-sm text-gray-600">
                        {t?.bookings?.totalPrice || 'Total Price'}
                      </div>
                    </div>
                  </div>

                  {/* Property Image */}
                  <div className="flex gap-6">
                    <div className="shrink-0">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                        {booking.house.images && booking.house.images.length > 0 ? (
                          <Image
                            src={booking.house.images[0]}
                            alt={booking.house.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {t?.bookings?.checkIn || 'Check-in'}
                            </div>
                            <div className="text-gray-600">
                              {new Date(booking.check_in).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {t?.bookings?.checkOut || 'Check-out'}
                            </div>
                            <div className="text-gray-600">
                              {new Date(booking.check_out).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {t?.bookings?.guests || 'Guests'}
                            </div>
                            <div className="text-gray-600">{booking.guests}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {t?.bookings?.pricePerNight || 'Price per night'}
                            </div>
                            <div className="text-gray-600">
                              €{(booking.total_price / Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Guest Information */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          <div className="font-medium text-gray-900 mb-1">
                            {t?.bookings?.guestInfo || 'Guest Information'}
                          </div>
                          <div className="flex items-center gap-4">
                            <span>{booking.first_name} {booking.last_name}</span>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <a href={`mailto:${booking.email}`} className="text-purple-600 hover:text-purple-700">
                                {booking.email}
                              </a>
                            </div>
                            {booking.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${booking.phone}`} className="text-purple-600 hover:text-purple-700">
                                  {booking.phone}
                                </a>
                              </div>
                            )}
                          </div>
                          {booking.special_requests && (
                            <div className="mt-2">
                              <span className="font-medium">
                                {t?.bookings?.specialRequests || 'Special Requests'}:
                              </span>{' '}
                              {booking.special_requests}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {t?.bookings?.bookingId || 'Booking ID'}: #{booking.id.slice(0, 8)}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/${lang}/stay/${booking.house.id}`}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        {t?.bookings?.viewProperty || 'View Property'}
                      </Link>
                      
                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            disabled={updating === booking.id}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {updating === booking.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                {t?.bookings?.updating || 'Updating...'}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                {t?.bookings?.confirm || 'Confirm'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            disabled={updating === booking.id}
                            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {updating === booking.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                {t?.bookings?.updating || 'Updating...'}
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                {t?.bookings?.cancel || 'Cancel'}
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </AccountLayout>
  );
}

export default function HostBookingsPage({ params }: { params: Promise<{ lang: string }> }) {
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
      <HostBookingsContent lang={langParam} />
    </Suspense>
  );
}
