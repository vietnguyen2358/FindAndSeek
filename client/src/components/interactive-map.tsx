import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";

// Update with the provided token
const MAPBOX_TOKEN = "pk.eyJ1Ijoidm5nMjM1OCIsImEiOiJjbTdwc3lraXQwcWVxMnJwdWZtZGkxdTY4In0.Ow6z_5cDo3XcRtiT_ZCMgA";

interface MapPin {
  id: number;
  lat: number;
  lng: number;
  type: "camera" | "lastSeen";
  timestamp?: string;
}

interface InteractiveMapProps {
  center: [number, number];
  zoom: number;
  pins?: MapPin[];
  onPinClick?: (pin: MapPin) => void;
}

export function InteractiveMap({
  center,
  zoom,
  pins = [],
  onPinClick,
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    // Add custom styles for labels and roads
    map.current.on('load', () => {
      if (!map.current) return;

      // Make water darker
      map.current.setPaintProperty('water', 'fill-color', '#1a1a1a');

      // Make buildings darker
      map.current.setPaintProperty('building', 'fill-color', '#262626');

      // Adjust text colors
      map.current.setPaintProperty('label-text', 'text-color', '#666666');
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while(markers[0]) {
      markers[0].remove();
    }

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.className = "w-3 h-3 rounded-full cursor-pointer relative";
      el.style.backgroundColor = pin.type === "camera" ? "#ef4444" : "#3b82f6";

      // Add pulse effect
      const pulse = document.createElement("div");
      pulse.className = "absolute -inset-1 rounded-full animate-ping";
      pulse.style.backgroundColor = pin.type === "camera" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)";
      el.appendChild(pulse);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setHTML(
              `<div class="p-2 text-xs">
                <strong>${pin.type === "camera" ? "Camera Location" : "Last Seen"}</strong>
                ${pin.timestamp ? `<br>Time: ${pin.timestamp}` : ""}
              </div>`
            )
        )
        .addTo(map.current);

      if (onPinClick) {
        el.addEventListener("click", () => onPinClick(pin));
      }
    });
  }, [pins, onPinClick]);

  return (
    <Card className="w-full h-[600px] overflow-hidden border-border bg-background relative">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-lg border border-border">
        <p className="text-xs font-medium mb-2">Map Legend</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs">Camera Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs">Person Detections</span>
          </div>
        </div>
      </div>
    </Card>
  );
}