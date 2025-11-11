import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";

interface AIAnalysisDisplayProps {
  analysis: string;
}

export const AIAnalysisDisplay = ({ analysis }: AIAnalysisDisplayProps) => {
  // Parse the analysis to extract sections
  const parseAnalysis = (text: string) => {
    const sections = text.split("\n\n").filter(s => s.trim());
    return sections;
  };

  const sections = parseAnalysis(analysis);

  return (
    <Card className="shadow-[var(--shadow-ice)] border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Analysis Report</CardTitle>
          </div>
          <Badge variant="secondary">Powered by Lovable AI</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, index) => (
          <div key={index}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap">{section}</div>
            </div>
            {index < sections.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};