import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  Shield,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  User,
  Database,
  CreditCard,
  Lock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  old_data: any;
  new_data: any;
  changed_at: string;
  changed_by_user?: {
    email: string;
    role: string;
  };
}

export default function AdminSecurity() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTable, setFilterTable] = useState("all");
  const [filterOperation, setFilterOperation] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [filterTable, filterOperation]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select(
          `
                    *,
                    changed_by_user:profiles (
                        email,
                        role
                    )
                `,
        )
        .order("changed_at", { ascending: false })
        .limit(100);

      if (filterTable !== "all") {
        query = query.eq("table_name", filterTable);
      }
      if (filterOperation !== "all") {
        query = query.eq("operation", filterOperation);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForTable = (tableName: string) => {
    switch (tableName) {
      case "transactions":
        return <CreditCard className="w-4 h-4 text-green-500" />;
      case "profiles":
        return <User className="w-4 h-4 text-blue-500" />;
      case "system_settings":
        return <Lock className="w-4 h-4 text-red-500" />;
      default:
        return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDataDiff = (oldData: any, newData: any) => {
    if (!oldData && newData)
      return <span className="text-green-600">Created Record</span>;
    if (oldData && !newData)
      return <span className="text-red-600">Deleted Record</span>;

    const changes: string[] = [];
    // Simple comparison for demo. Ideally use a deep diff util.
    Object.keys(newData).forEach((key) => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes.push(
          `${key}: ${JSON.stringify(oldData[key])} -> ${JSON.stringify(newData[key])}`,
        );
      }
    });

    return (
      <div className="text-xs font-mono space-y-1">
        {changes.slice(0, 3).map((change, i) => (
          <div key={i} className="truncate" title={change}>
            {change}
          </div>
        ))}
        {changes.length > 3 && (
          <div className="text-gray-400">+{changes.length - 3} more...</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-8 h-8 text-indigo-600" />
          Iron Dome Security Logs
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Immutable audit trail of all sensitive system actions.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          aria-label="Filter by Table"
          title="Filter by Table"
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Tables</option>
          <option value="transactions">Transactions</option>
          <option value="profiles">Profiles</option>
          <option value="shipments">Shipments</option>
          <option value="platform_rates">Platform Rates</option>
          <option value="system_settings">System Settings</option>
        </select>

        <select
          aria-label="Filter by Operation"
          title="Filter by Operation"
          value={filterOperation}
          onChange={(e) => setFilterOperation(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">All Operations</option>
          <option value="INSERT">Create (INSERT)</option>
          <option value="UPDATE">Modify (UPDATE)</option>
          <option value="DELETE">Remove (DELETE)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Actor
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    {new Date(log.changed_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.changed_by_user?.email || "System / Anonymous"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {log.changed_by_user?.role || "Unknown"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold 
                                            ${log.operation === "INSERT"
                          ? "bg-green-100 text-green-700"
                          : log.operation === "DELETE"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                    >
                      {log.operation}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getIconForTable(log.table_name)}
                      {log.table_name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-mono">
                    ID: {log.record_id.substring(0, 8)}...
                  </div>
                </td>
                <td className="px-6 py-4">
                  {formatDataDiff(log.old_data, log.new_data)}
                </td>
              </tr>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="w-12 h-12 text-gray-300" />
                    <p>No audit logs found matching criteria.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
