import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { emailService } from "../../../services/emailService";
import {
  Mail,
  Send,
  RefreshCcw,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Clock,
  X,
  Trash2,
  Eye,
  Repeat,
} from "lucide-react";
import DOMPurify from "dompurify";
import { useToast } from "../../../contexts/ToastContext";
import { storageService } from "../../../services/storageService";
import {
  brandingService,
  BrandingSettings,
} from "../../../services/brandingService";
import RichEditor from "../../../components/common/RichEditor";

interface EmailHistoryItem {
  id: string;
  created_at: string;
  subject: string;
  body: string;
  recipient_group: "all" | "clients" | "forwarders" | "specific";
  status: "pending" | "processing" | "sent" | "failed";
  error_message?: string;
  sender: {
    full_name: string;
    email: string;
  };
}

export default function AdminEmails() {
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<EmailHistoryItem[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [subject, setSubject] = useState("");
  const [recipientGroup, setRecipientGroup] = useState<
    "all" | "clients" | "forwarders" | "specific"
  >("all");
  const [messageBody, setMessageBody] = useState("");
  const [attachments, setAttachments] = useState<
    {
      name: string;
      path: string;
      fullPath: string;
      publicUrl: string;
      type: string;
      size: number;
    }[]
  >([]);

  // Branding State
  const [branding, setBranding] = useState<BrandingSettings | null>(null);

  // Selected Email for View Modal
  const [selectedEmail, setSelectedEmail] = useState<EmailHistoryItem | null>(
    null,
  );
  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState(false);

  const generatePreviewHTML = (content: string) => {
    const logo =
      branding?.logo_url || "https://via.placeholder.com/150x50?text=NextMove";
    const address =
      branding?.pages?.contact?.address ||
      "123 Avenue Leopold Sedar Senghor, Dakar, Sénégal";
    const emailContact =
      branding?.pages?.contact?.email || "contact@nextmovecargo.com";
    const fb = branding?.social_media?.facebook || "#";
    const li = branding?.social_media?.linkedin || "#";
    const insta = branding?.social_media?.instagram || "#";
    const company = branding?.platform_name || "NextMove Cargo";

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    
                    <!-- Main Card -->
                    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);">
                        
                        <!-- Brand Accent -->
                        <div style="height: 6px; background: linear-gradient(90deg, #0f172a, #3b82f6);"></div>
                        
                        <!-- Header Spacer -->
                        <div style="padding: 30px 40px 0 40px;"></div>

                        <!-- Main Content -->
                        <div style="padding: 10px 40px 40px 40px; font-size: 15px; line-height: 1.6; color: #374151;">
                            ${content}
                        </div>
                    </div>

                    <!-- Corporate Footer (Outside Card) -->
                    <div style="margin-top: 30px; text-align: center; padding: 0 20px;">
                        
                        <!-- Logo (Larger) -->
                        <div style="margin-bottom: 25px;">
                            <img src="${logo}" alt="${company}" style="height: 65px; width: auto; max-width: 220px; object-fit: contain;">
                        </div>

                        <!-- Social Media Mockups -->
                        <div style="margin-bottom: 25px;">
                            <a href="${li}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                            </a>
                            <a href="${fb}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                            </a>
                            <a href="${insta}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                            </a>
                        </div>

                        <!-- Address & Contact -->
                        <div style="margin-bottom: 20px;">
                            <p style="font-size: 12px; color: #6b7280; margin: 3px 0;">
                                ${company} International
                            </p>
                            <p style="font-size: 12px; color: #9ca3af; margin: 3px 0;">
                                ${address}
                            </p>
                            <p style="font-size: 12px; color: #9ca3af; margin: 3px 0;">
                                <a href="mailto:${emailContact}" style="color: #6b7280; text-decoration: none;">${emailContact}</a>
                            </p>
                        </div>

                        <!-- Legal -->
                        <div style="font-size: 11px; color: #9ca3af;">
                            <p style="margin: 0;">
                                &copy; ${new Date().getFullYear()} ${company}.
                                <span style="margin: 0 6px;">•</span>
                                <a href="#" style="color: #9ca3af; text-decoration: none;">Confidentialité</a>
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setUploading(true);
    const file = e.target.files[0]; // Simple single file upload logic for now, though input is multiple

    try {
      // Upload to Supabase Storage
      const result = await storageService.uploadEmailAttachment(file);

      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          type: file.type,
          size: file.size,
          ...result,
        },
      ]);

      success("Fichier ajouté !");
    } catch (error) {
      console.error("Upload failed", error);
      toastError("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    loadHistory();

    // Fetch branding settings
    const loadBranding = async () => {
      const data = await brandingService.getBranding();
      setBranding(data);
    };
    loadBranding();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await emailService.getAdminEmailHistory();
      setHistory((data as any) || []);
    } catch (error) {
      console.error("Failed to load email history", error);
      toastError("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !messageBody) {
      toastError("Veuillez remplir le sujet et le message");
      return;
    }

    setSending(true);
    try {
      await emailService.queueAdminEmail({
        subject,
        body: messageBody,
        recipient_group: recipientGroup,
        attachments,
      });
      success("Email ajouté à la file d'attente");

      // Reset form
      setSubject("");
      setMessageBody("");
      setRecipientGroup("all");
      setAttachments([]);

      // Reload list
      loadHistory();
      setView("list");
    } catch (error) {
      console.error("Failed to queue email", error);
      toastError("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" /> Envoyé
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="w-3 h-3" /> Échec
          </span>
        );
      case "processing":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <RefreshCcw className="w-3 h-3 animate-spin" /> En cours
          </span>
        );
      default: // pending
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cet email de l'historique ?"))
      return;

    try {
      await emailService.deleteAdminEmail(id);
      success("Email supprimé");
      loadHistory();
    } catch (err) {
      console.error(err);
      toastError("Impossible de supprimer");
    }
  };

  const handleResend = (item: EmailHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubject(item.subject);
    setMessageBody(item.body);
    setRecipientGroup(item.recipient_group);
    setAttachments([]); // Attachments logic is complex to restore, skipping for safety

    setView("compose");
    success("Contenu chargé dans l'éditeur");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getGroupLabel = (group: string) => {
    const labels: Record<string, string> = {
      all: "Tous les utilisateurs",
      clients: "Clients seulement",
      forwarders: "Transitaires seulement",
      specific: "Spécifique",
    };
    return labels[group] || group;
  };

  const [view, setView] = useState<"list" | "compose">("list");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-7 h-7 text-primary" />
            Gestion des Emails
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Envoyez des annonces et suivez leur statut.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {view === "list" ? (
            <button
              onClick={() => setView("compose")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Nouvel Email
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          )}

          <button
            onClick={loadHistory}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
            title="Actualiser"
          >
            <RefreshCcw
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Compose View */}
      {view === "compose" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-700">
            <Send className="w-5 h-5 text-primary" />
            Rédiger un nouvel email
          </h2>

          <form onSubmit={handleSend} className="space-y-6 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="recipient_group"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Destinataires
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="recipient_group"
                    value={recipientGroup}
                    onChange={(e) => setRecipientGroup(e.target.value as any)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  >
                    <option value="all">Tous les utilisateurs</option>
                    <option value="clients">Clients uniquement</option>
                    <option value="forwarders">Transitaires uniquement</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email_subject"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Sujet
                </label>
                <input
                  id="email_subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Maintenance prévue..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Message
              </label>
              <RichEditor
                value={messageBody}
                onChange={setMessageBody}
                placeholder="Rédigez votre message ici..."
                className="min-h-[400px]"
              />
            </div>

            {/* Attachments Section */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pièces Jointes
                </label>
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow">
                  <Paperclip className="w-4 h-4" />
                  Ajouter un fichier
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {uploading && (
                <div className="text-xs text-center py-2 text-gray-500 animate-pulse">
                  Téléchargement en cours...
                </div>
              )}

              {attachments.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        aria-label="Supprimer la pièce jointe"
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4 italic">
                  Aucune pièce jointe
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setView("list")}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!subject || !messageBody}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Prévisualiser
              </button>
              <button
                type="submit"
                disabled={sending || !subject || !messageBody}
                className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer l'email
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History List View */}
      {view === "list" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">
                Historique des envois
              </h2>
            </div>
            <span className="text-xs text-gray-500 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              {history.length} email{history.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left w-1/3">Sujet / Message</th>
                  <th className="px-6 py-3 text-left">Cible & Date</th>
                  <th className="px-6 py-3 text-left">Détails</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Aucun email envoyé
                      </p>
                      <p className="text-sm mt-1">
                        Commencez par cliquer sur "Nouvel Email" pour envoyer
                        votre première annonce.
                      </p>
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                              item.status === "sent"
                                ? "bg-green-500"
                                : item.status === "failed"
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                            }`}
                          />
                          <div>
                            <p
                              className="font-bold text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                              onClick={() => setSelectedEmail(item)}
                            >
                              {item.subject}
                            </p>
                            <p
                              className="text-sm text-gray-500 line-clamp-2 mt-0.5"
                              dangerouslySetInnerHTML={{
                                __html:
                                  DOMPurify.sanitize(item.body).replace(
                                    /<[^>]+>/g,
                                    " ",
                                  ) || "",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            {getGroupLabel(item.recipient_group)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(
                              item.created_at,
                            ).toLocaleDateString()} à{" "}
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {item.sender?.full_name || "Admin"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {getStatusBadge(item.status)}
                        </div>
                        {item.error_message && (
                          <p
                            className="text-xs text-red-500 mt-1 max-w-[150px] truncate mx-auto"
                            title={item.error_message}
                          >
                            {item.error_message}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedEmail(item)}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Voir détails"
                            aria-label="Voir les détails de l'email"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleResend(item, e)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Réutiliser / Renvoyer"
                            aria-label="Réutiliser ou renvoyer l'email"
                          >
                            <Repeat className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                            aria-label="Supprimer l'email"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Modal Detail View */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {selectedEmail.subject}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {new Date(selectedEmail.created_at).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>{getGroupLabel(selectedEmail.recipient_group)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                aria-label="Fermer les détails"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
              <div
                className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(selectedEmail.body),
                }}
              />
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800">
              <button
                onClick={(e) => handleDelete(selectedEmail.id, e)}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <button
                onClick={(e) => {
                  handleResend(selectedEmail, e);
                  setSelectedEmail(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Repeat className="w-4 h-4" /> Utiliser comme modèle
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Prévisualisation
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                aria-label="Fermer la prévisualisation"
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900/50 p-4">
              <div className="bg-white shadow-lg mx-auto max-w-[600px] min-h-[400px]">
                <div
                  dangerouslySetInnerHTML={{
                    __html: generatePreviewHTML(messageBody),
                  }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-gray-800">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={(e) => {
                  setPreviewOpen(false);
                  handleSend(e as any);
                }}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
