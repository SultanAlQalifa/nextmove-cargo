import { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { shipmentService } from '../../services/shipmentService';
import { consolidationService } from '../../services/consolidationService';
import { ExcelService } from '../../utils/excelService';

interface BulkUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'shipments' | 'consolidations';
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess, type }: BulkUploadModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);

    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            try {
                const data = await ExcelService.parseFile(selectedFile);
                setPreviewData(data);
                setError(null);
            } catch (err: any) {
                console.error("Excel parse error:", err);
                setError(err.message || 'Erreur lors de la lecture du fichier Excel.');
                setPreviewData([]);
            }
        }
    };

    const handleUpload = async () => {
        if (!previewData.length) return;
        setLoading(true);
        setError(null);

        try {
            if (type === 'shipments') {
                await shipmentService.bulkCreateShipments(previewData);
            } else {
                await consolidationService.bulkCreateConsolidations(previewData);
            }
            setSuccess(`${previewData.length} éléments importés avec succès !`);
            setTimeout(() => {
                onSuccess();
                onClose();
                setSuccess(null);
                setFile(null);
                setPreviewData([]);
            }, 2000);
        } catch (err: any) {
            console.error('Error uploading data:', err);
            setError(err.message || 'Une erreur est survenue lors de l\'importation.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        try {
            console.log('Starting template download...');
            ExcelService.downloadTemplate(type);
            console.log('Template download triggered successfully.');
        } catch (err: any) {
            console.error('Error downloading template:', err);
            setError(`Impossible de générer le modèle Excel: ${err.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" />
                                Importation Excel - {type === 'shipments' ? 'Expéditions' : 'Groupages'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-5 w-5 text-green-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <FileText className="w-12 h-12 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-900">
                                        {file ? file.name : 'Cliquez pour sélectionner un fichier Excel'}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">Acceptés : .xlsx, .xls</span>
                                </label>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="text-primary hover:text-blue-700 font-medium"
                                >
                                    Télécharger le modèle Excel
                                </button>
                                {previewData.length > 0 && (
                                    <span className="text-gray-500">{previewData.length} lignes détectées</span>
                                )}
                            </div>

                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={loading || !file}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:col-start-2 sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Importation...' : 'Importer'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={onClose}
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
