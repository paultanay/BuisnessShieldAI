import { useEffect, useRef, useState, useCallback } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetOnboardingStatus, getGetOnboardingStatusQueryKey } from "@business-shield/api-client-react";

import { CommandPalette } from "./components/CommandPalette";
import { OnboardingPage } from "./pages/OnboardingPage";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WebsitesPage } from "./pages/WebsitesPage";
import { WebsiteDetailPage } from "./pages/WebsiteDetailPage";
import { ScanDetailPage } from "./pages/ScanDetailPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { ReportsPage } from "./pages/ReportsPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { AlertsPage } from "./pages/AlertsPage";
import { TeamPage } from "./pages/TeamPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { BillingPage } from "./pages/BillingPage";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(243 75% 59%)",
    colorForeground: "hsl(0 0% 98%)",
    colorMutedForeground: "hsl(240 5% 65%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(240 10% 8%)",
    colorInput: "hsl(240 10% 15%)",
    colorInputForeground: "hsl(0 0% 98%)",
    colorNeutral: "hsl(240 10% 15%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function OnboardingGate({ component: Component }: { component: any }) {
  const { data: status, isLoading, isError } = useGetOnboardingStatus({
    query: {
      queryKey: getGetOnboardingStatusQueryKey(),
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => failureCount < 3 && error?.status === 401,
      retryDelay: (attempt: number) => 800 * (attempt + 1),
      throwOnError: false,
    },
  });
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !status?.completed) {
    return (
      <OnboardingPage
        onComplete={() => {
          queryClient.invalidateQueries({ queryKey: getGetOnboardingStatusQueryKey() });
        }}
      />
    );
  }

  return <Component />;
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <OnboardingGate component={Component} />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setCmdOpen((o) => !o);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
            <Route path="/websites" component={() => <ProtectedRoute component={WebsitesPage} />} />
            <Route path="/websites/:id" component={() => <ProtectedRoute component={WebsiteDetailPage} />} />
            <Route path="/websites/:id/scans/:scanId" component={() => <ProtectedRoute component={ScanDetailPage} />} />
            <Route path="/monitoring" component={() => <ProtectedRoute component={MonitoringPage} />} />
            <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
            <Route path="/policies" component={() => <ProtectedRoute component={PoliciesPage} />} />
            <Route path="/alerts" component={() => <ProtectedRoute component={AlertsPage} />} />
            <Route path="/team" component={() => <ProtectedRoute component={TeamPage} />} />
            <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
            <Route path="/developer" component={() => <ProtectedRoute component={DeveloperPage} />} />
            <Route path="/audit-logs" component={() => <ProtectedRoute component={AuditLogsPage} />} />
            <Route path="/billing" component={() => <ProtectedRoute component={BillingPage} />} />
            <Route>
              <div className="flex h-screen items-center justify-center text-muted-foreground">404 - Not Found</div>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
