import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CallButtonProps {
  description?: string;
}

export function CallButton({ description }: CallButtonProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCall = async () => {
    if (!phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      await apiRequest('/api/call/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          message: description || "Please describe who you are looking for."
        })
      });

      toast({
        title: "Call initiated",
        description: "You will receive a call shortly."
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate call. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Phone className="w-4 h-4 mr-2" />
        Call In
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your phone number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
            />
            <Button 
              onClick={handleCall}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full"
            >
              {isLoading ? "Initiating call..." : "Call me"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
