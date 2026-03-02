"use client";

import { getStayDictionary } from '@/i18n/get-stay-dictionary';
import type { Locale } from '@/i18n/config';
import { Star, MapPin, Wifi, Car, Utensils, Waves, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LightpickDatePicker } from '@/components/LightpickDatePicker';

export default function StayDetailPage() {
  const params = useParams();
  const lang = params.lang as Locale;
  const slug = params.slug as string;
  const [t, setT] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getStayDictionary(lang);
      setT(translations);
    };
    loadTranslations();
  }, [lang]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/data/listings-${lang}.json`);
        const data = await response.json();
        const foundListing = data.featuredListings.find((l: any) => l.slug === slug);
        
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
  }, [lang, slug]);

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
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden h-[500px]">
          <div className="col-span-2 row-span-2 relative">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          {listing.images.slice(1, 5).map((image: string, index: number) => (
            <div key={index} className="relative">
              <Image
                src={image}
                alt={`${listing.title} ${index + 2}`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Basic Info */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span className="font-semibold">{listing.rating}</span>
                      <span>({listing.reviews_count} {t.reviews.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-gray-700 border-b border-gray-200 pb-6">
                <span>{listing.guests} {t.details.guests}</span>
                <span>·</span>
                <span>{listing.bedrooms} {t.details.bedrooms}</span>
                <span>·</span>
                <span>{listing.beds} {t.details.beds}</span>
                <span>·</span>
                <span>{listing.bathrooms} {t.details.bathrooms}</span>
              </div>
            </div>

            {/* Host Info */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg">
                  {listing.host.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {t.details.hostedBy} {listing.host.name}
                  </p>
                  {listing.host.is_superhost && (
                    <p className="text-sm text-gray-600">{t.details.superhost}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.sections.overview}</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-8 pb-8 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t.amenities.title}</h2>
              <div className="grid grid-cols-2 gap-4">
                {listing.amenities.map((amenity: string) => {
                  const Icon = amenityIcons[amenity];
                  if (!Icon) return null;
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      {typeof Icon === 'string' ? (
                        <span className="text-2xl">{Icon}</span>
                      ) : (
                        <Icon className="h-6 w-6 text-gray-700" />
                      )}
                      <span className="text-gray-700">{t.amenities[amenity as keyof typeof t.amenities]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-6 w-6 fill-current text-yellow-400" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {listing.rating} · {listing.reviews_count} {t.reviews.reviews}
                </h2>
              </div>
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-600">{t.reviews.noReviews}</p>
                <p className="text-sm text-gray-500 mt-1">{t.reviews.beTheFirst}</p>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">€{listing.price_per_night}</span>
                  <span className="text-gray-600">/ {t.booking.pricePerNight}</span>
                </div>
              </div>

              <div className="mb-4">
                <LightpickDatePicker
                  checkIn={checkIn}
                  checkOut={checkOut}
                  onCheckInChange={setCheckIn}
                  onCheckOutChange={setCheckOut}
                  lang={lang}
                />
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  {t.booking.guests}
                </label>
                <div className="relative">
                  <select 
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-50 transition-colors appearance-none bg-white cursor-pointer"
                  >
                    <option value="1">1 {t.details.guests}</option>
                    <option value="2">2 {t.details.guests}</option>
                    <option value="3">3 {t.details.guests}</option>
                    <option value="4">4 {t.details.guests}</option>
                    <option value="5">5 {t.details.guests}</option>
                    <option value="6">6 {t.details.guests}</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <Link
                href={`/${lang}/booking/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors mb-4"
              >
                {t.details.reserve}
              </Link>

              <p className="text-center text-sm text-gray-600">
                {t.booking.youWontBeChargedYet}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">€{listing.price_per_night} x 5 {t.details.nights}</span>
                  <span className="text-gray-900">€{listing.price_per_night * 5}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.booking.cleaningFee}</span>
                  <span className="text-gray-900">€25</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t.booking.serviceFee}</span>
                  <span className="text-gray-900">€35</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-3 border-t border-gray-200">
                  <span>{t.booking.totalPrice}</span>
                  <span>€{listing.price_per_night * 5 + 25 + 35}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
