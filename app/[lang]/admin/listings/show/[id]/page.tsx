"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MapPin, BedDouble, Users, Bath } from "lucide-react";

type HouseDetails = {
  id: number;
  accommodation_name: string | null;
  description: string | null;
  location: string | null;
  type: string | null;
  status: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  max_person?: number | null;
  price_per_night: number | null;
  created_at: string;
  house_images?: {
    id?: number;
    image_url: string;
    sort_order: number;
    is_primary?: boolean;
  }[];
  images?: string[];
  special_pricing?: {
    id: number;
    start_date: string;
    end_date: string;
    price_per_night: number;
    occasion_name?: string | null;
    status?: string | null;
  }[];
  [key: string]: unknown;
};

type CategoryOption = {
  id: number;
  name: string;
  image_url?: string | null;
};

type HouseCategoryTag = {
  category_id: number;
  name: string;
};

type BookingMetricPoint = {
  date: string;
  bookingCount: number;
  salesAmount: number;
};

export default function AdminShowListingPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;
  const supabase = useMemo(() => createClient(), []);

  const [listing, setListing] = useState<HouseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [houseCategories, setHouseCategories] = useState<HouseCategoryTag[]>(
    [],
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isAssigningCategory, setIsAssigningCategory] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [bookingChartData, setBookingChartData] = useState<
    BookingMetricPoint[]
  >([]);
  const [bookingTotals, setBookingTotals] = useState({
    totalBookings: 0,
    totalSales: 0,
  });
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const fetchCategoryData = async (houseId: number | string) => {
    const [categoriesRes, houseCategoriesRes] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, image_url")
        .order("name", { ascending: true }),
      (supabase as any)
        .from("house_categories")
        .select("category_id, categories ( id, name )")
        .eq("house_id", houseId),
    ]);

    if (!categoriesRes.error) {
      setAllCategories((categoriesRes.data || []) as CategoryOption[]);
    }

    if (!houseCategoriesRes.error) {
      const mapped = ((houseCategoriesRes.data || []) as any[])
        .map((item) => ({
          category_id: item.category_id as number,
          name: item.categories?.name as string,
        }))
        .filter((item) => item.category_id && item.name);
      setHouseCategories(mapped);
      setSelectedCategoryIds(mapped.map((item) => item.category_id));
    } else {
      setCategoryMessage(
        `Category links unavailable: ${houseCategoriesRes.error.message}`,
      );
    }
  };

  const fetchBookingMetrics = async (houseId: number | string) => {
    setIsMetricsLoading(true);
    setMetricsError(null);

    const { data, error: bookingError } = await (supabase as any)
      .from("bookings")
      .select("check_in, created_at, total_price, status")
      .eq("house_id", houseId)
      .order("created_at", { ascending: true });

    if (bookingError) {
      setBookingChartData([]);
      setBookingTotals({ totalBookings: 0, totalSales: 0 });
      setMetricsError(`Booking analytics unavailable: ${bookingError.message}`);
      setIsMetricsLoading(false);
      return;
    }

    const rows = (data || []) as {
      check_in?: string | null;
      created_at?: string | null;
      total_price?: number | null;
      status?: string | null;
    }[];

    const dayMap = new Map<string, BookingMetricPoint>();
    const now = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - index);
      const key = day.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, bookingCount: 0, salesAmount: 0 });
    }

    rows.forEach((row) => {
      const rawDate = row.check_in || row.created_at;
      if (!rawDate) return;

      const dateKey = rawDate.slice(0, 10);
      const point = dayMap.get(dateKey);
      if (!point) return;

      if (row.status !== "cancelled") {
        point.bookingCount += 1;
      }

      if (row.status === "confirmed" || row.status === "completed") {
        point.salesAmount += Number(row.total_price || 0);
      }
    });

    const chartPoints = Array.from(dayMap.values());
    const totalBookings = chartPoints.reduce(
      (sum, point) => sum + point.bookingCount,
      0,
    );
    const totalSales = chartPoints.reduce(
      (sum, point) => sum + point.salesAmount,
      0,
    );

    setBookingChartData(chartPoints);
    setBookingTotals({ totalBookings, totalSales });
    setIsMetricsLoading(false);
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);

        const numericId = Number(id);
        const listingId = Number.isNaN(numericId) ? id : numericId;

        const { data, error: fetchError } = await supabase
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
            )
          `,
          )
          .eq("id", listingId)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        const row = data as any;
        setListing({
          ...row,
          max_guests: row.max_guests ?? row.max_person ?? null,
        } as HouseDetails);
        await Promise.all([
          fetchCategoryData(listingId),
          fetchBookingMetrics(listingId),
        ]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load listing details",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchListing();
    }
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        {error || "Listing not found"}
      </div>
    );
  }

  const sortedImages = [...(listing.house_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const relatedImages = sortedImages
    .map((image) => image.image_url)
    .filter(Boolean);
  const legacyImages = (listing.images || []).filter(Boolean);
  const allImages = Array.from(new Set([...relatedImages, ...legacyImages]));
  const heroImage = allImages[0] || "";
  const visibleFields = Object.entries(listing).filter(
    ([key]) =>
      key !== "house_images" &&
      key !== "id" &&
      key !== "created_at" &&
      key !== "special_pricing" &&
      key !== "registration_number_option" &&
      key !== "status" &&
      key !== "updated_at" &&
      key !== "search_embedding" &&
      key !== "host_id" &&
      key !== "search_vector" &&
      key !== "embedding_model" &&
      key !== "embedding_updated_at" &&
      key !== "amenities_embedding" &&
      key !== "embedding_model" &&
      key !== "location_embedding" &&
      key !== "description_embedding" &&
      key !== "safety_deposit" &&
      key !== "land_registration_option",
  );

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string" || typeof value === "number")
      return String(value);
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      return JSON.stringify(value, null, 2);
    }
    return JSON.stringify(value, null, 2);
  };

  const formatFieldLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const normalizeTextArrayValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : String(item)))
        .filter(Boolean);
    }

    if (typeof value !== "string") {
      return [];
    }

    const raw = value.trim();
    if (!raw) return [];

    // Handles Postgres text[] format like {wifi,tv} or plain comma/newline text.
    const cleaned = raw.startsWith("{") && raw.endsWith("}")
      ? raw.slice(1, -1)
      : raw;

    return cleaned
      .split(/,|\n/)
      .map((item) => item.replace(/^"|"$/g, "").trim())
      .filter(Boolean);
  };

  const specialPricingEntries = [...(listing.special_pricing || [])].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );

  const getSpecialPricingStatusClass = (status?: string | null) => {
    if (status === "active") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "inactive") {
      return "bg-slate-100 text-slate-700";
    }
    if (status === "draft") {
      return "bg-amber-100 text-amber-700";
    }
    return "bg-blue-100 text-blue-700";
  };

  const filteredCategories = allCategories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase().trim()),
  );

  const badgeColorClasses = [
    "bg-red-400/10 text-red-500 inset-ring inset-ring-red-400/20",
    "bg-yellow-400/10 text-yellow-600 inset-ring inset-ring-yellow-400/20",
    "bg-green-400/10 text-green-600 inset-ring inset-ring-green-500/20",
    "bg-blue-400/10 text-blue-500 inset-ring inset-ring-blue-400/30",
    "bg-indigo-400/10 text-indigo-500 inset-ring inset-ring-indigo-400/30",
    "bg-purple-400/10 text-purple-500 inset-ring inset-ring-purple-400/30",
    "bg-pink-400/10 text-pink-500 inset-ring inset-ring-pink-400/20",
  ];

  const badgeDotColorClasses = [
    "bg-red-700",
    "bg-yellow-700",
    "bg-green-700",
    "bg-blue-700",
    "bg-indigo-700",
    "bg-purple-700",
    "bg-pink-700",
  ];

  const maxBookingCount = Math.max(
    1,
    ...bookingChartData.map((point) => point.bookingCount),
  );
  const maxSalesAmount = Math.max(
    1,
    ...bookingChartData.map((point) => point.salesAmount),
  );

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((idValue) => idValue !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleAssignCategory = async () => {
    if (!listing) return;

    const existingCategoryIds = houseCategories.map(
      (category) => category.category_id,
    );
    const existingCategoryIdSet = new Set(existingCategoryIds);
    const selectedCategoryIdSet = new Set(selectedCategoryIds);

    const categoryIdsToInsert = selectedCategoryIds.filter(
      (categoryId) => !existingCategoryIdSet.has(categoryId),
    );
    const categoryIdsToDelete = existingCategoryIds.filter(
      (categoryId) => !selectedCategoryIdSet.has(categoryId),
    );

    if (categoryIdsToInsert.length === 0 && categoryIdsToDelete.length === 0) {
      setCategoryMessage("No category changes to save.");
      setIsCategoryModalOpen(false);
      return;
    }

    setIsAssigningCategory(true);
    setCategoryMessage(null);

    if (categoryIdsToInsert.length > 0) {
      const payload = categoryIdsToInsert.map((categoryId) => ({
        house_id: listing.id,
        category_id: categoryId,
      }));

      const { error: assignError } = await (supabase as any)
        .from("house_categories")
        .insert(payload);

      if (assignError) {
        if (assignError.code === "23505") {
          setCategoryMessage(
            "This category is already assigned to this house.",
          );
        } else {
          setCategoryMessage(
            `Failed to assign category: ${assignError.message}`,
          );
        }
        setIsAssigningCategory(false);
        return;
      }
    }

    if (categoryIdsToDelete.length > 0) {
      const { error: removeError } = await (supabase as any)
        .from("house_categories")
        .delete()
        .eq("house_id", listing.id)
        .in("category_id", categoryIdsToDelete);

      if (removeError) {
        setCategoryMessage(`Failed to remove category: ${removeError.message}`);
        setIsAssigningCategory(false);
        return;
      }
    }

    setCategoryMessage("Categories updated successfully.");
    setIsCategoryModalOpen(false);
    setCategorySearch("");
    await fetchCategoryData(listing.id);
    setIsAssigningCategory(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/${lang}/admin/listings`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Listings
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/${lang}/host/edit/${listing.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit House
          </Link>
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryIds(
                houseCategories.map((category) => category.category_id),
              );
              setCategorySearch("");
              setIsCategoryModalOpen(true);
              setCategoryMessage(null);
            }}
            className="rounded-lg bg-[#5b2d8e] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c2476] disabled:opacity-60"
          >
            Add Category
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {houseCategories.length > 0 &&
          houseCategories.map((category, index) => (
            <span
              key={`top-category-badge-${category.category_id}`}
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                badgeColorClasses[index % badgeColorClasses.length]
              }`}
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                  badgeDotColorClasses[index % badgeDotColorClasses.length]
                }`}
              />
              {category.name}
            </span>
          ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Bookings & Sales
          </h3>
          <p className="text-xs text-slate-500">Last 7 days (date-wise)</p>
        </div>

        {isMetricsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 rounded-lg bg-slate-100" />
              <div className="h-16 rounded-lg bg-slate-100" />
            </div>
            <div className="h-36 rounded-lg bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 transition-all duration-500 hover:-translate-y-0.5">
                <p className="text-xs font-medium text-blue-600">
                  Bookings Count
                </p>
                <p className="mt-1 text-2xl font-semibold text-blue-700">
                  {bookingTotals.totalBookings}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 transition-all duration-500 hover:-translate-y-0.5">
                <p className="text-xs font-medium text-emerald-600">
                  Sales (EUR)
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">
                  {bookingTotals.totalSales.toLocaleString()}
                </p>
              </div>
            </div>

            {metricsError ? (
              <p className="text-sm text-rose-600">{metricsError}</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[420px] rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-4 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      Bookings
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Sales
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    {bookingChartData.map((point) => {
                      const bookingHeight = Math.max(
                        (point.bookingCount / maxBookingCount) * 100,
                        point.bookingCount > 0 ? 8 : 0,
                      );
                      const salesHeight = Math.max(
                        (point.salesAmount / maxSalesAmount) * 100,
                        point.salesAmount > 0 ? 8 : 0,
                      );

                      return (
                        <div
                          key={`chart-day-${point.date}`}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="flex h-24 items-end gap-1">
                            <div
                              className="w-2 rounded-t bg-blue-500 transition-all duration-700"
                              style={{ height: `${bookingHeight}%` }}
                            />
                            <div
                              className="w-2 rounded-t bg-emerald-500 transition-all duration-700"
                              style={{ height: `${salesHeight}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-medium text-slate-500">
                            {new Date(point.date).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900">
                Select Categories
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                disabled={isAssigningCategory}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            {categoryMessage && (
              <p className="text-sm text-slate-600">{categoryMessage}</p>
            )}

            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Search categories..."
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#5b2d8e]"
            />

            <div className="max-h-[55vh] overflow-y-auto pr-1">
              {filteredCategories.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategoryIds.includes(
                      category.id,
                    );
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleCategorySelection(category.id)}
                        className={`relative overflow-hidden rounded-xl border bg-white text-left transition hover:shadow-md ${
                          isSelected
                            ? "border-[#5b2d8e] ring-2 ring-[#5b2d8e]/25"
                            : "border-slate-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="absolute right-2 top-2 h-4 w-4 cursor-pointer accent-[#5b2d8e]"
                        />
                        <div className="h-28 w-full bg-slate-100">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-500">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-1 text-sm font-semibold text-slate-800">
                            {category.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No categories found for this search.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                Selected: {selectedCategoryIds.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={isAssigningCategory}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleAssignCategory()}
                  disabled={isAssigningCategory}
                  className="rounded-lg bg-[#5b2d8e] px-4 py-2 text-sm font-medium text-white hover:bg-[#4c2476] disabled:opacity-60"
                >
                  {isAssigningCategory ? "Saving..." : "Submit Categories"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={listing.accommodation_name || "Listing image"}
                width={900}
                height={600}
                className="h-80 w-full object-cover"
              />
            ) : (
              <div className="flex h-80 items-center justify-center text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {listing.accommodation_name || "Untitled Listing"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {listing.description || "No description"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Type</p>
                <p className="font-medium capitalize">{listing.type || "-"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <p className="font-medium capitalize">
                  {listing.status || "-"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Price</p>
                <p className="font-medium">
                  EUR {listing.price_per_night || 0}/night
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Created</p>
                <p className="font-medium">
                  {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {listing.location || "No location"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="h-4 w-4" />
                {listing.bedrooms || 0} bedrooms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Bath className="h-4 w-4" />
                {listing.bathrooms || 0} bathrooms
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {listing.max_guests || 0} guests
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Special Pricing</h2>
          <span className="text-xs text-slate-500">
            Total: {specialPricingEntries.length}
          </span>
        </div>

        {specialPricingEntries.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {specialPricingEntries.map((pricing) => (
              <div
                key={pricing.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {pricing.occasion_name || "Special rate"}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${getSpecialPricingStatusClass(
                      pricing.status,
                    )}`}
                  >
                    {pricing.status || "scheduled"}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-slate-700">
                  <p>
                    <span className="text-slate-500">Date:</span>{" "}
                    {new Date(pricing.start_date).toLocaleDateString()} -{" "}
                    {new Date(pricing.end_date).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="text-slate-500">Price:</span> EUR{" "}
                    {pricing.price_per_night}/night
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No special pricing configured for this listing.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          All Images
        </h2>
        {allImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {allImages.map((imageUrl, index) => (
              <div
                key={`${imageUrl}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <Image
                  src={imageUrl}
                  alt={`Listing image ${index + 1}`}
                  width={400}
                  height={300}
                  className="h-32 w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No images available for this listing.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          All Listing Fields
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleFields.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              {(() => {
                const includedFacilitiesItems =
                  key === "included_facilities"
                    ? normalizeTextArrayValue(value)
                    : [];

                return (
                  <>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {formatFieldLabel(key)}
              </p>
              {key === "included_facilities" ? (
                includedFacilitiesItems.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {includedFacilitiesItems.map((item, index) => (
                      <li key={`${key}-${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-700">-</p>
                )
              ) : Array.isArray(value) ? (
                value.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {value.map((item, index) => (
                      <li key={`${key}-${index}`}>
                        {typeof item === "object" && item !== null ? (
                          <pre className="whitespace-pre-wrap break-all text-sm text-slate-700">
                            {formatValue(item)}
                          </pre>
                        ) : (
                          formatValue(item)
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-700">[]</p>
                )
              ) : typeof value === "object" ? (
                <pre className="whitespace-pre-wrap break-all text-sm text-slate-700">
                  {formatValue(value)}
                </pre>
              ) : (
                <p className="text-sm text-slate-700">{formatValue(value)}</p>
              )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
