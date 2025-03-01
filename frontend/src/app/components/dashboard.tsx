"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Search, MapPin, Bell, Filter, Map, Sun, Moon, Menu, X } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Badge } from "@/app/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet"

import SearchMap from "@/app/components/search-map"
import VideoPlayer from "@/app/components/video-player"
import FilterPanel from "@/app/components/filter-panel"
import AlertsPanel from "@/app/components/alerts-panel"

export default function Dashboard() {
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would trigger the search API
    console.log("Searching for:", searchQuery)
  }

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 z-10 bg-background">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Find & Seek</h1>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, description, or location..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 pt-6">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>

                <Button
                  variant="outline"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-full justify-start"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel - Map */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Search Area</CardTitle>
                <CardDescription>Interactive map with camera locations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 relative">
              {showFilters && (
                <div className="absolute top-0 right-0 z-10 w-full md:w-72 bg-card border rounded-md shadow-lg m-2">
                  <div className="p-3 flex justify-between items-center border-b">
                    <h3 className="font-medium">Search Filters</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <FilterPanel />
                </div>
              )}
              <div className="h-[500px]">
                <SearchMap onLocationSelect={handleLocationSelect} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Tabs for Video and Alerts */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="footage" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="footage">
                <Map className="h-4 w-4 mr-2" />
                Footage
              </TabsTrigger>
              <TabsTrigger value="alerts">
                <Bell className="h-4 w-4 mr-2" />
                Live Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="footage" className="flex-1 mt-0">
              <Card className="h-full">
                <CardHeader className="p-4">
                  <CardTitle>Camera Footage</CardTitle>
                  <CardDescription>
                    {selectedLocation
                      ? `Viewing footage from ${selectedLocation.name}`
                      : "Select a camera location on the map"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {selectedLocation ? (
                    <VideoPlayer location={selectedLocation} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] border rounded-md bg-muted/20">
                      <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">Click on a map pin to view camera footage</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 mt-0">
              <Card className="h-full">
                <CardHeader className="p-4">
                  <CardTitle>Live Alerts</CardTitle>
                  <CardDescription>Real-time updates and notifications</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <AlertsPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Find & Seek - AI-Powered Search and Rescue Platform
          </p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <Badge variant="outline">Emergency Services</Badge>
            <Badge variant="outline">Government Agencies</Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}