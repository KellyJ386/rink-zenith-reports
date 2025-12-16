import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bluetooth, BluetoothConnected, BluetoothOff, Loader2, Trash2, ChevronDown } from "lucide-react";
import { useBluetoothCaliper, CaliperProfile, getSavedDevice, clearSavedDevice } from "@/hooks/useBluetoothCaliper";
import { useToast } from "@/hooks/use-toast";

interface BluetoothCaliperControlProps {
  onReading: (mm: number) => void;
  currentPoint: number;
  unit: "in" | "mm";
}

export const BluetoothCaliperControl = ({
  onReading,
  currentPoint,
  unit,
}: BluetoothCaliperControlProps) => {
  const { toast } = useToast();
  const { state, connect, disconnect, onReading: setOnReading, isSupported } = useBluetoothCaliper();
  
  const [profile, setProfile] = useState<CaliperProfile>(() => {
    return (localStorage.getItem("bt-caliper-profile") as CaliperProfile) || "igaging";
  });
  const [customServiceUUID, setCustomServiceUUID] = useState(() => {
    return localStorage.getItem("bt-custom-service-uuid") || "";
  });
  const [customCharUUID, setCustomCharUUID] = useState(() => {
    return localStorage.getItem("bt-custom-char-uuid") || "";
  });
  const [autoAdvance, setAutoAdvance] = useState(() => {
    const saved = localStorage.getItem("bt-auto-advance");
    return saved === null ? true : saved === "true";
  });
  const [rememberDevice, setRememberDevice] = useState(() => {
    const saved = localStorage.getItem("bt-remember-device");
    return saved === null ? true : saved === "true";
  });
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);
  const [savedDeviceInfo, setSavedDeviceInfo] = useState(getSavedDevice());

  useEffect(() => {
    localStorage.setItem("bt-caliper-profile", profile);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("bt-auto-advance", String(autoAdvance));
  }, [autoAdvance]);

  useEffect(() => {
    localStorage.setItem("bt-remember-device", String(rememberDevice));
  }, [rememberDevice]);

  useEffect(() => {
    if (customServiceUUID) {
      localStorage.setItem("bt-custom-service-uuid", customServiceUUID);
    }
    if (customCharUUID) {
      localStorage.setItem("bt-custom-char-uuid", customCharUUID);
    }
  }, [customServiceUUID, customCharUUID]);

  useEffect(() => {
    setOnReading((mm: number) => {
      onReading(mm);
    });
  }, [setOnReading, onReading]);

  // Auto-reconnect on mount if device is saved and remember is enabled
  useEffect(() => {
    const attemptAutoReconnect = async () => {
      const saved = getSavedDevice();
      if (!saved || !rememberDevice || state.status !== "disconnected") return;
      
      // Don't auto-reconnect if already attempted
      if (isAutoReconnecting) return;
      
      setIsAutoReconnecting(true);
      setSavedDeviceInfo(saved);
      
      toast({
        title: "Reconnecting...",
        description: `Attempting to reconnect to ${saved.deviceName}`,
      });

      try {
        await connect(
          saved.profile,
          saved.customUUIDs,
          true
        );
      } catch (error) {
        console.log("Auto-reconnect failed, user will need to manually connect");
      } finally {
        setIsAutoReconnecting(false);
      }
    };

    // Small delay before auto-reconnect attempt
    const timer = setTimeout(attemptAutoReconnect, 500);
    return () => clearTimeout(timer);
  }, []); // Only run on mount

  useEffect(() => {
    if (state.status === "connected") {
      toast({
        title: "Caliper Connected",
        description: `${state.deviceName || "Device"} is ready to measure`,
      });
      setSavedDeviceInfo(getSavedDevice());
    } else if (state.status === "error" && state.error && !isAutoReconnecting) {
      toast({
        title: "Connection Error",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state.status, state.error, state.deviceName, toast, isAutoReconnecting]);

  const handleConnect = async () => {
    if (profile === "custom" && (!customServiceUUID || !customCharUUID)) {
      toast({
        title: "Missing UUIDs",
        description: "Please enter both Service and Characteristic UUIDs for custom profile",
        variant: "destructive",
      });
      return;
    }

    await connect(
      profile,
      profile === "custom"
        ? { serviceUUID: customServiceUUID, characteristicUUID: customCharUUID }
        : undefined,
      rememberDevice
    );
  };

  const handleForgetDevice = () => {
    clearSavedDevice();
    setSavedDeviceInfo(null);
    toast({
      title: "Device Forgotten",
      description: "Saved device info has been cleared",
    });
  };

  const getStatusBadge = () => {
    if (isAutoReconnecting) {
      return (
        <Badge variant="secondary">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Reconnecting...
        </Badge>
      );
    }
    
    switch (state.status) {
      case "connected":
        return (
          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30">
            <BluetoothConnected className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case "connecting":
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <BluetoothOff className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Bluetooth className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  const formatValue = (mm: number | null): string => {
    if (mm === null) return "--";
    if (unit === "in") {
      return (mm / 25.4).toFixed(3) + '"';
    }
    return mm.toFixed(2) + " mm";
  };

  if (!isSupported) {
    return (
      <div className="border border-muted rounded-lg bg-card p-4">
        <div className="text-center text-muted-foreground">
          <BluetoothOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-xs">
            Web Bluetooth is not supported in this browser.
            <br />
            Please use Chrome, Edge, or Opera.
          </p>
        </div>
      </div>
    );
  }

  const [isOpen, setIsOpen] = useState(state.status === "connected");

  // Auto-expand when connected
  useEffect(() => {
    if (state.status === "connected") {
      setIsOpen(true);
    }
  }, [state.status]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-primary/20 rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-2.5 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Bluetooth Caliper</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-2.5 pt-0 space-y-2">
            {state.status === "disconnected" || state.status === "error" ? (
              <>
                {/* Saved device info - compact */}
                {savedDeviceInfo && rememberDevice && (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 rounded text-xs">
                    <span className="text-muted-foreground">Last: <span className="font-medium text-foreground">{savedDeviceInfo.deviceName}</span></span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={handleForgetDevice}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                
                {/* Profile + Connect - same row */}
                <div className="grid grid-cols-2 gap-2">
                  <Select value={profile} onValueChange={(v) => setProfile(v as CaliperProfile)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="igaging">iGaging</SelectItem>
                      <SelectItem value="hid">HID Protocol</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleConnect} size="sm" className="h-8" disabled={isAutoReconnecting}>
                    <Bluetooth className="w-3 h-3 mr-1" />
                    Connect
                  </Button>
                </div>

                {profile === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Service UUID"
                      value={customServiceUUID}
                      onChange={(e) => setCustomServiceUUID(e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                    <Input
                      placeholder="Char UUID"
                      value={customCharUUID}
                      onChange={(e) => setCustomCharUUID(e.target.value)}
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Toggles - same row */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch id="remember-device" checked={rememberDevice} onCheckedChange={setRememberDevice} className="scale-90" />
                    <Label htmlFor="remember-device" className="text-xs cursor-pointer">Remember</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="auto-advance" checked={autoAdvance} onCheckedChange={setAutoAdvance} className="scale-90" />
                    <Label htmlFor="auto-advance" className="text-xs cursor-pointer">Auto-advance</Label>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Connected state - compact grid */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div>
                    <span className="text-muted-foreground">Device: </span>
                    <span className="font-medium">{state.deviceName || "Unknown"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Point: </span>
                    <span className="font-medium">#{currentPoint}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reading: </span>
                    <span className="font-bold text-primary">{formatValue(state.lastValueMm)}</span>
                  </div>
                </div>

                <Button onClick={disconnect} variant="outline" size="sm" className="w-full h-7 text-xs">
                  <BluetoothOff className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
