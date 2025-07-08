import { useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { getPendingConnection } from "../../../store/reducers/walletConnectionsCache";
import { SideSlider } from "../../components/SideSlider";
import { SidePageContentProps } from "../../components/SidePage/SidePage.types";
import { WalletConnectStageOne } from "./WalletConnectStageOne";
import { WalletConnectStageTwo } from "./WalletConnectStageTwo";

const WalletConnect = ({ setOpenPage }: SidePageContentProps) => {
  const pendingConnection = useAppSelector(getPendingConnection);
  const [requestStage, setRequestStage] = useState(0);
  const [hiddenStageOne, setHiddenStageOne] = useState(false);

  const changeToStageTwo = () => {
    setTimeout(() => setHiddenStageOne(true), 400);
    setRequestStage(1);
  };

  const backToStageOne = () => {
    setHiddenStageOne(false);
    setRequestStage(0);
  };

  const handleCloseWalletConnect = () => {
    setOpenPage(false);
  };

  if (!pendingConnection) return null;

  return (
    <div className="wallet-connect-container">
      {!hiddenStageOne && (
        <WalletConnectStageOne
          isOpen={!!pendingConnection}
          onClose={handleCloseWalletConnect}
          onAccept={changeToStageTwo}
        />
      )}
      <SideSlider isOpen={requestStage === 1}>
        <WalletConnectStageTwo
          pendingDAppMeerkat={pendingConnection.id}
          isOpen={!!pendingConnection && requestStage === 1}
          onClose={handleCloseWalletConnect}
          onBackClick={backToStageOne}
        />
      </SideSlider>
    </div>
  );
};

export { WalletConnect };
