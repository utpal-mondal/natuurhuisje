type PageLoadingSkeletonProps = {
  title?: string;
  subtitle?: string;
  cardCount?: number;
};

export function PageLoadingSkeleton({
  title = "Loading content",
  subtitle = "Please wait a moment",
  cardCount = 6,
}: PageLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative overflow-hidden bg-gray-300/70">
        <div className="h-[44vh] md:h-[56vh] animate-pulse bg-linear-to-r from-gray-300 via-gray-200 to-gray-300" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_55%)]" />
      </div>

      <div className="container-custom -mt-16 relative z-10 pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-gray-200/80 p-5 shadow-sm animate-pulse">
          <div className="h-4 w-40 rounded-full bg-gray-300" />
          <div className="mt-3 h-10 w-full rounded-xl bg-gray-300" />
        </div>

        <div className="mt-12">
          <div className="mb-6">
            <div className="h-8 w-72 rounded-lg bg-gray-300 animate-pulse" />
            <div className="mt-2 h-4 w-48 rounded-full bg-gray-200 animate-pulse" />
            <p className="sr-only">
              {title} {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={`page-loading-card-${index}`}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div
                  className="h-44 bg-gray-300 animate-pulse"
                  style={{ animationDelay: `${index * 120}ms` }}
                />
                <div className="space-y-3 p-4">
                  <div
                    className="h-4 w-3/4 rounded-full bg-gray-300 animate-pulse"
                    style={{ animationDelay: `${index * 120 + 60}ms` }}
                  />
                  <div className="h-3 w-1/2 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-1/3 rounded-full bg-gray-300 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
