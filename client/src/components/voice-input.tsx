import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);

          // Send current chunk for processing
          const formData = new FormData();
          formData.append('audio', e.data);

          try {
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error('Failed to transcribe audio');
            }

            const { text } = await response.json();
            if (text && text.trim()) {
              onTranscription(text);
            }
          } catch (error) {
            console.error('Transcription error:', error);
          }
        }
      };

      // Process audio in chunks every second
      mediaRecorder.current.start(1000);
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast({
        title: "Recording stopped",
        description: "Processing your message...",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'transition-all duration-200',
        isRecording && 'bg-destructive text-destructive-foreground animate-pulse'
      )}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      title={isRecording ? "Stop recording" : "Start voice recording"}
    >
      {isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}