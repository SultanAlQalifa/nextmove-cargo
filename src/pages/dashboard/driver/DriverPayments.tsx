import { CreditCard, Download, TrendingUp, Calendar } from "lucide-react";
import { useCurrency } from "../../../contexts/CurrencyContext";

export default function DriverPayments() {
  const { currency } = useCurrency();

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const payments = [
    {
      id: 1,
      date: "2024-03-15",
      amount: 295000,
      status: "paid",
      reference: "PAY-2024-001",
    },
    {
      id: 2,
      date: "2024-03-08",
      amount: 210000,
      status: "paid",
      reference: "PAY-2024-002",
    },
    {
      id: 3,
      date: "2024-03-01",
      amount: 360000,
      status: "paid",
      reference: "PAY-2024-003",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <CreditCard className="text-primary" /> Mes Paiements
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Gains ce mois</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(865000)}
          </p>
          <div className="flex items-center gap-1 text-green-600 text-sm mt-2">
            <TrendingUp className="w-4 h-4" /> +12% vs mois dernier
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">En attente</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {formatCurrency(0)}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Prochain virement: 22 Mars
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Annuel</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(3005000)}
          </p>
          <p className="text-sm text-gray-400 mt-2">Depuis Janvier 2024</p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Historique des Virements</h3>
          <button className="text-sm text-primary hover:underline flex items-center gap-1">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {payment.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Payé
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-primary hover:text-blue-900">
                    Reçu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
