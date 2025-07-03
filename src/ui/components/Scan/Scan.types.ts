import { LensFacing } from "@capacitor-mlkit/barcode-scanning";

interface ScanProps {
  cameraDirection?: LensFacing;
  onCheckPermissionFinish?: (permission: boolean) => void;
  onFinishScan: (value: string) => Promise<void>;
  componentId?: string;
  customTranslateKey?: string;
}

interface ScanRef {
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  registerScanHandler: () => Promise<void>;
}

export type { ScanProps, ScanRef };
