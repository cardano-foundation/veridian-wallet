import React, { useEffect, useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { useCardano } from "@cardano-foundation/cardano-connect-with-wallet";
import { NetworkType } from "@cardano-foundation/cardano-connect-with-wallet-core";
import idwLogo from "../../public/idw.png";

interface IWalletInfoExtended {
  name: string
  address: string
  oobi: string
}
const Demo: React.FC = () => {
  const [payload, setPayload] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [showAcceptButton, setShowAcceptButton] = useState<boolean>(false);
  const [walletIsConnected, setWalletIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const defautlWallet = {
    name: "",
    address: "",
    oobi: "",
  };

  const [peerConnectWalletInfo, setPeerConnectWalletInfo] = useState<
    IWalletInfoExtended
    >(defautlWallet);

  // @ts-ignore: TS6133
  const [onPeerConnectAccept, setOnPeerConnectAccept] = useState(() => () => {
    /*TODO */
  });
  // @ts-ignore: TS6133
  const [onPeerConnectReject, setOnPeerConnectReject] = useState(() => () => {
    /*TODO */
  });

  const {
    dAppConnect,
    meerkatAddress,
    initDappConnect,
    disconnect,
    connect,
  } = useCardano({
    limitNetwork: NetworkType.TESTNET,
  });

  useEffect(() => {
    if (dAppConnect.current === null) {
      const verifyConnection = (
        walletInfo: IWalletInfoExtended,
        callback: (granted: boolean, autoconnect: boolean) => void,
      ) => {
        setPeerConnectWalletInfo(walletInfo);
        setShowAcceptButton(true);

        setOnPeerConnectAccept(() => () => callback(true, true));
        setOnPeerConnectReject(() => () => callback(false, false));
      };

      const onApiInject = async (name: string) => {
        const api = window.cardano && window.cardano[name];
        if (api) {
          const enabledApi = await api.enable();
          const keriIdentifier =
            await enabledApi.experimental.getKeriIdentifier();

          setPeerConnectWalletInfo({
            ...peerConnectWalletInfo,
            name: name,
            address: keriIdentifier.id,
            oobi: keriIdentifier.oobi,
          });

          setWalletIsConnected(true);
          setError("");
        } else {
          setError( `Timeout while connecting P2P ${name} wallet`)
        }
      };

      // @ts-ignore: TS6133
      const onApiEject = (name: string): void => {
        setPeerConnectWalletInfo(defautlWallet);
        setError("");
        disconnect();
      };

      // @ts-ignore
      const onP2PConnect = (a): void => {};

      initDappConnect(
        "Cip45 sample demo",
        window.location.href,
        verifyConnection,
        onApiInject,
        onApiEject,
        ["wss://tracker.webtorrent.dev:443/announce", "wss://dev.btt.cf-identity-wallet.metadata.dev.cf-deployments.org"],
        onP2PConnect,
      );
    }
  }, []);

  const disconnectWallet = () => {
    disconnect();
    setPeerConnectWalletInfo(defautlWallet);
    setShowAcceptButton(false);
    setWalletIsConnected(false);
    setError("");
  }
  const handleAcceptWallet = () => {
    if (peerConnectWalletInfo) {
      onPeerConnectAccept();
      connect(peerConnectWalletInfo.name).then(async () => {
        if (peerConnectWalletInfo.name === "veridian_p2p") {
          const start = Date.now();
          const interval = 100;
          const timeout = 5000;

          const checkApi = setInterval(async () => {
            const api =
                // @ts-ignore
                window.cardano && window.cardano[peerConnectWalletInfo.name];
            if (api || Date.now() - start > timeout) {
              clearInterval(checkApi);
              if (api) {
                const enabledApi = await api.enable();
                const keriIdentifier =
                    await enabledApi.experimental.getKeriIdentifier();
                setPeerConnectWalletInfo({
                  ...peerConnectWalletInfo,
                  address: keriIdentifier.id,
                  oobi: keriIdentifier.oobi,
                });
                setShowAcceptButton(false);
                setWalletIsConnected(true);
                setError("");
              } else {
                setError(`Timeout while connecting P2P ${peerConnectWalletInfo.name} wallet`);
                setWalletIsConnected(false);
              }
            }
          }, interval);
        } else {
          setError(`Wrong wallet: ${peerConnectWalletInfo.name}`);
        }
      });
    }
  };

  const signMessageWithWallet = async () => {

    if (
      window.cardano &&
      window.cardano["veridian_p2p"]
    ) {
      setError("");
      const api = window.cardano["veridian_p2p"];
      const enabledApi = await api.enable();
      try {
        const signedMessage = await enabledApi.experimental.signKeri(
            peerConnectWalletInfo?.address,
            payload
        );

        setSignature(signedMessage);
      // @ts-ignore
      } catch (e) {
        // @ts-ignore
        setError(e.code === 2
            ? "User declined to sign"
            // @ts-ignore
            : e.info)
      }
    } else {
      setError("Wallet not connected")
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-center text-gray-800">CIP45 Demo Dapp</h1>
      <p className="mt-4 text-lg text-gray-600 text-center">Scan the QR code with your IDW wallet to proceed.</p>
      <div className="p-4 border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center">
        <div className="h-8"/>
        <QRCode
          value={meerkatAddress}
          size={250}
          fgColor={"black"}
          bgColor={"white"}
          qrStyle={"squares"}
          logoImage={idwLogo}
          logoWidth={60}
          logoHeight={60}
          logoOpacity={1}
          quietZone={10}
        />
        <div className="text-sm font-semibold text-gray-500 mt-2">Meerkat Address: {meerkatAddress}</div>
        <div className="h-12 my-4">
          {
            showAcceptButton ? <button className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg"
                                       onClick={handleAcceptWallet} disabled={!showAcceptButton}>
              Accept connection with {peerConnectWalletInfo.name}
            </button> : walletIsConnected ? <button className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg"
                                onClick={disconnectWallet}>
              Disconnect Wallet
            </button> : null
          }
        </div>
      </div>
      <div className="my-6 text-center">
        <div className="h-24 mt-2">
          {peerConnectWalletInfo.address.length ? (
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-green-500 w-1/3 text-right pr-2">Connected Wallet:</p>
                  <p className="text-gray-800 w-2/3 text-left pl-2">{peerConnectWalletInfo.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 w-1/3 text-right pr-2">AID:</p>
                  <p className="text-gray-800 w-2/3 text-left pl-2">{peerConnectWalletInfo.address}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-800 w-1/3 text-right pr-2">OOBI:</p>
                  <p
                      className="text-gray-800 w-2/3 text-left pl-2 w-full break-words"
                  >
                    {peerConnectWalletInfo.oobi}
                  </p>
                </div>
              </div>
          ) : null}
          {error.length ? <p className="text-red-500">{error}</p> : null}
        </div>
      </div>
      <div className="mb-6 mt-12 text-center">
                <textarea
                  className="form-textarea mt-1 block w-full rounded-lg p-4 bg-white text-gray-900"
                  rows={4}
                  placeholder="Enter payload here..."
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  disabled={!peerConnectWalletInfo}
                />
        <button className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg mt-4"
                onClick={signMessageWithWallet} disabled={!walletIsConnected || !peerConnectWalletInfo || !payload.trim()}>
          Sign Payload
        </button>
      </div>
      {
        signature.length ? <>
          <p className="mt-14 bold text-xl text-gray-600 text-left">Signature:</p>
          <div className="mb-6 mt-2 p-4 bg-gray-100 rounded-lg h-24">
            <p className="text-gray-700 w-full break-words">{signature}</p>
          </div>
        </> : null
      }

    </div>
  );
};

export { Demo };
