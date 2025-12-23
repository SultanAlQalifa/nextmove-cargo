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
  Check,
  Banknote,
  MapPin
} from "lucide-react";
import { paymentService } from "../../services/paymentService";
import { couponService, Coupon } from "../../services/couponService";
import { supabase } from "../../lib/supabase";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planName: string;
  amount: number;
  currency: string;
  allowedMethods?: PaymentMethod[];
  shipmentId?: string;
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
}: PaymentModalProps) {
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "method" | "processing" | "success" | "error"
  >("method");
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

  // ... (keeping useEffect same)
  useEffect(() => {
    if (isOpen) {
      setStep("method");
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
      fetchWalletBalance();
    }
  }, [isOpen, allowedMethods]);

  // ... (keeping fetchWalletBalance same)
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

  // ... (keeping calculations same)
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? (amount * appliedCoupon.discount_value) / 100
      : appliedCoupon.discount_value
    : 0;

  const finalDiscount = Math.min(discountAmount, amount);
  const discountedAmount = Math.max(0, amount - finalDiscount);

  const TRANSACTION_FEE_PERCENT = 0.01; // 1%
  const VAT_PERCENT = 0.18; // 18%

  const fees = discountedAmount * TRANSACTION_FEE_PERCENT;
  const subtotal = discountedAmount + fees;
  const vat = subtotal * VAT_PERCENT;
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

    if (selectedMethod === "wave" && !phoneNumber) {
      setError("Veuillez entrer votre numéro de téléphone");
      return;
    }

    setStep("processing");
    setError("");

    try {
      if (selectedMethod === "wave") {
        // 1. Initialize Payment with Total Amount
        const { transaction_id, wave_launch_url } =
          await paymentService.initializeWavePayment(totalAmount, currency);

        // 2. Redirect user to Wave to pay
        if (wave_launch_url) {
          window.open(wave_launch_url, "_blank");
        } else {
          throw new Error("Erreur: URL de paiement Wave manquante");
        }

        // 3. Verify Payment (Polling)
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
            onSuccess();
            onClose();
          }, 2000);
        } else {
          throw new Error("Paiement non validé");
        }
      } else if (selectedMethod === "wallet") {
        if (walletBalance < totalAmount) {
          throw new Error("Solde insuffisant dans votre portefeuille");
        }

        if (shipmentId) {
          // Shipment Flow: Escrow RPC handles wallet deduction internally
          await paymentService.confirmPayment(shipmentId, {
            amount: totalAmount,
            currency: currency,
            method: 'wallet',
            transactionId: `WALLET-${Date.now()}`
          }, appliedCoupon?.id);
        } else {
          // Subscription/Service Flow: Direct Wallet Deduction
          await paymentService.payWithWallet(
            totalAmount,
            `SUB-${Date.now()}`,
            `Paiement ${planName || "Service"}`,
          );
        }

        setStep("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else if (selectedMethod === "cinetpay") {
        // CinetPay Flow
        const { redirect_url } = await paymentService.initializeCinetPayPayment(
          totalAmount,
          currency,
          {
            plan_name: planName, // Metadata
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        );
        if (redirect_url) {
          window.open(redirect_url, "_self"); // Redirect current tab as it's a hosted page
        } else {
          throw new Error("Erreur URL CinetPay");
        }
      } else if (selectedMethod === "paytech") {
        // PayTech Flow
        const { redirect_url } = await paymentService.initializePayTechPayment(
          totalAmount,
          currency,
          {
            item_name: `Abonnement ${planName}`,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
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
          onSuccess();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-900">Paiement Sécurisé</h3>
            <p className="text-xs text-gray-500">Paiement {planName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {step === "method" && (
            <div className="space-y-6">
              {/* Amount Breakdown */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Montant HT</span>
                  <span>
                    {amount.toLocaleString()} {currency}
                  </span>
                </div>

                {/* Coupon Section */}
                <div className="py-2 border-y border-gray-200 my-2">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          placeholder="Code Promo"
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary uppercase"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || verifyingCoupon}
                          className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                          {verifyingCoupon ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Appliquer"
                          )}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      <span className="flex items-center gap-1 font-medium">
                        <Tag className="w-3 h-3" /> {appliedCoupon.code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          -{finalDiscount.toLocaleString()} {currency}
                        </span>
                        <button
                          onClick={() => setAppliedCoupon(null)}
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Supprimer le code promo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frais de transaction (1%)</span>
                  <span>
                    {fees.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>TVA (18%)</span>
                  <span>
                    {vat.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-lg text-primary">
                  <span>Total à payer</span>
                  <span>
                    {totalAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Choisir un moyen de paiement
                </p>

                {allowedMethods.includes("wallet") && (
                  <button
                    onClick={() =>
                      walletBalance >= totalAmount
                        ? setSelectedMethod("wallet")
                        : null
                    }
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all 
                                        ${selectedMethod === "wallet"
                        ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                        : walletBalance >= totalAmount
                          ? "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
                      }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          Mon Portefeuille
                        </p>
                        {selectedMethod === "wallet" && (
                          <Check className="w-4 h-4 text-gray-900" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500">
                          Solde: {walletBalance.toLocaleString()} FCFA
                        </p>
                        {walletBalance < totalAmount && (
                          <p className="text-xs text-red-500 font-medium mt-0.5">
                            Solde insuffisant
                          </p>
                        )}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedMethod === "wallet" ? "border-gray-900 bg-gray-900" : "border-gray-300"}`}
                    >
                      {selectedMethod === "wallet" && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                )}

                {allowedMethods.includes("wave") && (
                  <button
                    onClick={() => setSelectedMethod("wave")}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${selectedMethod === "wave" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#1dc4ff] flex items-center justify-center text-white font-bold text-xs">
                      Wave
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">
                        Wave Mobile Money
                      </p>
                      <p className="text-xs text-gray-500">
                        Paiement rapide via QR ou numéro
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedMethod === "wave" ? "border-primary bg-primary" : "border-gray-300"}`}
                    >
                      {selectedMethod === "wave" && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                )}

                {allowedMethods.includes("cash") && (
                  <button
                    onClick={() => setSelectedMethod("cash")}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${selectedMethod === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">
                        Espèces / Agence
                      </p>
                      <p className="text-xs text-gray-500">Paiement au bureau</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedMethod === "cash" ? "border-primary bg-primary" : "border-gray-300"}`}
                    >
                      {selectedMethod === "cash" && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                )}

                {allowedMethods.includes("cinetpay") && (
                  <button
                    onClick={() => setSelectedMethod("cinetpay")}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${selectedMethod === "cinetpay" ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                      CP
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">
                        CinetPay (CB, Mobile)
                      </p>
                      <p className="text-xs text-gray-500">
                        Cartes Bancaires, Orange Money, MTN...
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedMethod === "cinetpay" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`}
                    >
                      {selectedMethod === "cinetpay" && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                )}

                {allowedMethods.includes("paytech") && (
                  <button
                    onClick={() => setSelectedMethod("paytech")}
                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${selectedMethod === "paytech" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      PT
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">
                        PayTech
                      </p>
                      <p className="text-xs text-gray-500">
                        Agrégateur Paiement Sénégal
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedMethod === "paytech" ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}
                    >
                      {selectedMethod === "paytech" && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              {selectedMethod === "wave" && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de téléphone Wave
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="77 000 00 00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={selectedMethod === 'cash' ? handleCashPayment : handlePayment}
                disabled={!selectedMethod}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
              >
                Payer {totalAmount.toLocaleString()} {currency}
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  Traitement en cours...
                </h4>
                <p className="text-gray-500 text-sm mt-1">
                  Veuillez valider le paiement sur votre téléphone si
                  nécessaire.
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  Paiement Réussi !
                </h4>
                <p className="text-gray-500 text-sm mt-1">
                  Paiement enregistré avec succès.
                </p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">
                  Échec du paiement
                </h4>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setStep("method")}
                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
