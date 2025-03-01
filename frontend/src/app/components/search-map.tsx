"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/app/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"

// Mock camera locations data
const MOCK_LOCATIONS = [
  {
    id: 1,
    name: "Downtown Plaza",
    lat: 37.7749,
    lng: -122.4194,
    lastUpdated: "10 minutes ago",
    detections: 3,
  },
  {
    id: 2,
    name: "Central Park",
    lat: 37.7833,
    lng: -122.4167,
    lastUpdated: "5 minutes ago",
    detections: 1,
  },
  {
    id: 3,
    name: "Main Street",
    lat: 37.785,
    lng: -122.422,
    lastUpdated: "2 minutes ago",
    detections: 5,
  },
  {
    id: 4,
    name: "City Hall",
    lat: 37.779,
    lng: -122.415,
    lastUpdated: "15 minutes ago",
    detections: 2,
  },
  {
    id: 5,
    name: "Transit Center",
    lat: 37.781,
    lng: -122.423,
    lastUpdated: "1 minute ago",
    detections: 7,
  },
]

interface SearchMapProps {
  onLocationSelect: (location: any) => void
}

export default function SearchMap({ onLocationSelect }: SearchMapProps) {
  const [loading, setLoading] = useState(true)
  const [mapInitialized, setMapInitialized] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Simulate map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      setMapInitialized(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // In a real implementation, this would use the Mapbox GL JS library
  // to render an interactive map with the camera locations

  return (
    <div className="relative h-full w-full">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Map placeholder */}
          <div
            ref={mapContainerRef}
            className="h-full w-full bg-muted/20 relative"
            style={{
              backgroundImage: "url('/placeholder.svg?height=500&width=800')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Map pins */}
            {MOCK_LOCATIONS.map((location) => (
              <div
                key={location.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${(location.lng + 122.43) * 1000}%`,
                  top: `${(37.79 - location.lat) * 1000}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={() => onLocationSelect(location)}
              >
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {location.detections}
                    </div>
                  </div>
                  <div className="bg-card border shadow-sm rounded-md px-2 py-1 text-xs mt-1 whitespace-nowrap">
                    {location.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button variant="secondary" size="icon" title="Zoom in">
              <span className="text-lg font-bold">+</span>
            </Button>
            <Button variant="secondary" size="icon" title="Zoom out">
              <span className="text-lg font-bold">-</span>
            </Button>
          </div>

          {/* Map legend */}
          <div className="absolute bottom-4 left-4 bg-card border rounded-md shadow-sm p-2">
            <div className="text-xs font-medium mb-1">Map Legend</div>
            <div className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3 text-primary" />
              <span>Camera Location</span>
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              <div className="bg-destructive text-destructive-foreground rounded-full w-3 h-3 flex items-center justify-center text-[10px]">
                1
              </div>
              <span>Person Detections</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

