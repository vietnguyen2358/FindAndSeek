import { useEffect, useRef } from "react";
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
      pitchWithRotate: false,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    map.current.on('load', () => {
      if (map.current) {
        map.current.setPaintProperty('water', 'fill-color', '#1a1a1a');
        map.current.setPaintProperty('building', 'fill-color', '#262626');
      }
    });

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty deps array as this should only run once

  // Handle pins updates
  useEffect(() => {
    if (!map.current) return;

    // Create or update markers for each pin
    pins.forEach((pin) => {
      const isHighlighted = pin.id === highlightedPinId;

      // Check if marker already exists
      let marker = markersRef.current[pin.id];
      let el: HTMLDivElement;

      if (!marker) {
        // Create new marker element
        el = document.createElement("div");
        marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map.current!);

        // Store marker reference
        markersRef.current[pin.id] = marker;

        // Add click handler
        if (onPinClick) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            onPinClick(pin);
          });
        }
      } else {
        el = marker.getElement();
        // Only update position if it changed
        const currentPos = marker.getLngLat();
        if (currentPos.lng !== pin.lng || currentPos.lat !== pin.lat) {
          marker.setLngLat([pin.lng, pin.lat]);
        }
      }

      // Update marker appearance
      el.className = `w-3 h-3 rounded-full cursor-pointer relative transition-all duration-300 ${
        isHighlighted ? 'scale-150' : ''
      }`;
      el.style.backgroundColor = pin.type === "camera" ? "#ef4444" : "#3b82f6";
      el.style.boxShadow = isHighlighted ? "0 0 10px rgba(255,255,255,0.5)" : "none";

      // Add pulse effect
      el.innerHTML = ''; // Clear existing pulse
      const pulse = document.createElement("div");
      pulse.className = "absolute -inset-1 rounded-full animate-ping";
      pulse.style.backgroundColor = pin.type === "camera" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)";
      pulse.style.animationDuration = isHighlighted ? "1s" : "2s";
      el.appendChild(pulse);
    });

    // Remove markers that are no longer in pins
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (!pins.find(p => p.id === Number(id))) {
        marker.remove();
        delete markersRef.current[Number(id)];
      }
    });
  }, [pins, highlightedPinId, onPinClick]);

  // Handle center and zoom changes
  useEffect(() => {
    if (!map.current) return;

    map.current.flyTo({
      center,
      zoom,
      duration: 1000,
    });
  }, [center, zoom]);

  return (
    <Card className="w-full h-[calc(100vh-10rem)] overflow-hidden border-border bg-background relative">
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
}