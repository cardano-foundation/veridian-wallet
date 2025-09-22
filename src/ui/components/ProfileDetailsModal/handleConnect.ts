import { Agent } from "../../../core/agent/agent";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { setToastMsg } from "../../../store/reducers/stateCache";

export const handleConnect = async (
  content: string,
  profileId: string | undefined,
  profile: any,
  dispatch: any
) => {
  try {
    const url = new URL(content);
    const pathParts = url.pathname.split("/");
    const backendOobi = pathParts[2];
    const sessionAid = pathParts[4];
    const backendApi = `${url.protocol}//${url.host}`;

    if (!backendOobi || !sessionAid || !backendApi) {
      throw new Error("Invalid QR code data: missing required fields");
    }

    const identifier = await Agent.agent.client
      .identifiers()
      .get(profile?.id || profileId);
    const signer = Agent.agent.client.manager?.get(identifier);

    const method = "POST";
    const path = "/login";
    const requestBody = JSON.stringify({ sessionAid });

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    headers.set("Signify-Resource", sessionAid);
    headers.set(
      "Signify-Timestamp",
      new Date().toISOString().replace("Z", "+00:00")
    );

    const bodyBuffer = new TextEncoder().encode(requestBody);
    const hashBuffer = await crypto.subtle.digest("SHA-256", bodyBuffer);
    const hashBase64 = Buffer.from(hashBuffer).toString("base64");
    headers.set("Content-Digest", `sha-256=:${hashBase64}:`);

    const coveredComponents = [
      "@method",
      "@path",
      "signify-resource",
      "signify-timestamp",
      "content-digest",
    ];
    const signatureInput = `sig1=(${coveredComponents
      .map((c) => `"${c}"`)
      .join(" ")});created=${Math.floor(Date.now() / 1000)};keyid="${
      profile?.id || profileId
    }"`;
    headers.set("Signature-Input", signatureInput);

    let payload = "";
    for (const component of coveredComponents) {
      if (component === "@method") {
        payload += `"@method": ${method}\n`;
      } else if (component === "@path") {
        payload += `"@path": ${path}\n`;
      } else {
        payload += `"${component}": ${headers.get(component)}\n`;
      }
    }
    payload += `"@signature-params": ${signatureInput.substring(
      signatureInput.indexOf(";")
    )}`;

    if (!signer) {
      throw new Error("Unable to get signer for the current profile");
    }

    const signResult = await signer.sign(Buffer.from(payload));

    let signature: string;
    if (typeof signResult === "string") {
      signature = signResult;
    } else if (Array.isArray(signResult) && signResult.length > 0) {
      signature = signResult[0];
    } else if (
      signResult &&
      typeof signResult === "object" &&
      "qb64" in signResult
    ) {
      signature = (signResult as any).qb64;
    } else {
      throw new Error(`Unexpected sign result type: ${typeof signResult}`);
    }

    headers.set("Signature", `sig1=:${signature}:`);

    const baseUrl = backendApi
      .replace(/\/$/, "")
      .replace("127.0.0.1", "localhost");
    const fullUrl = `${baseUrl}${path}`;

    // TEMPORARY MOCK: Skip actual API call until backend is fixed
    // const response = await fetch(fullUrl, {
    //   method: "POST",
    //   headers: headers,
    //   body: requestBody,
    // });

    // if (!response.ok) {
    //   const errorText = await response.text();
    //   throw new Error(
    //     `HTTP error! status: ${response.status}, body: ${errorText}`
    //   );
    // }

    // Mock successful response
    const mockResponse = {
      success: true,
      message: "Login successful",
      sessionId: "mock-session-" + Date.now(),
      userId: profile?.id || profileId,
    };

    // TODO: Not sure what to do with this yet
    const data = mockResponse;

    dispatch(setToastMsg(ToastMsgType.CONNECT_WALLET_SUCCESS));
  } catch (error) {
    showError(
      "Failed to login with scanned QR code",
      error instanceof Error ? error : new Error(String(error)),
      dispatch
    );
  }
};
