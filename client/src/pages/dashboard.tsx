import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { SearchFilters } from "@/components/search-filters";
import { AlertsPanel } from "@/components/alerts-panel";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Mic, Send, Camera, Bell, UserSearch, Phone, PhoneOff } from "lucide-react";
import { mockPins, mockDetections, personImages } from "@/lib/mockData";
import type { DetectedPerson, MapPin } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [detections, setDetections] = useState(mockDetections);
  const [searchResults, setSearchResults] = useState<DetectedPerson[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (filters: string[]) => {
    const results = mockDetections.filter(person => {
      const searchText = `${person.description} ${person.details.clothing} ${person.details.distinctive_features.join(' ')}`.toLowerCase();
      return filters.some(filter => searchText.includes(filter.toLowerCase()));
    });
    setSearchResults(results);
  };

  const handlePersonsDetected = (persons: DetectedPerson[]) => {
    setDetections(persons);
  };

  const toggleCall = () => {
    if (!isCallActive) {
      setIsCallActive(true);
      // Mock live transcription updates
      const mockUpdate = () => {
        setTranscription(prev => [...prev, "Operator: Last seen wearing a red jacket near downtown..."]);
      };
      setTimeout(mockUpdate, 2000);
    } else {
      setIsCallActive(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Detections & Alerts */}
          <div className="col-span-3">
            <Tabs defaultValue="detections" className="h-full">
              <TabsList className="w-full">
                <TabsTrigger value="detections" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Detections
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex-1">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detections" className="mt-4 h-[calc(100vh-12rem)]">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {detections.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onClick={() => setSelectedPerson(person)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="alerts" className="mt-4">
                <AlertsPanel />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Map */}
          <div className="col-span-6">
            <InteractiveMap
              center={[-74.006, 40.7128]}
              zoom={14}
              pins={mockPins}
              onPinClick={setSelectedPin}
            />
          </div>

          {/* Right Panel - Search & Call Transcription */}
          <div className="col-span-3 space-y-4">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle>Search</CardTitle>
              </CardHeader>
              <CardContent>
                <SearchFilters onSearch={handleSearch} />
                <ScrollArea className="h-[200px] mt-4">
                  <div className="space-y-2">
                    {searchResults.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        onClick={() => setSelectedPerson(person)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Call Transcription */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Live Call</CardTitle>
                <Button
                  size="icon"
                  variant={isCallActive ? "destructive" : "outline"}
                  onClick={toggleCall}
                >
                  {isCallActive ? (
                    <PhoneOff className="h-4 w-4" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-2">
                    {transcription.map((line, i) => (
                      <p key={i} className="text-sm">{line}</p>
                    ))}
                    {isCallActive && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mic className="h-4 w-4 animate-pulse" />
                        <span className="text-sm">Listening...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Camera View Dialog */}
      <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Camera Feed - {selectedPin?.location}</DialogTitle>
          </DialogHeader>
          {selectedPin && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <VideoPlayer
                  showDetections={true}
                  onPersonsDetected={handlePersonsDetected}
                  cameraId={selectedPin.id}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last updated: {selectedPin.timestamp}
                </span>
                <Badge variant="secondary">
                  {detections.length} people detected
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Person Details Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Person Details
              <Badge variant={selectedPerson?.confidence && selectedPerson.confidence > 0.8 ? "default" : "secondary"}>
                {selectedPerson?.confidence && Math.round(selectedPerson.confidence * 100)}% Match
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={personImages[selectedPerson.id as keyof typeof personImages]}
                  alt="Detected person"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Time Detected</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.time}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Details</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Age: {selectedPerson.details.age}</p>
                    <p>Clothing: {selectedPerson.details.clothing}</p>
                    <p>Environment: {selectedPerson.details.environment}</p>
                    <p>Movement: {selectedPerson.details.movement}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Distinctive Features</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPerson.details.distinctive_features.map((feature, index) => (
                      <Badge key={index} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PersonCard({ person, onClick }: { person: DetectedPerson; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={personImages[person.id as keyof typeof personImages]}
            alt={`Person ${person.id}`}
            className="w-16 h-16 rounded object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{person.description}</p>
              <Badge variant="outline">
                {Math.round(person.confidence * 100)}%
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {person.time}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {person.details.distinctive_features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}