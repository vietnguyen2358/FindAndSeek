"use client"

import { useState } from "react"
import { Bell, User, MapPin, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { ScrollArea } from "@/app/components/ui/scroll-area"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

// Mock alerts data
const MOCK_ALERTS = [
  {
    id: 1,
    type: "detection",
    location: "Downtown Plaza",
    timestamp: "2 minutes ago",
    message: "New person detected matching search criteria",
    priority: "high",
    read: false,
  },
  {
    id: 2,
    type: "detection",
    location: "Central Park",
    timestamp: "5 minutes ago",
    message: "Potential match found for missing person report #1293",
    priority: "high",
    read: false,
  },
  {
    id: 3,
    type: "system",
    location: "Main Street",
    timestamp: "10 minutes ago",
    message: "Camera connection restored after temporary outage",
    priority: "medium",
    read: true,
  },
  {
    id: 4,
    type: "detection",
    location: "Transit Center",
    timestamp: "15 minutes ago",
    message: "Multiple persons detected in restricted area",
    priority: "medium",
    read: true,
  },
  {
    id: 5,
    type: "system",
    location: "City Hall",
    timestamp: "30 minutes ago",
    message: "Daily system health check completed successfully",
    priority: "low",
    read: true,
  },
  {
    id: 6,
    type: "detection",
    location: "Downtown Plaza",
    timestamp: "45 minutes ago",
    message: "Person with red jacket detected near last known location",
    priority: "high",
    read: true,
  },
  {
    id: 7,
    type: "system",
    location: "System-wide",
    timestamp: "1 hour ago",
    message: "AI model updated to latest version for improved detection accuracy",
    priority: "medium",
    read: true,
  },
]

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)

  const markAsRead = (id: number) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, read: true })))
  }

  const unreadCount = alerts.filter((alert) => !alert.read).length

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Alerts</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="detections">Detections</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 mt-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} onMarkAsRead={() => markAsRead(alert.id)} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="detections" className="flex-1 mt-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {alerts
                .filter((alert) => alert.type === "detection")
                .map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onMarkAsRead={() => markAsRead(alert.id)} />
                ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="system" className="flex-1 mt-0">
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-2">
              {alerts
                .filter((alert) => alert.type === "system")
                .map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onMarkAsRead={() => markAsRead(alert.id)} />
                ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface AlertItemProps {
  alert: {
    id: number
    type: string
    location: string
    timestamp: string
    message: string
    priority: string
    read: boolean
  }
  onMarkAsRead: () => void
}

function AlertItem({ alert, onMarkAsRead }: AlertItemProps) {
  return (
    <div
      className={`border rounded-md p-3 transition-colors ${
        !alert.read ? "bg-muted/50 border-primary/50" : "bg-background hover:bg-muted/20"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {alert.type === "detection" ? (
            <div
              className={`p-1 rounded-full ${
                alert.priority === "high" ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-500"
              }`}
            >
              <User className="h-4 w-4" />
            </div>
          ) : (
            <div
              className={`p-1 rounded-full ${
                alert.priority === "high"
                  ? "bg-destructive/20 text-destructive"
                  : alert.priority === "medium"
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-green-500/20 text-green-500"
              }`}
            >
              {alert.priority === "high" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : alert.priority === "medium" ? (
                <Bell className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${!alert.read ? "text-primary" : ""}`}>
              {alert.type === "detection" ? "Person Detection" : "System Alert"}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {alert.timestamp}
            </div>
          </div>

          <p className="text-sm mt-1">{alert.message}</p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {alert.location}
            </div>

            {!alert.read && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onMarkAsRead}>
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

