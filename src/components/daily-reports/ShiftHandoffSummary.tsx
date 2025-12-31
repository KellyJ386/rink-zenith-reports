import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SHIFT_HANDOFF_SECTIONS, FACILITY_RATING_OPTIONS } from "@/data/dailyReportChecklists";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ClipboardCheck, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShiftHandoffSummaryProps {
  data: {
    checklist: Record<string, boolean>;
    facilityRating: number | null;
    notes: string;
  };
  onChange: (data: {
    checklist: Record<string, boolean>;
    facilityRating: number | null;
    notes: string;
  }) => void;
}

export function ShiftHandoffSummary({ data, onChange }: ShiftHandoffSummaryProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    critical: true,
    documentation: true,
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const updateChecklist = (itemId: string, checked: boolean) => {
    onChange({
      ...data,
      checklist: {
        ...data.checklist,
        [itemId]: checked,
      },
    });
  };

  const updateRating = (rating: number) => {
    onChange({
      ...data,
      facilityRating: rating,
    });
  };

  const updateNotes = (notes: string) => {
    onChange({
      ...data,
      notes,
    });
  };

  // Calculate completion for each section
  const getSectionCompletion = (sectionId: string, items: { id: string }[]) => {
    const completed = items.filter(item => data.checklist[`${sectionId}-${item.id}`]).length;
    return { completed, total: items.length };
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Shift Handoff Summary</CardTitle>
            <CardDescription>
              Complete before ending your shift
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checklist Sections */}
        {SHIFT_HANDOFF_SECTIONS.map((section) => {
          const { completed, total } = getSectionCompletion(section.id, section.items);
          const isComplete = completed === total;

          return (
            <Collapsible
              key={section.id}
              open={openSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{section.title}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    isComplete 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {completed}/{total}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  openSections[section.id] && "rotate-180"
                )} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <div className="space-y-2 pl-2">
                  {section.items.map((item) => {
                    const itemKey = `${section.id}-${item.id}`;
                    const isChecked = data.checklist[itemKey] || false;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={itemKey}
                          checked={isChecked}
                          onCheckedChange={(checked) => updateChecklist(itemKey, checked as boolean)}
                        />
                        <Label
                          htmlFor={itemKey}
                          className={cn(
                            "flex-1 cursor-pointer text-sm",
                            isChecked && "line-through text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Facility Rating */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <Label className="text-base font-medium">Overall Facility Status Rating</Label>
          </div>
          <RadioGroup
            value={data.facilityRating?.toString() || ""}
            onValueChange={(value) => updateRating(parseInt(value))}
            className="space-y-2"
          >
            {FACILITY_RATING_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                  data.facilityRating === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value={option.value.toString()} id={`rating-${option.value}`} />
                <div className="flex-1">
                  <Label htmlFor={`rating-${option.value}`} className="cursor-pointer font-medium">
                    {option.value} - {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="handoff-notes" className="text-base font-medium">
            Additional Handoff Notes
          </Label>
          <Textarea
            id="handoff-notes"
            placeholder="Add any additional information for the next shift..."
            value={data.notes}
            onChange={(e) => updateNotes(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}
