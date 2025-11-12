import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bluetooth, BluetoothConnected, BluetoothOff, Loader2 } from "lucide-react";
import { useBluetoothCaliper, CaliperProfile } from "@/hooks/useBluetoothCaliper";
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

  useEffect(() => {
    localStorage.setItem("bt-caliper-profile", profile);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("bt-auto-advance", String(autoAdvance));
  }, [autoAdvance]);

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

  useEffect(() => {
    if (state.status === "connected") {
      toast({
        title: "Caliper Connected",
        description: `${state.deviceName || "Device"} is ready to measure`,
      });
    } else if (state.status === "error" && state.error) {
      toast({
        title: "Connection Error",
        description: state.error,
        variant: "destructive",
      });
    }
  }, [state.status, state.error, state.deviceName, toast]);

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
        : undefined
    );
  };

  const getStatusBadge = () => {
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
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <BluetoothOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Web Bluetooth is not supported in this browser.
              <br />
              Please use Chrome, Edge, or Opera.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-[var(--shadow-ice)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-primary" />
            Bluetooth Caliper
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "disconnected" || state.status === "error" ? (
          <>
            <div className="space-y-2">
              <Label>Device Profile</Label>
              <Select value={profile} onValueChange={(v) => setProfile(v as CaliperProfile)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="igaging">iGaging (Default)</SelectItem>
                  <SelectItem value="hid">HID Protocol</SelectItem>
                  <SelectItem value="custom">Custom UUIDs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {profile === "custom" && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="service-uuid" className="text-sm">Service UUID</Label>
                  <Input
                    id="service-uuid"
                    placeholder="0000fff0-0000-1000-8000-00805f9b34fb"
                    value={customServiceUUID}
                    onChange={(e) => setCustomServiceUUID(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-uuid" className="text-sm">Characteristic UUID</Label>
                  <Input
                    id="char-uuid"
                    placeholder="0000fff1-0000-1000-8000-00805f9b34fb"
                    value={customCharUUID}
                    onChange={(e) => setCustomCharUUID(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <Label htmlFor="auto-advance" className="cursor-pointer">
                Auto-advance to next point
              </Label>
              <Switch
                id="auto-advance"
                checked={autoAdvance}
                onCheckedChange={setAutoAdvance}
              />
            </div>

            <Button 
              onClick={handleConnect} 
              className="w-full" 
              disabled={!(state.status === "disconnected" || state.status === "error")}
            >
              <Bluetooth className="w-4 h-4 mr-2" />
              Connect Bluetooth Caliper
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Device</Label>
                <p className="text-sm font-medium">{state.deviceName || "Unknown"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Current Point</Label>
                <p className="text-sm font-medium">Point {currentPoint}</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-center">
                <Label className="text-sm text-muted-foreground">Last Reading</Label>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatValue(state.lastValueMm)}
                </p>
              </div>
            </div>

            {autoAdvance && (
              <p className="text-sm text-muted-foreground text-center">
                Taking measurements will automatically advance to the next point
              </p>
            )}

            <Button onClick={disconnect} variant="outline" className="w-full">
              <BluetoothOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};