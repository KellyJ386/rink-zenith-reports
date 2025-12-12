import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Wifi, WifiOff } from "lucide-react";

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isOnline, promptInstall } = usePWA();

  if (isInstalled) return null;

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      
      {isInstallable && (
        <Button
          variant="outline"
          size="sm"
          onClick={promptInstall}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Install App
        </Button>
      )}
    </div>
  );
};
