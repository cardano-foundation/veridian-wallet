import { useEffect, useState, useMemo, useCallback } from "react";
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
  IncomingRequestProps,
} from "../../../store/reducers/stateCache/stateCache.types";
import { getConnectedWallet } from "../../../store/reducers/walletConnectionsCache";
import { ToastMsgType } from "../../globals/types";
import { VerifyRequest } from "./components/VerifyRequest";

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
      return queueIncomingRequest.queues[0];
    }
  }, [queueIncomingRequest]);
  const [initiateAnimation, setInitiateAnimation] = useState(false);
  const [requestData, setRequestData] = useState<
    IncomingRequestProps | undefined
  >();
  const ANIMATION_DELAY = 4000;
  const [blur, setBlur] = useState(false);

  // After the current refactoring we are defaulting all incoming requests to be
  // of type IncomingRequestType.PEER_CONNECT_SIGN because of the lack of other use cases.
  // Before the refactoring we had 3 use cases, so the JSX was rendering a component
  // that has now been removed and this used to contain a switch statement in order to render
  // the correct component. Please consider this if in the future we need to add more use cases.
  // The old code can be found in PR #550.

  const handleReset = useCallback(() => {
    setInitiateAnimation(false);
    setOpenPage(false);
    setBlur(false);

    setTimeout(() => {
      dispatch(dequeueIncomingRequest());
    }, 500);
  }, [dispatch, setOpenPage]);

  useEffect(() => {
    if (!incomingRequest) {
      setRequestData(undefined);
      return;
    }
    if (
      incomingRequest.type === IncomingRequestType.PEER_CONNECT_SIGN &&
      (!connectedWallet ||
        connectedWallet.id !== incomingRequest.peerConnection.id)
    ) {
      handleReset();
      return;
    }
    setRequestData(incomingRequest);
    setOpenPage(true);
  }, [connectedWallet, incomingRequest, setOpenPage, handleReset]);

  useEffect(() => {
    if (blur) {
      document?.querySelector("ion-router-outlet")?.classList.add("blur");
    } else {
      document?.querySelector("ion-router-outlet")?.classList.remove("blur");
    }
  }, [blur]);

  const handleCancel = async () => {
    if (!requestData) {
      return handleReset();
    }
    if (requestData.type === IncomingRequestType.PEER_CONNECT_SIGN) {
      requestData.signTransaction.payload.approvalCallback(false);
    } else if (requestData.type === IncomingRequestType.PEER_CONNECT_VERIFY) {
      requestData.verifyTransaction.payload.approvalCallback(false);
    }
    handleReset();
  };

  const handleAccept = async () => {
    if (!requestData) {
      return handleReset();
    }
    setInitiateAnimation(true);
    if (requestData.type === IncomingRequestType.PEER_CONNECT_SIGN) {
      requestData.signTransaction.payload.approvalCallback(true);
    } else if (requestData.type === IncomingRequestType.PEER_CONNECT_VERIFY) {
      requestData.verifyTransaction.payload.approvalCallback(true);
    }
    setTimeout(() => {
      handleReset();
      dispatch(setToastMsg(ToastMsgType.SIGN_SUCCESSFUL)); // Consider making this toast type-specific
    }, ANIMATION_DELAY);
  };

  if (!requestData) {
    return null;
  }

  switch (requestData.type) {
    case IncomingRequestType.PEER_CONNECT_SIGN:
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
    case IncomingRequestType.PEER_CONNECT_VERIFY:
      return (
        <VerifyRequest
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
    default:
      return null;
  }
};

export { IncomingRequest };
