"use client";

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { getBookingDictionary } from '@/i18n/get-booking-dictionary';
import { Wifi, Car, Utensils, Home, Waves, Wind, Tv, Briefcase, Calendar, Users, ChevronDown, Star, MapPin } from 'lucide-react';

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Booking submitted:', formData);
    
    const confirmParams = new URLSearchParams({
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
    });
    
    router.push(`/${lang}/booking/${id}/confirm?${confirmParams.toString()}`);
  };

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

  const nights = 5; // Calculate from check-in/check-out dates
  const cleaningFee = 25;
  const serviceFee = 35;
  const totalPrice = listing.price_per_night * nights + cleaningFee + serviceFee;

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
                  <div className="text-xl font-bold text-gray-900">€{listing.price_per_night}</div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.bookingDetails.checkIn}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="checkIn"
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.bookingDetails.checkOut}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.bookingDetails.guests}
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="guests"
                      value={formData.guests}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                      required
                    >
                      <option value="1">1 {t.bookingDetails.guest}</option>
                      <option value="2">2 {t.bookingDetails.guests}</option>
                      <option value="3">3 {t.bookingDetails.guests}</option>
                      <option value="4">4 {t.bookingDetails.guests}</option>
                      <option value="5">5 {t.bookingDetails.guests}</option>
                      <option value="6">6 {t.bookingDetails.guests}</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
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
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                {t.confirmBooking}
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
