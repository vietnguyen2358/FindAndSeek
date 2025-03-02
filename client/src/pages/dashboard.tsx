import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { SearchFilters } from "@/components/search-filters";
import { AlertsPanel } from "@/components/alerts-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockPins, mockDetections, personImages } from "@/lib/mockData";
import type { DetectedPerson } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, UserSearch, Bell } from "lucide-react";

export default function Dashboard() {
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const [detections, setDetections] = useState(mockDetections);
  const [searchResults, setSearchResults] = useState<DetectedPerson[]>([]);

  const handleSearch = (filters: string[]) => {
    // Simple mock search implementation
    const results = mockDetections.filter(person => {
      const searchText = `${person.description} ${person.details.clothing} ${person.details.distinctive_features.join(' ')}`.toLowerCase();
      return filters.some(filter => searchText.includes(filter.toLowerCase()));
    });
    setSearchResults(results);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-4">
        {/* Search Bar */}
        <SearchFilters onSearch={handleSearch} />

        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Map */}
          <div className="col-span-8">
            <InteractiveMap
              center={[-74.006, 40.7128]}
              zoom={14}
              pins={mockPins}
              onPinClick={() => {}}
            />
          </div>

          {/* Right Panel - Detections & Alerts */}
          <div className="col-span-4">
            <Tabs defaultValue="detections" className="h-full">
              <TabsList className="w-full">
                <TabsTrigger value="detections" className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Detections
                </TabsTrigger>
                <TabsTrigger value="search" className="flex-1">
                  <UserSearch className="w-4 h-4 mr-2" />
                  Search
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

              <TabsContent value="search" className="mt-4 h-[calc(100vh-12rem)]">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {searchResults.map((person) => (
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