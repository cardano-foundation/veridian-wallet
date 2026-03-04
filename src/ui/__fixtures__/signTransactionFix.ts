import {
  PeerConnectSigningEvent,
  PeerConnectionEventTypes,
} from "../../core/cardano/walletConnect/peerConnection.types";

const signTransactionFix: PeerConnectSigningEvent = {
  type: PeerConnectionEventTypes.PeerConnectSign,
  payload: {
    identifier: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    payload: "Hello",
    approvalCallback: (approvalStatus: boolean) => approvalStatus,
  },
};

const signObjectFix: PeerConnectSigningEvent = {
  type: PeerConnectionEventTypes.PeerConnectSign,
  payload: {
    identifier: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    payload: JSON.stringify({
      action: "CAST_VOTE",
      actionText: "Cast Vote",
      data: {
        id: "2658fb7d-cd12-48c3-bc95-23e73616b79f",
        address:
          "stake_test1uzpq2pktpnj54e64kfgjkm8nrptdwfj7s7fvhp40e98qsusd9z7ek",
        event: "CF_TEST_EVENT_01",
        category: "CHANGE_SOMETHING",
        proposal: "YES",
        network: "PREPROD",
        votedAt: "40262406",
        votingPower: "10444555666",
      },
      slot: "40262407",
      uri: "https://evoting.cardano.org/voltaire",
      ownerUrl: "https://voting.summit.cardano.org",
      eventName: "Cardano Summit Voting Awards",
    }),
    approvalCallback: (approvalStatus: boolean) => approvalStatus,
  },
};

export { signObjectFix, signTransactionFix };
