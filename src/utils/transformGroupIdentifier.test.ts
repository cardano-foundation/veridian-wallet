import { CreationStatus } from "../core/agent/agent.types";
import { transformGroupIdentifier } from "./transformGroupIdentifier";

describe("transformGroupIdentifier", () => {
  it("should transform group identifier with all fields present", () => {
    const input = {
      id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo",
      displayName: "Test MS",
      createdAtUTC: "2024-03-07T11:54:56.886Z",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
      s: "4",
      dt: "2023-06-12T14:07:53.224866+00:00",
      kt: "2",
      k: ["DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxH-"],
      nt: "3",
      n: ["EIZ-n_hHHY5ERGTzvpXYBkB6_yBAM4RXcjQG3-JykFvF"],
      bt: "1",
      b: ["BIe_q0F4EkYPEne6jUnSV1exxOYeGf_AMSMvegpF4XQP"],
      di: "test",
      groupMemberPre: "ELUXM-ajSu0o1qyFvss-3QQfkj3DOke9aHNwt72Byi9y",
      groupId: "test-group-id",
      members: [
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYBu",
        "EFZ-hSogn3-wXEahBbIW_oXYxAV_vH8eEhX6BwQHsYB2",
      ],
    };

    const expectedOutput = {
      "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo": {
        displayName: "Test MS",
        id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo",
        createdAtUTC: "2024-03-07T11:54:56.886Z",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata: undefined,
        groupMemberPre: "ELUXM-ajSu0o1qyFvss-3QQfkj3DOke9aHNwt72Byi9y",
        groupUsername: "",
      },
    };

    const result = transformGroupIdentifier(input);
    expect(result).toEqual(expectedOutput);
  });

  it("should transform group identifier with all optional fields missing", () => {
    const input = {
      id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo",
      displayName: "Test MS",
      createdAtUTC: "2024-03-07T11:54:56.886Z",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
      s: "4",
      dt: "2023-06-12T14:07:53.224866+00:00",
      kt: "2",
      k: ["DCF6b0c5aVm_26_sCTgLB4An6oUxEM5pVDDLqxxXDxH-"],
      nt: "3",
      n: ["EIZ-n_hHHY5ERGTzvpXYBkB6_yBAM4RXcjQG3-JykFvF"],
      bt: "1",
      b: ["BIe_q0F4EkYPEne6jUnSV1exxOYeGf_AMSMvegpF4XQP"],
    };

    const expectedOutput = {
      "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo": {
        displayName: "Test MS",
        id: "ECHG-cxboMQ78Hwlm2-w6OS3iU275bAKkqC1LjwICPyo",
        createdAtUTC: "2024-03-07T11:54:56.886Z",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
        groupMetadata: undefined,
        groupMemberPre: undefined,
        groupUsername: undefined,
      },
    };

    const result = transformGroupIdentifier(input);
    expect(result).toEqual(expectedOutput);
  });
});
