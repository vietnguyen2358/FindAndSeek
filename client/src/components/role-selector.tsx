import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Radio, Headphones } from "lucide-react";

interface RoleSelectorProps {
  onSelect: (role: string) => void;
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const roles = [
    {
      id: "operator",
      title: "911 Operator",
      icon: Headphones,
      description: "Manage incoming cases and coordinate responses",
    },
    {
      id: "law_enforcement",
      title: "Law Enforcement",
      icon: Shield,
      description: "Access case details and coordinate field operations",
    },
    {
      id: "sar_team",
      title: "SAR Team",
      icon: Radio,
      description: "View mission details and coordinate search efforts",
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Your Role</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Button
            key={role.id}
            variant="outline"
            className="h-32 flex flex-col items-center justify-center text-center p-4"
            onClick={() => onSelect(role.id)}
          >
            <role.icon className="h-6 w-6 mb-2" />
            <span className="font-medium">{role.title}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {role.description}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
