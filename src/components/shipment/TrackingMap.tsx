import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { locationService, LatLng } from '../../services/locationService';
import { supabase } from '../../lib/supabase';

// Fix for default marker icons in Leaflet with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

interface TrackingMapProps {
    shipmentId: string;
    origin: string;
    destination: string;
    progress: number;
    status?: string;
}

export default function TrackingMap({ shipmentId, origin, destination, progress, status }: TrackingMapProps) {
    const [originCoords, setOriginCoords] = useState<LatLng | null>(null);
    const [destCoords, setDestCoords] = useState<LatLng | null>(null);
    const [driverCoords, setDriverCoords] = useState<LatLng | null>(null);

    useEffect(() => {
        setOriginCoords(locationService.getCoordinates(origin));
        setDestCoords(locationService.getCoordinates(destination));
    }, [origin, destination]);

    useEffect(() => {
        if (!shipmentId) return;

        // 1. Initial Load of last known position
        supabase
            .from('delivery_updates')
            .select('latitude, longitude')
            .eq('shipment_id', shipmentId)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .then(({ data }) => {
                if (data && data.length > 0) {
                    setDriverCoords({ lat: data[0].latitude, lng: data[0].longitude });
                }
            });

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`shipment-gps-${shipmentId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'delivery_updates',
                    filter: `shipment_id=eq.${shipmentId}`
                },
                (payload) => {
                    console.log('Realtime GPS Update:', payload);
                    setDriverCoords({
                        lat: payload.new.latitude,
                        lng: payload.new.longitude
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shipmentId]);

    if (!originCoords || !destCoords) {
        return (
            <div className="h-[400px] w-full bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto">
                        <MapPin className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium italic">Carte de suivi indisponible pour cet itinéraire</p>
                </div>
            </div>
        );
    }

    const center: [number, number] = [
        (originCoords.lat + destCoords.lat) / 2,
        (originCoords.lng + destCoords.lng) / 2
    ];

    // Calculate current position based on progress
    const currentLat = originCoords.lat + (destCoords.lat - originCoords.lat) * (progress / 100);
    const currentLng = originCoords.lng + (destCoords.lng - originCoords.lng) * (progress / 100);
    const currentPos: [number, number] = [currentLat, currentLng];

    const polyline: [number, number][] = [
        [originCoords.lat, originCoords.lng],
        [destCoords.lat, destCoords.lng]
    ];

    // Custom Transport Icon
    const transportIcon = L.divIcon({
        html: `
      <div style="background-color: #f97316; padding: 8px; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid white; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.2.6 4.3 1.62 6"/><path d="M12 10.12V3.5"/><path d="M12 3.5 17 6"/><path d="M12 3.5 7 6"/></svg>
      </div>
    `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const originIcon = L.divIcon({
        html: `<div style="color: #64748b;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    const destIcon = L.divIcon({
        html: `<div style="color: #1e3a8a;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    const driverIcon = L.divIcon({
        html: `
      <div style="background-color: #22c55e; padding: 8px; border-radius: 50%; box-shadow: 0 0 15px rgba(34,197,94,0.5); border: 2px solid white; display: flex; align-items: center; justify-content: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #22c55e; border-radius: 50%; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.91A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.09L21 9"/><path d="M12 3v6"/><path d="M14 13h.01"/><path d="M10 13h.01"/><path d="M10 17h4"/></svg>
      </div>
      <style>
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    return (
        <div className="h-[500px] w-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl relative z-10 my-8">
            <MapContainer center={center} zoom={3} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Polyline positions={polyline} color="#f97316" weight={3} dashArray="10, 10" opacity={0.5} />

                <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-slate-900">Origine</p>
                            <p className="text-xs text-slate-500">{origin}</p>
                        </div>
                    </Popup>
                </Marker>

                <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-slate-900">Destination</p>
                            <p className="text-xs text-slate-500">{destination}</p>
                        </div>
                    </Popup>
                </Marker>

                <Marker position={currentPos} icon={transportIcon}>
                    <Popup>
                        <div className="text-center">
                            <p className="font-bold text-orange-600">Statut: {status || 'En transit'}</p>
                            <p className="text-xs text-slate-500">Progression Estimée: {progress}%</p>
                        </div>
                    </Popup>
                </Marker>

                {driverCoords && (
                    <Marker position={[driverCoords.lat, driverCoords.lng]} icon={driverIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-green-600">Livreur en direct 📍</p>
                                <p className="text-xs text-slate-500">Position partagée en temps réel</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
