"use client";

import Link from 'next/link';
import { SearchDock } from '@/components/SearchDock';
import { ListingCard } from '@/components/ListingCard';
import { useRef, useState, useEffect, use, useMemo } from 'react';
import type { Locale } from '@/i18n/config';
import { getHomepageDictionary } from '@/i18n/get-homepage-dictionary';
import { createClient } from '@/utils/supabase/client';

type Listing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  images: string[];
  price_per_night: number;
  avg_rating?: number;
  is_published: boolean;
};

type Destination = {
  country: string;
  label: string;
  image: string;
};

type Category = {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  created_at: string;
};

type Mood = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  view_count?: number;
  created_at: string;
};

type DestinationShowcase = {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  view_count?: number;
  created_at: string;
};

type ExperienceShowcase = {
  id: number;
  title: string;
  description: string | null;
  video_url: string | null;
  view_count?: number;
  created_at: string;
};

type CarouselItem = {
  id: string;
  label: string;
  type?: string;
  country?: string;
  region?: string;
  image: string;
  href: string;
};

type CarouselData = {
  natureHouses: CarouselItem[];
  countries: CarouselItem[];
  regions: CarouselItem[];
};

type DataType = {
  featuredListings: Listing[];
  destinations: Destination[];
};

export default function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = use(params);
  const lang = langParam as Locale;
  const supabase = useMemo(() => createClient(), []);
  const natureHousesRef = useRef<HTMLDivElement>(null);
  const countriesRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DataType>({
    featuredListings: [],
    destinations: [],
  });
  const [carouselData, setCarouselData] = useState<CarouselData>({
    natureHouses: [],
    countries: [],
    regions: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [destinationShowcase, setDestinationShowcase] = useState<DestinationShowcase[]>([]);
  const [experienceShowcase, setExperienceShowcase] = useState<ExperienceShowcase[]>([]);
  const [hideHeroSearch, setHideHeroSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getHomepageDictionary(lang);
      setT(translations);
    };
    loadTranslations();
  }, [lang]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setHideHeroSearch(true);
      } else {
        setHideHeroSearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadCarouselData = async () => {
      try {
        const response = await fetch('/data/homepage-carousels.json');
        const data = await response.json();
        setCarouselData(data);
      } catch (error) {
        console.error('Error loading carousel data:', error);
      }
    };

    loadCarouselData();
  }, []);

  useEffect(() => {
    fetch(`/data/listings-${lang}.json`)
      .then(response => response.json())
      .then((jsonData: DataType) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, [lang]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [supabase]);

  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const moodsQuery: any = supabase.from('moods');
        const { data, error } = await moodsQuery
          .select('id, title, description, video_url, view_count, created_at')
          .order('created_at', { ascending: false });

        if (error && error.message.includes('column moods.view_count does not exist')) {
          const { data: fallbackData, error: fallbackError } = await moodsQuery
            .select('id, title, description, video_url, created_at')
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('Error fetching moods:', fallbackError);
          } else {
            const normalized = (fallbackData || []).map((mood: Mood) => ({
              ...mood,
              view_count: 0,
            }));
            setMoods(normalized);
          }
        } else if (error) {
          console.error('Error fetching moods:', error);
        } else {
          setMoods(data || []);
        }
      } catch (error) {
        console.error('Error fetching moods:', error);
      }
    };

    fetchMoods();
  }, [supabase]);

  useEffect(() => {
    const fetchDestinationShowcase = async () => {
      try {
        const destinationsQuery: any = supabase.from('destinations');
        const { data, error } = await destinationsQuery
          .select('id, title, description, video_url, view_count, created_at')
          .order('created_at', { ascending: false });

        if (error && error.message.includes('column destinations.view_count does not exist')) {
          const { data: fallbackData, error: fallbackError } = await destinationsQuery
            .select('id, title, description, video_url, created_at')
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('Error fetching destination showcase:', fallbackError);
          } else {
            const normalized = (fallbackData || []).map((item: DestinationShowcase) => ({
              ...item,
              view_count: 0,
            }));
            setDestinationShowcase(normalized);
          }
        } else if (error) {
          console.error('Error fetching destination showcase:', error);
        } else {
          setDestinationShowcase(data || []);
        }
      } catch (error) {
        console.error('Error fetching destination showcase:', error);
      }
    };

    fetchDestinationShowcase();
  }, [supabase]);

  useEffect(() => {
    const fetchExperienceShowcase = async () => {
      try {
        const experiencesQuery: any = supabase.from('experiences');
        const { data, error } = await experiencesQuery
          .select('id, title, description, video_url, view_count, created_at')
          .order('created_at', { ascending: false });

        if (error && error.message.includes('column experiences.view_count does not exist')) {
          const { data: fallbackData, error: fallbackError } = await experiencesQuery
            .select('id, title, description, video_url, created_at')
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('Error fetching experience showcase:', fallbackError);
          } else {
            const normalized = (fallbackData || []).map((item: ExperienceShowcase) => ({
              ...item,
              view_count: 0,
            }));
            setExperienceShowcase(normalized);
          }
        } else if (error) {
          console.error('Error fetching experience showcase:', error);
        } else {
          setExperienceShowcase(data || []);
        }
      } catch (error) {
        console.error('Error fetching experience showcase:', error);
      }
    };

    fetchExperienceShowcase();
  }, [supabase]);

  const latestMoods = moods.slice(0, 8);
  const latestDestinations = destinationShowcase.slice(0, 6);
  const latestExperiences = experienceShowcase.slice(0, 5);
  const formatViewCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000) return `${Math.round(count / 1000)}K`;
    return count.toString();
  };

  if (!t) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] w-full overflow-visible -mt-20 z-40">
        {/* Background Image Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="relative w-full h-full">
            {/* Banner 1 */}
            <div className="absolute inset-0 animate-[fadeInOut_15s_ease-in-out_infinite]">
              <img 
                src="/images/banner1.jpeg" 
                alt="Nature banner 1"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Banner 2 */}
            <div className="absolute inset-0 animate-[fadeInOut_15s_ease-in-out_5s_infinite]">
              <img 
                src="/images/banner2.jpeg" 
                alt="Nature banner 2"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Banner 3 */}
            <div className="absolute inset-0 animate-[fadeInOut_15s_ease-in-out_10s_infinite]">
              <img 
                src="/images/banner3.jpeg" 
                alt="Nature banner 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container-custom h-full min-h-[85vh] flex flex-col justify-center items-center text-center px-4 pt-20 overflow-visible">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></span>
            <span className="text-sm text-white/90 font-medium tracking-wide">{t.hero.badge}</span>
          </div>
          
          <h1 className="text-lg md:text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight font-poppins">
            {t.hero.title}
            <span className="block mt-2 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
              {t.hero.subtitle}
            </span>
          </h1>
          
          <p className="text-lg md:text-base md:text-lg text-white/80 mb-12 max-w-2xl leading-relaxed">
            {t.hero.description}
          </p>
          
          {/* Search Dock - Hidden on mobile when scrolled */}
          <div className={`w-full max-w-4xl relative z-50 transition-opacity duration-300 ${hideHeroSearch ? 'md:opacity-100 opacity-0 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
            <SearchDock variant="hero" maxWidth="max-w-4xl" lang={lang}/>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              <span>{t.hero.trustBadges.cancellation}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              <span>{t.hero.trustBadges.verified}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              <span>{t.hero.trustBadges.support}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category show */}
      <section className="py-3 bg-white">
        <div className="container-custom">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-2" style={{ minWidth: 'max-content' }}>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${lang}/search?category=${category.id}`}
                  className="group block shrink-0"
                >
                  <div className="bg-white border border-gray-300 rounded-lg p-2 text-center w-36">
                    <div className="w-12 h-12 mx-auto flex items-center justify-center">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : category.icon ? (
                        <span className="text-3xl">{category.icon}</span>
                      ) : (
                        <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800 text-xs">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* mood section */}
      <section className="py-14 bg-[#f5f5f3]">
        <div className="container-custom">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Explore experiences based on your mood</h2>
            <p className="mt-1.5 text-sm md:text-base text-gray-600">Choose your vibe and find your experience</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10">
            {latestMoods.map((mood) => (
              <div key={mood.id} className="relative">
                <div className="relative aspect-[9/16] bg-gray-200 rounded-2xl overflow-hidden">
                  <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-md bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{formatViewCount(mood.view_count)}</span>
                  </div>

                  <video
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(e) => {
                      const video = e.currentTarget;
                      video.currentTime = 0;
                      video.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget;
                      video.pause();
                      video.currentTime = 0;
                    }}
                  >
                    <source src={mood.video_url} type="video/mp4" />
                  </video>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {mood.title}
                  </h3>
                  {mood.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {mood.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* destination section */}
      <section className="py-14 bg-white">
        <div className="container-custom">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Explore Pilgrimage Destinations</h2>
            <p className="mt-1.5 text-sm md:text-base text-gray-600">Discover sacred sites across India</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestDestinations.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="h-48 overflow-hidden">
                  {item.video_url ? (
                    <img
                      src={item.video_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm text-gray-500">
                      No image available
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-semibold leading-tight text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{item.description || 'Discover spiritual journeys and cultural heritage stays.'}</p>

                  <Link
                    href={`/${lang}/search`}
                    className="mt-3 inline-flex items-center gap-1 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[hsl(270_55%_42%)]"
                  >
                    Explore Journey
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* experience section */}
      <section className="py-14 bg-[#f5f5f3]">
        <div className="container-custom">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">Seasonal escapes &amp; cultural experiences</h2>
            <p className="mt-1.5 text-sm md:text-base text-gray-600">Experience rich traditions and vibrant celebrations</p>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-3 snap-x snap-mandatory" style={{ minWidth: 'max-content' }}>
              {latestExperiences.map((item) => (
                <article key={item.id} className="relative h-80 w-[220px] shrink-0 overflow-hidden rounded-xl snap-start sm:w-[230px]">
                  {item.video_url ? (
                    <img
                      src={item.video_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-2xl font-semibold leading-tight">{item.title}</h3>
                    <p className="mt-1 text-sm text-white/90 line-clamp-1">{item.description || 'Immersive cultural stay experiences.'}</p>

                    <Link
                      href={`/${lang}/search`}
                      className="mt-3 inline-flex items-center gap-1 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[hsl(270_55%_42%)]"
                    >
                      Packages
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {latestExperiences.map((item, index) => (
              <span
                key={`exp-dot-${item.id}`}
                className={`h-1.5 w-1.5 rounded-full ${index === 0 ? 'bg-[hsl(var(--primary))]' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
