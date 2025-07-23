import { ReactNode, useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import {
  getQueueIncomingRequest,
  getStateCache,
} from "../../../store/reducers/stateCache";
import {
  getIsConnecting,
  getPendingConnection,
} from "../../../store/reducers/walletConnectionsCache";
import { IncomingRequest } from "../../pages/IncomingRequest";
import { WalletConnect } from "../ConnectdApp/components/WalletConnect";
import { SideSlider } from "../SideSlider";

const SidePage = () => {
  const [openSidePage, setOpenSidePage] = useState(false);
  const pauseIncommingRequestByConnection = useRef(false);
  const queueIncomingRequest = useAppSelector(getQueueIncomingRequest);
  const pendingConnection = useAppSelector(getPendingConnection);
  const isConnecting = useAppSelector(getIsConnecting);
  const stateCache = useAppSelector(getStateCache);
  const canOpenIncomingRequest =
    queueIncomingRequest.queues.length > 0 && !queueIncomingRequest.isPaused;
  const canOpenPendingWalletConnection = !!pendingConnection;
  const DELAY_ON_PAGE_CLOSE = 500;
  const [lastContent, setLastContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    if (!stateCache.authentication.loggedIn || isConnecting) return;
    setOpenSidePage(canOpenIncomingRequest || canOpenPendingWalletConnection);
    if (canOpenPendingWalletConnection) {
      pauseIncommingRequestByConnection.current = true;
    }
  }, [
    canOpenIncomingRequest,
    canOpenPendingWalletConnection,
    stateCache.authentication.loggedIn,
    isConnecting,
  ]);

  const getContent = () => {
    if (canOpenPendingWalletConnection) {
      return (
        <WalletConnect
          open={openSidePage}
          setOpenPage={setOpenSidePage}
        />
      );
    }

    if (canOpenIncomingRequest) {
      return (
        <IncomingRequest
          open={openSidePage}
          setOpenPage={setOpenSidePage}
        />
      );
    }

    return null;
  };

  const clearLastContent = () => {
    setTimeout(() => {
      setLastContent(null);
    }, DELAY_ON_PAGE_CLOSE);
  };

  useEffect(() => {
    getContent() !== null && setLastContent(getContent());
    !openSidePage && clearLastContent();
  }, [openSidePage]);

  return (
    <SideSlider
      renderAsModal
      isOpen={openSidePage}
    >
      {getContent() || lastContent}
    </SideSlider>
  );
};

export { SidePage };
