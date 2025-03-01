"use client"

import { useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Calendar, Clock, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Slider } from "@/app/components/ui/slider"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent } from "@/app/components/ui/card"
import { ScrollArea } from "@/app/components/ui/scroll-area"

interface VideoPlayerProps {
  location: {
    id: number
    name: string
    lastUpdated: string
    detections: number
  }
}

// Mock person detection data
const MOCK_DETECTIONS = [
  {
    id: 1,
    timestamp: "10:15 AM",
    boundingBox: { x: 20, y: 30, width: 100, height: 200 },
    description: "Male, mid-30s, red jacket, blue jeans, carrying backpack",
  },
  {
    id: 2,
    timestamp: "10:16 AM",
    boundingBox: { x: 250, y: 50, width: 90, height: 180 },
    description: "Female, early 20s, black coat, blonde hair",
  },
  {
    id: 3,
    timestamp: "10:17 AM",
    boundingBox: { x: 150, y: 100, width: 80, height: 160 },
    description: "Child, approximately 10 years old, green t-shirt, brown hair",
  },
]

export default function VideoPlayer({ location }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [showDetections, setShowDetections] = useState(true)

  // Simulate video playback
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 1
          if (newProgress >= 100) {
            setIsPlaying(false)
            return 100
          }
          return newProgress
        })

        // Update current time display
        const minutes = Math.floor((progress / 100) * 5)
        const seconds = Math.floor(((progress / 100) * 300) % 60)
        setCurrentTime(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, progress])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRestart = () => {
    setProgress(0)
    setCurrentTime("00:00")
    setIsPlaying(true)
  }

  const handleSkipForward = () => {
    setProgress((prev) => Math.min(prev + 10, 100))
  }

  const handleProgressChange = (value: number[]) => {
    setProgress(value[0])
  }

  return (
    <div className="space-y-4">
      {/* Video metadata */}
      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Today
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last updated: {location.lastUpdated}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {location.detections} persons detected
        </Badge>
      </div>

      {/* Video player */}
      <div className="video-container relative rounded-md overflow-hidden border bg-muted/20 aspect-video">
        {/* Video placeholder */}
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/placeholder.svg?height=300&width=500')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Person detection highlights */}
        {showDetections &&
          MOCK_DETECTIONS.map((detection) => (
            <div
              key={detection.id}
              className="person-highlight"
              style={{
                left: `${detection.boundingBox.x}px`,
                top: `${detection.boundingBox.y}px`,
                width: `${detection.boundingBox.width}px`,
                height: `${detection.boundingBox.height}px`,
              }}
            >
              <div className="person-highlight-label">Person {detection.id}</div>
            </div>
          ))}

        {/* Video controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
          <div className="flex flex-col gap-2">
            <Slider value={[progress]} max={100} step={1} onValueChange={handleProgressChange} className="w-full" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleRestart}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSkipForward}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-xs">{currentTime} / 05:00</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetections(!showDetections)} className="text-xs">
                {showDetections ? "Hide Detections" : "Show Detections"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Person detections list */}
      <Card>
        <CardContent className="p-3">
          <h3 className="text-sm font-medium mb-2">Detected Persons</h3>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {MOCK_DETECTIONS.map((detection) => (
                <div key={detection.id} className="flex gap-2 p-2 border rounded-md bg-muted/10">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Person {detection.id}</span>
                      <span className="text-xs text-muted-foreground">{detection.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{detection.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

