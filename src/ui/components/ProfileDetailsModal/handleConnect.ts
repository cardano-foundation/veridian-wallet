import { Agent } from "../../../core/agent/agent";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { setToastMsg } from "../../../store/reducers/stateCache";

interface ConnectParams {
  content: string;
  profileId: string | undefined;
  profile: any;
  dispatch: any;
}

interface ParsedQRData {
  backendOobi: string;
  sessionAid: string;
  backendApi: string;
}

interface LoginRequest {
  sessionAid: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  sessionId: string;
  userId: string;
}

const HTTP_METHODS = {
  POST: "POST",
} as const;

const API_ENDPOINTS = {
  LOGIN: "/login",
} as const;

const SIGNATURE_COMPONENTS = [
  "@method",
  "@path",
  "signify-resource",
  "signify-timestamp",
  "content-digest",
] as const;

const parseQRData = (content: string): ParsedQRData => {
  const url = new URL(content);
  const pathParts = url.pathname.split("/");
  const backendOobi = pathParts[2];
  const sessionAid = pathParts[4];
  const backendApi = `${url.protocol}//${url.host}`;

  if (!backendOobi || !sessionAid || !backendApi) {
    throw new Error("Invalid QR code data: missing required fields");
  }

  return { backendOobi, sessionAid, backendApi };
};

const createLoginRequest = (sessionAid: string): LoginRequest => ({
  sessionAid,
});

const createHttpSignature = async (
  method: string,
  path: string,
  requestBody: string,
  sessionAid: string,
  profileId: string | undefined,
  profile: any
): Promise<Headers> => {
  const identifier = await Agent.agent.client
    .identifiers()
    .get(profile?.id || profileId);
  const signer = Agent.agent.client.manager?.get(identifier);

  if (!signer) {
    throw new Error("Unable to get signer for the current profile");
  }

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

  const signatureInput = `sig1=(${SIGNATURE_COMPONENTS.map(
    (c) => `"${c}"`
  ).join(" ")});created=${Math.floor(Date.now() / 1000)};keyid="${
    profile?.id || profileId
  }"`;
  headers.set("Signature-Input", signatureInput);

  let payload = "";
  for (const component of SIGNATURE_COMPONENTS) {
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

  const signResult = await signer.sign(Buffer.from(payload));
  const signature = extractSignature(signResult);
  headers.set("Signature", `sig1=:${signature}:`);

  return headers;
};

const extractSignature = (signResult: any): string => {
  if (typeof signResult === "string") {
    return signResult;
  } else if (Array.isArray(signResult) && signResult.length > 0) {
    return signResult[0];
  } else if (
    signResult &&
    typeof signResult === "object" &&
    "qb64" in signResult
  ) {
    return (signResult as any).qb64;
  } else {
    throw new Error(`Unexpected sign result type: ${typeof signResult}`);
  }
};

const performLoginRequest = async (
  backendApi: string,
  headers: Headers,
  requestBody: string
): Promise<LoginResponse> => {
  const baseUrl = backendApi
    .replace(/\/$/, "")
    .replace("127.0.0.1", "localhost");
  const fullUrl = `${baseUrl}${API_ENDPOINTS.LOGIN}`;

  // TEMPORARY MOCK: Skip actual API call until backend is fixed
  // const response = await fetch(fullUrl, {
  //   method: HTTP_METHODS.POST,
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
  const mockResponse: LoginResponse = {
    success: true,
    message: "Login successful",
    sessionId: "mock-session-" + Date.now(),
    userId: "mock-user-id",
  };

  return mockResponse;
};

export const handleConnect = async ({
  content,
  profileId,
  profile,
  dispatch,
}: ConnectParams): Promise<void> => {
  try {
    const { sessionAid, backendApi } = parseQRData(content);
    const loginRequest = createLoginRequest(sessionAid);
    const requestBody = JSON.stringify(loginRequest);

    const headers = await createHttpSignature(
      HTTP_METHODS.POST,
      API_ENDPOINTS.LOGIN,
      requestBody,
      sessionAid,
      profileId,
      profile
    );

    const response = await performLoginRequest(
      backendApi,
      headers,
      requestBody
    );

    dispatch(setToastMsg(ToastMsgType.LOGIN_SUCCESSFUL));
  } catch (error) {
    showError(
      "Failed to login with scanned QR code",
      error instanceof Error ? error : new Error(String(error)),
      dispatch
    );
  }
};
