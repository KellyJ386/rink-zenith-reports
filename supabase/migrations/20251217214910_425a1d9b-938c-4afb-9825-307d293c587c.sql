-- Copy daily report tabs from Ice Arena Complex to Tennity Ice Skating Pavilion
INSERT INTO public.daily_report_tabs (facility_id, tab_key, tab_name, icon, display_order, is_active, is_required, form_template_id)
SELECT 
  'bd5cadf5-d12e-45f9-8618-ab391aa3f25e' as facility_id,
  tab_key,
  tab_name,
  icon,
  display_order,
  is_active,
  is_required,
  form_template_id
FROM public.daily_report_tabs
WHERE facility_id = '35bd447c-d2c4-4250-9e8b-bf2874395dc3'
ORDER BY display_order;