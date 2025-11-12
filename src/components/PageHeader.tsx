import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  showBackButton = true,
  showHomeButton = true
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {showBackButton && (
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {showHomeButton && (
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
