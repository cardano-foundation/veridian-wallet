import { Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { PresentationRequestStatus } from "../../store/reducers/connectionsSlice.types";

interface PresentationStatusProps {
  status: PresentationRequestStatus;
  className?: string;
}

const PresentationStatus = ({ status, className }: PresentationStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case PresentationRequestStatus.Requested:
        return {
          label: "Requested",
          icon: <HourglassEmptyIcon />,
          color: "warning" as const,
          variant: "outlined" as const,
        };
      case PresentationRequestStatus.Presented:
        return {
          label: "Presented",
          icon: <CheckCircleIcon />,
          color: "success" as const,
          variant: "filled" as const,
        };
      default:
        return {
          label: "Unknown",
          icon: null,
          color: "default" as const,
          variant: "outlined" as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Chip
      icon={config.icon || undefined}
      label={config.label}
      color={config.color}
      variant={config.variant}
      size="small"
      className={className}
    />
  );
};

export { PresentationStatus };
export type { PresentationStatusProps };
