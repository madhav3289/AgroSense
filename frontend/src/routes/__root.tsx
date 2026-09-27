import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "../lib/auth";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { PageShell } from "../components/PageShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-green-200 bg-white/90 p-8 text-center shadow-lg backdrop-blur-md">
        <h1 className="text-7xl font-extrabold text-green-800">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-green-900">Page not found 🌱</h2>
        <p className="mt-2 text-sm text-green-800/80">
          This field hasn't been sown yet — the page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            Back to AgroSense
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="max-w-md rounded-2xl border border-green-200 bg-white/90 p-8 text-center shadow-lg backdrop-blur-md">
        <h1 className="text-xl font-extrabold text-green-800">This page didn't load</h1>
        <p className="mt-2 text-sm text-green-900/80">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-green-300 px-4 py-3 font-semibold text-green-800 transition hover:bg-green-50"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgroSense — Smart Agriculture for Farmers" },
      {
        name: "description",
        content:
          "AgroSense helps farmers pick the right crop, restore soil, detect plant diseases and track mandi prices.",
      },
      { name: "author", content: "AgroSense" },
      { property: "og:title", content: "AgroSense — Smart Agriculture for Farmers" },
      {
        property: "og:description",
        content:
          "Crop recommendation, soil restoration, disease detection and mandi prices in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PageShell>
          <Navbar />
          <main className="min-h-[70vh]">
            {/* Required: nested routes render here. */}
            <Outlet />
          </main>
          <Footer />
        </PageShell>
      </AuthProvider>
    </QueryClientProvider>
  );
}
