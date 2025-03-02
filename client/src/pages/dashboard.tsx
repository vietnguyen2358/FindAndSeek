import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { SearchFilters } from "@/components/search-filters";
import { AlertsPanel } from "@/components/alerts-panel";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Mic, Send, Camera, Bell } from "lucide-react";
import { mockPins } from "@/lib/mockData";
import type { DetectedPerson } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState<{
    id: number;
    location: string;
  } | null>(null);
  const [hideDetections, setHideDetections] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [detectedPersons, setDetectedPersons] = useState<DetectedPerson[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'system';
    content: string;
  }>>([]);

  const handlePersonsDetected = (persons: DetectedPerson[]) => {
    setDetectedPersons(persons);
  };

  const handleSendMessage = () => {
    if (!searchQuery.trim()) return;

    setChatMessages([
      ...chatMessages,
      { role: 'user', content: searchQuery },
      { role: 'system', content: 'Searching for matches...' }
    ]);
    setSearchQuery("");
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Camera Views & Alerts */}
          <div className="col-span-3">
            <Tabs defaultValue="cameras" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="cameras" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Cameras
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex-1">
                  <Bell className="w-4 h-4 mr-2" />
                  Alerts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cameras" className="mt-4">
                {selectedCamera && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-medium">
                        {selectedCamera.location}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHideDetections(!hideDetections)}
                      >
                        {hideDetections ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-black rounded-lg relative">
                        <VideoPlayer
                          showDetections={!hideDetections}
                          onPersonsDetected={handlePersonsDetected}
                          cameraId={selectedCamera.id}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
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
              zoom={12}
              pins={mockPins}
              onPinClick={(pin) =>
                setSelectedCamera({ id: pin.id, location: pin.location })
              }
            />
          </div>

          {/* Right Panel - Search & Chat */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Search & Communicate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Voice Input */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleRecording}
                  >
                    <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {isRecording ? 'Recording...' : 'Click to record'}
                  </span>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`rounded-lg px-4 py-2 max-w-[80%] ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Search Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe person or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
              <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                {selectedPerson.croppedImage && (
                  <img
                    src={selectedPerson.croppedImage}
                    alt="Detected person"
                    className="object-cover w-full h-full"
                  />
                )}
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
                  <h4 className="text-sm font-medium">Location</h4>
                  <p className="text-sm text-muted-foreground">{selectedCamera?.location}</p>
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