import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";

// Usually this would come from env vars
const MAPBOX_TOKEN = "pk.your_mapbox_token_here";

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

    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.className = "w-6 h-6 rounded-full cursor-pointer";
      el.style.backgroundColor = pin.type === "camera" ? "#ef4444" : "#3b82f6";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div class="p-2">
              <strong>${pin.type === "camera" ? "Camera" : "Last Seen"}</strong>
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
    <Card className="w-full h-[600px] overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
    </Card>
  );
}
