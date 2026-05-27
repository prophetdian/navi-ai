import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check, Zap, Crown, Loader2, ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

const ONE_TIME_FEATURES = [
  "Unlimited NAVI conversations — forever",
  "All 4 chat modes (Agent, Chat, Code, Research)",
  "File upload & analysis",
  "Voice input via Whisper",
  "AI image generation",
  "Live web search",
  "Chat history & export",
  "No monthly fees",
];

const MONTHLY_FEATURES = [
  "Everything in Lifetime, monthly",
  "Priority response speed",
  "Early access to new features",
  "Cancel anytime",
];

export default function Payment() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<"one_time" | "monthly">("one_time");
  const [loading, setLoading] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  const paymentStatus = trpc.payment.status.useQuery(undefined, { enabled: isAuthenticated });
  const createOrder = trpc.payment.createOrder.useMutation();
  const captureOrder = trpc.payment.captureOrder.useMutation();
  const createSubscription = trpc.payment.createSubscription.useMutation();
  const utils = trpc.useUtils();

  // Redirect if already has access
  useEffect(() => {
    if (paymentStatus.data?.hasAccess) {
      navigate("/chat");
    }
  }, [paymentStatus.data]);

  // Load PayPal SDK
  useEffect(() => {
    if (!isAuthenticated) return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      console.warn("PayPal client ID not configured");
      setPaypalLoaded(false);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&vault=true&enable-funding=venmo`;
    script.async = true;
    script.onload = () => setPaypalLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [isAuthenticated]);

  // Render PayPal buttons when SDK is loaded
  useEffect(() => {
    if (!paypalLoaded || !window.paypal) return;
    const container = document.getElementById("paypal-button-container");
    if (!container) return;
    container.innerHTML = "";

    if (selectedPlan === "one_time") {
      window.paypal.Buttons({
        createOrder: async () => {
          const result = await createOrder.mutateAsync({ planType: "one_time" });
          return result.orderId;
        },
        onApprove: async (data: Record<string, string>) => {
          setLoading(true);
          try {
            const result = await captureOrder.mutateAsync({ orderId: data['orderID'] ?? '' });
            if (result.success) {
              await utils.payment.status.invalidate();
              toast.success("Welcome to NAVI! Your access is now active.");
              navigate("/chat");
            } else {
              toast.error("Payment could not be completed. Please try again.");
            }
          } catch {
            toast.error("Payment error. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        onError: () => {
          toast.error("PayPal encountered an error. Please try again.");
        },
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      }).render("#paypal-button-container");
    } else {
      // Monthly subscription
      const planId = import.meta.env.VITE_PAYPAL_MONTHLY_PLAN_ID;
      if (!planId) {
        container.innerHTML = '<p class="text-muted-foreground text-sm text-center">Monthly subscription coming soon.</p>';
        return;
      }
      window.paypal.Buttons({
        createSubscription: (_data: unknown, actions: { subscription: { create: (config: Record<string, unknown>) => Promise<string> } }) => {
          return actions.subscription.create({ plan_id: planId });
        },
        onApprove: async (data: Record<string, string>) => {
          setLoading(true);
          try {
            await createSubscription.mutateAsync({ subscriptionId: data['subscriptionID'] ?? '' });
            await utils.payment.status.invalidate();
            toast.success("Welcome to NAVI! Your monthly subscription is active.");
            navigate("/chat");
          } catch {
            toast.error("Subscription error. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        onError: () => {
          toast.error("PayPal encountered an error. Please try again.");
        },
        style: { layout: "vertical", color: "blue", shape: "rect", label: "subscribe" },
      }).render("#paypal-button-container");
    }
  }, [paypalLoaded, selectedPlan]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <img src="/manus-storage/navi-mascot_e743e72a.png" alt="NAVI" className="w-24 h-24 object-contain mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Sign in to continue</h2>
          <p className="text-muted-foreground mb-6">You need to sign in before unlocking NAVI.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="navi-glow">
            Sign In with Manus
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img src="/manus-storage/navi-mascot_e743e72a.png" alt="NAVI" className="w-8 h-8 object-contain" />
          <span className="text-xl font-semibold text-primary">NAVI</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">
            Unlock <span className="text-primary navi-glow-text">NAVI</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            One simple payment. Full access. No API keys needed.
          </p>
        </div>

        {/* Plan selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* One-time */}
          <button
            onClick={() => setSelectedPlan("one_time")}
            className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${
              selectedPlan === "one_time"
                ? "border-primary bg-accent/30 navi-glow"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-lg">Lifetime Access</div>
                <div className="text-muted-foreground text-sm">Pay once, use forever</div>
              </div>
              {selectedPlan === "one_time" && (
                <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-primary mb-4">$19.99</div>
            <ul className="space-y-2">
              {ONE_TIME_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`p-6 rounded-xl border-2 text-left transition-all duration-200 relative ${
              selectedPlan === "monthly"
                ? "border-primary bg-accent/30 navi-glow"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
              Most Flexible
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-lg">Monthly Access</div>
                <div className="text-muted-foreground text-sm">Cancel anytime</div>
              </div>
              {selectedPlan === "monthly" && (
                <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-primary mb-4">$9.99<span className="text-base font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2">
              {MONTHLY_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </button>
        </div>

        {/* PayPal button area */}
        <div className="max-w-md mx-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing payment...
            </div>
          )}
          {!paypalLoaded && !loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading payment options...
            </div>
          )}
          <div id="paypal-button-container" className="min-h-[50px]" />
          <p className="text-center text-xs text-muted-foreground mt-4">
            Secured by PayPal · No credit card stored · Cancel anytime (monthly plan)
          </p>
        </div>
      </div>
    </div>
  );
}
