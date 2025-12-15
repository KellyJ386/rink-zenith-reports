/// <reference path="../types/bluetooth.d.ts" />

import { useState, useCallback, useRef, useEffect } from "react";

export type CaliperProfile = "igaging" | "hid" | "custom";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface BluetoothCaliperState {
  status: ConnectionStatus;
  error: string | null;
  lastValueMm: number | null;
  deviceName: string | null;
}

export interface CustomUUIDs {
  serviceUUID: string;
  characteristicUUID: string;
}

interface SavedDeviceInfo {
  deviceName: string;
  profile: CaliperProfile;
  customUUIDs?: CustomUUIDs;
  lastConnected: string;
}

const STORAGE_KEY = "bt-caliper-saved-device";

const IGAGING_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
const IGAGING_CHARACTERISTIC_UUID = "0000fff1-0000-1000-8000-00805f9b34fb";

const HID_SERVICE_UUID = "00001812-0000-1000-8000-00805f9b34fb";
const HID_CHARACTERISTIC_UUID = "00002a4d-0000-1000-8000-00805f9b34fb";

// Helper functions for device persistence
export const getSavedDevice = (): SavedDeviceInfo | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const saveDevice = (info: SavedDeviceInfo): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
};

export const clearSavedDevice = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const useBluetoothCaliper = () => {
  const [state, setState] = useState<BluetoothCaliperState>({
    status: "disconnected",
    error: null,
    lastValueMm: null,
    deviceName: null,
  });

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const onReadingCallbackRef = useRef<((mm: number, raw?: any) => void) | null>(null);
  const lastReadingTimeRef = useRef<number>(0);

  const parseReading = useCallback((dataView: DataView): number | null => {
    try {
      // Try ASCII parsing first (common for BLE UART devices like iGaging)
      const decoder = new TextDecoder();
      const text = decoder.decode(dataView.buffer);
      
      // Look for numeric patterns: optional minus, digits, optional decimal point
      const match = text.match(/(-?\d+\.?\d*)/);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          // Assume inches if value is small (< 10), mm if larger
          // iGaging typically sends inches with 3-4 decimal places
          return value < 10 ? value * 25.4 : value;
        }
      }

      // Try binary parsing (24-bit signed value common in some calipers)
      if (dataView.byteLength >= 3) {
        const byte1 = dataView.getUint8(0);
        const byte2 = dataView.getUint8(1);
        const byte3 = dataView.getUint8(2);
        
        let value = (byte1 << 16) | (byte2 << 8) | byte3;
        
        // Check for sign bit (24-bit signed)
        if (value & 0x800000) {
          value = value - 0x1000000;
        }
        
        // Common scaling: value in 0.01mm units
        return value / 100;
      }

      return null;
    } catch (error) {
      console.error("Parse error:", error);
      return null;
    }
  }, []);

  const handleNotification = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = characteristic.value;
    
    if (!dataView) return;

    // Debounce rapid readings (200ms)
    const now = Date.now();
    if (now - lastReadingTimeRef.current < 200) return;
    lastReadingTimeRef.current = now;

    const valueMm = parseReading(dataView);
    
    if (valueMm !== null && valueMm >= 0 && valueMm <= 100) {
      setState(prev => ({ ...prev, lastValueMm: valueMm }));
      onReadingCallbackRef.current?.(valueMm, dataView);
    }
  }, [parseReading]);

  const getUUIDs = useCallback((profile: CaliperProfile, customUUIDs?: CustomUUIDs) => {
    switch (profile) {
      case "igaging":
        return { serviceUUID: IGAGING_SERVICE_UUID, characteristicUUID: IGAGING_CHARACTERISTIC_UUID };
      case "hid":
        return { serviceUUID: HID_SERVICE_UUID, characteristicUUID: HID_CHARACTERISTIC_UUID };
      case "custom":
        if (!customUUIDs) {
          throw new Error("Custom UUIDs required for custom profile");
        }
        return { serviceUUID: customUUIDs.serviceUUID, characteristicUUID: customUUIDs.characteristicUUID };
    }
  }, []);

  const connect = useCallback(async (
    profile: CaliperProfile = "igaging",
    customUUIDs?: CustomUUIDs,
    rememberDevice: boolean = true
  ) => {
    if (!navigator.bluetooth) {
      setState(prev => ({
        ...prev,
        status: "error",
        error: "Web Bluetooth not supported in this browser. Please use Chrome, Edge, or Opera.",
      }));
      return;
    }

    setState(prev => ({ ...prev, status: "connecting", error: null }));

    try {
      const { serviceUUID, characteristicUUID } = getUUIDs(profile, customUUIDs);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [serviceUUID] }],
        optionalServices: [serviceUUID],
      });

      deviceRef.current = device;

      device.addEventListener("gattserverdisconnected", () => {
        setState(prev => ({
          ...prev,
          status: "disconnected",
          error: "Device disconnected",
        }));
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Failed to connect to GATT server");

      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);

      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", handleNotification);

      const deviceName = device.name || "Unknown Device";

      // Save device info if remember is enabled
      if (rememberDevice) {
        saveDevice({
          deviceName,
          profile,
          customUUIDs: profile === "custom" ? customUUIDs : undefined,
          lastConnected: new Date().toISOString(),
        });
      }

      setState({
        status: "connected",
        error: null,
        lastValueMm: null,
        deviceName,
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      setState(prev => ({
        ...prev,
        status: "error",
        error: error.message || "Failed to connect to device",
      }));
    }
  }, [handleNotification, getUUIDs]);

  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
        characteristicRef.current.removeEventListener(
          "characteristicvaluechanged",
          handleNotification
        );
      } catch (error) {
        console.error("Error stopping notifications:", error);
      }
    }

    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }

    characteristicRef.current = null;
    deviceRef.current = null;
    onReadingCallbackRef.current = null;

    setState({
      status: "disconnected",
      error: null,
      lastValueMm: null,
      deviceName: null,
    });
  }, [handleNotification]);

  const onReading = useCallback((callback: (mm: number, raw?: any) => void) => {
    onReadingCallbackRef.current = callback;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    onReading,
    isSupported: typeof navigator !== "undefined" && !!navigator.bluetooth,
    getSavedDevice,
    clearSavedDevice,
  };
};
