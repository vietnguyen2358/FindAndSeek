import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";

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
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
      pitchWithRotate: false,
      attributionControl: false,
    });

    newMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    newMap.on('load', () => {
      newMap.setPaintProperty('water', 'fill-color', '#1a1a1a');
      newMap.setPaintProperty('building', 'fill-color', '#262626');
      newMap.setPaintProperty('label-text', 'text-color', '#666666');
      setIsMapReady(true);
    });

    map.current = newMap;

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle pins updates with memoization
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap || !isMapReady) return;

    // Remove stale markers first
    const currentPinIds = new Set(pins.map(pin => pin.id));
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!currentPinIds.has(Number(id))) {
        marker.remove();
        delete markersRef.current[Number(id)];
      }
    });

    // Update or add pins
    pins.forEach((pin) => {
      const isHighlighted = pin.id === highlightedPinId;
      let marker = markersRef.current[pin.id];

      // Create marker element
      const el = document.createElement("div");
      el.className = `w-3 h-3 rounded-full cursor-pointer relative transition-transform duration-300 ${
        isHighlighted ? 'scale-150' : ''
      }`;
      el.style.backgroundColor = pin.type === "camera" ? "#ef4444" : "#3b82f6";
      el.style.boxShadow = isHighlighted ? "0 0 10px rgba(255,255,255,0.5)" : "none";

      // Add pulse effect
      const pulse = document.createElement("div");
      pulse.className = "absolute -inset-1 rounded-full animate-ping";
      pulse.style.backgroundColor = pin.type === "camera" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)";
      pulse.style.animationDuration = isHighlighted ? "1s" : "2s";
      el.appendChild(pulse);

      if (!marker) {
        // Create new marker
        marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([pin.lng, pin.lat]);

        // Add click handler
        if (onPinClick) {
          el.addEventListener("click", () => onPinClick(pin));
        }

        marker.addTo(currentMap);
        markersRef.current[pin.id] = marker;
      } else {
        // Update existing marker
        marker.getElement().replaceWith(el);
        marker.setLngLat([pin.lng, pin.lat]);
      }
    });
  }, [pins, highlightedPinId, onPinClick, isMapReady]);

  // Handle center and zoom changes
  useEffect(() => {
    if (!map.current || !isMapReady) return;

    map.current.flyTo({
      center,
      zoom,
      duration: 1000,
      essential: true,
    });
  }, [center, zoom, isMapReady]);

  return (
    <Card className="w-full h-[calc(100vh-10rem)] overflow-hidden border-border bg-background relative">
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
}