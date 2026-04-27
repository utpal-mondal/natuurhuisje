import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/utils/supabase/server";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ lang: string; slug: string }>;
};

type StayMetaRecord = {
  id: string;
  slug?: string | null;
  accommodation_name?: string | null;
  description?: string | null;
  location?: string | null;
  house_images?: { image_url: string; sort_order: number | null; is_primary?: boolean | null }[];
};

async function fetchStayMeta(slug: string): Promise<StayMetaRecord | null> {
  const supabase = await createClient();

  const { data: byId } = await supabase
    .from("houses")
    .select(
      `
      id,
      slug,
      accommodation_name,
      description,
      location,
      house_images (
        image_url,
        sort_order,
        is_primary
      )
    `,
    )
    .eq("id", slug)
    .maybeSingle();

  if (byId) return byId as unknown as StayMetaRecord;

  const { data: bySlug } = await supabase
    .from("houses")
    .select(
      `
      id,
      slug,
      accommodation_name,
      description,
      location,
      house_images (
        image_url,
        sort_order,
        is_primary
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  return (bySlug as unknown as StayMetaRecord) || null;
}

function resolveOgImageUrl(imageUrl: string, metadataBase: URL): string {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return new URL("/images/default-house.jpg", metadataBase).toString();
  }

  let normalized = trimmed;

  // Convert temporary signed URLs to stable public object URLs when possible.
  if (normalized.includes("/storage/v1/object/sign/")) {
    normalized = normalized.replace("/storage/v1/object/sign/", "/storage/v1/object/public/");
    normalized = normalized.split("?")[0];
  }

  if (normalized.startsWith("//")) {
    return `https:${normalized}`;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  return new URL(normalized, metadataBase).toString();
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const stay = await fetchStayMeta(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const metadataBase = new URL(siteUrl);

  const title = stay?.accommodation_name || "Nature house";
  const description =
    stay?.description?.trim() ||
    (stay?.location ? `Stay in ${stay.location}` : "Discover this nature stay.");

  const sortedImages = [...(stay?.house_images || [])].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
  });

  const firstImage = sortedImages[0]?.image_url || "/images/default-house.jpg";
  const ogImage = resolveOgImageUrl(firstImage, metadataBase);
  const canonicalPath = `/${lang}/stay/${stay?.slug || stay?.id || slug}`;
  const canonicalUrl = new URL(canonicalPath, metadataBase).toString();

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      images: [{ url: ogImage, alt: title, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function StaySlugLayout({ children }: LayoutProps) {
  return children;
}
