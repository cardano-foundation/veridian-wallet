import KeriLogo from "../assets/images/KeriGeneric.jpg";
import { ConnectionData } from "../components/ConnectdApp";

const walletConnectionsFix: ConnectionData[] = [
  {
    meerkatId: "1",
    name: "Wallet name #1",
    selectedAid: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    iconB64: KeriLogo,
    url: "http://localhost:3001/",
  },
  {
    meerkatId: "2",
    name: "Wallet name #2",
    selectedAid: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    url: "http://localhost:3002/",
  },
  {
    meerkatId: "3",
    name: "Wallet name #3",
    selectedAid: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    url: "http://localhost:3003/",
    iconB64: KeriLogo,
  },
  {
    meerkatId: "4",
    name: "Wallet name #4",
    selectedAid: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    url: "http://localhost:3004/",
  },
  {
    meerkatId: "5",
    name: "Wallet name #5",
    selectedAid: "ED4KeyyTKFj-72B008OTGgDCrFo6y7B2B73kfyzu5Inb",
    url: "http://localhost:3005/",
  },
];

export { walletConnectionsFix };
