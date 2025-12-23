import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  CreditCard,
  Settings,
  Power,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Wallet,
  Banknote,
} from "lucide-react";
import {
  paymentGatewayService,
  PaymentGateway,
} from "../../../services/paymentGatewayService";

import { useToast } from "../../../contexts/ToastContext";

export default function AdminPaymentGateway() {
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const { success, error: toastError } = useToast();

  const fetchGateways = async () => {
    try {
      const data = await paymentGatewayService.getGateways();
      setGateways(data);
      if (data.length > 0 && !selectedGateway) {
        setSelectedGateway(data[0]);
      }
    } catch (error) {
      console.error("Error fetching gateways:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await paymentGatewayService.toggleGateway(id);
      const updatedGateways = await paymentGatewayService.getGateways();
      setGateways(updatedGateways);

      // Important: Update the currently selected gateway if it was the one toggled
      if (selectedGateway?.id === id || (id.endsWith("-default") && selectedGateway?.provider === id.split("-")[0])) {
        const updated = updatedGateways.find(g => g.id === id || (id.endsWith("-default") && g.provider === id.split("-")[0]));
        if (updated) setSelectedGateway(updated);
      }

      success("Statut mis à jour !");
    } catch (error: any) {
      toastError("Erreur lors du basculement: " + error.message);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedGateway) return;
    setSaving(true);
    try {
      const savedGateway = await paymentGatewayService.updateGateway(
        selectedGateway.id,
        selectedGateway,
      );

      // Update local state with the saved gateway (important for getting the real ID if it was a new creation)
      setGateways((prev) =>
        prev.map((g) => (g.id === selectedGateway.id ? savedGateway : g)),
      );
      setSelectedGateway(savedGateway);

      success("Configuration enregistrée avec succès !");
    } catch (error: any) {
      console.error("Error saving gateway:", error);
      toastError(
        `Erreur lors de l'enregistrement: ${error.message || "Une erreur est survenue"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: string) => {
    if (!selectedGateway) return;
    setSelectedGateway({
      ...selectedGateway,
      config: {
        ...selectedGateway.config,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Passerelles de Paiement"
        subtitle="Configurez les méthodes de paiement acceptées"
        action={{
          label: saving ? "Enregistrement..." : "Enregistrer la configuration",
          onClick: handleSaveConfig,
          icon: Save,
          disabled: saving || !selectedGateway,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gateway List */}
        <div className="lg:col-span-1 space-y-4">
          {gateways.map((gateway) => (
            <div
              key={gateway.id}
              onClick={() => setSelectedGateway(gateway)}
              className={`
p-4 rounded-xl border cursor-pointer transition-all
                                ${selectedGateway?.id === gateway.id
                  ? "bg-white border-primary shadow-md shadow-primary/10"
                  : "bg-white border-gray-100 hover:border-gray-200"
                }
`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${selectedGateway?.id === gateway.id ? "bg-primary/10 text-primary" : "bg-gray-50 text-gray-500"} `}
                  >
                    {gateway.provider === "wallet" ? (
                      <Wallet className="w-5 h-5" />
                    ) : gateway.provider === "offline" || gateway.provider === "bank_transfer" ? (
                      <Banknote className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900">{gateway.name}</h3>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${gateway.is_active ? "bg-green-500" : "bg-gray-300"} `}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{gateway.provider.toUpperCase()}</span>
                <span>{gateway.transaction_fee_percent}% frais</span>
              </div>
            </div>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          {selectedGateway ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Configuration {selectedGateway.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(selectedGateway.id);
                  }}
                  className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${selectedGateway.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }
`}
                >
                  <Power className="w-4 h-4" />
                  {selectedGateway.is_active ? "Activé" : "Désactivé"}
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Assurez-vous d'utiliser les clés de test pour le
                    développement et les clés de production pour le site en
                    ligne.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGateway.is_test_mode}
                        onChange={(e) =>
                          setSelectedGateway({
                            ...selectedGateway,
                            is_test_mode: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        aria-label="Mode Test"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        Mode Test (Sandbox)
                      </span>
                    </label>
                  </div>

                  {selectedGateway.provider === "wave" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Merchant ID
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.merchant_id || ""}
                          onChange={(e) =>
                            updateConfig("merchant_id", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                          placeholder="Votre Merchant ID"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secret Key
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret ? "text" : "password"}
                            value={selectedGateway.config.secret_key || ""}
                            onChange={(e) =>
                              updateConfig("secret_key", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm pr-10"
                            placeholder="Votre Secret Key"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedGateway.provider === "paytech" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.apikey || ""}
                          onChange={(e) =>
                            updateConfig("apikey", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                          placeholder="Votre API Key PayTech"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Secret
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret ? "text" : "password"}
                            value={selectedGateway.config.secret_key || ""}
                            onChange={(e) =>
                              updateConfig("secret_key", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm pr-10"
                            placeholder="Votre API Secret PayTech"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedGateway.provider === "cinetpay" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Site ID
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.site_id || ""}
                          onChange={(e) =>
                            updateConfig("site_id", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                          placeholder="Votre Site ID CinetPay"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret ? "text" : "password"}
                            value={selectedGateway.config.apikey || ""}
                            onChange={(e) =>
                              updateConfig("apikey", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm pr-10"
                            placeholder="Votre API Key CinetPay"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedGateway.provider === "bank_transfer" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom de la Banque
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.bank_name || ""}
                          onChange={(e) =>
                            updateConfig("bank_name", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                          placeholder="Ex: Banque Agricole"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titulaire du Compte
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.account_name || ""}
                          onChange={(e) =>
                            updateConfig("account_name", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                          placeholder="Nom exact de la société"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IBAN / RIB
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.iban || ""}
                          onChange={(e) =>
                            updateConfig("iban", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                          placeholder="Votre IBAN ou RIB complet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SWIFT / BIC
                        </label>
                        <input
                          type="text"
                          value={selectedGateway.config.swift || ""}
                          onChange={(e) =>
                            updateConfig("swift", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                          placeholder="Code SWIFT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instructions
                        </label>
                        <textarea
                          value={selectedGateway.config.instructions || ""}
                          onChange={(e) =>
                            updateConfig("instructions", e.target.value)
                          }
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                          placeholder="Instructions pour le client..."
                        />
                      </div>
                    </div>
                  )}

                  {selectedGateway.provider === "wallet" && (
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                      <p>
                        Le module Portefeuille utilise le solde interne des
                        utilisateurs. Aucune clé API externe n'est requise.
                      </p>
                    </div>
                  )}

                  {selectedGateway.provider === "offline" && (
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                      <p>
                        Le paiement Cash permet aux clients de payer en agence ou à la livraison.
                        Aucune configuration technique requise.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
              Sélectionnez une passerelle pour la configurer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
