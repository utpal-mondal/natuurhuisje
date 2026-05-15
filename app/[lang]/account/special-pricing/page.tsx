import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SpecialPricingSelector from "@/components/host/SpecialPricingSelector";
import { Building } from "lucide-react";
import { Suspense, use } from "react";
import { i18n, type Locale } from "@/i18n/config";

async function SpecialPricingContent({ lang }: { lang: Locale }) {
  const supabase = await createClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      redirect(`/${lang}/login`);
    }

    // Get user's properties
    const { data: properties, error } = await (supabase as any)
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
      .eq("host_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      throw error;
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Special Pricing
          </h1>
          <p className="mt-2 text-gray-600">
            Set custom prices for holidays, weekends, and peak seasons
          </p>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Properties Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You need to create a property before you can set special
              pricing.
            </p>
            <a
              href={`/${lang}/host/new`}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Your First Property
            </a>
          </div>
        ) : (
          <SpecialPricingSelector properties={properties} lang={lang} />
        )}
      </div>
    );
  } catch (error) {
    console.error("Error in SpecialPricingContent:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-2">
          Error Loading Special Pricing
        </h2>
        <p className="text-red-700">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again later."}
        </p>
      </div>
    );
  }
}

export default function HostBookingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);

  // Validate that lang is a supported locale
  if (!i18n.locales.includes(lang as Locale)) {
    throw new Error(`Unsupported locale: ${lang}`);
  }

  const validatedLang = lang as Locale;

  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div>
            <div className="h-9 w-48 bg-gray-200 rounded" />
            <div className="mt-2 h-5 w-96 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-12 w-full bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-7 gap-2">
              {[...Array(14)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SpecialPricingContent lang={validatedLang} />
    </Suspense>
  );
}
