import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import {
  User,
  Grid,
  Building,
  MessageSquare,
  Heart,
  Calendar,
  HelpCircle,
  Settings,
  LogOut,
  Home,
} from "lucide-react";

export default async function AdminDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/admin/login`);
  }

  const { data: adminData } = await (supabase as any)
    .from("admin_users")
    .select("auth_user_id, role")
    .eq("auth_user_id", user.id)
    .single();

  const isAdmin = adminData?.role === "admin";

  // Get user profile from users table
  let profile: any = null;
  try {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    profile = data;
  } catch (error) {
    console.log("Profile fetch failed, using metadata fallback");
  }

  // Get properties
  let propertiesQuery = (supabase as any)
    .from("houses")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    propertiesQuery = propertiesQuery.eq("host_id", user.id);
  }

  const { data: properties } = await propertiesQuery;

  // Get bookings
  let bookingsQuery = (supabase as any)
    .from("bookings")
    .select(
      `
      *,
      listings(
        id, title, slug, images, location, price_per_night, avg_rating
      )
    `,
    )
    .order("check_in_date", { ascending: false });

  if (!isAdmin) {
    bookingsQuery = bookingsQuery.eq("guest_id", user.id);
  }

  const { data: bookings } = (await bookingsQuery) as { data: any[] | null };

  console.log("bookings", bookings);

  // Get favorites
  let favoritesQuery = (supabase as any)
    .from("favorites")
    .select(
      `
      *,
      listings(
        id, title, slug, images, location, price_per_night, avg_rating
      )
    `,
    );

  if (!isAdmin) {
    favoritesQuery = favoritesQuery.eq("user_id", user.id);
  }

  const { data: favorites } = (await favoritesQuery) as { data: any[] | null };

  // Calculate statistics
  const totalProperties = properties?.length || 0;
  const activeBookings =
    bookings?.filter(
      (booking) =>
        booking.status === "confirmed" || booking.status === "pending",
    ).length || 0;
  const totalRevenue =
    bookings
      ?.filter((booking) => booking.status === "completed")
      .reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
  const messageCount = 0; // TODO: Implement when messaging system is ready

  // Format user name - prioritize metadata since it's more reliable
  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;

  if (!profile) {
    profile = {
      first_name: user.user_metadata?.first_name || "User",
      last_name: user.user_metadata?.last_name || "",
      email: user.email || "",
    };
  }

  const fullName =
    firstName && lastName
      ? `${firstName} ${lastName}`
      : profile?.display_name ||
        (profile?.first_name && profile?.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : "User");

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Properties
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalProperties}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeBookings}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                €{totalRevenue}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messageCount}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isAdmin ? "Recent System Bookings" : "Recent Bookings"}
        </h2>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {booking.listings?.images?.[0] && (
                    <Image
                      src={booking.listings.images[0]}
                      alt={booking.listings.title}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {booking.listings?.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.check_in_date).toLocaleDateString()} -{" "}
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    €{booking.total_price}
                  </p>
                  <p className="text-sm text-gray-600">{booking.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No bookings yet</p>
        )}
      </div>

      {/* Recent Properties */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isAdmin ? "All Properties" : "Your Properties"}
        </h2>
        {properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.slice(0, 3).map((property: any) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {property.accommodation_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {property.type} • {property.location}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    €{property.price_per_night}/night
                  </p>
                  <p className="text-sm text-gray-600">
                    {property.status === "active" ? "Published" : "Draft"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No properties yet</p>
        )}
      </div>
    </>
  );
}
