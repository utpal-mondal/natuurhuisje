"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ListingWizard } from "@/components/host/ListingWizard";

interface Listing {
  id: string;
  host_id: string;
  title?: string;
  accommodation_name?: string;
  description: string;
  property_type?: string;
  type?: string;
  location: string;
  address?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  place?: string;
  country?: string;
  region?: string;
  price_per_night: number;
  min_nights: number;
  max_guests?: number;
  max_person?: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  images?: string[];
  house_images?: {
    image_url: string;
    sort_order: number;
  }[];
  plot_size?: string;
  is_near_neighbors?: boolean;
  registration_number_option?: string;
  registration_number?: string;
  has_public_transport?: boolean;
  is_published: boolean;
  created_at: string;
}

export default function EditListingPage() {
  const params = useParams();
  const supabase = createClient();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  // Fetch listing data from Supabase
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from("houses")
          .select(`
            *,
            house_images (
              image_url,
              sort_order
            )
          `)
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching listing:", error);
          setError(error.message);
          return;
        }

        setListing(data);
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, supabase]);

  // Transform database data to form format
  const transformListingData = (listing: Listing) => {
    return {
      id: id,
      accommodationName: listing.accommodation_name || listing.title || "",
      type: listing.type || listing.property_type || "Cottage",
      maxPerson: listing.max_person || listing.max_guests || 1,
      livingSituation: "Detached", // Default value since not in DB
      location: listing.location || "",
      plotSize: listing.plot_size || "", // Not in DB
      isNearNeighbors: listing.is_near_neighbors || null, // Not in DB
      registrationNumberOption: listing.registration_number_option || "I don't have a registration number", // Default
      registrationNumber: listing.registration_number || "", // Not in DB
      hasPublicTransport: listing.has_public_transport || false, // Not in DB

      // Location
      country: listing.country || "Netherlands", // Default
      region: listing.region || "Drenthe", // Default
      street: listing.street || "", // Not in DB
      number: listing.house_number || "", // Not in DB
      postalCode: listing.postal_code || "", // Not in DB
      place: listing.place || listing.address || "",
      landRegistrationOption: "", // Not in DB

      // Photos
      images: listing.house_images 
        ? listing.house_images
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((img: any) => img.image_url)
        : [],

      // Pricing
      pricePerNight: listing.price_per_night?.toString() || "",
      includedFacilities: [
        "Final cleaning",
        "Bed linen",
        "Bath towels",
        "Kitchen linen",
        "Water",
        "Electricity",
      ], // Default
      safetyDeposit: "no_deposit", // Default
      safetyDepositAmount: "", // Not in DB
      longerStayPricing: {
        weeklyPrice: "",
        monthlyPrice: "",
        weekendPrice: "",
        longWeekendPrice: "",
        weekdayPrice: "",
        weekPrice: "",
      }, // Not in DB
      personPricing: {
        basePersons: 0,
        additionalPersonPrice: "",
      }, // Not in DB
      extraCosts: [], // Not in DB

      // Availability
      minNights: listing.min_nights || 1,

      // Description
      description: listing.description || "",
      surroundings: "", // Not in DB

      // Stay Details
      amenities: listing.amenities || [],

      // Sustainability
      energyLabel: "", // Not in DB
      sustainability: {}, // Not in DB

      // House Rules
      houseRules: {
        babies: 0,
        pets: 0,
        childAge: 0,
        bookingAge: 18,
        parties: null,
        smoking: null,
        fireworks: null,
        groups: null,
        waste: null,
        silenceStart: "",
        silenceEnd: "",
        customRules: [],
      }, // Not in DB
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59A559] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#59A559] text-white px-6 py-2 rounded-lg hover:bg-[#4a8a4a] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ListingWizard
        mode="edit"
        existingListing={listing ? transformListingData(listing) : null}
      />
    </div>
  );
}
