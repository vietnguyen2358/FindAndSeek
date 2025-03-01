import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface TimelineEvent {
  time: string;
  event: string;
}

interface TimelineViewProps {
  events: TimelineEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={index}
                className="flex items-start gap-4 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:w-2 before:h-2 before:bg-primary before:rounded-full"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
