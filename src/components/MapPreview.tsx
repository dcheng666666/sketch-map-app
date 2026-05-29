import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Location } from "sketch-map-sdk";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

function FitBounds({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 10);
      return;
    }
    const bounds = L.latLngBounds(
      locations.map((l) => [l.lat, l.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [locations, map]);

  return null;
}

interface Props {
  locations: Location[];
}

export function MapPreview({ locations }: Props) {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].lat, locations[0].lng]
      : [35, 105];

  return (
    <div className="map-preview">
      <MapContainer
        center={center}
        zoom={locations.length === 0 ? 3 : 6}
        scrollWheelZoom
        className="leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds locations={locations} />
        {locations.map((loc, i) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <strong>
                {i + 1}. {loc.name}
              </strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
