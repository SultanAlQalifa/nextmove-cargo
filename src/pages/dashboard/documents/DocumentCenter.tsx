import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  File,
  Loader2,
  Eye,
} from "lucide-react";
import { documentService, Document } from "../../../services/documentService";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { format } from "date-fns";
import { fr, enUS, es } from "date-fns/locale";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function DocumentCenter() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const getDateLocale = () => {
    switch (i18n.language) {
      case "fr":
        return fr;
      case "es":
        return es;
      default:
        return enUS;
    }
  };

  const loadDocuments = async () => {
    try {
      if (!user) return;
      const data = await documentService.getDocuments(user.id);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
      showError(t("documents.messages.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Simple type detection based on extension or user selection (defaulting to 'other' for now)
    // In a real app, we might ask the user to select the type via a modal
    const type = "other";

    setUploading(true);
    try {
      await documentService.uploadDocument(user.id, file, type);
      success(t("documents.messages.uploadSuccess"));
      loadDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      showError(t("documents.messages.uploadError"));
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    docId: string | null;
    docUrl: string | null;
  }>({
    isOpen: false,
    docId: null,
    docUrl: null
  });

  const handleDelete = (doc: Document) => {
    setConfirmation({
      isOpen: true,
      docId: doc.id,
      docUrl: doc.url
    });
  };

  const confirmDelete = async () => {
    if (!confirmation.docId || !confirmation.docUrl) return;

    try {
      await documentService.deleteDocument(confirmation.docId, confirmation.docUrl);
      success(t("documents.messages.deleteSuccess"));
      setDocuments((prev) => prev.filter((d) => d.id !== confirmation.docId));
    } catch (error) {
      console.error("Error deleting document:", error);
      showError(t("documents.messages.deleteError"));
    } finally {
      setConfirmation({ isOpen: false, docId: null, docUrl: null });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await documentService.getDownloadUrl(doc.url);
      if (url) {
        window.open(url, "_blank");
      } else {
        showError(t("documents.messages.downloadError"));
      }
    } catch (error) {
      console.error("Error downloading:", error);
      showError(t("documents.messages.downloadError"));
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("documents.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {t("documents.subtitle")}
          </p>
        </div>

        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>
              {uploading ? t("documents.uploading") : t("documents.upload")}
            </span>
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t("documents.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {["all", "invoice", "contract", "kyc", "other"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filterType === type
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-slate-50 text-slate-600 dark:bg-gray-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-600"
                }`}
            >
              {t(`documents.filter.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
              {t("documents.empty.title")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {t("documents.empty.subtitle")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="uppercase tracking-wider font-bold bg-slate-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        {doc.type}
                      </span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(doc.created_at), "dd MMM yyyy", {
                          locale: getDateLocale(),
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    title={t("documents.actions.download")}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title={t("documents.actions.delete")}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, docId: null, docUrl: null })}
        onConfirm={confirmDelete}
        title={t("documents.modal.deleteTitle")}
        message={t("documents.modal.deleteMessage")}
        variant="danger"
        confirmLabel={t("common.delete")}
      />
    </div>
  );
}
