import { useEffect, useRef, useState } from "react";
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
  location: string;
  detectionCount?: number;
}

interface InteractiveMapProps {
  center: [number, number];
  zoom: number;
  pins?: MapPin[];
  onPinClick?: (pin: MapPin) => void;
  highlightedPinId?: number;
}

export function InteractiveMap({
  center,
  zoom,
  pins = [],
  onPinClick,
  highlightedPinId,
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: mapboxgl.Marker }>({});

  // Initialize map
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
      // Clean up markers before removing map
      Object.values(markersRef.current).forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Handle pins updates
  useEffect(() => {
    if (!map.current) return;

    // Track existing pins to remove stale ones
    const currentPinIds = new Set(pins.map(pin => pin.id));

    // Remove stale markers
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentPinIds.has(Number(id))) {
        marker.remove();
        delete markersRef.current[Number(id)];
      }
    });

    // Update or add new pins
    pins.forEach((pin) => {
      let marker = markersRef.current[pin.id];
      const isHighlighted = pin.id === highlightedPinId;

      // Create or update marker element
      const el = document.createElement("div");
      el.className = "w-3 h-3 rounded-full cursor-pointer relative";
      el.style.backgroundColor = pin.type === "camera" ? "#ef4444" : "#3b82f6";

      if (isHighlighted) {
        el.style.transform = "scale(1.5)";
        el.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
      }

      // Add pulse effect
      const pulse = document.createElement("div");
      pulse.className = "absolute -inset-1 rounded-full animate-ping";
      pulse.style.backgroundColor = pin.type === "camera" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)";
      pulse.style.animationDuration = isHighlighted ? "1s" : "2s";
      el.appendChild(pulse);

      // Create or update popup content
      const popupContent = `
        <div class="p-2 text-xs">
          <strong>${pin.type === "camera" ? "Camera Location" : "Last Seen"}</strong>
          ${pin.timestamp ? `<br>Time: ${pin.timestamp}` : ""}
          ${pin.location ? `<br>Location: ${pin.location}` : ""}
          ${pin.detectionCount ? `<br>Detections: ${pin.detectionCount}` : ""}
        </div>
      `;

      if (!marker) {
        // Create new marker with popup
        marker = new mapboxgl.Marker(el)
          .setLngLat([pin.lng, pin.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25, closeButton: false })
              .setHTML(popupContent)
          )
          .addTo(map.current);

        // Store marker reference
        markersRef.current[pin.id] = marker;

        // Add click handler
        if (onPinClick) {
          el.addEventListener("click", () => onPinClick(pin));
        }
      } else {
        // Update existing marker
        marker.getElement().replaceWith(el);
        marker.setLngLat([pin.lng, pin.lat]);
        marker.getPopup().setHTML(popupContent);
      }
    });
  }, [pins, highlightedPinId, onPinClick]);

  // Handle center changes
  useEffect(() => {
    if (!map.current) return;

    // Smoothly animate to new center
    map.current.flyTo({
      center: center,
      duration: 1000,
      essential: true
    });
  }, [center]);

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