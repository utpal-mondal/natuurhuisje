"use client";

import { getStayDictionary } from '@/i18n/get-stay-dictionary';
import { testHousesTable } from '@/lib/test-houses-table';
import type { Locale } from '@/i18n/config';
import { Star, MapPin, Wifi, Car, Utensils, Waves, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LightpickDatePicker } from '@/components/LightpickDatePicker';
import { createClient } from '@/utils/supabase/client';

interface House {
  id: string;
  host_id: string;
  title: string;
  description: string;
  property_type: string;
  location: string;
  address: string;
  price_per_night: number;
  min_nights: number;
  max_person: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  is_published: boolean;
  created_at: string;
  slug?: string;
  avg_rating?: number;
  rating?: number;
  reviews_count?: number;
  host?: {
    name: string;
    image: string;
    verified: boolean;
    is_superhost?: boolean;
  };
}

const defaultListing: House = {
  id: '',
  host_id: '',
  title: '',
  description: '',
  property_type: '',
  location: '',
  address: '',
  price_per_night: 0,
  min_nights: 0,
  max_person: 0,
  bedrooms: 0,
  beds: 0,
  bathrooms: 0,
  amenities: [],
  images: ['/images/default-house.jpg'],
  is_published: false,
  created_at: '',
  slug: '',
  avg_rating: 0,
  rating: 0,
  reviews_count: 0,
  host: {
    name: '',
    image: '',
    verified: false,
    is_superhost: false
  }
};

export default function StayDetailPage() {
  const params = useParams();
  const lang = params.lang as Locale;
  const slug = params.slug as string;
  const [t, setT] = useState<any>(null);
  const [listing, setListing] = useState<House>(defaultListing);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  // State for pricing calculations
  const [nights, setNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

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
        // Test database connection and houses table first
        console.log('Testing houses table connection...');
        const dbTest = await testHousesTable();
        if (!dbTest.success) {
          console.error('Houses table test failed:', dbTest);
          setError(dbTest.error || 'Database connection error');
          return;
        }
        
        console.log('Houses table test passed, fetching listing...');
        
        // Fetch listing from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from('houses')
          .select(`
            *,
            house_images (
              id,
              image_url,
              sort_order,
              is_primary
            )
          `)
          .eq('id', slug)
          .single();
        
        if (error) {
          console.error('Error fetching listing from Supabase:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          
          // Check if it's a table not found error
          if (!error.message || error.message === '{}' || Object.keys(error).length === 0) {
            console.error('Empty error detected - likely houses table does not exist');
            console.error('This usually means the houses table is missing from the database');
            console.error('Run the houses table migration to fix this issue');
          }
          // Try to find by ID if slug doesn't work
          const { data: idData, error: idError } = await supabase
            .from('houses')
            .select(`
              *,
              house_images (
                id,
                image_url,
                sort_order,
                is_primary
              )
            `)
            .eq('id', slug)
            .single();
          
          if (idError) {
            console.error('Error fetching listing by ID:', idError);
            console.error('ID Error details:', {
              message: idError.message,
              code: idError.code,
              details: idError.details,
              hint: idError.hint
            });
            
            // Check if it's the same empty error pattern
            if (!idError.message || idError.message === '{}' || Object.keys(idError).length === 0) {
              console.error('Empty ID error detected - houses table definitely missing');
              console.error('Please run houses table migration immediately');
            }
            return;
          }
          
          if (idData) {
            const rawData = idData as any;
            // Extract images from house_images relationship
            console.log('Raw house_images data:', rawData.house_images);
            const images = rawData.house_images 
              ? rawData.house_images
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((img: any) => img.image_url)
              : [];
            console.log('Processed images array:', images);
            
            const houseData: House = {
              id: rawData.id,
              host_id: rawData.host_id,
              title: rawData.accommodation_name || 'Property',
              description: rawData.description || '',
              property_type: rawData.type || 'house',
              location: rawData.location || rawData.place || '',
              address: `${rawData.street || ''} ${rawData.house_number || ''}, ${rawData.postalCode || ''} ${rawData.place || ''}`.trim(),
              price_per_night: rawData.price_per_night || 0,
              min_nights: rawData.min_nights || 1,
              max_person: rawData.max_person || 1,
              bedrooms: rawData.bedrooms || 0,
              beds: rawData.beds || 0,
              bathrooms: rawData.bathrooms || 0,
              amenities: rawData.amenities || [],
              images: images.length > 0 ? images : ['/images/default-house.jpg'],
              is_published: rawData.is_published || true,
              created_at: rawData.created_at || '',
              slug: rawData.slug || rawData.id,
              avg_rating: rawData.avg_rating || 0,
              rating: rawData.avg_rating || 0,
              reviews_count: 24,
              host: {
                name: 'Host',
                image: '/images/default-host.jpg',
                verified: true,
                is_superhost: false
              }
            };
            setListing({...listing, ...houseData});
          }
        } else if (data) {
          const rawData = data as any;
          // Extract images from house_images relationship
          const images = rawData.house_images 
            ? rawData.house_images
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((img: any) => img.image_url)
            : [];
          
          const houseData: House = {
            id: rawData.id,
            host_id: rawData.host_id,
            title: rawData.accommodation_name || 'Property',
            description: rawData.description || '',
            property_type: rawData.type || 'house',
            location: rawData.location || rawData.place || '',
            address: `${rawData.street || ''} ${rawData.house_number || ''}, ${rawData.postalCode || ''} ${rawData.place || ''}`.trim(),
            price_per_night: rawData.price_per_night || 0,
            min_nights: rawData.min_nights || 1,
            max_person: rawData.max_person || 1,
            bedrooms: rawData.bedrooms || 0,
            beds: rawData.beds || 0,
            bathrooms: rawData.bathrooms || 0,
            amenities: rawData.amenities || [],
            images: images.length > 0 ? images : ['/images/default-house.jpg'],
            is_published: rawData.is_published || true,
            created_at: rawData.created_at || '',
            slug: rawData.slug || rawData.id,
            avg_rating: rawData.avg_rating || 0,
            rating: rawData.avg_rating || 0,
            reviews_count: 24,
            host: {
              name: 'Host',
              image: '/images/default-host.jpg',
              verified: true,
              is_superhost: false
            }
          };
          
          console.log('Final houseData images:', houseData.images);
          console.log('Final houseData:', houseData);
          setListing({...listing, ...houseData});
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [lang, slug]);

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

  // Recalculate pricing when dates or listing changes
  useEffect(() => {
    const calculatedNights = calculateNights(checkIn, checkOut);
    setNights(calculatedNights);
    
    const calculatedSubtotal = listing.price_per_night * calculatedNights || 0;
    setSubtotal(calculatedSubtotal);
    
    const calculatedTotal = calculatedSubtotal + cleaningFee + serviceFee;
    setTotalPrice(calculatedTotal);
  }, [checkIn, checkOut, listing.price_per_night]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Database Error</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            This usually means the houses table is missing from the database.
          </p>
          <Link
            href={`/${lang}/database-test`}
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            Test Database Connection
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !t) {
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
              src={listing.images[0] || '/images/default-house.jpg'}
              alt={listing.title || 'Property'}
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
                src={image || '/images/default-house.jpg'}
                alt={`${listing.title || 'Property'} ${index + 2}`}
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
                      <span className="font-semibold">{listing.rating || listing.avg_rating || 4.5}</span>
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
                <span>{listing.max_person} {t.details.guests}</span>
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
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-lg">
                  {listing.host?.name?.[0] || 'H'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {t.details.hostedBy} {listing.host?.name || 'Host'}
                  </p>
                  {listing.host?.is_superhost && (
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
                  {listing.rating || listing.avg_rating || 4.5} · {listing.reviews_count} {t.reviews.reviews}
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

              {checkIn && checkOut ? (
                <Link
                  href={`/${lang}/booking/${listing.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                  className="block w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors mb-4"
                >
                  {t.details.reserve}
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full py-3 px-4 bg-gray-300 text-gray-500 font-semibold rounded-lg text-center cursor-not-allowed mb-4"
                >
                  {t.details.selectDates || 'Select dates to reserve'}
                </button>
              )}

              <p className="text-center text-sm text-gray-600">
                {t.booking.youWontBeChargedYet}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {checkIn && checkOut ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">€{listing?.price_per_night || 0} x {nights} {t.details.nights}</span>
                    <span className="text-gray-900">€{subtotal}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Select dates to see pricing
                  </div>
                )}
                
                {checkIn && checkOut && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.booking.cleaningFee}</span>
                      <span className="text-gray-900">€{cleaningFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.booking.serviceFee}</span>
                      <span className="text-gray-900">€{serviceFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-3 border-t border-gray-200">
                      <span>{t.booking.totalPrice}</span>
                      <span>€{totalPrice}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
