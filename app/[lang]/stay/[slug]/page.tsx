"use client";

import { getStayDictionary } from "@/i18n/get-stay-dictionary";
import { testHousesTable } from "@/lib/test-houses-table";
import type { Locale } from "@/i18n/config";
import {
  Star,
  MapPin,
  Wifi,
  Waves,
  Flame,
  Tv,
  Accessibility,
  ShieldCheck,
  Heart,
  Share2,
  Users,
  BedDouble,
  Dog,
  CircleCheck,
  Bike,
  TreePine,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { LightpickDatePicker } from "@/components/LightpickDatePicker";
import { ModernPageLoader } from "@/components/common/ModernPageLoader";
import { createClient } from "@/utils/supabase/client";
import { calculateBookingPrice } from "@/lib/pricing-calculator";

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
  house_amenities?: {
    amenity_name: string | null;
  }[];
  house_facilities?: {
    facility_name: string;
    included: boolean | null;
  }[];
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
  special_pricing?: {
    start_date: string;
    end_date: string;
    price_per_night: number;
    occasion_name?: string;
  }[];
}

const defaultListing: House = {
  id: "",
  host_id: "",
  title: "",
  description: "",
  property_type: "",
  location: "",
  address: "",
  price_per_night: 0,
  min_nights: 0,
  max_person: 0,
  bedrooms: 0,
  beds: 0,
  bathrooms: 0,
  amenities: [],
  images: ["/images/default-house.jpg"],
  is_published: false,
  created_at: "",
  slug: "",
  avg_rating: 0,
  rating: 0,
  reviews_count: 0,
  host: {
    name: "",
    image: "",
    verified: false,
    is_superhost: false,
  },
  special_pricing: [],
  house_amenities: [],
  house_facilities: [],
};

export default function StayDetailPage() {
  const params = useParams();
  const lang = params.lang as Locale;
  const slug = params.slug as string;
  const [t, setT] = useState<any>(null);
  const [listing, setListing] = useState<House>(defaultListing);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // State for pricing calculations
  const [nights, setNights] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<
    {
      date: string;
      price: number;
      isSpecialPricing: boolean;
      occasionName?: string;
    }[]
  >([]);

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
        console.log("Testing houses table connection...");
        const dbTest = await testHousesTable();
        if (!dbTest.success) {
          console.error("Houses table test failed:", dbTest);
          setError(dbTest.error || "Database connection error");
          return;
        }

        console.log("Houses table test passed, fetching listing...");

        // Fetch listing from Supabase
        const supabase = createClient();
        const { data, error } = await supabase
          .from("houses")
          .select(
            `
            *,
            house_images (
              id,
              image_url,
              sort_order,
              is_primary
            ),
            special_pricing (
              id,
              start_date,
              end_date,
              price_per_night,
              occasion_name,
              status
            ),
            house_amenities(*),
            house_rules(*),
            house_facilities(*)
          `,
          )
          .eq("id", slug)
          .single();

        if (error) {
          console.error("Error fetching listing from Supabase:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          // Check if it's a table not found error
          if (
            !error.message ||
            error.message === "{}" ||
            Object.keys(error).length === 0
          ) {
            console.error(
              "Empty error detected - likely houses table does not exist",
            );
            console.error(
              "This usually means the houses table is missing from the database",
            );
            console.error("Run the houses table migration to fix this issue");
          }
          // Try to find by ID if slug doesn't work
          const { data: idData, error: idError } = await supabase
            .from("houses")
            .select(
              `
              *,
              house_images (
                id,
                image_url,
                sort_order,
                is_primary
              ),
              special_pricing(
                id,
                start_date,
                end_date,
                price_per_night,
                occasion_name,
                status
              )
            `,
            )
            .eq("id", slug)
            .single();

          if (idError) {
            console.error("Error fetching listing by ID:", idError);
            console.error("ID Error details:", {
              message: idError.message,
              code: idError.code,
              details: idError.details,
              hint: idError.hint,
            });

            // Check if it's the same empty error pattern
            if (
              !idError.message ||
              idError.message === "{}" ||
              Object.keys(idError).length === 0
            ) {
              console.error(
                "Empty ID error detected - houses table definitely missing",
              );
              console.error("Please run houses table migration immediately");
            }
            return;
          }

          if (idData) {
            const rawData = idData as any;
            // Extract images from house_images relationship
            console.log("Raw house_images data:", rawData.house_images);
            const images = rawData.house_images
              ? rawData.house_images
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((img: any) => img.image_url)
              : [];
            console.log("Processed images array:", images);

            // Filter special pricing to only show active and valid (not expired) pricing
            const today = new Date().toISOString().split("T")[0];
            const activeSpecialPricing = (rawData.special_pricing || []).filter(
              (sp: any) => sp.status === "active" && sp.end_date >= today,
            );

            const houseData: House = {
              id: rawData.id,
              host_id: rawData.host_id,
              title: rawData.accommodation_name || "Property",
              description: rawData.description || "",
              property_type: rawData.type || "house",
              location: rawData.location || rawData.place || "",
              address:
                `${rawData.street || ""} ${rawData.house_number || ""}, ${rawData.postalCode || ""} ${rawData.place || ""}`.trim(),
              price_per_night: rawData.price_per_night || 0,
              min_nights: rawData.min_nights || 1,
              max_person: rawData.max_person || 1,
              bedrooms: rawData.bedrooms || 0,
              beds: rawData.beds || 0,
              bathrooms: rawData.bathrooms || 0,
              amenities: rawData.amenities || [],
              house_amenities: rawData.house_amenities || [],
              house_facilities: rawData.house_facilities || [],
              images:
                images.length > 0 ? images : ["/images/default-house.jpg"],
              is_published: rawData.is_published || true,
              created_at: rawData.created_at || "",
              slug: rawData.slug || rawData.id,
              avg_rating: rawData.avg_rating || 0,
              rating: rawData.avg_rating || 0,
              reviews_count: 24,
              host: {
                name: "Host",
                image: "/images/default-host.jpg",
                verified: true,
                is_superhost: false,
              },
              special_pricing: activeSpecialPricing,
            };

            setListing({ ...listing, ...houseData });
          }
        } else if (data) {
          const rawData = data as any;
          // Extract images from house_images relationship
          const images = rawData.house_images
            ? rawData.house_images
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((img: any) => img.image_url)
            : [];

          // Filter special pricing to only show active and valid (not expired) pricing
          const today = new Date().toISOString().split("T")[0];
          const activeSpecialPricing = (rawData.special_pricing || []).filter(
            (sp: any) => sp.status === "active" && sp.end_date >= today,
          );

          const houseData: House = {
            id: rawData.id,
            host_id: rawData.host_id,
            title: rawData.accommodation_name || "Property",
            description: rawData.description || "",
            property_type: rawData.type || "house",
            location: rawData.location || rawData.place || "",
            address:
              `${rawData.street || ""} ${rawData.house_number || ""}, ${rawData.postalCode || ""} ${rawData.place || ""}`.trim(),
            price_per_night: rawData.price_per_night || 0,
            min_nights: rawData.min_nights || 1,
            max_person: rawData.max_person || 1,
            bedrooms: rawData.bedrooms || 0,
            beds: rawData.beds || 0,
            bathrooms: rawData.bathrooms || 0,
            amenities: rawData.amenities || [],
            house_amenities: rawData.house_amenities || [],
            house_facilities: rawData.house_facilities || [],
            images: images.length > 0 ? images : ["/images/default-house.jpg"],
            is_published: rawData.is_published || true,
            created_at: rawData.created_at || "",
            slug: rawData.slug || rawData.id,
            avg_rating: rawData.avg_rating || 0,
            rating: rawData.avg_rating || 0,
            reviews_count: 24,
            host: {
              name: "Host",
              image: "/images/default-host.jpg",
              verified: true,
              is_superhost: false,
            },
            special_pricing: activeSpecialPricing,
          };

          setListing({ ...listing, ...houseData });
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [lang, slug]);

  const cleaningFee = 25;
  const serviceFee = 35;

  // Recalculate pricing when dates or listing changes using special pricing calculator
  useEffect(() => {
    if (
      (listing.price_per_night > 0 ||
        (listing.special_pricing?.length ?? 0) > 0) &&
      checkIn &&
      checkOut
    ) {
      const calculation = calculateBookingPrice(
        checkIn,
        checkOut,
        listing.price_per_night,
        listing.special_pricing || [],
      );

      setNights(calculation.nights);
      setSubtotal(calculation.subtotal);
      setTotalPrice(calculation.subtotal + cleaningFee + serviceFee);
      setPriceBreakdown(calculation.priceBreakdown);
    } else {
      setNights(0);
      setSubtotal(0);
      setTotalPrice(0);
      setPriceBreakdown([]);
    }
  }, [checkIn, checkOut, listing.price_per_night, listing.special_pricing]);

  useEffect(() => {
    if (!isGalleryModalOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const totalImages = listing.images.length > 0 ? listing.images.length : 1;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsGalleryModalOpen(false);
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((prev) =>
          totalImages > 0 ? (prev + 1) % totalImages : 0,
        );
      }

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((prev) =>
          totalImages > 0 ? (prev - 1 + totalImages) % totalImages : 0,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isGalleryModalOpen, listing.images]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
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
      <ModernPageLoader
        title="Loading stay details"
        subtitle="Getting house, pricing, and availability"
        variant="stayDetail"
      />
    );
  }

  const galleryImages =
    listing.images && listing.images.length > 0
      ? listing.images
      : ["/images/default-house.jpg"];
  const extraImagesCount = Math.max(galleryImages.length - 5, 0);

  const openGalleryAt = (index: number) => {
    setActiveImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();

  const amenityNames = Array.from(
    new Set(
      (listing.house_amenities || [])
        .map((amenity) => amenity.amenity_name?.trim())
        .filter((amenity): amenity is string => Boolean(amenity)),
    ),
  );

  const normalizedAmenityNames = amenityNames.length > 0 ? amenityNames : listing.amenities;
  const petFriendly = normalizedAmenityNames.some((amenity) => {
    const normalized = amenity.toLowerCase();
    return normalized.includes("pet") || normalized.includes("dog") || normalized.includes("hond");
  });

  const highlightActivities = normalizedAmenityNames.slice(0, 6).map(formatLabel);
  const getHighlightIcon = (activity: string) => {
    const normalized = activity.toLowerCase();

    if (
      normalized.includes("internet") ||
      normalized.includes("wifi") ||
      normalized.includes("wi-fi")
    ) {
      return Wifi;
    }

    if (
      normalized.includes("gas heater") ||
      normalized.includes("heater") ||
      normalized.includes("heating")
    ) {
      return Flame;
    }

    if (normalized.includes("tv") || normalized.includes("television")) {
      return Tv;
    }

    if (
      normalized.includes("swimming pool") ||
      normalized.includes("pool") ||
      normalized.includes("shared pool")
    ) {
      return Waves;
    }

    if (
      normalized.includes("wheelchair") ||
      normalized.includes("accessible") ||
      normalized.includes("accessibility")
    ) {
      return Accessibility;
    }

    if (
      normalized.includes("contactless") ||
      normalized.includes("self check") ||
      normalized.includes("self-check")
    ) {
      return ShieldCheck;
    }

    if (
      normalized.includes("bike") ||
      normalized.includes("biking") ||
      normalized.includes("cycling") ||
      normalized.includes("fiets")
    ) {
      return Bike;
    }

    if (
      normalized.includes("dog") ||
      normalized.includes("pet") ||
      normalized.includes("hond")
    ) {
      return Dog;
    }

    if (
      normalized.includes("walk") ||
      normalized.includes("hike") ||
      normalized.includes("forest") ||
      normalized.includes("bird") ||
      normalized.includes("nature")
    ) {
      return TreePine;
    }

    if (
      normalized.includes("ride") ||
      normalized.includes("location") ||
      normalized.includes("trip")
    ) {
      return MapPin;
    }

    return CircleCheck;
  };
  const descriptionText = listing.description?.trim() || "No description available yet.";
  const descriptionLimit = 340;
  const hasLongDescription = descriptionText.length > descriptionLimit;
  const visibleDescription =
    hasLongDescription && !showFullDescription
      ? `${descriptionText.slice(0, descriptionLimit)}...`
      : descriptionText;

  const facilityEntries = Array.from(
    new Set(
      [
        ...(listing.house_facilities || [])
          .filter((facility) => facility.included !== false)
          .map((facility) => facility.facility_name?.trim())
          .filter((facilityName): facilityName is string => Boolean(facilityName)),
        ...normalizedAmenityNames,
      ].filter((facilityName): facilityName is string => Boolean(facilityName)),
    ),
  );

  const getFacilityCategory = (facilityName: string) => {
    const value = facilityName.toLowerCase();

    if (value.includes("parking") || value.includes("access")) return "Accessibility";
    if (value.includes("wifi") || value.includes("internet") || value.includes("water") || value.includes("heating") || value.includes("electric")) return "Basic amenities";
    if (value.includes("garden") || value.includes("terrace") || value.includes("outside") || value.includes("barbecue") || value.includes("bbq") || value.includes("lake")) return "Outside";
    if (value.includes("tv") || value.includes("sauna") || value.includes("game")) return "Entertainment";
    if (value.includes("child") || value.includes("kid") || value.includes("play")) return "Children";
    if (value.includes("pet") || value.includes("dog")) return "Pets";
    if (value.includes("kitchen") || value.includes("dishwasher") || value.includes("oven") || value.includes("fridge") || value.includes("stove")) return "Kitchen";
    if (value.includes("bath") || value.includes("toilet") || value.includes("shower") || value.includes("sanitary")) return "Bathroom";
    if (value.includes("washing") || value.includes("laundry")) return "Laundry";
    return "Other facilities";
  };

  const groupedFacilities = facilityEntries.reduce<Record<string, string[]>>((groups, facilityName) => {
    const category = getFacilityCategory(facilityName);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(formatLabel(facilityName));
    return groups;
  }, {});

  const orderedFacilitySections = [
    "Accessibility",
    "Basic amenities",
    "Outside",
    "Entertainment",
    "Children",
    "Pets",
    "Kitchen",
    "Bathroom",
    "Laundry",
    "Other facilities",
  ].filter((category) => (groupedFacilities[category] || []).length > 0);

  const reviewCount = listing.reviews_count || 0;
  const reviewLabel = `${reviewCount} ${t.reviews.reviews}`;
  const mainScore = Number(listing.rating || listing.avg_rating || 4.5).toFixed(1);
  const natureScore = (Math.min(5, (listing.avg_rating || listing.rating || 4.5) / 2) + 0.1).toFixed(1);
  const mapQuery = [listing.address, listing.location]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(", ");
  const encodedMapQuery = mapQuery ? encodeURIComponent(mapQuery) : "";
  const googleMapEmbedUrl = encodedMapQuery
    ? `https://www.google.com/maps?q=${encodedMapQuery}&z=14&output=embed`
    : "";
  const googleMapUrl = encodedMapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodedMapQuery}`
    : "";

  const handleShareClick = async () => {
    if (typeof window === "undefined") return;

    const shareUrl = window.location.href;
    const shareData = {
      title: listing.title || "Nature house",
      text: listing.location
        ? `${listing.title || "Nature house"} · ${listing.location}`
        : listing.title || "Nature house",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        window.alert("Share link copied to clipboard.");
        return;
      }

      window.prompt("Copy this link", shareUrl);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Failed to share stay link:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery */}
      <div className="container-custom py-6">
        <div className="grid h-125 grid-cols-4 gap-2 overflow-hidden rounded-2xl">
          <button
            type="button"
            className="col-span-2 row-span-2 relative cursor-pointer"
            onClick={() => openGalleryAt(0)}
          >
            <Image
              src={galleryImages[0] || "/images/default-house.jpg"}
              alt={listing.title || "Property"}
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
              }}
            />
          </button>
          {galleryImages.slice(1, 5).map((image: string, index: number) => {
            const currentImageIndex = index + 1;
            const shouldShowOverlay = index === 3 && extraImagesCount > 0;

            return (
              <button
                key={currentImageIndex}
                type="button"
                className="relative cursor-pointer"
                onClick={() => openGalleryAt(currentImageIndex)}
              >
              <Image
                src={image || "/images/default-house.jpg"}
                alt={`${listing.title || "Property"} ${index + 2}`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                }}
              />
                {shouldShowOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-500/75 text-2xl font-bold text-white">
                    +{extraImagesCount} more
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Basic Info */}
            <div className="mb-8 border-b border-[#cbc7bc] pb-8">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h1 className="mb-2 text-4xl font-semibold leading-tight text-[#28331b]">
                    {listing.title}
                  </h1>
                  <p className="text-2xl font-medium text-[#38452a]">{listing.location}</p>
                  <p className="mt-1 text-sm text-[#6f7468]">
                    {formatLabel(listing.property_type || "house")} · {listing.bedrooms || 1} bedrooms · {listing.bathrooms || 1} bathrooms
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-[#f0d895] px-3 py-1 text-sm font-semibold text-[#28331b]">
                    <Star className="h-4 w-4 fill-current text-[#e9a019]" />
                    {mainScore}/10
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-[#d5e4a6] px-3 py-1 text-sm font-semibold text-[#28331b]">
                    <Waves className="h-4 w-4 text-[#5f7f33]" />
                    {natureScore}/5
                  </span>
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#6b2d6f] underline underline-offset-2"
                  >
                    {reviewLabel}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                    onClick={handleShareClick}
                    aria-label="Share this stay"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                  >
                    <Heart className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-[#29331f]">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-5 w-5" /> {listing.max_person} {t.details.guests}
                </span>
                <span className="inline-flex items-center gap-2">
                  <BedDouble className="h-5 w-5" /> {listing.bedrooms} {t.details.bedrooms}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Wifi className="h-5 w-5" /> WiFi
                </span>
                {petFriendly && (
                  <span className="inline-flex items-center gap-2">
                    <Dog className="h-5 w-5" /> Pets allowed
                  </span>
                )}
              </div>

              {highlightActivities.length > 0 && (
                <div className="mt-5 rounded-2xl border border-[#d5d1c3] bg-[#f4f2e9] p-5">
                  <p className="text-sm font-medium text-[#2d361f]">
                    Guests who stayed here find the surroundings fantastic for
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlightActivities.map((activity, index) => {
                      const ActivityIcon = getHighlightIcon(activity);

                      return (
                        <span
                          key={`${activity}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#dbe8b8] px-3 py-1 text-sm text-[#374426]"
                        >
                          <ActivityIcon className="h-3.5 w-3.5 shrink-0" />
                          {activity}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8 border-b border-[#cbc7bc] pb-8">
              <p className="text-sm leading-relaxed text-[#2e3621]">
                {visibleDescription}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-[#6b2d6f]"
                  onClick={() => setShowFullDescription((prev) => !prev)}
                >
                  {showFullDescription ? "Read less" : "Read more"}
                </button>
              )}
            </div>

            {/* Facilities */}
            <div className="mb-8 border-b border-[#cbc7bc] pb-8">
              <h2 className="mb-6 text-4xl font-semibold text-[#26311a]">Facilities</h2>

              {orderedFacilitySections.length > 0 ? (
                <div className="space-y-7">
                  {orderedFacilitySections.map((category) => {
                    const facilities = groupedFacilities[category] || [];
                    const shouldSplitColumns = facilities.length > 6;

                    return (
                      <div key={category}>
                        <h3 className="mb-3 text-sm font-semibold text-[#2d361f]">{category}</h3>
                        <ul
                          className={
                            shouldSplitColumns
                              ? "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"
                              : "space-y-2"
                          }
                        >
                          {facilities.map((facility, index) => (
                            <li
                              key={`${category}-${facility}-${index}`}
                              className="flex items-start gap-2 text-sm text-[#2f3a22]"
                            >
                              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#364523]" />
                              <span>{facility}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Facilities will be updated soon.</p>
              )}
            </div>

            {/* Location */}
            <div className="mb-8 border-b border-[#cbc7bc] pb-8">
              <h2 className="mb-3 text-xl font-semibold text-[#26311a]">Location</h2>
              <div className="relative overflow-hidden rounded-3xl bg-[#dce6ba] p-10">
                {googleMapEmbedUrl ? (
                  <iframe
                    title="Property location map"
                    src={googleMapEmbedUrl}
                    className="h-56 w-full rounded-2xl border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="h-56 rounded-2xl bg-linear-to-br from-[#c8d9a1] via-[#dbe7bf] to-[#bdd596]" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  {googleMapUrl ? (
                    <a
                      href={googleMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#6b2d6f] shadow-md"
                    >
                      <MapPin className="h-5 w-5" />
                      Show location
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-white/80 px-8 py-3 text-sm font-semibold text-[#6b2d6f]/70 shadow-md"
                    >
                      <MapPin className="h-5 w-5" />
                      Show location
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="mb-8">
              <h2 className="mb-5 text-4xl font-semibold text-[#26311a]">Reviews</h2>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-[#f0d895] px-3 py-1 text-sm font-semibold text-[#28331b]">
                  <Star className="h-4 w-4 fill-current text-[#e9a019]" />
                  {mainScore}/10
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-[#d5e4a6] px-3 py-1 text-sm font-semibold text-[#28331b]">
                  <Waves className="h-4 w-4 text-[#5f7f33]" />
                  {natureScore}/5
                </span>
                <span className="text-sm font-semibold text-[#6b2d6f] underline underline-offset-2">
                  {reviewLabel}
                </span>
              </div>
              <div className="rounded-2xl bg-[#f4f2e9] py-8 text-center">
                <p className="text-gray-600">{t.reviews.noReviews}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.reviews.beTheFirst}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    €{listing.price_per_night}
                  </span>
                  <span className="text-gray-600">
                    / {t.booking.pricePerNight}
                  </span>
                </div>
                {listing.special_pricing &&
                  listing.special_pricing.length > 0 &&
                  listing.special_pricing.map((sp, index) => (
                    <div
                      key={index}
                      className="flex items-baseline gap-2 text-sm text-red-500 font-semibold"
                    >
                      <span>€{sp.price_per_night}</span>
                      <span>/ {t.booking.pricePerNight}</span>
                      <span>
                        {sp.start_date} - {sp.end_date}
                      </span>
                    </div>
                  ))}
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
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
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
                  {t.details.selectDates || "Select dates to reserve"}
                </button>
              )}

              <p className="text-center text-sm text-gray-600">
                {t.booking.youWontBeChargedYet}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                {checkIn && checkOut ? (
                  <>
                    {(() => {
                      const specialNights = priceBreakdown.filter(
                        (d) => d.isSpecialPricing,
                      ).length;
                      const normalNights = priceBreakdown.filter(
                        (d) => !d.isSpecialPricing,
                      ).length;
                      const hasSpecialPricing = specialNights > 0;

                      return (
                        <>
                          {hasSpecialPricing && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                              <p className="text-sm text-purple-800 font-medium">
                                ✨ Special pricing applied
                              </p>
                              <p className="text-xs text-purple-600 mt-1">
                                {specialNights}{" "}
                                {specialNights === 1 ? "night" : "nights"} with
                                special pricing, {normalNights}{" "}
                                {normalNights === 1 ? "night" : "nights"} at
                                regular price
                              </p>
                            </div>
                          )}

                          {hasSpecialPricing ? (
                            <>
                              {normalNights > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    €{listing.price_per_night} x {normalNights}{" "}
                                    {normalNights === 1 ? "night" : "nights"}{" "}
                                    (regular)
                                  </span>
                                  <span className="text-gray-900">
                                    €
                                    {priceBreakdown
                                      .filter((d) => !d.isSpecialPricing)
                                      .reduce((sum, d) => sum + d.price, 0)}
                                  </span>
                                </div>
                              )}
                              {specialNights > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">
                                    €
                                    {Math.round(
                                      priceBreakdown
                                        .filter((d) => d.isSpecialPricing)
                                        .reduce((sum, d) => sum + d.price, 0) /
                                        specialNights,
                                    )}{" "}
                                    x {specialNights}{" "}
                                    {specialNights === 1 ? "night" : "nights"}{" "}
                                    (special)
                                  </span>
                                  <span className="text-gray-900">
                                    €
                                    {priceBreakdown
                                      .filter((d) => d.isSpecialPricing)
                                      .reduce((sum, d) => sum + d.price, 0)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-200">
                                <span className="text-gray-700">
                                  Subtotal ({nights}{" "}
                                  {nights === 1 ? "night" : "nights"})
                                </span>
                                <span className="text-gray-900">
                                  €{subtotal}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                €{listing?.price_per_night || 0} x {nights}{" "}
                                {t.details.nights}
                              </span>
                              <span className="text-gray-900">€{subtotal}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Select dates to see pricing
                  </div>
                )}

                {checkIn && checkOut && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t.booking.cleaningFee}
                      </span>
                      <span className="text-gray-900">€{cleaningFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {t.booking.serviceFee}
                      </span>
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

      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-white p-4 sm:p-6"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-7xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between px-1 sm:px-2">
              <p className="text-sm font-medium text-gray-500">
                {activeImageIndex + 1} / {galleryImages.length}
              </p>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="rounded-md p-2 text-[#6b2d6f] transition-colors hover:bg-white/80"
                aria-label="Close image gallery"
              >
                ✕
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center">
              <div className="relative h-full w-full max-w-5xl overflow-hidden rounded-xl bg-white/50">
                <Image
                  src={galleryImages[activeImageIndex] || "/images/default-house.jpg"}
                  alt={`${listing.title || "Property"} image ${activeImageIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 1100px"
                />
              </div>

              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? galleryImages.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-md border border-gray-200 bg-white/95 px-3 py-1 text-lg text-gray-700 shadow-sm transition-colors hover:bg-white sm:left-2"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === galleryImages.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-md border border-gray-200 bg-white/95 px-3 py-1 text-lg text-gray-700 shadow-sm transition-colors hover:bg-white sm:right-2"
                    aria-label="Next image"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 px-2 pb-2">
              <div className="flex gap-2 overflow-x-auto">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-12 min-w-16 overflow-hidden rounded-md border transition ${
                      activeImageIndex === index
                        ? "border-[#6b2d6f] opacity-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image || "/images/default-house.jpg"}
                      alt={`${listing.title || "Property"} preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
