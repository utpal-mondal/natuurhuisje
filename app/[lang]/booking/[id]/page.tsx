"use client";

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getBookingDictionary } from '@/i18n/get-booking-dictionary';
import { Wifi, Car, Utensils, Home, Waves, Wind, Tv, Briefcase, Calendar, Users, ChevronDown, Star, MapPin } from 'lucide-react';
import { LightpickDatePicker } from '@/components/LightpickDatePicker';
import { createClient } from '@/utils/supabase/client';

function BookingContent({ lang, id }: { lang: Locale; id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [t, setT] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '2',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  // State for pricing calculations
  const [nights, setNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if booking details are complete
  useEffect(() => {
    const bookingDetailsComplete = formData.checkIn && formData.checkOut && formData.guests;
    const guestInfoComplete = formData.firstName && formData.lastName && formData.email && formData.phone;
    
    if (guestInfoComplete) {
      setCurrentStep(2);
    } else if (bookingDetailsComplete) {
      setCurrentStep(1);
    }
  }, [formData]);

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
        // Fetch listing from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from('houses')
          .select(`
            *,
            house_images (
              image_url,
              sort_order
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching listing from Supabase:', error);
          return;
        }
        
        if (data) {
          // Transform data to match expected format
          const rawData = data as any;
          // Extract images from house_images relationship
          const images = rawData.house_images 
            ? rawData.house_images
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((img: any) => img.image_url)
            : [];
          
          const transformedListing = {
            id: rawData.id,
            title: rawData.accommodation_name || rawData.title || 'Property',
            description: rawData.description || '',
            property_type: rawData.type || rawData.property_type || 'house',
            location: rawData.location || rawData.place || '',
            address: `${rawData.street || ''} ${rawData.house_number || ''}, ${rawData.postal_code || ''} ${rawData.place || ''}`.trim(),
            price_per_night: rawData.price_per_night || 0,
            min_nights: rawData.min_nights || 1,
            max_guests: rawData.max_person || rawData.max_guests || 1,
            bedrooms: rawData.bedrooms || 0,
            beds: rawData.beds || 0,
            bathrooms: rawData.bathrooms || 0,
            amenities: rawData.amenities || [],
            images: images.length > 0 ? images : ['/images/default-house.jpg'],
            is_published: rawData.is_published || true,
            created_at: rawData.created_at || '',
            slug: rawData.slug || rawData.id,
            avg_rating: rawData.avg_rating || 0,
            reviews_count: 24,
            host: {
              name: 'Host',
              image: '/images/default-host.jpg',
              verified: true,
              is_superhost: false
            }
          };
          
          setListing(transformedListing);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [lang, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      console.log('Booking submitted:', formData);
      
      // Build URL with query parameters
      const queryParams = new URLSearchParams({
        houseId: listing.id.toString(),
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        guests: formData.guests,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        specialRequests: formData.specialRequests,
        totalPrice: totalPrice.toString()
      });
      
      // Navigate to confirmation page
      router.push(`/${lang}/booking/confirm?${queryParams.toString()}`);
    } catch (error) {
      console.error('Error submitting booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const cleaningFee = 25;
  const serviceFee = 35;

  const amenityIcons: Record<string, any> = {
    wifi: Wifi,
    parking: Car,
    kitchen: Utensils,
    fireplace: '🔥',
    bbq: '🍖',
    heating: '🔥',
    airConditioning: Wind,
    hotTub: Waves,
    pool: Waves,
    petFriendly: '🐾',
    workspace: Briefcase,
    tv: Tv,
  };

  const isLoading = loading || !t || !listing;

  // Update form data when URL parameters change
  useEffect(() => {
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');
    const guestsParam = searchParams.get('guests');
    
    if (checkInParam || checkOutParam || guestsParam) {
      setFormData(prev => ({
        ...prev,
        checkIn: checkInParam || prev.checkIn,
        checkOut: checkOutParam || prev.checkOut,
        guests: guestsParam || prev.guests
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    const calculatedNights = calculateNights(formData.checkIn, formData.checkOut);
    setNights(calculatedNights);
    
    const calculatedSubtotal = listing?.price_per_night * calculatedNights || 0;
    setSubtotal(calculatedSubtotal);
    
    const calculatedTotal = calculatedSubtotal + cleaningFee + serviceFee;
    setTotalPrice(calculatedTotal);
  }, [formData.checkIn, formData.checkOut, listing?.price_per_night]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom max-w-7xl pt-24 pb-12">
        {/* Progress Indicator - Mobile Only */}
        <div className="md:hidden mb-6">
          <div className="flex items-center gap-1">
            <span className={`text-sm ${currentStep >= 1 ? 'text-purple-900 font-medium' : 'text-gray-400 font-normal'}`}>
              {t.steps.step1}
            </span>
            <span className="text-gray-400 text-sm mx-1">›</span>
            <span className={`text-sm ${currentStep >= 2 ? 'text-purple-900 font-medium' : 'text-gray-400 font-normal'}`}>
              {t.steps.step2}
            </span>
          </div>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-900 mb-2">{t.title}</h1>
        </div>

        {/* Property Card - Mobile Only (before form) */}
        <div className="lg:hidden mb-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Property Image */}
            <div className="relative h-48">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            {/* Property Details */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{listing.title}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{listing.location}</span>
              </div>
              
              {listing.avg_rating && (
                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{listing.avg_rating}</span>
                  <span className="text-sm text-gray-600">({listing.reviews_count || 0} reviews)</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-600">{t.pricePerNight}</div>
                  <div className="text-xl font-bold text-gray-900">€{listing?.price_per_night || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Booking Details Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.bookingDetails.title}</h2>
                
                <div className="mb-4">
                  <LightpickDatePicker
                    checkIn={formData.checkIn}
                    checkOut={formData.checkOut}
                    onCheckInChange={(date) => setFormData(prev => ({ ...prev, checkIn: date }))}
                    onCheckOutChange={(date) => setFormData(prev => ({ ...prev, checkOut: date }))}
                    positionClass={`left-0 right-0`}
                    lang={lang}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.bookingDetails.guests}
                  </label>
                  <div className="relative">
                    <select
                      name="guests"
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors appearance-none bg-white cursor-pointer"
                      required
                    >
                      <option value="1">1 {t.bookingDetails.guest}</option>
                      <option value="2">2 {t.bookingDetails.guests}</option>
                      <option value="3">3 {t.bookingDetails.guests}</option>
                      <option value="4">4 {t.bookingDetails.guests}</option>
                      <option value="5">5 {t.bookingDetails.guests}</option>
                      <option value="6">6 {t.bookingDetails.guests}</option>
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Guest Information Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">{t.guestInfo.title}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.guestInfo.firstName}
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.guestInfo.lastName}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.guestInfo.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.guestInfo.phone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.guestInfo.specialRequests}
                  </label>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder={t.guestInfo.specialRequestsPlaceholder}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  t.confirmBooking
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Property Card (Desktop Only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
              {/* Property Image */}
              <div className="relative h-48">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{listing.title}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{listing.location}</span>
                </div>
                
                {listing.avg_rating && (
                  <div className="flex items-center gap-1 mb-4">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{listing.avg_rating}</span>
                    <span className="text-sm text-gray-600">({listing.reviews_count || 0} reviews)</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">€{listing?.price_per_night || 0} x {nights} {t.pricing.nights}</span>
                    <span className="text-gray-900">€{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.pricing.cleaningFee}</span>
                    <span className="text-gray-900">€{cleaningFee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t.pricing.serviceFee}</span>
                    <span className="text-gray-900">€{serviceFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-3 border-t border-gray-200">
                    <span>{t.pricing.total}</span>
                    <span>€{totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: langParam, id } = use(params);
  const lang = langParam as Locale;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking...</p>
        </div>
      </div>
    }>
      <BookingContent lang={lang} id={id} />
    </Suspense>
  );
}
