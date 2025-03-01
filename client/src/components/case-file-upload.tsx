import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { insertCaseSchema } from "@shared/schema";
import { Upload, Loader2 } from "lucide-react";
import { simulateAiTextAnalysis } from "@/lib/mockAi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function CaseFileUpload() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertCaseSchema),
    defaultValues: {
      title: "",
      description: "",
      lastLocation: "",
      images: [],
    },
  });

  const createCase = useMutation({
    mutationFn: async (values) => {
      const response = await apiRequest("POST", "/api/cases", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Case created",
        description: "The case has been successfully created.",
      });
      form.reset();
    },
  });

  const onSubmit = async (values) => {
    setIsAnalyzing(true);
    try {
      const analysis = await simulateAiTextAnalysis(values.description);
      await createCase.mutateAsync({
        ...values,
        description: `${values.description}\n\nAI Analysis:\nEntities: ${analysis.entities.join(", ")}\nLocations: ${analysis.locations.join(", ")}\nTimestamps: ${analysis.timestamps.join(", ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Case</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter case title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter case details..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Known Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isAnalyzing || createCase.isPending}
              className="w-full"
            >
              {isAnalyzing || createCase.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Case
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
