type ModernPageLoaderProps = {
  title?: string;
  subtitle?: string;
  variant?: "default" | "stayDetail";
};

export function ModernPageLoader({
  title = "Loading",
  subtitle = "Preparing your experience",
  variant = "default",
}: ModernPageLoaderProps) {
  if (variant === "stayDetail") {
    return (
      <div className="min-h-screen bg-white text-gray-700">
        <div className="container-custom py-6">
          <div className="mb-6 h-6 w-48 animate-pulse rounded-md bg-gray-200" />

          <div className="grid h-115 grid-cols-4 gap-2 overflow-hidden rounded-2xl">
            <div className="col-span-2 row-span-2 animate-pulse rounded-xl bg-gray-300" />
            <div className="animate-pulse rounded-xl bg-gray-200" />
            <div className="animate-pulse rounded-xl bg-gray-200" />
            <div className="animate-pulse rounded-xl bg-gray-200" />
            <div className="animate-pulse rounded-xl bg-gray-200" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div>
                <div className="h-9 w-4/5 animate-pulse rounded-lg bg-gray-300" />
                <div className="mt-3 h-5 w-2/5 animate-pulse rounded-full bg-gray-200" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`stay-facts-${index}`}
                    className="h-20 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="mb-4 h-6 w-56 animate-pulse rounded-md bg-gray-300" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={`stay-amenity-${index}`}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
                      <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:h-fit">
              <div className="h-8 w-32 animate-pulse rounded-md bg-gray-300" />
              <div className="mt-5 space-y-3">
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />
              </div>
              <div className="mt-5 h-11 w-full animate-pulse rounded-xl bg-gray-300" />
              <div className="mt-6 space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`stay-price-line-${index}`}
                    className="h-4 animate-pulse rounded-full bg-gray-200"
                    style={{ width: `${92 - index * 12}%` }}
                  />
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-700">
      <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
        <div className="container-custom flex h-16 items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded-md bg-gray-300" />
          <div className="hidden items-center gap-3 md:flex">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`nav-skeleton-${i}`}
                className="h-4 w-16 animate-pulse rounded-full bg-gray-200"
              />
            ))}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-gray-200 bg-linear-to-b from-gray-200 to-gray-100">
        <div className="absolute -left-20 top-8 h-40 w-40 animate-pulse rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -right-16 bottom-4 h-36 w-36 animate-pulse rounded-full bg-white/25 blur-3xl" />
        <div className="container-custom relative py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-4 h-7 w-36 animate-pulse rounded-full bg-gray-300/90" />
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="mt-2 text-sm text-gray-600 md:text-base">{subtitle}</p>

            <div className="mx-auto mt-7 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm">
              <div className="h-11 w-full animate-pulse rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <main className="container-custom py-10 md:py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="h-7 w-56 animate-pulse rounded-lg bg-gray-300" />
            <div className="mt-2 h-4 w-44 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="hidden h-9 w-24 animate-pulse rounded-full bg-gray-200 md:block" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <article
              key={`modern-loader-card-${index}`}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="relative h-44 overflow-hidden bg-gray-300">
                <div
                  className="absolute inset-0 animate-pulse bg-linear-to-r from-gray-300 via-gray-200 to-gray-300"
                  style={{ animationDelay: `${index * 110}ms` }}
                />
              </div>
              <div className="space-y-3 p-4">
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-gray-300" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-200" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-gray-300" />
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 h-6 w-48 animate-pulse rounded-lg bg-gray-300" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`modern-loader-line-${index}`}
                className="h-4 animate-pulse rounded-full bg-gray-200"
                style={{ width: `${95 - index * 11}%` }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
