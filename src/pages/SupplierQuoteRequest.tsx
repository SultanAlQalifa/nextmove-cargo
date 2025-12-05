import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { quoteService, QuoteRequest } from '../services/quoteService';
import { Link } from 'react-router-dom';

interface QuoteRequestFormData {
    supplier_email: string;
    origin_country: string;
    destination_country: string;
    mode: 'sea' | 'air';
    type: 'standard' | 'express';
    weight_kg?: number;
    volume_cbm?: number;
    description: string;
}

export default function SupplierQuoteRequest() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, watch } = useForm<QuoteRequestFormData>({
        defaultValues: {
            mode: 'sea',
            type: 'standard',
            origin_country: 'China',
            destination_country: 'Senegal'
        }
    });

    const selectedMode = watch('mode');

    const onSubmit = async (data: QuoteRequestFormData) => {
        setLoading(true);
        try {
            await quoteService.createRequest({
                // No client_id for guest supplier
                supplier_email: data.supplier_email,
                origin_country: data.origin_country,
                destination_country: data.destination_country,
                mode: data.mode,
                type: data.type,
                cargo_details: {
                    weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
                    volume_cbm: data.volume_cbm ? Number(data.volume_cbm) : undefined,
                    description: data.description
                }
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-green-500 text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold mb-2">Request Submitted!</h2>
                    <p className="text-gray-600 mb-6">
                        Your quote request has been sent to our network of forwarders.
                        You will receive offers via email shortly.
                    </p>
                    <Link to="/" className="text-primary hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Supplier Quote Request</h1>
                    <p className="mt-2 text-gray-600">Send a shipping request directly to NextMove Cargo forwarders.</p>
                </div>

                <div className="bg-white shadow sm:rounded-lg p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Email</label>
                            <input
                                type="email"
                                required
                                {...register('supplier_email')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                placeholder="supplier@example.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Origin</label>
                                <select {...register('origin_country')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                                    <option value="China">China</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Destination</label>
                                <select {...register('destination_country')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                                    <option value="Senegal">Senegal</option>
                                    <option value="Ivory Coast">Ivory Coast</option>
                                    <option value="Mali">Mali</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mode</label>
                                <select {...register('mode')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                                    <option value="sea">Sea Freight</option>
                                    <option value="air">Air Freight</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type</label>
                                <select {...register('type')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                                    <option value="standard">Standard</option>
                                    <option value="express">Express</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description of Goods</label>
                            <textarea
                                {...register('description')}
                                required
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                placeholder="E.g. Electronics, Textiles, Machinery..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedMode === 'sea' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Volume (CBM)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register('volume_cbm')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...register('weight_kg')}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
