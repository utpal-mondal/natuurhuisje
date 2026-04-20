"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import type { Locale } from '@/i18n/config';
import { getSearchResultsDictionary } from '@/i18n/get-search-results-dictionary';
import { ListingCard } from '@/components/ListingCard';
import { SearchDock } from '@/components/SearchDock';
import { Filter, ChevronDown } from 'lucide-react';

function SearchContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang as Locale;

  const [t, setT] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 500]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getSearchResultsDictionary(lang);
      setT(translations);
    };
    loadTranslations();
  }, [lang]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {        
        const response = await fetch('/api/listings');
        const data = await response.json();
        const fetchedListings = data.data || [];
        setListings(fetchedListings);

        const prices = fetchedListings
          .map((listing: any) => Number(listing.price_per_night))
          .filter((price: number) => Number.isFinite(price) && price >= 0);

        if (prices.length > 0) {
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceBounds([minPrice, maxPrice]);
          setPriceRange([minPrice, maxPrice]);
        } else {
          setPriceBounds([0, 500]);
          setPriceRange([0, 500]);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
        setPriceBounds([0, 500]);
        setPriceRange([0, 500]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [searchParams]);

  if (!t) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const propertyTypes = ['cabin', 'treehouse', 'cottage', 'villa', 'chalet', 'tent', 'yurt'];
  const amenities = ['wifi', 'parking', 'kitchen', 'pool', 'petFriendly', 'fireplace', 'hottub', 'bbq'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 py-4 sticky top-20 z-30">
        <div className="container-custom">
          <SearchDock variant="compact" lang={lang} />
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0`}>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-36">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{t.filters.title}</h2>
                <button className="text-sm text-purple-600 hover:text-purple-700">
                  {t.filters.clearAll}
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.filters.priceRange}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>€{priceRange[0]}</span>
                  <span>-</span>
                  <span>€{priceRange[1]}</span>
                  <span className="text-xs">{t.filters.perNight}</span>
                </div>
                <input
                  type="range"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceBounds[0], parseInt(e.target.value)])}
                  className="w-full mt-3"
                />
              </div>

              {/* Property Type */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.filters.propertyType}</h3>
                <div className="space-y-2">
                  {propertyTypes.map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPropertyTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPropertyTypes([...selectedPropertyTypes, type]);
                          } else {
                            setSelectedPropertyTypes(selectedPropertyTypes.filter(t => t !== type));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t.propertyTypes[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.filters.amenities}</h3>
                <div className="space-y-2">
                  {amenities.map((amenity) => (
                    <label key={amenity} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAmenities([...selectedAmenities, amenity]);
                          } else {
                            setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t.amenities[amenity]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t.filters.rating}</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => setMinRating(rating)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {rating} {t.filters.starsAndUp}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {listings.length} {t.results.found}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  {t.filters.title}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="recommended">{t.sort.recommended}</option>
                    <option value="priceLowToHigh">{t.sort.priceLowToHigh}</option>
                    <option value="priceHighToLow">{t.sort.priceHighToLow}</option>
                    <option value="rating">{t.sort.rating}</option>
                    <option value="newest">{t.sort.newest}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-2xl h-64 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    title={listing.title}
                    location={listing.location}
                    images={listing.images}
                    pricePerNight={listing.price_per_night}
                    rating={listing.avg_rating}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.results.noResults}</h3>
                  <p className="text-gray-600">{t.results.noResultsDescription}</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading search results...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
