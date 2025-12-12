import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { DollarSign, Lock, TrendingUp } from "lucide-react";

export default function AdminFinancials() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    blockedFunds: 0,
    recentPayments: [] as any[],
  });

  useEffect(() => {
    loadFinancials();
  }, []);

  const loadFinancials = async () => {
    // 1. Get all payments
    const { data: payments, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading financials:", error);
      return;
    }

    // 2. Calculate stats
    const totalRevenue = payments.reduce(
      (sum, p) => sum + (p.fee_platform || 0),
      0,
    );
    const blockedFunds = payments
      .filter((p) => p.status === "blocked")
      .reduce((sum, p) => sum + (p.amount_total || 0), 0);

    setStats({
      totalRevenue,
      blockedFunds,
      recentPayments: payments.slice(0, 5),
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Financial Overview</h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Revenue
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  €{stats.totalRevenue.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Escrow (Blocked)
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  €{stats.blockedFunds.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Transactions
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {stats.recentPayments.map((payment) => (
              <li key={payment.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 text-gray-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-primary truncate">
                        {payment.wave_transaction_id || "Pending Transaction"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">
                      {payment.amount_total} {payment.currency}
                    </span>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        payment.status === "released"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "blocked"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
            {stats.recentPayments.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">
                No transactions yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
