import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChecklistSection } from "@/data/dailyReportChecklists";
import { Progress } from "@/components/ui/progress";

interface SectionedChecklistProps {
  sections: ChecklistSection[];
  checklist: Record<string, boolean>;
  onChecklistChange: (itemKey: string, checked: boolean) => void;
}

export function SectionedChecklist({ sections, checklist, onChecklistChange }: SectionedChecklistProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Open first section by default
    const initial: Record<string, boolean> = {};
    sections.forEach((section, index) => {
      initial[section.id] = index === 0;
    });
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const getSectionCompletion = (section: ChecklistSection) => {
    const completed = section.items.filter(item => checklist[`${section.id}-${item.id}`]).length;
    return { completed, total: section.items.length, percent: section.items.length > 0 ? (completed / section.items.length) * 100 : 0 };
  };

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const { completed, total, percent } = getSectionCompletion(section);
        const isComplete = completed === total && total > 0;

        return (
          <Collapsible
            key={section.id}
            open={openSections[section.id]}
            onOpenChange={() => toggleSection(section.id)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
              <div className="flex items-center gap-3 flex-1">
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <span className="font-medium text-sm">{section.title}</span>
                <div className="flex items-center gap-2 ml-auto mr-3">
                  <Progress value={percent} className="h-1.5 w-16" />
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full shrink-0",
                    isComplete
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {completed}/{total}
                  </span>
                </div>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                openSections[section.id] && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-1 pl-2 border-l-2 border-muted ml-2">
                {section.items.map((item) => {
                  const itemKey = `${section.id}-${item.id}`;
                  const isChecked = checklist[itemKey] || false;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={itemKey}
                        checked={isChecked}
                        onCheckedChange={(checked) => onChecklistChange(itemKey, checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={itemKey}
                        className={cn(
                          "flex-1 cursor-pointer text-sm leading-relaxed",
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
    </div>
  );
}
