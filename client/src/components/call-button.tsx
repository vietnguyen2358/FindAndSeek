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
  onTranscription?: (transcription: string) => void;
}

export function CallButton({ description, onTranscription }: CallButtonProps) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/call/initiate', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          message: description || "Please describe who you are looking for."
        })
      });

      if (response.success) {
        toast({
          title: "Call initiated",
          description: "You will receive a call shortly."
        });
        setOpen(false);

        // If transcription is successful, notify parent
        if (response.description && onTranscription) {
          onTranscription(response.description);
        }
      } else {
        throw new Error("Failed to initiate call");
      }
    } catch (error) {
      console.error("Call error:", error);
      toast({
        title: "Error",
        description: "Failed to initiate call. Please verify your phone number and try again.",
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
              placeholder="Phone number (e.g., +1234567890)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              type="tel"
              pattern="[+][0-9]{10,}"
              title="Please enter phone number with country code (e.g., +1234567890)"
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