import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import rink24 from "@/assets/rink-24-point.svg";
import rink35 from "@/assets/rink-35-point.svg";
import rink46 from "@/assets/rink-46-point.svg";

interface TemplateSelectionProps {
  templateType: string;
}

export const TemplateSelection = ({ templateType }: TemplateSelectionProps) => {
  const getTemplate = () => {
    switch (templateType) {
      case "24-point":
        return rink24;
      case "35-point":
        return rink35;
      case "46-point":
        return rink46;
      default:
        return rink24;
    }
  };

  return (
    <Card className="shadow-[var(--shadow-ice)]">
      <CardHeader>
        <CardTitle>Rink Diagram - {templateType}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <img 
            src={getTemplate()} 
            alt={`Ice rink ${templateType} measurement template`}
            className="max-w-full h-auto max-h-[600px] rounded-lg"
          />
        </div>
      </CardContent>
    </Card>
  );
};