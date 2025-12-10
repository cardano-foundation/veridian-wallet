import { ReactNode, useEffect, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { getIsConnectingToDApp } from "../../../store/reducers/profileCache";
import {
  getQueueIncomingRequest,
  getStateCache,
} from "../../../store/reducers/stateCache";
import { IncomingRequest } from "../../pages/IncomingRequest";
import { SideSlider } from "../SideSlider";

const SidePage = () => {
  const [openSidePage, setOpenSidePage] = useState(false);
  const queueIncomingRequest = useAppSelector(getQueueIncomingRequest);
  const isConnectingToDApp = useAppSelector(getIsConnectingToDApp);
  const stateCache = useAppSelector(getStateCache);
  const canOpenIncomingRequest =
    queueIncomingRequest.queues.length > 0 && !queueIncomingRequest.isPaused;
  const DELAY_ON_PAGE_CLOSE = 500;
  const [lastContent, setLastContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    if (!stateCache.authentication.loggedIn || isConnectingToDApp) return;
    setOpenSidePage(canOpenIncomingRequest);
  }, [
    canOpenIncomingRequest,
    stateCache.authentication.loggedIn,
    isConnectingToDApp,
  ]);

  const getContent = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
