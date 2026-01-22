import { useAppSelector } from "../../../store/hooks";
import { getIsInBiometricProcess } from "../../../store/reducers/stateCache";
import "./BiometricOverlay.scss";

const BiometricOverlay = () => {
  const isInBiometricProcess = useAppSelector(getIsInBiometricProcess);

  return isInBiometricProcess && <div className="biometric-overlay"></div>;
};

export { BiometricOverlay };
