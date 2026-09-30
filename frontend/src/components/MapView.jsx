import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

// Helper to create colored SVG markers without missing asset issues
const createCustomIcon = (color, label = '') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

const getMarkerColor = (item) => {
  if (item.status === 'RESOLVED' || item.status === 'CITIZEN_VERIFIED' || item.status === 'COLLECTED') {
    return '#059669'; // Emerald
  }
  const priority = (item.priority_level || '').toUpperCase();
  if (priority === 'CRITICAL') return '#E11D48'; // Rose
  if (priority === 'HIGH') return '#D97706'; // Amber
  if (priority === 'LOW') return '#64748B'; // Slate
  return '#2563EB'; // Blue
};

// Location picker click handler for Report Wizard
function LocationPickerEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function MapView({
  center = [28.6280, 77.2180],
  zoom = 13,
  items = [],
  hotspots = [],
  pickups = [],
  selectedLocation = null,
  onLocationSelect = null,
  height = '500px',
  showHotspots = true,
  onItemClick = null,
}) {
  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onLocationSelect && <LocationPickerEvents onLocationSelect={onLocationSelect} />}

        {/* Selected Draggable Location Marker for Report creation */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createCustomIcon('#059669')}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                if (onLocationSelect) onLocationSelect(pos.lat, pos.lng);
              },
            }}
          >
            <Popup>
              <div className="text-xs font-semibold text-slate-800">
                Selected Incident Location
                <div className="text-[10px] text-slate-500 font-mono">
                  {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Hotspots Density / Recurrence Circles */}
        {showHotspots &&
          hotspots.map((h) => (
            <React.Fragment key={`hotspot-${h.id}`}>
              <Circle
                center={[h.latitude, h.longitude]}
                radius={h.radius_meters || 150}
                pathOptions={{
                  color: h.status === 'ACTIVE' ? '#E11D48' : '#059669',
                  fillColor: h.status === 'ACTIVE' ? '#F43F5E' : '#10B981',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '4, 6',
                }}
              />
              <Marker
                position={[h.latitude, h.longitude]}
                icon={createCustomIcon('#E11D48')}
              >
                <Popup>
                  <div className="p-1 space-y-1 max-w-xs text-xs">
                    <div className="font-bold text-rose-700 uppercase tracking-wider text-[10px]">
                      🔥 Recurring Waste Hotspot
                    </div>
                    <div className="font-semibold text-slate-900 text-sm">{h.name}</div>
                    <div className="text-slate-600">
                      <strong>{h.report_count} reports</strong> registered • Trend: <span className="text-rose-600 font-semibold">+{h.trend_percentage}%</span>
                    </div>
                    {h.recommendation && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-900">
                        <strong>Operational Advice:</strong> {h.recommendation}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* Normal Incident & Waste Report Markers */}
        {items.map((item) => (
          <Marker
            key={`report-${item.id}`}
            position={[item.latitude, item.longitude]}
            icon={createCustomIcon(getMarkerColor(item))}
            eventHandlers={{
              click: () => onItemClick && onItemClick(item),
            }}
          >
            <Popup>
              <div className="p-1 max-w-xs text-xs space-y-2">
                {/* Photo Preview if present */}
                {(item.image_url || item.image) && (
                  <img
                    src={item.image_url || item.image}
                    alt={item.title}
                    className="w-full h-24 object-cover rounded-md mb-1.5 border border-slate-200"
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 line-clamp-1">{item.title || item.category_details?.name}</span>
                  <StatusBadge status={item.status} />
                </div>

                <div className="text-slate-600 text-[11px] leading-snug">
                  {item.address}
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                  <PriorityBadge level={item.priority_level} score={item.priority_score} factors={item.priority_factors} />
                  <span className="text-[10px] text-slate-500 font-mono">#{item.id}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pickup Request Markers */}
        {pickups.map((p) => (
          <Marker
            key={`pickup-${p.id}`}
            position={[p.latitude, p.longitude]}
            icon={createCustomIcon('#8B5CF6')}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-semibold text-purple-700">📦 On-Demand Pickup #{p.id}</div>
                <div className="font-bold text-slate-800">{p.waste_type}</div>
                <div className="text-slate-600">{p.estimated_volume}</div>
                <div className="text-slate-500">{p.address}</div>
                <StatusBadge status={p.status} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
