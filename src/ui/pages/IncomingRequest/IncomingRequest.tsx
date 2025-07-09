import { useEffect, useState, useMemo } from "react";
import "./IncomingRequest.scss";
import { SidePageContentProps } from "../../components/SidePage/SidePage.types";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  dequeueIncomingRequest,
  getQueueIncomingRequest,
  setToastMsg,
} from "../../../store/reducers/stateCache";
import { SignRequest } from "./components/SignRequest"; // Import SignRequest component
import {
  IncomingRequestType,
  PeerConnectSigningEventRequest,
} from "../../../store/reducers/stateCache/stateCache.types";
import { getConnectedWallet } from "../../../store/reducers/walletConnectionsCache";
import { ToastMsgType } from "../../globals/types";

const IncomingRequest = ({ open, setOpenPage }: SidePageContentProps) => {
  const pageId = "incoming-request";
  const dispatch = useAppDispatch();
  const queueIncomingRequest = useAppSelector(getQueueIncomingRequest);
  const connectedWallet = useAppSelector(getConnectedWallet);
  const incomingRequest = useMemo(() => {
    if (
      !queueIncomingRequest.isProcessing ||
      !queueIncomingRequest.queues.length
    ) {
      return;
    } else {
      return queueIncomingRequest.queues[0] as PeerConnectSigningEventRequest;
    }
  }, [queueIncomingRequest]);
  const [initiateAnimation, setInitiateAnimation] = useState(false);
  const [requestData, setRequestData] =
    useState<PeerConnectSigningEventRequest>();
  const ANIMATION_DELAY = 4000;
  const [blur, setBlur] = useState(false);

  // After the current refactoring we are defaulting all incoming requests to be
  // of type IncomingRequestType.PEER_CONNECT_SIGN because of the lack of other use cases.
  // Before the refactoring we had 3 use cases, so the JSX was rendering a component
  // that has now been removed and this used to contain a switch statement in order to render
  // the correct component. Please consider this if in the future we need to add more use cases.
  // The old code can be found in PR #550.

  useEffect(() => {
    if (!incomingRequest) {
      return;
    }
    if (
      incomingRequest.type === IncomingRequestType.PEER_CONNECT_SIGN &&
      (!connectedWallet ||
        connectedWallet.id !== incomingRequest.peerConnection?.id)
    ) {
      handleReset();
    }
    setRequestData(incomingRequest);
    setOpenPage(true);
  }, [connectedWallet, incomingRequest, setOpenPage]);

  useEffect(() => {
    if (blur) {
      document?.querySelector("ion-router-outlet")?.classList.add("blur");
    } else {
      document?.querySelector("ion-router-outlet")?.classList.remove("blur");
    }
  }, [blur]);

  const handleReset = () => {
    setInitiateAnimation(false);
    setOpenPage(false);
    setBlur(false);

    setTimeout(() => {
      dispatch(dequeueIncomingRequest());
    }, 500);
  };

  const handleCancel = async () => {
    if (!incomingRequest) {
      return handleReset();
    }
    incomingRequest.signTransaction?.payload.approvalCallback(false);
    handleReset();
  };

  const handleAccept = async () => {
    if (!incomingRequest) {
      return handleReset();
    }
    setInitiateAnimation(true);
    incomingRequest.signTransaction?.payload.approvalCallback(true);
    setTimeout(() => {
      handleReset();
      dispatch(setToastMsg(ToastMsgType.SIGN_SUCCESSFUL));
    }, ANIMATION_DELAY);
  };

  if (!requestData) {
    return null;
  }

  return (
    <SignRequest
      pageId={pageId}
      activeStatus={open}
      blur={blur}
      setBlur={setBlur}
      requestData={requestData}
      initiateAnimation={initiateAnimation}
      handleAccept={handleAccept}
      handleCancel={handleCancel}
    />
  );
};

export { IncomingRequest };
