import { ConnectionData } from "../../store/reducers/walletConnectionsCache";
import KeriLogo from "../assets/images/KeriGeneric.jpg";

const walletConnectionsFix: ConnectionData[] = [
  {
    meerkatId: "1",
    name: "Wallet name #1",
    selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRd",
    iconB64: KeriLogo,
    url: "http://localhost:3001/",
  },
  {
    meerkatId: "2",
    name: "Wallet name #2",
    selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRc",
    url: "http://localhost:3002/",
  },
  {
    meerkatId: "3",
    name: "Wallet name #3",
    selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRe",
    url: "http://localhost:3003/",
    iconB64: KeriLogo,
  },
  {
    meerkatId: "4",
    name: "Wallet name #4",
    selectedAid: "EN5dwY0N7RKn6OcVrK7ksIniSgPcItCuBRax2JFUpuRf",
    url: "http://localhost:3004/",
  },
];

export { walletConnectionsFix };
