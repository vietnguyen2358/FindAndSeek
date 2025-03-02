import { useState, useRef, useEffect } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Camera, UserSearch, MapPin, Send, Bell, Filter, History } from "lucide-react";
import type { DetectedPerson, MapPin as MapPinType } from "@shared/types";
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
import { VoiceInput } from "@/components/voice-input";
import { CallButton } from "@/components/call-button";


interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isAudio?: boolean;
}

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-74.006, 40.7128]);
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
      content: "Hello! I'm your AI assistant specialized in helping find missing persons. I can help analyze descriptions and search through our database. How can I assist you today?",
      timestamp: new Date().toLocaleString()
    }
  ]);

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
      const userMessage: ChatMessage = {
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleString()
      };
      setChatMessages(prev => [...prev, userMessage]);

      const result = await apiRequest('/api/parse-search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          detections
        })
      });

      if (result.matches?.length > 0) {
        setSearchResults(result.matches);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: result.analysis.join('\n'),
            timestamp: new Date().toLocaleString()
          }
        ]);
      } else {
        setSearchResults([]);
        setChatMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'No matches found yet. I\'ll keep looking.',
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
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toLocaleString()
        }
      ]);
    } finally {
      setIsProcessing(false);
      setSearchQuery('');
    }
  };

  const handleVoiceTranscription = (text: string, processed: string) => {
    setChatMessages(prev => [...prev, {
      role: 'system',
      content: '🎙️ Recording your message...',
      timestamp: new Date().toLocaleString(),
      isAudio: true
    }]);

    setChatMessages(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleString(),
      isAudio: true
    }]);

    setChatMessages(prev => [...prev, {
      role: 'assistant',
      content: processed,
      timestamp: new Date().toLocaleString()
    }]);

    handleSearch(processed);
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

                  setChatMessages(prev => [...prev, {
                    role: 'user',
                    content: text,
                    timestamp: new Date().toLocaleString(),
                    isAudio: true
                  }]);

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
          <div className="col-span-9">
            <Card className="h-[calc(100vh-10rem)]">
              <InteractiveMap
                center={mapCenter}
                zoom={mapZoom}
                pins={[]}
                onPinClick={setSelectedPin}
                highlightedPinId={highlightedPinId}
              />
            </Card>
          </div>
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
                    placeholder="Type or use voice to describe who you're looking for..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                    disabled={isProcessing}
                  />
                  <VoiceInput
                    onTranscription={handleVoiceTranscription}
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