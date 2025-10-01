import { Saider } from "signify-ts";
import { Agent } from "../../../core/agent/agent";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { setToastMsg } from "../../../store/reducers/stateCache";

interface ConnectParams {
  content: string;
  profileAid: string | undefined;
  dispatch: any;
}

export async function signedInteractionFetch(
  profileAid: string,
  sessionAid: string,
  url: string,
  requestOptions: RequestInit
): Promise<Response> {
  const headers = new Headers(requestOptions.headers);
  const method = requestOptions.method?.toUpperCase() || "GET";
  const path = new URL(url).pathname;
  const datetime = new Date();

  const signer = await Agent.agent.identifiers.getSigner(profileAid);

  // Base headers
  headers.set("Signify-Resource", profileAid);
  headers.set(
    "Signify-Timestamp",
    datetime.toISOString().replace("Z", "+00:00")
  );

  // Handle body digest
  const coveredComponents = [
    "@method",
    "@path",
    "signify-resource",
    "signify-main-resource",
    "signify-timestamp",
  ];

  if (requestOptions.body) {
    headers.set("Content-Type", "application/json");
    const bodyBuffer =
      typeof requestOptions.body === "string"
        ? new TextEncoder().encode(requestOptions.body)
        : new Uint8Array(requestOptions.body as ArrayBuffer);

    const hashBuffer = await window.crypto.subtle.digest("SHA-256", bodyBuffer);
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    headers.set("Content-Digest", `sha-256=:${hashBase64}:`);
    coveredComponents.push("content-digest");
  }

  // Construct dynamic Signature-Input
  const signatureInput = `sig1=(${coveredComponents
    .map((c) => `"${c}"`)
    .join(" ")});created=${Math.floor(datetime.getTime() / 1000)};keyid="${
    signer.verfer.qb64
  }"`;
  headers.set("Signature-Input", signatureInput);

  const payload = constructPayload(method, path, headers, signatureInput);

  const payloadDigest = {
    ...payload,
    d: "",
    sessionAid,
  };

  const [, ked] = Saider.saidify(payloadDigest);

  const r = await Agent.agent.identifiers.signInteractionEvent(
    profileAid,
    ked.d
  );

  const kelIsVerified = await Agent.agent.identifiers.verifyInteraction(
    profileAid,
    ked.d,
    r.serder.ked.s
  );

  headers.set("Sequence-Number", r.serder.ked.s);
  const finalOptions: RequestInit = {
    ...requestOptions,
    headers: headers,
  };

  return fetch(url, finalOptions);
}

export async function signedFetch(
  profileAid: string,
  url: string,
  requestOptions: RequestInit
): Promise<Response> {
  const headers = new Headers(requestOptions.headers);
  const method = requestOptions.method?.toUpperCase() || "GET";
  const path = new URL(url).pathname;
  const datetime = new Date();

  const signer = await Agent.agent.identifiers.getSigner(profileAid);
  // Base headers
  headers.set("Signify-Resource", signer.verfer.qb64);

  headers.set(
    "Signify-Timestamp",
    datetime.toISOString().replace("Z", "+00:00")
  );
  // Handle body digest
  const coveredComponents = [
    "@method",
    "@path",
    "signify-resource",
    "signify-timestamp",
  ];

  if (requestOptions.body) {
    headers.set("Content-Type", "application/json");

    const bodyBuffer =
      typeof requestOptions.body === "string"
        ? new TextEncoder().encode(requestOptions.body)
        : new Uint8Array(requestOptions.body as ArrayBuffer);

    const hashBuffer = await window.crypto.subtle.digest("SHA-256", bodyBuffer);
    const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

    headers.set("Content-Digest", `sha-256=:${hashBase64}:`);
    coveredComponents.push("content-digest");
  }

  // Construct dynamic Signature-Input
  const signatureInput = `sig1=(${coveredComponents
    .map((c) => `"${c}"`)
    .join(" ")});created=${Math.floor(datetime.getTime() / 1000)};keyid="${
    signer.verfer.qb64
  }"`;
  headers.set("Signature-Input", signatureInput);

  const payload = constructPayload(method, path, headers, signatureInput);

  const payloadDigest = {
    d: "",
    ...payload,
  };

  const [, ked] = Saider.saidify(payloadDigest);

  const signature = signer.sign(ked.d).qb64;
  headers.set("Signature", `sig1=:${signature}:`);

  const finalOptions: RequestInit = {
    ...requestOptions,
    headers: headers,
  };

  return fetch(url, finalOptions);
}


function extractOobiAid(urlString: string): string | null {
  try {
    const parsedUrl = new URL(urlString);
    const pathname = parsedUrl.pathname;
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
    const oobiIndex = pathSegments.indexOf('oobi');

    if (oobiIndex !== -1 && pathSegments.length > oobiIndex + 1) {
      return pathSegments[oobiIndex + 1];
    }

    return null;
  } catch (error) {
    return null;
  }
}


export const handleConnect = async ({
  content,
  profileAid,
  dispatch,
}: ConnectParams): Promise<void> => {
  console.log("handleConnect");
  if (!profileAid) {
    throw new Error("Missing profileAid");
  }

  try {
    const { sessionAid, backendApi, backendOobi } = JSON.parse(content);
    
    const backendAid = extractOobiAid(backendOobi);

    if (!backendAid){
      throw new Error("backendAid not found in backendOobi");
    }

    await Agent.agent.connections.oneWayScanningLogin(backendOobi, backendAid, backendApi, profileAid);

    const requestPath = "/login";

    /* TODO: fix verification of interaction event in backend
    await signedInteractionFetch(profileAid, sessionAid, `${backendApi}${requestPath}`, {
      method: "POST",
       body: JSON.stringify({
        sessionAid,
        userAid: profileAid
      })
    });*/

    console.log("signedFetch");
    await signedFetch(profileAid, `${backendApi}${requestPath}`, {
      method: "POST",
      body: JSON.stringify({
        sessionAid,
        userAid: profileAid,
      }),
    });

    console.log("heylogin33")
    dispatch(setToastMsg(ToastMsgType.LOGIN_SUCCESSFUL));
  } catch (error) {
    showError(
      "Failed to login with scanned QR code",
      error instanceof Error ? error : new Error(String(error)),
      dispatch
    );
  }
};

function constructPayload(
  method: string,
  path: string,
  headers: Headers,
  signatureInput: string
): object {
  const coveredComponents = (signatureInput.match(/\(([^)]+)\)/)?.[1] || "")
    .split(" ")
    .map((c) => c.replace(/"/g, ""));

  const payload: { [key: string]: any } = {};
  for (const component of coveredComponents) {
    if (component === "@method") {
      payload[component] = method;
    } else if (component === "@path") {
      payload[component] = path;
    } else {
      payload[component] = headers.get(component);
    }
  }
  payload["@signature-params"] = signatureInput.substring(
    signatureInput.indexOf(";")
  );

  return payload;
}
