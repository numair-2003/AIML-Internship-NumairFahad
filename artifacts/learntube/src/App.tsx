import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Menu, X, LogOut, Play } from "lucide-react";
import { ProcessResult } from "@/api/client";
import { VideoInput } from "@/components/VideoInput";
import { LibrarySidebar } from "@/components/LibrarySidebar";
import { VideoWorkspace } from "@/pages/VideoWorkspace";
import { HomePage } from "@/pages/HomePage";

// ─── Clerk wiring (copy verbatim per skill) ────────────────────────────────
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// In development (*.replit.dev / localhost), Clerk JS connects to FAPI directly —
// the backend proxy returns 404 for dev keys so no proxy is needed.
// In production (custom .replit.app domain), ALL Clerk requests MUST go through
// the backend proxy at /api/__clerk so that session cookies are set for THIS
// domain rather than frontend-api.clerk.dev (cross-site cookies are blocked by
// browsers and cause the session to be dropped on every page load).
const _isDevHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.endsWith(".replit.dev") ||
  window.location.hostname.endsWith(".repl.co") ||
  // Replit workspace internal preview proxy (numeric IP or *.repl.co subdomain)
  /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname);

const clerkProxyUrl: string | undefined =
  import.meta.env.VITE_CLERK_PROXY_URL ||
  (_isDevHost ? undefined : `${window.location.origin}/api/__clerk`);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// ─── Clerk appearance ───────────────────────────────────────────────────────
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "blockButton" as const,
    socialButtonsPlacement: "top" as const,
  },
  variables: {
    colorPrimary: "#818cf8",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#f87171",
    colorBackground: "#0f172a",
    colorInput: "#1e293b",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#334155",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-slate-900 border border-slate-700/50 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-indigo-500/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-slate-900/80 !rounded-none",
    headerTitle: "text-white font-bold text-2xl tracking-tight",
    headerSubtitle: "text-slate-400 text-sm",
    socialButtonsBlockButtonText: "text-slate-200 font-medium text-sm",
    formFieldLabel: "text-slate-300 text-sm font-medium",
    footerActionLink: "text-indigo-400 hover:text-indigo-300 font-semibold",
    footerActionText: "text-slate-500 text-sm",
    dividerText: "text-slate-500 text-xs uppercase tracking-widest",
    identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-slate-200",
    logoBox: "flex items-center justify-center pt-2 pb-1",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "border border-slate-700 bg-slate-800 hover:bg-slate-700/80 text-white transition-all duration-200 rounded-xl",
    formButtonPrimary:
      "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-200 rounded-xl shadow-lg shadow-indigo-500/25",
    formFieldInput:
      "bg-slate-800 border-slate-600 text-white rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20",
    footerAction: "border-t border-slate-700/50 bg-slate-900/80",
    dividerLine: "bg-slate-700",
    alert: "border border-red-500/30 bg-red-500/10 rounded-xl",
    otpCodeFieldInput:
      "bg-slate-800 border-slate-600 text-white rounded-xl text-center",
    formFieldRow: "gap-3",
    main: "gap-5 px-8 py-6",
  },
};

// ─── Auth pages ─────────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#080d1a] px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          forceRedirectUrl={`${basePath}/app`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#080d1a] px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          forceRedirectUrl={`${basePath}/app`}
        />
      </div>
    </div>
  );
}

// ─── Workspace (authenticated) ───────────────────────────────────────────────
function AppPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleProcessed(videoId: string, _result: ProcessResult) {
    setCurrentVideoId(videoId);
    setSidebarRefresh((n) => n + 1);
    setSidebarOpen(false);
  }

  function handleSelectVideo(videoId: string) {
    setCurrentVideoId(videoId);
    setSidebarOpen(false);
  }

  function handleBack() {
    setCurrentVideoId(null);
  }

  // While Clerk is initialising (proxy round-trip) show a branded spinner
  // instead of a white flash. Only redirect once we KNOW the user is signed out.
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080d1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg"><span className="text-indigo-400">Learn</span><span className="text-white">Tube</span></span>
          </div>
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-[#080d1a] overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed md:relative inset-y-0 left-0 z-30
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:flex md:shrink-0
          `}
        >
          <LibrarySidebar
            currentVideoId={currentVideoId ?? undefined}
            onSelectVideo={handleSelectVideo}
            refreshTrigger={sidebarRefresh}
          />
        </div>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* App header */}
          <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-700/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden text-slate-400 hover:text-white transition-colors p-1"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Play className="h-3.5 w-3.5 text-white fill-white" />
                </div>
                <span className="font-bold text-sm tracking-tight">
                  <span className="text-indigo-400">Learn</span><span className="text-white">Tube</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {user.imageUrl ? (
                      <img src={user.imageUrl} alt={user.firstName ?? "User"} className="w-full h-full object-cover" />
                    ) : (
                      (user.firstName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase()
                    )}
                  </div>
                  <span className="text-slate-300 text-sm hidden sm:block">
                    {user.firstName ?? user.emailAddresses?.[0]?.emailAddress?.split("@")[0]}
                  </span>
                </div>
              )}
              <button
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-700/60 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          </header>

          {currentVideoId ? (
            <VideoWorkspace
              key={currentVideoId}
              videoId={currentVideoId}
              onBack={handleBack}
            />
          ) : (
            <VideoInput onProcessed={handleProcessed} />
          )}
        </main>
      </div>
  );
}

// ─── Home route (public landing or redirect) ─────────────────────────────────
function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/app" />
      </Show>
      <Show when="signed-out">
        <HomePage />
      </Show>
    </>
  );
}

// ─── Cache invalidator ───────────────────────────────────────────────────────
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== uid) {
        qc.clear();
      }
      prevUserIdRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

// ─── Router ──────────────────────────────────────────────────────────────────
function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInForceRedirectUrl={`${basePath}/app`}
      signUpForceRedirectUrl={`${basePath}/app`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to continue learning",
          },
          emailCode: {
            title: "Check your inbox",
            subtitle: "We sent a code to {{identifier}}",
            formTitle: "Verification code",
            formSubtitle:
              "Enter the 6-digit code. If you don't see it, check your spam/junk folder.",
            resendButton: "Didn't get it? Resend code",
          },
        },
        signUp: {
          start: {
            title: "Start learning today",
            subtitle: "Create your free LearnTube account",
          },
          emailCode: {
            title: "Verify your email",
            subtitle: "We sent a code to {{identifier}}",
            formTitle: "Verification code",
            formSubtitle:
              "Enter the 6-digit code sent to your email. Check your spam/junk folder if it doesn't arrive within a minute.",
            resendButton: "Didn't receive it? Resend code",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRoute} />
          <Route path="/app" component={AppPage} />
          {/* REQUIRED — exact pattern with /*? optional wildcard */}
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
