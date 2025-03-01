import { useState } from "react";
import { CaseFileUpload } from "@/components/case-file-upload";
import { InteractiveMap } from "@/components/interactive-map";
import { TimelineView } from "@/components/timeline-view";
import { SearchFilters } from "@/components/search-filters";
import { OperatorDashboard } from "@/components/operator-dashboard";
import { RoleSelector } from "@/components/role-selector";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);

  if (!role) {
    return (
      <div className="container mx-auto py-8">
        <RoleSelector onSelect={setRole} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CaseFileUpload />
        <OperatorDashboard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <InteractiveMap
            center={[-74.006, 40.7128]} // NYC coordinates
            zoom={12}
            pins={[
              {
                id: 1,
                lat: 40.7128,
                lng: -74.006,
                type: "lastSeen",
                timestamp: "2024-03-21 15:30",
              },
              {
                id: 2,
                lat: 40.7158,
                lng: -74.009,
                type: "camera",
                timestamp: "2024-03-21 16:45",
              },
            ]}
          />
        </div>
        <div className="space-y-8">
          <SearchFilters onSearch={console.log} />
          <TimelineView
            events={[
              { time: "15:30", event: "Last seen at Central Park" },
              { time: "16:45", event: "Camera detection on 5th Avenue" },
              { time: "17:15", event: "Search radius updated" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
