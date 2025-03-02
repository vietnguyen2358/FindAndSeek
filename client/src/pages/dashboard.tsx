import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { SearchFilters } from "@/components/search-filters";
import { AlertsPanel } from "@/components/alerts-panel";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Mic, Camera, Bell, UserSearch, Phone, PhoneOff, MapPin } from "lucide-react";
import { mockPins, mockDetections, personImages } from "@/lib/mockData";
import type { DetectedPerson, MapPin as MapPinType, SearchFilter } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  const [detections, setDetections] = useState(mockDetections);
  const [searchResults, setSearchResults] = useState<DetectedPerson[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);

  const handleSearch = (filters: SearchFilter[]) => {
    const results = mockDetections.filter(person =>
      matchPersonToFilters(person, filters)
    );
    setSearchResults(results);
  };

  const handlePersonsDetected = (persons: DetectedPerson[]) => {
    setDetections(prev => [...persons]);
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
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Detections & Alerts */}
          <div className="col-span-3 space-y-6">
            <Card className="h-[calc(100vh-7rem)]">
              <Tabs defaultValue="detections" className="h-full">
                <CardHeader>
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
                </CardHeader>

                <CardContent className="p-0">
                  <TabsContent value="detections" className="m-0">
                    <ScrollArea className="h-[calc(100vh-12rem)] px-6">
                      <div className="space-y-4 pb-6">
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

                  <TabsContent value="alerts" className="m-0 px-6">
                    <AlertsPanel />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Center - Map */}
          <div className="col-span-6">
            <Card className="h-[calc(100vh-7rem)]">
              <InteractiveMap
                center={[-74.006, 40.7128]}
                zoom={14}
                pins={mockPins}
                onPinClick={setSelectedPin}
              />
            </Card>
          </div>

          {/* Right Panel - Search & Call Transcription */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-7rem)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserSearch className="w-5 h-5" />
                    Search & Communication
                  </CardTitle>
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
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Search Section */}
                <div className="space-y-4">
                  <SearchFilters onSearch={handleSearch} />
                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-4 space-y-4">
                      {searchResults.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          No search results
                        </div>
                      ) : (
                        searchResults.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            onClick={() => setSelectedPerson(person)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Call Transcription */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Live Call Transcript
                    </h3>
                    {isCallActive && (
                      <Badge variant="secondary" className="animate-pulse">
                        Live
                      </Badge>
                    )}
                  </div>
                  <ScrollArea className="h-[calc(100vh-36rem)] border rounded-lg">
                    <div className="p-4 space-y-3">
                      {transcription.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          {isCallActive ? "Listening..." : "No active call"}
                        </div>
                      ) : (
                        transcription.map((line, i) => (
                          <p key={i} className="text-sm">{line}</p>
                        ))
                      )}
                      {isCallActive && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mic className="h-4 w-4 animate-pulse" />
                          <span className="text-sm">Listening...</span>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Camera View Dialog */}
      <Dialog open={!!selectedPin} onOpenChange={() => setSelectedPin(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Camera Feed - {selectedPin?.location}
            </DialogTitle>
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
              <UserSearch className="w-5 h-5" />
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

function matchPersonToFilters(person: DetectedPerson, filters: SearchFilter[]): boolean {
  return filters.every(filter => {
    const searchValue = filter.value.toLowerCase();
    switch (filter.category) {
      case 'clothing':
        return person.details.clothing.toLowerCase().includes(searchValue);
      case 'physical':
        return person.details.distinctive_features.some((f: string) => 
          f.toLowerCase().includes(searchValue)
        );
      case 'location':
        return person.details.environment.toLowerCase().includes(searchValue);
      case 'time':
        return person.time.toLowerCase().includes(searchValue);
      case 'age':
        return person.details.age.toLowerCase().includes(searchValue);
      case 'action':
        return person.details.movement.toLowerCase().includes(searchValue);
      default:
        return false;
    }
  });
}