import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { measurementPoints, MeasurementPoint } from "@/components/ice-depth/measurementPoints";
import type { Json } from "@/integrations/supabase/types";

export const useTemplateOverrides = (facilityId: string | undefined) => {
  const [overrides, setOverrides] = useState<Record<string, MeasurementPoint[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverrides = async () => {
      if (!facilityId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("custom_templates")
          .select("id, preset_template_key, template_data")
          .eq("facility_id", facilityId)
          .eq("is_preset_override", true);

        if (error) {
          console.error("Error fetching template overrides:", error);
          setLoading(false);
          return;
        }

        const overrideMap: Record<string, MeasurementPoint[]> = {};
        data?.forEach((override) => {
          const templateData = override.template_data as unknown as { points: MeasurementPoint[] } | null;
          if (override.preset_template_key && templateData?.points) {
            overrideMap[override.preset_template_key] = templateData.points;
          }
        });

        setOverrides(overrideMap);
      } catch (err) {
        console.error("Error in useTemplateOverrides:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverrides();
  }, [facilityId]);

  const getPointsForTemplate = (templateType: string): MeasurementPoint[] => {
    // Check for facility override first
    if (overrides[templateType]) {
      return overrides[templateType];
    }
    // Fall back to hardcoded defaults
    return measurementPoints[templateType] || [];
  };

  const hasOverride = (templateType: string): boolean => {
    return !!overrides[templateType];
  };

  const refetch = async () => {
    if (!facilityId) return;

    const { data } = await supabase
      .from("custom_templates")
      .select("id, preset_template_key, template_data")
      .eq("facility_id", facilityId)
      .eq("is_preset_override", true);

    const overrideMap: Record<string, MeasurementPoint[]> = {};
    data?.forEach((override) => {
      const templateData = override.template_data as unknown as { points: MeasurementPoint[] } | null;
      if (override.preset_template_key && templateData?.points) {
        overrideMap[override.preset_template_key] = templateData.points;
      }
    });

    setOverrides(overrideMap);
  };

  return {
    getPointsForTemplate,
    hasOverride,
    loading,
    refetch,
  };
};
