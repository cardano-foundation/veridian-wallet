import { useEffect, useRef, useState } from "react";
import { SideSlider } from "../../components/SideSlider";
import {
  getQueueIncomingRequest,
  setPauseQueueIncomingRequest,
} from "../../../store/reducers/stateCache";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getPendingDAppMeerkat } from "../../../store/reducers/walletConnectionsCache";
import { IncomingRequest } from "./components/IncomingRequest";
import { WalletConnect } from "./components/WalletConnect";

const SidePage = () => {
  const dispatch = useAppDispatch();
  const [openSidePage, setOpenSidePage] = useState(false);
  const pauseIncommingRequestByConnection = useRef(false);

  const queueIncomingRequest = useAppSelector(getQueueIncomingRequest);
  const pendingDAppMeerkat = useAppSelector(getPendingDAppMeerkat);

  const canOpenIncomingRequest =
    queueIncomingRequest.queues.length > 0 && !queueIncomingRequest.isPaused;
  const canOpenPendingWalletConnection = !!pendingDAppMeerkat;

  useEffect(() => {
    if (canOpenIncomingRequest) return;

    if (canOpenPendingWalletConnection && !queueIncomingRequest.isPaused) {
      dispatch(setPauseQueueIncomingRequest(true));
      pauseIncommingRequestByConnection.current = true;
    }
  }, [canOpenIncomingRequest, canOpenPendingWalletConnection]);

  useEffect(() => {
    setOpenSidePage(canOpenIncomingRequest || canOpenPendingWalletConnection);
  }, [canOpenIncomingRequest, canOpenPendingWalletConnection]);

  const unpauseIncomingRequest = () => {
    if (pauseIncommingRequestByConnection.current) {
      dispatch(setPauseQueueIncomingRequest(false));
      pauseIncommingRequestByConnection.current = false;
    }
  };

  const getContent = () => {
    if (canOpenIncomingRequest)
      return (
        <IncomingRequest
          open={openSidePage}
          setOpenPage={setOpenSidePage}
        />
      );
    if (canOpenPendingWalletConnection)
      return (
        <WalletConnect
          open={openSidePage}
          setOpenPage={setOpenSidePage}
        />
      );
    return null;
  };

  return (
    <SideSlider
      renderAsModal
      onCloseAnimationEnd={unpauseIncomingRequest}
      open={openSidePage}
    >
      {getContent()}
    </SideSlider>
  );
};

export { SidePage };
