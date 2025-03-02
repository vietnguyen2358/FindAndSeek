import { useState, useRef, useEffect } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { AlertsPanel } from "@/components/alerts-panel";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Camera, UserSearch, MapPin, Send } from "lucide-react";
import { mockPins, mockDetections } from "@/lib/mockData";
import type { DetectedPerson, MapPin as MapPinType, SearchFilter } from "@shared/types";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { PersonCard } from "@/components/person-card";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  const [detections, setDetections] = useState(mockDetections);
  const [searchResults, setSearchResults] = useState<DetectedPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant specialized in helping find missing persons. I can help analyze descriptions and search through our database. How can I assist you today?",
      timestamp: new Date().toLocaleString()
    }
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [chatMessages]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsProcessing(true);
    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleString()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Process with ChatGPT, including current detections
      const result = await apiRequest('/api/parse-search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          detections // Send current detections for analysis
        })
      });

      // Update search results with ranked matches if available
      if (result.topMatches) {
        setSearchResults(result.topMatches);

        // Add match analysis to chat
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: result.response + "\n\n" + result.matchAnalysis,
            timestamp: new Date().toLocaleString()
          }
        ]);
      } else {
        // Handle case when no detections were analyzed
        setSearchResults([]);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: result.response,
            timestamp: new Date().toLocaleString()
          }
        ]);
      }

      // Add suggestions if available
      if (result.suggestions?.length > 0) {
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "You might also want to consider:\n" + result.suggestions.join("\n"),
            timestamp: new Date().toLocaleString()
          }
        ]);
      }

    } catch (error) {
      console.error('Error processing search:', error);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your search. Please try again.',
          timestamp: new Date().toLocaleString()
        }
      ]);
    } finally {
      setIsProcessing(false);
      setSearchQuery('');
    }
  };

  const handlePersonsDetected = (persons: DetectedPerson[]) => {
    // Update detections list with new detections
    setDetections(prev => {
      // Combine existing and new detections, removing duplicates based on description
      const combined = [...prev];
      persons.forEach(person => {
        const existingIndex = combined.findIndex(p => p.description === person.description);
        if (existingIndex === -1) {
          combined.push(person);
        } else {
          combined[existingIndex] = person; // Update with latest detection
        }
      });
      return combined;
    });

    // If we have active search results, check for matches
    if (searchResults.length > 0) {
      // Filter new detections that match our search criteria
      const newMatches = persons.filter(person =>
        searchResults.some(result => result.description === person.description)
      );

      if (newMatches.length > 0) {
        // Add a system message about the new matches
        setChatMessages(prev => [...prev, {
          role: 'system',
          content: `🎯 Found ${newMatches.length} new match${newMatches.length > 1 ? 'es' : ''} in latest detection!`,
          timestamp: new Date().toLocaleString()
        }]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Detections & Matches */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-7rem)]">
              <Tabs defaultValue="all" className="h-full">
                <CardHeader>
                  <TabsList className="w-full">
                    <TabsTrigger value="all">
                      <Camera className="w-4 h-4 mr-2" />
                      All Detections
                    </TabsTrigger>
                    <TabsTrigger value="matches">
                      <UserSearch className="w-4 h-4 mr-2" />
                      Matches
                      {searchResults.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {searchResults.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="p-0">
                  <TabsContent value="all" className="m-0">
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

                  <TabsContent value="matches" className="m-0">
                    <ScrollArea className="h-[calc(100vh-12rem)] px-6">
                      <div className="space-y-4 pb-6">
                        {searchResults.length === 0 ? (
                          <div className="text-center text-muted-foreground p-4">
                            No matches found. Try adjusting your search criteria.
                          </div>
                        ) : (
                          searchResults.map((person) => (
                            <PersonCard
                              key={person.id}
                              person={person}
                              onClick={() => setSelectedPerson(person)}
                              highlight
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
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

          {/* Right Panel - AI Assistant */}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-7rem)] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserSearch className="w-5 h-5" />
                    AI Assistant
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Chat Messages */}
                <div ref={scrollAreaRef} className="flex-1 overflow-y-auto pr-4">
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
                              : message.role === 'system'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-accent'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex items-center gap-2 pt-4">
                  <Input
                    className="flex-1"
                    placeholder="Describe who you're looking for..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                    disabled={isProcessing}
                  />
                  <Button
                    size="icon"
                    onClick={() => handleSearch(searchQuery)}
                    disabled={isProcessing || !searchQuery.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
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
                  searchResults={searchResults}
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
                  src={selectedPerson.thumbnail}
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