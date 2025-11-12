-- Create table for custom measurement templates
CREATE TABLE public.custom_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  template_data JSONB NOT NULL,
  point_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own templates"
ON public.custom_templates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create their own templates"
ON public.custom_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates"
ON public.custom_templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
ON public.custom_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all templates
CREATE POLICY "Admins can manage all templates"
ON public.custom_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_templates_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();