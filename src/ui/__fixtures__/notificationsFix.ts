import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

const now = new Date(Date.now());
const notificationsFix: KeriaNotification[] = [
  {
    id: "AFp6F1v0t7AGNbOcH6a6_1dAl84v_vpd3pxPcwF2k72g",
    createdAt: new Date(now.getTime() + 10 * -60000).toISOString(),
    a: {
      r: "/exn/ipex/grant",
      d: "EPdq0b6ulG4uHiH4B7xBUJIGNIdOnt8uD1WkDqDp6CjD",
      m: "",
    },
    connectionId: "EJNd_YCOZA_g5fT8BnvY6KWgSMbIP9selgebbVNu8gNw",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMmG",
    createdAt: new Date(now.getTime() + 120 * -60000).toISOString(),
    a: {
      r: "/exn/ipex/grant",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMmv",
    createdAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * -1000).toISOString(),
    a: {
      r: "/exn/ipex/grant",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMmk",
    createdAt: new Date(
      now.getTime() + 15 * 24 * 60 * 60 * -1000
    ).toISOString(),
    a: {
      r: "/multisig/icp",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMmc",
    createdAt: new Date(
      now.getTime() + 750 * 24 * 60 * 60 * -1000
    ).toISOString(),
    a: {
      r: "/exn/ipex/apply",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm1",
    createdAt: new Date(now.getTime() + 120 * -60000).toISOString(),
    a: {
      r: "/local/acdc/revoked",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
      credentialId: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm4",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm2",
    createdAt: new Date(now.getTime() + 120 * -60000).toISOString(),
    a: {
      r: "/multisig/exn",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
      m: "",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
  {
    id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm3",
    createdAt: new Date(now.getTime() + 120 * -60000).toISOString(),
    a: {
      r: "/local/signrequest/",
      d: "EMT02ZHUhpnr4gFFk104B-pLwb2bJC8aip2VYmbPztnk",
    },
    connectionId: "EMrT7qX0FIMenQoe5pJLahxz_rheks1uIviGW8ch8pfB",
    read: false,
    groupReplied: false,
  },
];

const connectInstructionsFix = {
  id: "AL3XmFY8BM9F604qmV-l9b0YMZNvshHG7X6CveMWKMm4",
  createdAt: new Date(now.getTime() + 120 * -60000).toISOString(),
  a: {
    name: "ServerToConnectTo",
  },
  connectionId: "singleton",
  read: false,
  groupReplied: false,
};

export { notificationsFix, connectInstructionsFix };
