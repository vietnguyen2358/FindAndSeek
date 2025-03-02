import { useState, useRef, useEffect } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UserSearch, Send } from "lucide-react";
import type { DetectedPerson, MapPin as MapPinType } from "@shared/types";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "@/components/voice-input";
import { CallButton } from "@/components/call-button";
import { mockPins } from "@/lib/mockData";
import { CameraSidebar } from "@/components/camera-sidebar";
import { apiRequest } from "@/lib/queryClient";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAudio?: boolean;
}

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-73.9877, 40.7502]); // Herald Square
  const [mapZoom, setMapZoom] = useState(14);
  const [detections, setDetections] = useState<DetectedPerson[]>([]);
  const [searchResults, setSearchResults] = useState<DetectedPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedPinId, setHighlightedPinId] = useState<number | undefined>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant specialized in helping find missing persons. I can help analyze descriptions, search through camera feeds, and track potential matches. How can I assist you today?",
      timestamp: new Date().toLocaleString()
    }
  ]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [chatMessages]);

  const handlePinClick = (pin: MapPinType) => {
    setSelectedPin(pin);
    setHighlightedPinId(pin.id);
    setMapCenter([pin.lng, pin.lat]);
    setMapZoom(18);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsProcessing(true);
    try {
      const userMessage: ChatMessage = {
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleString()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // First, get AI analysis of the query
      const aiResponse = await apiRequest('/api/parse-search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          detections
        })
      });

      if (aiResponse.matches?.length > 0) {
        setSearchResults(aiResponse.matches);

        // Find the highest scoring match
        const bestMatch = aiResponse.matches.reduce((prev: any, current: any) => 
          (current.matchScore || 0) > (prev.matchScore || 0) ? current : prev
        );

        // Find corresponding camera pin and center map
        const cameraPin = mockPins.find(pin => 
          pin.type === "camera" && pin.id === bestMatch.cameraId
        );

        if (cameraPin) {
          setHighlightedPinId(cameraPin.id);
          setMapCenter([cameraPin.lng, cameraPin.lat]);
          setMapZoom(16);
        }

        // Add AI response to chat
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `I've analyzed your description and found some potential matches. Let me show you the best match, located at ${cameraPin?.location || 'a camera location'}.\n\n${aiResponse.analysis.join('\n')}\n\nI'll continue monitoring all camera feeds for additional matches.`,
            timestamp: new Date().toLocaleString()
          }
        ]);
      } else {
        setSearchResults([]);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: "I've analyzed your description, but I haven't found any matches in our current camera feeds yet. I'll keep monitoring all locations and alert you as soon as I detect a potential match. Could you provide any additional details that might help with the search?",
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
          content: 'I apologize, but I encountered an error while processing your request. Please try again, and feel free to provide more details to help with the search.',
          timestamp: new Date().toLocaleString()
        }
      ]);
    } finally {
      setIsProcessing(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Find & Seek</h1>
            </div>
            <div className="flex items-center gap-2">
              <CallButton
                description="Please describe who you're looking for"
                onTranscription={(text, processed) => {
                  setChatMessages(prev => [...prev, {
                    role: 'system',
                    content: '📞 Phone call recorded',
                    timestamp: new Date().toLocaleString()
                  }]);

                  if (text) {
                    setChatMessages(prev => [...prev, {
                      role: 'user',
                      content: text,
                      timestamp: new Date().toLocaleString(),
                      isAudio: true
                    }]);
                  }

                  if (processed) {
                    setChatMessages(prev => [...prev, {
                      role: 'assistant',
                      content: processed,
                      timestamp: new Date().toLocaleString()
                    }]);

                    handleSearch(processed);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-12 gap-6">
          {selectedPin ? (
            <>
              <div className="col-span-8">
                <Card className="h-[calc(100vh-10rem)]">
                  <InteractiveMap
                    center={mapCenter}
                    zoom={mapZoom}
                    pins={mockPins}
                    onPinClick={handlePinClick}
                    highlightedPinId={highlightedPinId}
                  />
                </Card>
              </div>
              <div className="col-span-4">
                <CameraSidebar
                  pin={selectedPin}
                  onClose={() => setSelectedPin(null)}
                  detections={detections}
                />
              </div>
            </>
          ) : (
            <div className="col-span-9">
              <Card className="h-[calc(100vh-10rem)]">
                <InteractiveMap
                  center={mapCenter}
                  zoom={mapZoom}
                  pins={mockPins}
                  onPinClick={handlePinClick}
                  highlightedPinId={highlightedPinId}
                />
              </Card>
            </div>
          )}
          <div className="col-span-3">
            <Card className="h-[calc(100vh-10rem)] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <UserSearch className="w-5 h-5" />
                    AI Assistant
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
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
                          } ${message.isAudio ? 'border-2 border-primary/20' : ''}`}
                        >
                          {message.isAudio && message.role === 'user' && (
                            <span className="block text-xs opacity-60 mb-1">🎙️ Voice Message</span>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 mt-1">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <Input
                    className="flex-1"
                    placeholder="Type your search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                    disabled={isProcessing}
                  />
                  <VoiceInput
                    onTranscription={(text: string, processed?: string) => {
                      if (processed) {
                        handleSearch(processed);
                      }
                    }}
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
    </div>
  );
}