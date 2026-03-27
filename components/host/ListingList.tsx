"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Edit, Trash2, Eye, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Listing {
  id: string;
  host_id: string;
  title: string;
  description: string;
  property_type: string;
  location: string;
  address: string;
  price_per_night: number;
  min_nights: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  house_images?: {
    image_url: string;
    sort_order: number;
  }[];
  status: string;
  created_at: string;
}

export function ListingList() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch listings from Supabase
  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from("houses")
        .select(
          `
            *,
            house_images (
              image_url,
              sort_order
            )
          `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        setError(error.message);
        return;
      }

      setListings(data || []);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  // Delete listing
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase.from("houses").delete().eq("id", id);

      if (error) {
        console.error("Error deleting listing:", error);
        setError(error.message);
        return;
      }

      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to delete listing");
    }
  };

  // Toggle publish status
  const togglePublish = async (id: string, currentStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from("houses")
        .update({ status: currentStatus === 'active' ? 'inactive' : 'active' })
        .eq("id", id);

      if (error) {
        console.error("Error updating listing:", error);
        setError(error.message);
        return;
      }

      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to update listing");
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Plus className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No listings yet
        </h3>
        <p className="text-gray-500 mb-6">
          Get started by creating your first listing
        </p>
        <Link
          href="/en/host/new"
          className="inline-flex items-center px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href="/en/host/new"
          className="inline-flex items-center px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Listing
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Image */}
            <div className="relative h-48 bg-gray-200">
              {listing.house_images && listing.house_images.length > 0 && listing.house_images[0].image_url ? (
                <Image
                  src={listing.house_images[0].image_url}
                  alt={listing.title || 'Property image'}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">
                    <Eye className="h-8 w-8" />
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    listing.status === 'active'
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {listing.status === 'active' ? "Published" : "Draft"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                {listing.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {listing.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>{listing.property_type}</span>
                <span>€{listing.price_per_night}/night</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/en/host/edit/${listing.id}`}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors text-sm"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Link>
                <button
                  onClick={() =>
                    togglePublish(listing.id, listing.status)
                  }
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors text-sm ${
                    listing.status === 'active'
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                >
                  {listing.status === 'active' ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
