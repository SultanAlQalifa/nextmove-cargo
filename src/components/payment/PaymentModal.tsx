import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../contexts/ToastContext";
import {
  X,
  CreditCard,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Tag,
  Wallet,
  Banknote,
  XCircle,
  ArrowRight
} from "lucide-react";
import { paymentService } from "../../services/paymentService";
import { paymentGatewayService, PaymentGateway } from "../../services/paymentGatewayService";
import { couponService, Coupon } from "../../services/couponService";
import { supabase } from "../../lib/supabase";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId?: string) => void;
  planName: string;
  amount: number;
  currency: string;
  allowedMethods?: PaymentMethod[];
  shipmentId?: string;
  showCoupons?: boolean;
  showVAT?: boolean;
  returnUrl?: string;
  mode?: 'subscription' | 'topup' | 'shipment';
}

type PaymentMethod = "wave" | "wallet" | "cash" | "paytech" | "cinetpay";

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  planName,
  amount,
  currency,
  allowedMethods = ["wave", "wallet", "cash", "paytech", "cinetpay"],
  shipmentId,
  showCoupons = true,
  showVAT = true,
  returnUrl,
  mode = 'subscription',
}: PaymentModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "method" | "processing" | "success" | "error" | "error_timeout"
  >("method");
  const [editableAmount, setEditableAmount] = useState(amount);
  const [lastTxId, setLastTxId] = useState<string | null>(null);
  // ... (keeping state same)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  // ... (keeping coupon state same)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeGateways, setActiveGateways] = useState<PaymentGateway[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(false);

  // ... (keeping useEffect same)
  useEffect(() => {
    if (isOpen) {
      setStep("method");
      setEditableAmount(amount);
      if (allowedMethods.length === 1) {
        setSelectedMethod(allowedMethods[0]);
      } else {
        setSelectedMethod(null);
      }
      setPhoneNumber("");
      setError("");
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponError("");
      setLastTxId(null);
      fetchWalletBalance();
      fetchActiveGateways();
    }
  }, [isOpen, amount]);

  const fetchWalletBalance = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setWalletBalance(Number(data.balance));
    }
  };

  const fetchActiveGateways = async () => {
    setLoadingGateways(true);
    try {
      const gateways = await paymentGatewayService.getGateways();
      setActiveGateways(gateways.filter(g => g.is_active));
    } catch (err) {
      console.error("Error fetching gateways:", err);
    } finally {
      setLoadingGateways(false);
    }
  };

  const isMethodActive = (method: PaymentMethod) => {
    // Cannot use wallet to top up wallet
    if (mode === 'topup' && method === 'wallet') return false;

    // Wallet is always allowed if selected in allowedMethods and balance is fetched
    if (method === "wallet") return allowedMethods.includes("wallet");
    // Cash is a special case (offline)
    if (method === "cash") return allowedMethods.includes("cash");

    // For external gateways, check if they are in the active gateways list from DB
    return allowedMethods.includes(method) && activeGateways.some(g => g.provider === method);
  };

  // ... (keeping calculations same)
  const currentAmount = mode === 'topup' ? editableAmount : amount;

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? (currentAmount * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;

  const finalDiscount = Math.min(discountAmount, currentAmount);
  const discountedAmount = Math.max(0, currentAmount - finalDiscount);

  const TRANSACTION_FEE_PERCENT = 0.01; // 1%
  const VAT_PERCENT = 0.18; // 18%

  const fees = mode === 'topup' ? 0 : discountedAmount * TRANSACTION_FEE_PERCENT;
  const subtotal = discountedAmount + fees;
  const vat = (showVAT && mode !== 'topup') ? subtotal * VAT_PERCENT : 0;
  const totalAmount = Math.round(subtotal + vat);

  // ... (keeping handleApplyCoupon same)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setVerifyingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const coupon = await couponService.validateCoupon(couponCode, {
        type: "subscription",
      });

      if (coupon.min_order_amount && amount < coupon.min_order_amount) {
        throw new Error(
          `Montant minimum requis : ${coupon.min_order_amount} ${currency}`,
        );
      }

      setAppliedCoupon(coupon);
    } catch (err: any) {
      setCouponError(err.message || "Code invalide");
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    if ((selectedMethod === "wave" || selectedMethod === "cinetpay") && !phoneNumber) {
      setError("Veuillez entrer votre numéro de téléphone pour le paiement");
      return;
    }

    setStep("processing");
    setError("");

    try {
      if (selectedMethod === "wave") {
        // 1. Initialize Payment with Total Amount
        const waveReturnUrls = returnUrl ? {
          success: `${returnUrl}?status=success`,
          error: `${returnUrl}?status=error`
        } : undefined;

        const { transaction_id, wave_launch_url } =
          await paymentService.initializeWavePayment(totalAmount, currency, waveReturnUrls);

        setLastTxId(transaction_id);

        // 2. Redirect user to Wave to pay
        if (wave_launch_url) {
          // If we have a custom return URL (Support Campaign), we just redirect and rely on the page reload
          if (returnUrl) {
            window.location.href = wave_launch_url; // Use current tab to ensure we come back to the right place
            return;
          }
          window.location.href = wave_launch_url;
        } else {
          throw new Error("Erreur: URL de paiement Wave manquante");
        }

        // 3. Verify Payment (Polling)
        try {
          const verification =
            await paymentService.verifyWavePayment(transaction_id);

          if (verification.status === "succeeded") {
            if (appliedCoupon) {
              await couponService.updateCoupon(appliedCoupon.id, {
                usage_count: appliedCoupon.usage_count + 1,
              });
            }

            setStep("success");
            setTimeout(() => {
              onSuccess(transaction_id);
              onClose();
            }, 2000);
          } else {
            throw new Error("Paiement non validé");
          }
        } catch (pollError: any) {
          if (pollError.message?.includes("timeout")) {
            setStep("error_timeout");
          } else {
            throw pollError;
          }
        }
      } else if (selectedMethod === "wallet") {
        if (walletBalance < totalAmount) {
          throw new Error("Solde insuffisant dans votre portefeuille");
        }

        if (shipmentId) {
          // Shipment Flow: Escrow RPC handles wallet deduction internally
          const txId = `WALLET-${Date.now()}`;
          await paymentService.confirmPayment(shipmentId, {
            amount: totalAmount,
            currency: currency,
            paymentMethod: 'wallet',
            transactionReference: txId
          }, appliedCoupon?.id);

          setStep("success");
          setTimeout(() => {
            onSuccess(txId);
            onClose();
          }, 2000);
        } else {
          // Subscription/Service Flow: Direct Wallet Deduction
          const txId = `SUB-${Date.now()}`;
          await paymentService.payWithWallet(
            totalAmount,
            txId,
            `Paiement ${planName || "Service"}`,
          );

          setStep("success");
          setTimeout(() => {
            onSuccess(txId);
            onClose();
          }, 2000);
        }
      } else if (selectedMethod === "cinetpay") {
        // CinetPay Flow
        const cinetPayReturnUrls = returnUrl ? {
          success: `${returnUrl}?status=success`
        } : undefined;

        const formattedPhone = (phoneNumber.match(/^(77|78|76|70|75)/))
          ? `+221${phoneNumber.replace(/\s/g, '')}`
          : phoneNumber;

        const { redirect_url } = await paymentService.initializeCinetPayPayment(
          totalAmount,
          currency,
          {
            plan_name: planName, // Metadata
            user_id: (await supabase.auth.getUser()).data.user?.id,
            phone: formattedPhone
          },
          cinetPayReturnUrls
        );
        if (redirect_url) {
          window.open(redirect_url, "_self"); // Redirect current tab as it's a hosted page
        } else {
          throw new Error("Erreur URL CinetPay");
        }
      } else if (selectedMethod === "paytech") {
        // PayTech Flow
        const payTechReturnUrls = returnUrl ? {
          success: `${returnUrl}?status=success`,
          cancel: `${returnUrl}?status=cancel`
        } : undefined;

        const { redirect_url } = await paymentService.initializePayTechPayment(
          totalAmount,
          currency,
          {
            item_name: `Abonnement ${planName}`,
            user_id: (await supabase.auth.getUser()).data.user?.id
          },
          payTechReturnUrls
        );
        if (redirect_url) {
          window.location.href = redirect_url;
        } else {
          throw new Error("Erreur URL PayTech");
        }
      } else {
        // Should not happen as types are restricted, but for safety:
        throw new Error("Méthode de paiement non supportée");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setStep("error");
      setError(
        err.message ||
        err.error_description ||
        "Une erreur est survenue lors du paiement.",
      );
    }
  };

  const handleCheckStatus = async () => {
    if (!lastTxId) return;
    setStep("processing");
    try {
      await paymentService.verifyWavePayment(lastTxId);
      setStep("success");
      showSuccess("Paiement retrouvé et validé !");
      setTimeout(() => {
        onSuccess(lastTxId);
        onClose();
      }, 2000);
    } catch (error) {
      setStep("error_timeout");
      showError(
        "Paiement toujours en attente ou échoué. Veuillez réessayer dans quelques instants.",
      );
    }
  };

  const handleCashPayment = async () => {
    try {
      setStep("processing");

      // Appel réel au backend
      const result = await paymentService.initiateCashPayment(
        shipmentId,
        {
          paymentMethod: 'cash',
          discountAmount: totalAmount,
          transactionReference: `CASH-${Date.now()}`,
        },
        appliedCoupon?.id
      );

      if (result.success) {
        showSuccess("Paiement en espèces enregistré");

        // Rediriger vers page de confirmation avec instructions
        // Si shipmentId existe, on track. Sinon on va juste au dashboard.
        if (result.shipment_id) {
          navigate(`/tracking/${result.shipment_id}?payment=cash_pending`);
        } else {
          // Cas abonnement : On reste sur dashboard mais on notifie
          onSuccess(result.transaction_id || `CASH-${Date.now()}`);
        }
        onClose();
      }
    } catch (error: any) {
      console.error('Cash payment failed:', error);
      setStep("error");
      setError(
        error.message ||
        "Impossible d'enregistrer votre demande de paiement en espèces. Réessayez."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-indigo-100 dark:border-indigo-900/30 flex flex-col max-h-[90vh]">

        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500 z-10"></div>

        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 relative pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white shrink-0">
              {mode === 'topup' ? <Wallet className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {mode === 'topup' ? 'Recharger le compte' : 'Paiement Sécurisé'}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === 'topup' ? 'Alimenter votre portefeuille' : `Paiement ${planName || "Service"}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Fermer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {step === "method" && (
            <div className="space-y-6">
              {/* TopUp Amount Input */}
              {mode === 'topup' && (
                <div className="space-y-3">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Montant du rechargement
                  </label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={editableAmount}
                      onChange={(e) => setEditableAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-5 pr-16 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-2xl font-black text-slate-900 dark:text-white transition-all text-center"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-slate-500 dark:text-slate-400">
                      {currency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center">
                    Minimum conseillé : <span className="font-bold text-slate-700 dark:text-slate-300">500 {currency}</span>
                  </p>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-700/30">
                <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span>{mode === 'topup' ? 'Montant Saisi' : 'Montant HT'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {currentAmount.toLocaleString()} {currency}
                  </span>
                </div>

                {/* Coupon Section */}
                {showCoupons && mode !== 'topup' && (
                  <div className="py-3 border-y border-slate-200 dark:border-slate-700/50 my-3">
                    {!appliedCoupon ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            placeholder="CODE PROMO"
                            className="flex-1 px-4 py-3 text-sm font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 uppercase transition-all dark:text-white"
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode || verifyingCoupon}
                            className="px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors"
                          >
                            {verifyingCoupon ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              "Appliquer"
                            )}
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-sm font-medium text-rose-500 px-1">{couponError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        <span className="flex items-center gap-2 font-black tracking-wide">
                          <Tag className="w-4 h-4" /> {appliedCoupon.code}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold">
                            -{finalDiscount.toLocaleString()} {currency}
                          </span>
                          <button
                            onClick={() => setAppliedCoupon(null)}
                            className="p-1 text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors bg-emerald-500/10 rounded-full"
                            title="Supprimer la réduction"
                            aria-label="Supprimer la réduction"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {mode !== 'topup' && (
                  <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span>Frais de transaction (1%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {fees.toLocaleString()} {currency}
                    </span>
                  </div>
                )}
                {showVAT && mode !== 'topup' && (
                  <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span>TVA (18%)</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {vat.toLocaleString()} {currency}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700/50 pt-3 flex justify-between items-center">
                  <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">Total à payer</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {totalAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Choisir un moyen de paiement
                </p>

                {loadingGateways ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {isMethodActive("wallet") && (
                      <button
                        onClick={() =>
                          walletBalance >= totalAmount
                            ? setSelectedMethod("wallet")
                            : null
                        }
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all overflow-hidden relative group
                                        ${selectedMethod === "wallet"
                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 ring-4 ring-indigo-500/10 shadow-sm"
                            : walletBalance >= totalAmount
                              ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
                              : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed"
                          }`}
                      >
                        {selectedMethod === "wallet" && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        )}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shrink-0 shadow-inner">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1 relative z-10">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900 dark:text-white text-base">
                              Mon Portefeuille
                            </p>
                          </div>
                          <div className="flex flex-col mt-0.5">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              Solde: {walletBalance.toLocaleString()} FCFA
                            </p>
                            {walletBalance < totalAmount && (
                              <p className="text-xs font-bold text-rose-500 mt-1 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 w-fit px-2 py-0.5 rounded-md">
                                <AlertCircle className="w-3 h-3" /> Solde insuffisant
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedMethod === "wallet" ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedMethod === "wallet" && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    )}

                    {isMethodActive("wave") && (
                      <button
                        onClick={() => setSelectedMethod("wave")}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all overflow-hidden relative group
                            ${selectedMethod === "wave"
                            ? "border-[#1dc4ff] bg-[#1dc4ff]/5 dark:bg-[#1dc4ff]/10 ring-4 ring-[#1dc4ff]/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#1dc4ff]/50 hover:shadow-md"}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1dc4ff] to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-[#1dc4ff]/30">
                          Wave
                        </div>
                        <div className="text-left flex-1 relative z-10">
                          <p className="font-bold text-slate-900 dark:text-white text-base">
                            Wave Mobile Money
                          </p>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Paiement instantané (SN)
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedMethod === "wave" ? "border-[#1dc4ff] bg-[#1dc4ff]" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedMethod === "wave" && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    )}

                    {isMethodActive("cinetpay") && (
                      <button
                        onClick={() => setSelectedMethod("cinetpay")}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all overflow-hidden relative group
                            ${selectedMethod === "cinetpay"
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 ring-4 ring-emerald-500/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 hover:shadow-md"}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-emerald-500/30">
                          CP
                        </div>
                        <div className="text-left flex-1 relative z-10">
                          <p className="font-bold text-slate-900 dark:text-white text-base">
                            CinetPay
                          </p>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Cartes bancaires, Orange Money...
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedMethod === "cinetpay" ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedMethod === "cinetpay" && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    )}

                    {isMethodActive("paytech") && (
                      <button
                        onClick={() => setSelectedMethod("paytech")}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all overflow-hidden relative group
                            ${selectedMethod === "paytech"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 ring-4 ring-blue-500/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 hover:shadow-md"}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-blue-500/30">
                          PT
                        </div>
                        <div className="text-left flex-1 relative z-10">
                          <p className="font-bold text-slate-900 dark:text-white text-base">
                            PayTech
                          </p>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Agrégateur de paiement multi-options
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedMethod === "paytech" ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedMethod === "paytech" && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    )}

                    {isMethodActive("cash") && (
                      <button
                        onClick={() => setSelectedMethod("cash")}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all overflow-hidden relative group
                            ${selectedMethod === "cash"
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-4 ring-amber-500/10 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-400 hover:shadow-md"}`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/30">
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div className="text-left flex-1 relative z-10">
                          <p className="font-bold text-slate-900 dark:text-white text-base">
                            Espèces / Agence
                          </p>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Paiement physique au bureau
                          </p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedMethod === "cash" ? "border-amber-500 bg-amber-500" : "border-slate-300 dark:border-slate-600"}`}
                        >
                          {selectedMethod === "cash" && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          )}
                        </div>
                      </button>
                    )}

                  </div>
                )}
              </div>

              {(selectedMethod === "wave" || selectedMethod === "cinetpay") && (
                <div className="animate-in slide-in-from-top-2 duration-300 pt-2">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide px-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="77 658 17 41"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg dark:text-white"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold flex items-center gap-3 animate-in zoom-in duration-200">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={selectedMethod === 'cash' ? handleCashPayment : handlePayment}
                disabled={!selectedMethod || (mode === 'topup' && editableAmount < 500)}
                className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-indigo-500 hover:from-indigo-600 to-purple-600 hover:to-purple-700 text-white font-black text-lg rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 flex justify-center items-center gap-2"
              >
                {mode === 'topup' ? `Validation: ${totalAmount.toLocaleString()} ${currency}` : `Payer ${totalAmount.toLocaleString()} ${currency}`}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 dark:border-indigo-900/50 border-t-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {mode === 'topup' ? <Wallet className="w-8 h-8 text-indigo-500" /> : <CreditCard className="w-8 h-8 text-indigo-500" />}
                </div>
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                  Traitement en cours
                </h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 max-w-[250px] mx-auto">
                  {selectedMethod === "wave" || selectedMethod === "cinetpay"
                    ? "Veuillez confirmer le paiement sur votre application mobile."
                    : "Finalisation de la transaction interne..."}
                </p>
              </div>
            </div>
          )}

          {step === "error_timeout" && (
            <div className="py-10 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
              </div>
              <p className="text-slate-900 dark:text-white font-black text-xl mb-3 tracking-tight">
                Vérification du réseau
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 px-4">
                Le paiement met plus de temps que prévu à être confirmé. Avez-vous validé l'opération sur votre téléphone ?
              </p>
              <div className="flex flex-col gap-3 px-2">
                <button
                  onClick={handleCheckStatus}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  Vérifier maintenant
                </button>
                <button
                  onClick={() => setStep("method")}
                  className="py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold transition-colors"
                >
                  Abandonner et réessayer
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-5 animate-in zoom-in duration-300 fade-in">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2 mx-auto relative">
                <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-ping opacity-20"></div>
                <CheckCircle className="w-12 h-12 relative z-10" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tight">
                  Opération Réussie !
                </h4>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                  Le paiement a bien été comptabilisé. Redirection...
                </p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                  Échec de l'opération
                </h4>
                <p className="text-rose-500 font-medium mt-2 px-2 border-l-2 border-rose-500 text-left bg-rose-50 dark:bg-rose-500/10 p-3 rounded-r-lg max-w-sm">
                  {error}
                </p>
              </div>
              <button
                onClick={() => setStep("method")}
                className="w-full py-4 mt-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
              >
                Retour au moyen de paiement
              </button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
