import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { paymentService } from "../../services/paymentService";
import {
  paymentGatewayService,
  PaymentGateway,
} from "../../services/paymentGatewayService";
import { couponService } from "../../services/couponService";
import { useToast } from "../../contexts/ToastContext";
import {
  ShieldCheck,
  CreditCard,
  Check,
  Smartphone,
  Globe,
  Info,
  Wallet,
  Banknote,
} from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription";

interface PaymentModalProps {
  shipment: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  shipment,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const { success, error: toastError } = useToast();
  const { isPro, isElite } = useSubscription(); // Add Hook Call

  const [loading, setLoading] = useState(false);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState<{
    amount: number;
    couponId: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Discount Calculation
  const subDiscountPercent = isElite ? 10 : (isPro ? 5 : 0);
  const amount = shipment.quotes?.[0]?.amount || 0;
  const subDiscountAmount = (amount * subDiscountPercent) / 100;
  const couponDiscountAmount = discount?.amount || 0;
  const totalDiscountAmount = subDiscountAmount + couponDiscountAmount;
  const finalTotal = Math.max(0, amount - totalDiscountAmount);

  useEffect(() => {
    loadGateways();
    fetchWalletBalance();
  }, []);

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

  const loadGateways = async () => {
    try {
      const data = await paymentGatewayService.getGateways();
      const allowedProviders = ["wave", "wallet", "paytech", "cinetpay", "bank_transfer", "offline"];
      const active = data.filter(
        (g) => g.is_active && allowedProviders.includes(g.provider),
      );
      setGateways(active);

      // Default to Wave if available, otherwise first one
      const wave = active.find((g) => g.provider === "wave");
      if (wave) {
        setSelectedGateway(wave.id);
      } else if (active.length > 0) {
        setSelectedGateway(active[0].id);
      }
    } catch (error) {
      console.error("Error loading gateways:", error);
    }
  };

  const handlePayment = async () => {
    if (!selectedGateway) return;
    setLoading(true);
    try {
      // Use pre-calculated finalTotal
      const finalAmount = finalTotal;

      // Handle Wallet Payment
      const selectedGatewayObj = gateways.find((g) => g.id === selectedGateway);
      const isWalletPayment =
        selectedGateway === "wallet" ||
        selectedGatewayObj?.provider === "wallet";

      if (isWalletPayment) {
        // Direct execution via Escrow RPC (handled by confirmPayment)
        // We skip payWithWallet because confirmPayment's RPC (process_shipment_payment_escrow) 
        // already performs the deduction from the wallet.

        await paymentService.confirmPayment(shipment.id, {
          amount: finalAmount,
          currency: shipment.quotes?.[0]?.currency || "XOF",
          method: 'wallet',
          transactionId: `WALLET-${Date.now()}`
        }, discount?.couponId);

        success("Paiement réussi via Portefeuille !");
        onSuccess();
        return;
      }

      // Handle CinetPay Payment
      if (selectedGatewayObj?.provider === "cinetpay") {
        const { redirect_url } = await paymentService.initializeCinetPayPayment(finalAmount, shipment.quotes?.[0]?.currency || "XOF", {
          item_name: `Shipment ${shipment.number}`,
          description: `Paiement pour l'expédition ${shipment.number}`,
        });
        window.location.href = redirect_url;
        return;
      }

      // Handle PayTech Payment
      if (selectedGatewayObj?.provider === "paytech") {
        const { redirect_url } = await paymentService.initializePayTechPayment(finalAmount, shipment.quotes?.[0]?.currency || "XOF", {
          item_name: `Shipment ${shipment.number}`,
        });
        window.location.href = redirect_url;
        return;
      }

      // Handle Bank Transfer
      if (selectedGatewayObj?.provider === "bank_transfer") {
        await paymentService.confirmPayment(
          shipment.id,
          {
            amount: finalAmount,
            currency: shipment.quotes?.[0]?.currency || "XOF",
            method: 'bank_transfer',
            transactionReference: `VIRE-${Date.now()}`
          },
          discount?.couponId,
        );
        success("Demande de virement enregistrée. Veuillez procéder au virement.");
        onSuccess();
        return;
      }

      const isOffline = selectedGateway === "offline" || selectedGatewayObj?.provider === "offline";

      // 1. Initialize (Calculate fees)
      const details = await paymentService.initializePayment(
        shipment.id,
        finalAmount,
        shipment.quotes?.[0]?.currency || "EUR",
      );

      // 2. Simulate User Paying (Mock Delay)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Confirm Payment in Backend
      await paymentService.confirmPayment(
        shipment.id,
        {
          ...details,
          discountAmount: discount?.amount,
          method: isOffline ? "offline" : "gateway",
        },
        discount?.couponId,
      );

      if (isOffline) {
        success(
          "Commande confirmée ! Veuillez procéder au paiement directement auprès de votre transitaire.",
        );
      } else {
        success("Paiement réussi ! Les fonds sont maintenant sécurisés.");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Payment failed:", error);
      toastError(error.message || "Échec du paiement. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const amount = shipment.quotes?.[0]?.amount || 0;
      // Use couponService directly with service scope
      const coupon = await couponService.validateCoupon(promoCode, {
        type: "service",
        forwarderId: shipment.forwarder_id || shipment.forwarder?.id,
      });

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === "percentage") {
        discountAmount = (amount * coupon.discount_value) / 100;
        if (coupon.max_discount_amount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      setDiscount({ amount: discountAmount, couponId: coupon.id });
      success(
        `Coupon appliqué ! Vous avez économisé ${discountAmount} ${shipment.quotes?.[0]?.currency || "XOF"}`,
      );
    } catch (error: any) {
      console.error("Coupon error:", error);
      toastError(error.message || "Coupon invalide");
      setDiscount(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getGatewayIcon = (provider: string) => {
    switch (provider) {
      case "wave":
        return <Smartphone className="w-6 h-6" />;
      case "paytech":
        return <Smartphone className="w-6 h-6 text-orange-500" />;
      case "cinetpay":
        return <Globe className="w-6 h-6 text-green-600" />;
      case "bank_transfer":
        return <Banknote className="w-6 h-6 text-blue-600" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-center mb-4 text-primary">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <ShieldCheck size={32} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900">
            Paiement Sécurisé
          </h2>
          <p className="text-center text-gray-500 text-sm mt-1">
            Vos fonds sont protégés jusqu'à la livraison.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Amount Display */}
          <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Montant de base</span>
              <span className="font-bold text-gray-900">
                {amount.toLocaleString()} {shipment.quotes?.[0]?.currency || "XOF"}
              </span>
            </div>

            {/* Subscription Discount */}
            {subDiscountPercent > 0 && (
              <div className="flex justify-between items-center text-blue-600 text-sm">
                <span className="font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Réduction {isElite ? 'Elite' : 'Pro'} (-{subDiscountPercent}%)
                </span>
                <span className="font-bold">
                  - {subDiscountAmount.toLocaleString()} {shipment.quotes?.[0]?.currency || "XOF"}
                </span>
              </div>
            )}

            {/* Promo Code Discount */}
            {discount && (
              <div className="flex justify-between items-center text-green-600 text-sm">
                <span className="font-medium">Code Promo</span>
                <span className="font-bold">
                  - {discount.amount.toLocaleString()} {shipment.quotes?.[0]?.currency || "XOF"}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 my-1"></div>

            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-bold">Total à payer</span>
              <span className="text-2xl font-bold text-primary">
                {finalTotal.toLocaleString()} {shipment.quotes?.[0]?.currency || "XOF"}
              </span>
            </div>

            {/* Starter Upsell */}
            {subDiscountPercent === 0 && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-700">
                <p>💡 Économisez 5% avec le plan <span className="font-bold">Pro</span>.</p>
              </div>
            )}
          </div>

          {/* Promo Code */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Code Promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isValidatingCoupon || !promoCode}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidatingCoupon ? "..." : "Appliquer"}
            </button>
          </div>

          {/* Gateway Selection */}
          <div className="space-y-3">
            {gateways.map((gateway) => {
              const isWave = gateway.provider === "wave";
              const isWallet = gateway.provider === "wallet";
              const isSelected = selectedGateway === gateway.id;
              const isWalletEnabled = isWallet
                ? walletBalance >=
                (discount
                  ? Math.max(
                    0,
                    (shipment.quotes?.[0]?.amount || 0) - discount.amount,
                  )
                  : shipment.quotes?.[0]?.amount || 0)
                : true;

              return (
                <div
                  key={gateway.id}
                  onClick={() => {
                    if (isWallet && !isWalletEnabled) return;
                    setSelectedGateway(gateway.id);
                  }}
                  className={`
                                        relative p-4 rounded-xl border-2 transition-all flex items-center gap-4
                                        ${isSelected
                      ? isWave
                        ? "border-[#1DA1F2] bg-[#1DA1F2]/5"
                        : isWallet
                          ? "border-gray-900 bg-gray-50"
                          : "border-primary bg-primary/5"
                      : isWallet && !isWalletEnabled
                        ? "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50 cursor-pointer"
                    }
                                    `}
                >
                  {isWave && (
                    <div className="absolute -top-3 left-4 bg-[#1DA1F2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm">
                      Recommandé pour l'Afrique
                    </div>
                  )}

                  <div
                    className={`
                                        p-2 rounded-lg 
                                        ${isWave ? "bg-[#1DA1F2]/10 text-[#1DA1F2]" : isWallet ? (isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600") : "bg-gray-100 text-gray-600"}
                                    `}
                  >
                    {isWallet ? (
                      <Wallet className="w-6 h-6" />
                    ) : (
                      getGatewayIcon(gateway.provider)
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">
                        {gateway.name}
                      </h3>
                      {isSelected && (
                        <div
                          className={`p-0.5 rounded-full ${isWave ? "bg-[#1DA1F2] text-white" : "bg-gray-900 text-white"}`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    {isWave && (
                      <p className="text-xs text-[#1DA1F2] font-medium mt-0.5">
                        Simple, Rapide et Sans frais cachés
                      </p>
                    )}
                    {isWallet && (
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500 mt-0.5">
                          Solde: {walletBalance.toLocaleString()} FCFA
                        </p>
                        {!isWalletEnabled && (
                          <p className="text-xs text-red-500 mt-0.5 font-medium">
                            Solde insuffisant
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Offline Payment Option */}
            <div
              onClick={() => setSelectedGateway("offline")}
              className={`
                                relative p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                                ${selectedGateway === "offline"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }
                            `}
            >
              <div
                className={`
                                p-2 rounded-lg 
                                ${selectedGateway === "offline" ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-600"}
                            `}
              >
                <CreditCard className="w-6 h-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">
                    Paiement à la réception (Offline)
                  </h3>
                  {selectedGateway === "offline" && (
                    <div className="p-0.5 rounded-full bg-orange-500 text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Payer directement au transitaire
                </p>
              </div>
            </div>
          </div>

          {/* Bank Transfer Instructions */}
          {selectedGatewayObj?.provider === "bank_transfer" && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <Info className="w-4 h-4" />
                Coordonnées de Virement ({selectedGatewayObj.config.bank_name || "Banque Agricole"})
              </div>
              <div className="space-y-2 text-xs text-blue-700">
                <div className="flex justify-between">
                  <span className="opacity-70">Banque:</span>
                  <span className="font-bold">{selectedGatewayObj.config.bank_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Titulaire:</span>
                  <span className="font-bold">{selectedGatewayObj.config.account_name || "NextMove Cargo Business"}</span>
                </div>
                {selectedGatewayObj.config.iban && (
                  <div className="pt-1 border-t border-blue-200">
                    <span className="opacity-70 block mb-0.5">IBAN / RIB:</span>
                    <span className="font-mono font-bold break-all">{selectedGatewayObj.config.iban}</span>
                  </div>
                )}
                {selectedGatewayObj.config.swift && (
                  <div className="pt-1 border-t border-blue-200">
                    <span className="opacity-70">SWIFT / BIC:</span>
                    <span className="font-mono font-bold">{selectedGatewayObj.config.swift}</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-blue-600 italic">
                {selectedGatewayObj.config.instructions || "Veuillez préciser votre nom et numéro d'expédition dans le libellé du virement."}
              </p>
            </div>
          )}

          {/* Offline Disclaimer */}
          {selectedGateway === "offline" && (
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800">
              <p className="font-medium mb-1 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Important
              </p>
              Le paiement offline est sous l'entière responsabilité du client et
              de son transitaire, la plateforme n'est pas concernée.
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading || !selectedGateway}
            className={`
                            w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                            ${selectedGateway === "offline"
                ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30"
                : selectedGateway &&
                  gateways.find(
                    (g) => g.id === selectedGateway,
                  )?.provider === "wave"
                  ? "bg-[#1DA1F2] hover:bg-[#1a91da] shadow-[#1DA1F2]/30"
                  : "bg-gray-900 hover:bg-gray-800 shadow-gray-900/30"
              }
                            ${loading || !selectedGateway ? "opacity-50 cursor-not-allowed" : ""}
                        `}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {selectedGateway === "offline" ? (
                  <Check className="w-5 h-5" />
                ) : selectedGateway === "wallet" ||
                  gateways.find((g) => g.id === selectedGateway)?.provider ===
                  "wallet" ? (
                  <Wallet className="w-5 h-5" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {selectedGateway === "offline"
                  ? "Confirmer la commande"
                  : selectedGateway === "wallet" ||
                    gateways.find((g) => g.id === selectedGateway)
                      ?.provider === "wallet"
                    ? "Payer avec mon Solde"
                    : selectedGateway
                      ? `Payer avec ${gateways.find((g) => g.id === selectedGateway)?.name}`
                      : selectedGatewayObj?.provider === "bank_transfer"
                        ? "Confirmer le virement"
                        : "Choisir un moyen de paiement"}
              </>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
