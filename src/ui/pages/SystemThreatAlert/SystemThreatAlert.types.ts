import { DeviceInfo } from "@capacitor/device";
import { ThreatCheck } from "../../../security/freerasp";

export interface SystemThreatAlertProps {
  errors: string[];
  threats?: ThreatCheck[];
  deviceInfo?: DeviceInfo | null;
}
