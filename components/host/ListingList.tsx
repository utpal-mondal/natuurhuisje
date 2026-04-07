"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Edit, Trash2, Eye, Plus, ChevronLeft, ChevronRight, MoreVertical, DoorOpen, Copy, Archive, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getUserRole } from "@/lib/roles";

interface Listing {
  id: string;
  host_id: string;
  title: string;
  accommodation_name:string;
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
  const params = useParams();
  const router = useRouter();
  const lang = params?.lang as string;

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(9); // 3x3 grid
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch listings from Supabase
  const fetchListings = async (page: number = 1) => {
    try {
      setLoading(true);
      
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${lang || 'en'}/login`);
        return;
      }

      const role = await getUserRole(session.user.id);
      const isAdmin = role === "admin";

      // Get total count first
      let countQuery = supabase
        .from("houses")
        .select("id", { count: 'exact', head: true });

      if (!isAdmin) {
        countQuery = countQuery.eq('host_id', session.user.id);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error("Error counting listings:", countError);
        setError(countError.message);
        return;
      }

      setTotalCount(count || 0);

      // Get paginated data
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let dataQuery = supabase
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
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!isAdmin) {
        dataQuery = dataQuery.eq('host_id', session.user.id);
      }

      const { data, error } = await dataQuery;

      if (error) {
        console.error("Error fetching listings:", error);
        setError(error.message);
        return;
      }

      setListings(data || []);
      setCurrentPage(page);
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
      fetchListings(currentPage);
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
      fetchListings(currentPage);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to update listing");
    }
  };

  useEffect(() => {
    fetchListings(1);
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
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Listing
        </Link>
      </div>

      {/* List View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Image Thumbnail */}
              <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                {listing.house_images && listing.house_images.length > 0 && listing.house_images[0].image_url ? (
                  <Image
                    src={listing.house_images[0].image_url}
                    alt={listing.title || 'Property image'}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="12" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Eye className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Listing Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                      {listing.accommodation_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {listing.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize">{listing.property_type}</span>
                      <span>•</span>
                      <span>{listing.bedrooms} bedrooms</span>
                      <span>•</span>
                      <span>{listing.max_guests} guests</span>
                      <span>•</span>
                      <span className="font-semibold text-gray-900">€{listing.price_per_night}/night</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                      listing.status === 'active'
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {listing.status === 'active' ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/en/host/edit/${listing.id}`}
                  className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="Edit listing"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete listing"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                
                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === listing.id ? null : listing.id)}
                    className="p-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    title="More actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDropdown === listing.id && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenDropdown(null)}
                      />
                      
                      {/* Dropdown Content */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <Link
                          href={`/en/host/rooms/${listing.id}`}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <DoorOpen className="h-4 w-4" />
                          Add Room
                        </Link>
                        <Link
                          href={`/en/account/special-pricing`}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <DollarSign className="h-4 w-4" />
                          Special Pricing
                        </Link>
                        {/* <button
                          onClick={() => {
                            // Handle duplicate listing
                            setOpenDropdown(null);
                            alert('Duplicate listing feature coming soon!');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate Listing
                        </button>
                        <button
                          onClick={() => {
                            togglePublish(listing.id, listing.status);
                            setOpenDropdown(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Archive className="h-4 w-4" />
                          {listing.status === 'active' ? 'Unpublish' : 'Publish'}
                        </button> */}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalCount > itemsPerPage && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} listings
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchListings(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchListings(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    page === currentPage
                      ? "bg-forest-600 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => fetchListings(currentPage + 1)}
              disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
