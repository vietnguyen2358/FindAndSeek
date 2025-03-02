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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const newMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
      pitchWithRotate: false,
      attributionControl: false
    });

    newMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    // Add custom styles for labels and roads
    newMap.on('load', () => {
      // Make water darker
      newMap.setPaintProperty('water', 'fill-color', '#1a1a1a');

      // Make buildings darker
      newMap.setPaintProperty('building', 'fill-color', '#262626');

      // Adjust text colors
      newMap.setPaintProperty('label-text', 'text-color', '#666666');
    });

    map.current = newMap;

    return () => {
      // Clean up markers before removing map
      Object.values(markersRef.current).forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Handle pins updates
  useEffect(() => {
    const currentMap = map.current;
    if (!currentMap) return;

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
      const isHighlighted = pin.id === highlightedPinId;

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

      // Create popup content
      const popupContent = `
        <div class="p-2 text-xs">
          <strong>${pin.type === "camera" ? "Camera Location" : "Last Seen"}</strong>
          ${pin.timestamp ? `<br>Time: ${pin.timestamp}` : ""}
          ${pin.location ? `<br>Location: ${pin.location}` : ""}
        </div>
      `;

      let marker = markersRef.current[pin.id];

      if (!marker) {
        // Create new marker
        marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          offset: [0, 0]
        })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(
            new mapboxgl.Popup({ 
              offset: 25,
              closeButton: false,
              closeOnClick: false
            })
              .setHTML(popupContent)
          );

        if (currentMap) {
          marker.addTo(currentMap);
          markersRef.current[pin.id] = marker;

          // Add click handler
          if (onPinClick) {
            el.addEventListener("click", () => onPinClick(pin));
          }
        }
      } else {
        // Update existing marker
        marker.getElement().replaceWith(el);
        marker.setLngLat([pin.lng, pin.lat]);
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(popupContent);
        }
      }
    });
  }, [pins, highlightedPinId, onPinClick]);

  // Handle center and zoom changes
  useEffect(() => {
    if (!map.current) return;

    // Smoothly animate to new center and zoom
    map.current.flyTo({
      center,
      zoom,
      duration: 2000,
      essential: true,
      curve: 1.42,
      speed: 1.2,
      easing: (t) => t
    });
  }, [center, zoom]);

  return (
    <Card className="w-full h-[calc(100vh-10rem)] overflow-hidden border-border bg-background relative">
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
}