import { useEffect, useState } from "react";
import { X, Check, Loader2, Sparkles } from "lucide-react";
import { analytics, ANALYTICS_EVENTS, EXPERIMENTS } from "../utils/analytics";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Plan {
  id: string;
  name: string;
  price: number; // VND / tháng
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 99000,
    features: ["Export 4K, không watermark", "100 video / tháng", "Kho giọng cộng đồng", "Render ưu tiên"],
    highlight: true,
  },
  {
    id: "business",
    name: "Doanh nghiệp",
    price: 299000,
    features: ["Mọi thứ ở gói Pro", "Video không giới hạn", "API truy cập", "Hỗ trợ 24/7"],
  },
];

const formatVnd = (v: number) => v.toLocaleString("vi-VN") + "đ";

type Status = "idle" | "processing" | "done";

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [boughtPlan, setBoughtPlan] = useState<Plan | null>(null);

  // Funnel entry — tie pricing views to the running A/B experiment.
  useEffect(() => {
    if (!isOpen) return;
    setStatus("idle");
    setBoughtPlan(null);
    analytics.track(ANALYTICS_EVENTS.PRICING_VIEWED, {
      ab_variant: analytics.getVariant(EXPERIMENTS.EXPORT_CTA) ?? "unknown",
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBuy = (plan: Plan) => {
    analytics.track(ANALYTICS_EVENTS.PLAN_SELECTED, { plan: plan.id, value: plan.price });
    setBoughtPlan(plan);
    setStatus("processing");
    // ── SIMULATED payment ──────────────────────────────────────────────────
    // Real flow: redirect to SePay/Polar → success webhook hits the BACKEND →
    // backend fires `purchase` with the same distinct_id (see posthog-analytics.md).
    // Here we fake a successful charge purely to exercise the funnel in the demo.
    setTimeout(() => {
      analytics.purchase({
        value: plan.price,
        plan: plan.id,
        currency: "VND",
        simulated: true,
        ab_variant: analytics.getVariant(EXPERIMENTS.EXPORT_CTA) ?? "unknown",
      });
      setStatus("done");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={status === "processing" ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[640px] max-w-[92vw] max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[20px] font-semibold text-[#1c1c1e] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F1414D]" /> Nâng cấp gói
          </h2>
          <button onClick={onClose} title="Đóng" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {status === "done" && boughtPlan ? (
          <div className="py-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-[16px] font-semibold text-[#1c1c1e]">Mua gói {boughtPlan.name} thành công!</p>
            <p className="text-[13px] text-gray-500 mt-1">
              (Giả lập — đã gửi event <code>purchase</code> {formatVnd(boughtPlan.price)} lên PostHog)
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-[#1e164e] text-white rounded-lg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Xong
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-gray-500 mb-5">Mở khóa toàn bộ tính năng cho dự án của bạn.</p>
            <div className="grid grid-cols-2 gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-5 flex flex-col ${
                    plan.highlight ? "border-[#1e164e] ring-1 ring-[#1e164e]/20" : "border-gray-200"
                  }`}
                >
                  {plan.highlight && (
                    <span className="self-start mb-2 px-2 py-0.5 rounded-full bg-[#1e164e] text-white text-[10px] font-semibold tracking-wide">
                      PHỔ BIẾN
                    </span>
                  )}
                  <p className="text-[15px] font-semibold text-[#1c1c1e]">{plan.name}</p>
                  <p className="mt-1 mb-4">
                    <span className="text-[24px] font-bold text-[#1c1c1e]">{formatVnd(plan.price)}</span>
                    <span className="text-[13px] text-gray-400"> / tháng</span>
                  </p>
                  <ul className="flex-1 space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-gray-600">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleBuy(plan)}
                    disabled={status === "processing"}
                    className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 ${
                      plan.highlight
                        ? "bg-[#1e164e] text-white hover:opacity-90"
                        : "bg-white border border-[#1e164e] text-[#1e164e] hover:bg-gray-50"
                    }`}
                  >
                    {status === "processing" && boughtPlan?.id === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
                      </>
                    ) : (
                      "Mua gói"
                    )}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
