import { useMemo } from "react";
import { DailyReportTabWithRoles } from "@/types/dailyReport";

interface TabFormData {
  checklist?: Record<string, boolean>;
  notes?: string;
  fields?: Record<string, any>;
}

export interface TabCompletionStatus {
  tabId: string;
  tabName: string;
  isRequired: boolean;
  isComplete: boolean;
  completedItems: number;
  totalItems: number;
  percentComplete: number;
}

export const useTabSubmissionTracking = (
  tabs: DailyReportTabWithRoles[],
  formData: Record<string, TabFormData>,
  formTemplates: any[]
) => {
  const tabStatuses = useMemo(() => {
    return tabs.map((tab): TabCompletionStatus => {
      const tabData = formData[tab.id] || { checklist: {}, notes: '', fields: {} };
      
      // Check if using form template
      const assignedTemplate = tab.form_template_id 
        ? formTemplates.find(t => t.id === tab.form_template_id)
        : null;
      
      if (assignedTemplate) {
        const fields = assignedTemplate.configuration || [];
        const requiredFields = fields.filter((f: any) => f.is_required);
        const completedCount = fields.filter((f: any) => {
          const val = tabData.fields?.[f.field_name];
          if (f.field_type === 'checkbox') return val === true;
          return val !== undefined && val !== '' && val !== null;
        }).length;
        
        // Consider complete if all required fields are filled
        const requiredComplete = requiredFields.every((f: any) => {
          const val = tabData.fields?.[f.field_name];
          if (f.field_type === 'checkbox') return val === true;
          return val !== undefined && val !== '' && val !== null;
        });
        
        return {
          tabId: tab.id,
          tabName: tab.tab_name,
          isRequired: tab.is_required,
          isComplete: requiredFields.length > 0 ? requiredComplete : completedCount > 0,
          completedItems: completedCount,
          totalItems: fields.length,
          percentComplete: fields.length > 0 ? Math.round((completedCount / fields.length) * 100) : 0,
        };
      }
      
      // Default checklist
      const checklistItems = Object.keys(tabData.checklist || {});
      const completedItems = Object.values(tabData.checklist || {}).filter(Boolean).length;
      const hasNotes = !!tabData.notes?.trim();
      
      // For default checklists, consider complete if at least one item checked or has notes
      const isComplete = completedItems > 0 || hasNotes;
      
      return {
        tabId: tab.id,
        tabName: tab.tab_name,
        isRequired: tab.is_required,
        isComplete,
        completedItems,
        totalItems: checklistItems.length || 5, // Default checklist has ~5 items
        percentComplete: checklistItems.length > 0 
          ? Math.round((completedItems / checklistItems.length) * 100) 
          : (hasNotes ? 100 : 0),
      };
    });
  }, [tabs, formData, formTemplates]);

  const overallProgress = useMemo(() => {
    if (tabStatuses.length === 0) return { completed: 0, total: 0, percent: 0 };
    
    const completed = tabStatuses.filter(s => s.isComplete).length;
    return {
      completed,
      total: tabStatuses.length,
      percent: Math.round((completed / tabStatuses.length) * 100),
    };
  }, [tabStatuses]);

  const requiredTabsComplete = useMemo(() => {
    const requiredTabs = tabStatuses.filter(s => s.isRequired);
    return requiredTabs.every(s => s.isComplete);
  }, [tabStatuses]);

  const incompleteRequiredTabs = useMemo(() => {
    return tabStatuses.filter(s => s.isRequired && !s.isComplete);
  }, [tabStatuses]);

  return {
    tabStatuses,
    overallProgress,
    requiredTabsComplete,
    incompleteRequiredTabs,
  };
};
