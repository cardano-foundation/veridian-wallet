import { ConnectionStatus, ConnectionType } from "../../core/agent/agent.types";
import CardanoLogo from "../assets/images/CardanoLogo.jpg";
import UserPicture from "../assets/images/UserPicture.jpg";
import { ConnectionShortDetails } from "../pages/Connections/Connections.types";

const connectionsFix: ConnectionShortDetails[] = [
  {
    id: "ebfeb1ebc6f1c276ef71212ec20",
    label: "Cambridge University",
    connectionDate: "2017-01-14T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.PENDING,
    type: ConnectionType.DIDCOMM,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec21",
    label: "Passport Office",
    connectionDate: "2017-01-16T08:21:54Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    type: ConnectionType.DIDCOMM,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec22",
    label: "Cardano Foundation",
    connectionDate: "2017-01-13T10:15:11Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
    type: ConnectionType.DIDCOMM,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec23",
    label: "John Smith",
    connectionDate: "2024-02-13T11:39:20Z",
    logo: UserPicture,
    status: ConnectionStatus.CONFIRMED,
    type: ConnectionType.KERI,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec24",
    label: "Starling Bank",
    connectionDate: "2016-01-10T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.PENDING,
    type: ConnectionType.KERI,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec25",
    label: "Friends' Bank",
    connectionDate: "2018-01-14T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.ACCEPTED,
    type: ConnectionType.KERI,
  },
  {
    id: "ebfeb1ebc6f1c276ef71212ec26",
    label: "YMCA",
    connectionDate: "2020-07-06T19:23:24Z",
    logo: CardanoLogo,
    status: ConnectionStatus.CONFIRMED,
  },
];

const connectionRequestPlaceholder = {
  label: "",
  goal_code: "",
  goal: "",
  handshake_protocols: [],
  requestattach: [],
  service: [
    {
      id: "",
      type: "",
      recipientKeys: [],
      routingKeys: [],
      serviceEndpoint: "",
    },
  ],
  profileUrl: "",
  public_did: "",
  type: "",
  id: "",
};

const connectionRequestData = {
  label: "SunCrest Medical",
  goal_code: "connection",
  goal: "Setup passwordless login",
  handshake_protocols: ["did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0"],
  requestattach: [],
  service: [
    {
      id: "8nMzYxqi1nrGXJLpPLNjft;indy",
      type: "IndyAgent",
      recipientKeys: ["5F1SZ9WZusiiD29urKJYJkA6Nc5WggYcXzxjC37edPG3"],
      routingKeys: [
        "5F1SZ9WZusiiD29urKJYJkA6Nc5WggYcXzxjC37edPG3",
        "3mo3P6XzDzBvuktCgDQarACzzeV7zxrSExnicpuH7t83",
      ],
      serviceEndpoint: "https://vas.evernym.com/agency/msg",
    },
  ],
  profileUrl: "https://i.postimg.cc/bvs8K9bJ/Sun-Crest-Medical-logo.png",
  public_did: "did:sov:W2u9PzjDmhKM5xLABjAqav",
  type: "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.0/invitation",
  id: "565a1185-9df7-415d-8ab8-fd8e81ad3161",
};

const credentialRequestData = {
  label: "Happy Members Credit Union",
  goal_code: "issue-vc",
  goal: "To issue a credential",
  requestattach: [
    {
      id: "180feaa3-44a7-4075-92a4-266286af3ef3",
      mimetype: "application/json",
      data: {
        base64:
          "eyJjcmVkZW50aWFsX3ByZXZpZXciOnsiQHR5cGUiOiJkaWQ6c292OkJ6Q2JzTlloTXJqSGlxWkRUVUFTSGc7c3BlYy9pc3N1ZS1jcmVkZW50aWFsLzEuMC9jcmVkZW50aWFsLXByZXZpZXciLCJhdHRyaWJ1dGVzIjpbeyJuYW1lIjoiSUJBTiIsInZhbHVlIjoiMjczODQ2MzcyIn0seyJuYW1lIjoiVG90YWwgV2l0aHJhd3dhbHMiLCJ2YWx1ZSI6IiQ0NTYyLjM0In0seyJuYW1lIjoiQWNjb3VudCBUeXBlIiwidmFsdWUiOiJDaGVja2luZyJ9LHsibmFtZSI6Ikluc3RpdHV0aW9uIE5hbWUiLCJ2YWx1ZSI6IkhhcHB5IE1lbWJlcnMgQ3JlZGl0IFVuaW9uIn0seyJuYW1lIjoiQXZlcmFnZSBNb250bHkgQmFsYW5jZSBMYXN0IDEyIG1vbnRocyIsInZhbHVlIjoiJDM1NTQuMzIifSx7Im5hbWUiOiJUb3RhbCBEZXBvc2l0cyIsInZhbHVlIjoiJDYyMzQuMzQifSx7Im5hbWUiOiJBY2NvdW50IE51bWJlciIsInZhbHVlIjoiWFhYWFhYWFhYWFg1NTQzIn0seyJuYW1lIjoiU1dJRlQgQklDIiwidmFsdWUiOiJCQU4wMTAwNDY1In0seyJuYW1lIjoiQ3JlZGl0IFNjb3JlIiwidmFsdWUiOiJHcmVhdGVyIHRoYW4gNzYwIn0seyJuYW1lIjoiRE9CIiwidmFsdWUiOiIwMi8wMS8xOTg5In0seyJuYW1lIjoiU3RhdGVtZW50IFBlcmlvZCIsInZhbHVlIjoiMDMvMDEvMjAyMSAtIDAzLzMxLzIwMjEifSx7Im5hbWUiOiJGaXJzdCBOYW1lIiwidmFsdWUiOiJBbGljZSJ9LHsibmFtZSI6Ikxhc3QgTmFtZSIsInZhbHVlIjoiSm9uZXMifV19LCJvZmZlcnN+YXR0YWNoIjpbeyJAaWQiOiJsaWJpbmR5LWNyZWQtb2ZmZXItMCIsIm1pbWUtdHlwZSI6ImFwcGxpY2F0aW9uL2pzb24iLCJkYXRhIjp7ImJhc2U2NCI6ImV5SnpZMmhsYldGZmFXUWlPaUpRU2xCa1owcDFTMHRwUlcxM1pEaHFaM0YxZHpSVE9qSTZSbWx1WVc1amFXRnNJRk4wWVhSbGJXVnVkRG93TGpFaUxDSmpjbVZrWDJSbFpsOXBaQ0k2SWxCS1VHUm5TblZMUzJsRmJYZGtPR3BuY1hWM05GTTZNenBEVERvMU9UVTFNVHBzWVhSbGMzUWlMQ0pyWlhsZlkyOXljbVZqZEc1bGMzTmZjSEp2YjJZaU9uc2lZeUk2SWpFd01ERTFNakF3T1RnME9ESTJNak00TWpnMk16a3dNakk1TkRVeE1ETTVNVEEzTkRreE56RXdNVE00TkRBd09EWXhNalk0TlRFM05qYzVNREkwTURVek56SXpPVFEzTWpNeE9EYzVOaUlzSW5oNlgyTmhjQ0k2SWpJeU9EVXpNamc0TmpRME56QXpNRFExTVRrNU5EVXdNVFF4TURreE5UUTNNRFl5TURnNU5UUXhNVGs1TURBME9UQTRPVEUzTnpZeE1qWTFNRE01TVRBd01qUXhNemN4TmpNNU9UazFPVFkzTkRBNU9USTJNemsyT1RZNE5qTTROalUzTlRVeE1qQTFNRGd3TXpFeE1UQTVNRGN4T0RZM016VXpNREExTkRFd05EWTJPVFkzT0RjNU5qVTJORGN3TmpZMk5UY3dOREUwTURNd05UWTFPREV3TnprMU5qazVNek00TlRJd05UWTNNalUzTmpVMk9EazJNRGMzTXpreU1ERXlOVE16T1Rrek1ESTNORFk0TlRVeE1UYzFNRGM0TmpBeE5UZzVNemM1TURjek5USXdNREUyTURJM01USXhNVFUxTlRBMk1UY3hNVGt3TVRjeE5UUTVNekV3TWpjd05qRXlNVFUwT0RVM01EQTFOelUxTWpNMU5qSTNNek13TmpnM056YzRORGs0TlRFNE1UZzRPRGM0TkRNME1UTXlNelUzTURZMU5Ea3dOakF3TXpjMU1USXpPRFF6TlRRMU1UWXlPVGd4TXpRek1URXhNell4TkRFNE9ESTFOelUxTVRJMk1ERTFOelEyTkRZMU5UZzVNemN6TkRBME5UQTRNVFF4TnpNeE1qa3pOREF3TkRRNU1qZzROREl4TVRNd01qUXlOVEF3TXpFd09USTVPRFEzT0RVNE9ESXpNVEk1TnpNMU16QTBNRGcxTkRZME16TTNPVGN4TXpVMU1EY3lNVFF6TkRJMk9UTTFPVFE1T1RneE1qYzJNRGsxTkRreE9Ea3lNamd5T1RZMk5USTVNRFEwTlRNek1qSTRPVEV4T0RNMU56VTVNVGsyTWpBM016WXlOak13TURNd09EUXpOVFk1TmpFd01UQTRPRGsyTWprME56YzBPREkwT0RFd01EVXlNRGc0TmpNek5qTTVOalEzTlRrM09UVTRNemN3TkRVMk9UUTFPRGs0TWpZMk9URXlOams0TXpZeU5qY3hNemM0T0RFeE1qRXlPVEl5TXpjeE1Ea3lOemMwTkRZM01UTTFPVE15TnpZM05EUTROekEwTmpJME5UWXlPRFUxTlRFMU1EWTFPVFk0TURjek9UZzVPVFkwTkRJek1ESTVOVFE0TURVMk56UTVOVFU1TnpreE9EVTFNek01T0RJaUxDSjRjbDlqWVhBaU9sdGJJbU55WldScGRITmpiM0psSWl3aU1UZzNOelk1TkRJMU5qTTBNekV5T1RjMU1qazBNVFUyT1RNNU5ESTFNRFV5T0RNeU1EZ3lPRFV4TXpjNE5UazNOVGszTVRBek16UTRPVEExTkRBME1ESTNOekV6T0Rrek1USTVOams1TkRVeU5ETTBNemsyT0RnNU1USXhORE0yT1RnMU1qSXdNVGs1TkRBeE16QXhNRGMzT0RFNE5UUXhPVEk0T1RReE1EZzNPVEUxTVRZeU1qWTJNVGM1TXpBeE1UWTRORGsxTkRRNE1qUTRPVEl6T0RJeE9EQTNOemN5TlRRMU5URTBNRFEyT1RVd01ESTBPRFU0TmpNM05qQXhPVEEyTnpVd05EUTVOelU0TkRrNU1UazVNamN4TXpBeE5EY3lOalUyTXpnM09EQTVPVEl6TWpreE9UYzJOemN6TVRreE1UTXdOekk1TmpJMU9ETXlNREU1TXpZMk1EWXdNalF3TnpJeE1ERTBORFEyT1RZMU1UQTFNakkxT0RrME56TTROek0zTXpnNE5EWTVPRGd6TURJeE1qSXhPVGMzT1RRNE1ERTJNRGsxTWpFNE5ESXpNekExTlRVNE56STRNekkwTkRneE1UZzROVEE1TXpBeE5Ea3lNVGd3TlRVeU56Z3dPRE0xT0RRMk9ETTVNVFEyTWpZMk16YzBNemcwTkRBNE5qRTNNek14TkRFNU56QTJOakV6TmpBMk9UTXhNelUwT0RReE56SXlOek0xT0RJeU5UZzFNRGN4TmpJeE9EazJPVFkzT0RjNU5EVTVOVFk0TmpRME5EZ3dNRGsxTVRNME5EVXdNemMyT1RNMU56TTJOamszTmpBek16SXdNak15TlRrME1URXlOek0yTWpReU16RTFNVE0zTURRMk9UYzRNelExT1RVM09ERTFNRFl4TmpjeE5EZzNORGcxT0RBeU16RTRNekk0TXpVek5UQTBOREk0T0RnM09USXdNRE13TVRFMU56a3pNRGszT1RVeU56Z3lNRE0wTnpBd05EQXhNVE0wTWpVd056VTROakkzTXpjeU9UYzVNVGt6TWpRNU9Ua3hOemcwTWpFNE5qRTNNRGswTURZMk5Ua3hORE0xTlRReE9ESXpNakF3TWprNE9UWXpOakl5TkRZek5UazNNek01TWpjNU1ERTNNRGd6TWpRd056TXhNVFk0T1RrNU9EUTROemszTlRneU16QTJOelU1TVRjMUlsMHNXeUowYjNSaGJHUmxjRzl6YVhSeklpd2lORGs1TWprMU1EVTROemcxTWpjek9Ua3pOalkxTVRJMU5ERXdNakExTkRnNU9USXlNemN5T1RZM01qYzNPVEExTnpnd01ESTJORGczT0RBMk5qZzFNamcxT0RZMk5Ua3pNVGswTWpZeE56azBORE0wTnpRNE1UVTJOekF4TnpNMk9UWTBOamcwT1RBeE5qRXhNREF4T1RBMU1qQTJNakEyTmpVd05ETTBNelF4TWpVNE1Ea3lNVGswT1RBME9EVXhPVEF5T1RVMk5EQTFOak0wTXpZd05EZ3dOekkzT0RNME1ETXhNVGd5T0RRNE16UTJNelF4T1Rrd056QXhPRFEzTVRZNU9EVXhOVFF3TURBeU56Y3hORFU0T0RVME5qY3dNekU0TXpneE1ESXdNVEEzTWpZeU1qRTRNekl4TlRjd01qYzFNekEwTURJM016ZzJNVGN6TmpZd09ESTVNVFV5TXpVeE1UQTJNRFV3TnpFd016VXlPVEV4T0RJeU56Z3hORGMyTVRFeE9EazFOamt3TnpjNE1qTTNORFl6TmpJMk1UQXlPRFUzT0RRNU56STBPRFkwTXpNNU9EQXdOalkyTlRrM01qTTFPVGN3TkRFeE1EVTFPRE0xTURJNE5UWTBORFkxTkRVNE9UVTVNREUwTlRZM01qZzNORGM0TmpVeE5Ua3hORGN3TkRNd016ZzBPVGN4TkRJeE1UVXlNRE0xTlRZME56Z3dPVE0zTURVME1qazVNVFUyTVRBM056UTVORGt4TWpNNE5UY3dPVGMzTmpZME5UQTNOalV5TVRNMU5UVTROVFEyTmpreE5UWTBOekE1TmpNME1qVXdPRGM1TmpVek9USTFNalV4TmpBd01qa3dOelV4TlRBNE9EWXhOekl4TlRBd05qVTFNVFE0T0RVMk9EWTFNalE1TnpVd01Ea3hORFEyTnpjek16UXhNell6TWpJMU16azNNRE13T1RZd05qa3lNRFV4T1RZNU5qZzBOakkzT1RNMk1UZ3lNalV6TkRNNU9UUTNORGN5TXpNMk1UUTFORFEyTXpJME1EWXhOVE13TmpJeE5URTBNRGt3TVRrME9UWTJOakl3TXpnek56VTJNVE0xTlRJeE56VTRPRE0wTmpBMU5UYzBOalk1TWpNME5qTTJNekl5TkRNd09UWXlOekkxTWpnNE5USXpNekkxTkRBNE5URTVOak15TURVNU1UWTFJbDBzV3lKdFlYTjBaWEpmYzJWamNtVjBJaXdpTmprek1qWXhPRGs0TWpVME9EQTNNRGt5TWpZME5EQTJNVEkyT0RBMk5qQXhPREE0TkRjeU5UQXlORGczTWpNNE56STRPVGt4TWpVMk9EQXlPVFkyTkRnM05qQXhOREl4T1RNMU5USTBPRFF3TmpnMk9EWXlNRGc1TURnMk16Y3dNalU0T1RFMU9UTXlPVGcxTnpjeE9UWTJNalkwTXpRNU5UZzRNekUxTkRjMk1UTXdNREUxTXpFME5ETXhNemN5T0RVeE1ETXhOemN5TURrM056VXpOVEk0TXpnNU1ETTFOVGt4TkRFek5qVXhPVE0yT0RZek1EQTVORFV5TnpnM09ETTBOelk1TnpRNU5EWTVPVE13TXpreE56ZzNPVE14TVRRME56RTBNekF3TkRNeE1UTTVNVGd3TmpFek1UTXlNekl4TURNME1EWXpNakEyTlRrNE1USXhNalk1TkRneE9UZzBPVFk1TlRFM01EYzJOREkzTVRjeU9UYzVOREV4TlRZMU1UWTBOakEzTlRBME9UQXpNVGd3TVRrNU1EUTRPREkwTXpnNU9EZzNNakl3TVRJM05EUTFNREEwTnpnMU1qUTFORFE1TURjek1qSTFOREE1TkRRM05qYzRPREl3TURReE9ERXdOalk0Tmpnd05EQTVNakUzTkRBNU5qa3dORFU0TnpJeE5qQXpOREE1TlRFNE1qVXdPREUyT0RVM05Ea3hNRFl6TVRNNE9ETTBNamd5TnpNME9EWTBOVGN3TVRVMU9USTVOVEF6T0RjMk1UYzVOak01TVRFeE1UYzNOVGd5TVRZd09EUXlOelE0TnpnMU16VXdNakU1TVRFeE1qYzJOVE0xTURJNU5EWTNPVFU1T0RRNU1qQXhNRFF3TXpZM05ETTNPRFUxTlRJek5qVTRNalV5TURVd05Ea3pNelUyTWpnNU9UUTRPREl6TURBMU5qZ3pOVEkwTURJMU5URTRORGc1TmpreE5EazJPVEF6T0RRd01qRTNOemt5T1RNM01UQTVORFEwT1RBM09Ea3hNamd6TmpJM09ESTROamd6TkRFNU16VXpOamt5TnprMU1ERTRNVEkyTURVeU1EQTFNemMyTXpZeE16VTBORFV5TnpjeE1qQXdPRGt5TXpBek9URXdNRGcwTURJMU9ERTNNRGd6T1RVNE5EWXhORFE0T1RFNE16a3lPRFF3TURjNU1qRXpOVE01SWwwc1d5SmhZMk52ZFc1MGRIbHdaU0lzSWpFNU1UQTBOems0TWpjMU1qQXlPRFl6TnpjNU9EZzBOVFE1TVRnNU9ERXhNVE01TnpZM01ETXlOakF4TXpJNU56ZzNNakV5TVRrMU1EYzFNakF6TnpjNU5URTBNak0yT0RFMU5EWTBPVGcwT1RjME5qZzRPRFl5TnpneE5EWXpOVEk1TlRjNE1UUXlNRE16T0RBNE1qUTNNekl5TnpReE56UXlOelUzTURVME1qQXlNemcyTlRjMU5USTFOelU1T1RjMk16QTFPVGt3TkRVME5UTXdNRE14T1RJNE1qSXdPRFkwTXprM05UWXdORGN3TWpnd01UYzRNRGd5TURjMk5EZzNPVE16TnpJd016QXlPVEExTURrNE1EZzBPRFE1TlRBNE9UWTBORFExTmpFd016TXpNekV6T1Rjek1EVTVNalExTWpRek16WXlNakEzTmpFNE16TXlORGt5TWprMU9EazJOall5TkRjNE1qYzBOemd4TlRFNE5qQXlNemt3TnpZek1EZ3pPVEkzT0RVeE56RTROamM1T1RRd01UY3lPRE16TWpNeE1UUTNPVFUzTkRBME9UQTFPVEkzT0RjeU56VXhOVFF3T0Rrek1EWXhNVEl3TlRJMU9UTTVPREk0TVRrNU5qVXhNVGswTkRRd05qZzNNemcxTURjek1UWXhPVEl4TkRFeE9USTFOakV6TWpBM056QTNOekkyTXpNeE9UWTNNRE0xTURZd05qWTNPVFl6TURZeE16UTFOREF4TlRZME5qQTBORFl6TVRreE1qZ3lNemMwT1RRNU1qQTVOamMzTmpNNU9EUTRNemN3TXpjME9EQXdOVFUwTnpNek5ETTJORGswTlRBME16RTRPRGt6TWpBNU1EZzBOamt4TURJek9EQTNOemsyTmpjd05Ua3lPVGswTVRFeE1qQXpNelU1TVRnME1UUXlOamM1TVRnNE56azFPVFl4T1RJeE9URTVNRFV5TkRZNE1qRTNPRGMxTnpFMU5qQXhNek0wTnpBNU1UUTJOemswTVRJNE5ERTBNRGt3TkRReU5Ea3pPRGszTVRRd01qTXdOekl5TmpBMk5UYzNNakU1TVRJMk5ERXpNelk1TWpNM01EYzFPREkyTmpjM016Y3pOVEF3TURnNU1qUXhNRFUzT1RNeU1EWXlORFUzT1RJd056VTJPVGszTmpNMU1UVXhNRFUwTmpVNE5qVXdOREkwTmpNaVhTeGJJbVpwY25OMGJtRnRaU0lzSWpNeE1EUXdNRGd5T0Rrd056Y3dPVFUxT1RjMk9Ea3pOVEkzTURRM05qZzVOakV3T0Rrek56azFOekExT1RZeU5Ea3pNVFV3TXpnek5URTVPRE13TVRZM01EZzJOVGMxT0RJeE1Ua3pORE13TWpJNU1EVTFPREV3TURJeE16Z3pNemcxT0RZeE56UXdPRGsxTlRFNU5qTTROemsyTURZMk9UWTRNekE0TVRJM056WTBPVFV6T1RBd05ETTVPREl3TnpZMk16Z3dNek16TlRjNU1qWXhORGd5TkRBd05USTROelE0TnpFMU5ETTROVE01TnpVeE1EVTFPRFU1TXpRMU16YzJNamc0TkRjNE9URXlNamszTlRJd01UWTFNVEEwT1RjeE1qQTRNekUzTmpjMk1UWTNNRFF3TmpVNU1qSXdPVE16TURNeE5EVTVNVEl3TVRVM01UWTFNVEE1TXpJNE5EUTJOekUxTXpNMk5qYzFOVFUwTXpjeU1ERTFNVGszT1RVeE1qTTNNRFE1T1RrME16ZzNORGsxTURVd056a3lNelkwTVRFMU1UZ3lNVFF5TmpNNU56WXpNRFExTVRJMU1qSTRNVFU0TURRMk1qRXhNek13TXpZMk9EQTVNelkxTnpFeE5qVTVPRFkzTVRZeU5EVTVPREkzT0RVeU1EazFOamt5TlRnNE9EVTRNekEwTnpFM05ETTJORGMxTVRBME9UWTBNelF4TlRVd09EUXhPRFUxTXpNMk9UZzNNemd5TkRJd01EWTNOemd3TkRZME9UQTJOekk1TlRNd056YzFOemMyT1RrMU56QXdOREF5TWpRNU1qazBORFkzTWpJd09UVTNOell4TVRRNE16UXlNVGs1TlRVek1EVXlOREF6TVRJMU1EYzNOVFU1TkRjeE1UUTBORGczTURrM09URXlNak15T1RBM05UZzVPRE13Tmprd01qSXhOakF4TlRjM05UTXdPRGd4TVRRM05URXhPVEF3TkRnd01qY3lOVFV6TWpnMk1EUTFOell3TXpVMU5EYzRPVGc0T0RFME56ZzFPRGs0T0RJNE1UZzBOamcxTXpnd01ESXpNalEwTlRFNE1ETTBNak01TmpnME1UTXlNekl3TXpZMU16Z3lNVGN5TXprd016ZzFNamM0TlRnNU1UTTVOVFU0T1RRME1EVXhNakkxTURReE5EVTFNak13TWpVM05qWTBPVFF5TVNKZExGc2ljM2RwWm5SaWFXTWlMQ0l4TkRjeU56Z3pOekU1TmpFMk1ETTJNRGt5TXpFM016QXpNRFkwTkRNMk5qY3dOVGc0TlRjME1UTXdNRGN6TXprNE9UZzVNelU0T0RrMU9ERTJOVGd6T1RjNE5qVTFNekF6T1RNek5UWTFNVGc0TVRFM056YzROamc1TkRNNE16RTBOamt6TnpRek5qY3pPRGcwTlRZME5qWTROemN5TlRNM01USXpORGM1TWpjNU5qZzVNemN3T1RZMU5qYzNOemd4TlRjMU5EazVOamd3TWpBeE1UQXpPVFEyTXpZMk5qZ3dNamcwTmpVMU9EZzRNalkxTWpFeU16VTBOREk1TVRjME1qVXpPRGt3TnpVd016TXdNakl3TXpFM016Z3lNekV5T1RFek5qRTVOREV5TkRrMk16WXdPRFE0TlRNeE5qVTBOVGN6TURjMU5EVTRPREk0TWpneU5EZ3dOak00TVRBNU1UYzJPREkyTmpZNE1UWTBOemN3TlRNd05qRTVPVEkwT1RZMU5ESTRNRGsxTlRZM01EUTNNRFl6TXpJeU1qWXdOelk0TXpJNU5UQXdOamt4T0RRM01UVTBNekl5TkRreE1UQXpNREUzTlRjeU5ESTJPRE0wTnpJME5USTFNVGd6TWpZeU5qVTJOVGs0TkRVMU1qSTFOREl5T1RZNU9UazFOek01T0RJek9Ea3hOVGsxTXpBMU16Y3hOakF6TURBMk5EZzBNamMyTXpnME9UWTBNalF6TmpnNE9EVTRORFU1TWpZMU5qQXpNREF4TkRJeU1USXpOVFE0TWpNMU9EWXlOVFF3TmpjNU9ERTVORGMyTlRZeE9EYzVOekEyTmpZeE5UazNNVEUwTVRBd09EQTRNVGs1T1RRME5ETXpPVGN6TURNME5EVTBOekF6TkRJeE5UQXhORFF6TnpjeU1EZzRPVGMwTVRFM09UUXlPREF3TmpZeE16QTVPRFl3TnpZNU5qazNOakExTWpZeE5UTXdNelEyTURFMU1qVTJNakF4T1RZeE9UWXpPVFU0TWpZNU1EVXlOalUyTnpFMk5UTTBNelUzTURjeE9UUXhOamM0TnpNd01UQTFPRGczTmpRMU1qazRNak0wTlRVNU16RTRPVGs1TkRrek5qazBNekF6TlRZMk9EUTRORFV4TXpNek1UQTBPVGcyTnpZNE16QTFNamMxTVRBM01ERXhNekk1TXpJeU5qUTBNek14SWwwc1d5SmhkbVZ5WVdkbGJXOXVkR3g1WW1Gc1lXNWpaV3hoYzNReE1tMXZiblJvY3lJc0lqRTNPVEE0TkRBNU1UUXlPREE1TVRReE1UY3pOVFUzTWpJMk5qUTJNREkxTXpNek5qRTFOalU1TnpJMk9USTRPRFU1TWpJM05URTRORFl5T1RVd09UYzRNakk0TkRVeU5ESTNOekUxT0RnNU9UTTFNVGcxTmpJME5EWTVOekV6TmpVMU5UWXhORGN4T1RrNU16UTBOemN3TXpVeU1ESTNOalEzTXpVd01qRTJNRFUxTWpBek1EazROREl5T0RjM01qTXlNRGMzTnpRMU9EWTROVEV5TkRFM05qTTNNemcyT1RVM01qVXlOVGcwTmpJeU1ETTRNVGMxTlRFek56YzNOakV5T1RnME1EY3lPREkyTVRnM01qTXhNVE14TXpBek5qSXlOalUyTnprMk1qZzRNVFE0T0RNeE16VXpPVEU0TlRJNE1qZzRNRFkyTVRRNE5UTXhNRGt5TkRZMk56RXlNemsyTXpnMk9UQXpNakEwT0RRM01qRXpOVFkwTkRRME5EWTRNVFV4TnpRNU5UazNOelExTWpBME56WTBNREE1TkRFeE9ETTJOVFl4TkRFek1Ua3lORGszT1RjMU56a3hOamswTmpRMU56RXpOamswT0RZM05qY3dNVEkwT0RjMk16UXlNekkyT0RreE5qQTJNekV5TkRnMk5UQXpNems0TURreE5USTROemsyTWpVMU1ESXdOVEExTnpNME56RTVOREkzTkRjNE1UUXdOVEU0TlRFd01UVTBOREUyTXpjMU5ERXdNVFkyTXpBd016YzVNRGczTnpRek5qSXdOek16TWpnMk5UQTNPVEkxT1RVeE1UZzFNRGMxTWpRM016VTJNalU0TURVNE9UYzBOakF3TmprM016QXhORFl3T0RBME5qRXhORE0wTXpFek56Z3pOakk0TVRJMk5ESXpNRE01TVRZeU1ESTJOREUwTkRnek16STRORGM0TWpRNE9URXpORFUzTVRBek5qQXlNRFV3TnpNMU16SXpOakF4TnpnMk16Z3dNREk0TkRrek5qWTJNak01TmpjMk5EQTJOekV3TXpneE5qZ3hNREEyTmpjMU9EYzVNekl4TnpFeU9UUTJNVGc0TXpJME56WXdPVE15T1RNMk1ERTVOalk0TnpJek1EZzNPVFU1TXpnek9UQXdOelV5T0RReU16UXhOVFV4T1RJMk56WXlORGMxTmpVNU1Ea3hOemN6TkRBNE1Ea2lYU3hiSW1sdWMzUnBkSFYwYVc5dWJtRnRaU0lzSWpJek5Ua3dOREkzTmpBek9EQXdOemd6TWprNE9UZzRPRFkyTnpRME1qY3hOelUyTURBNU5UYzNNakV3T0RBMU9UQTVNakk0T0RRM056UTFPVEV6TXprMk5USTJOVEF6TnpBd09EWTJNVGswTkRVM05EZ3pNekl5TlRVek16VXdORGs1TWpZME16TTBNek13TlRjeU56a3dPRE0wTXpZNU9USXhNalU0TnpVNU5qWXpNRFUwTlRjNU56UTRNamcxTURrME9EUXdOek15TlRBeU9ESXdNelF5TkRjMU56UTBNemN5TmpJNU9ESXpOelF6TWprd01USXdNREEwTVRJNU1UQXdNRGt5TnpFNU56YzFNekF5TkRnMU16WXlNekUxT1RFd01EVXpNamcyTlRZNE9EYzVPVFkzT0RFM05EVTNPREF6TmpjME9UUTFOalEwTlRRMk1UTTVNemd5T0Rrek5qazFNemMyTXpFek5EVTRNVFV5TXpVMk1EYzRNamt5T0RVeU1Ea3dOemcyT1RZMk1ESTNOelV5TXpBeE5EZzJOalUzTURBek1qZzNOREkyT0Rnd01qRTNOVEEyTmpRME1UZzBNREF5T0RVd09UVTFPVGMwTVRBNU56WTVPVGc0TmpBeE1EZ3pOak0zTkRRd01qZzFNekF3TnpJME1qVTRNRFUyTVRVNE1UUTBOekV5TVRNNU1EQXdOVGN5T0RjM09ERXpOVEU0TnpReU16RTFNalF5TURFek1qTTVOek13TkRZM05Ea3hPVGs0TURVM09EUXpPVFF3TnpZNU5EZzBOekl5T0RjNU5EQTBOamczT1RFNE5EQTFOVEE0TmpBNU1EWXdPRGN5TkRFNU9EWTRNak16TmpnMk1ESTNPRGMzTlRVM056QTVOell5TXpJNE5EZzBORFk0TXpjME9UY3dNRGMwT1RJeE9URTFOalU0TmpZME9UQXhPVGN6TWpVM09UWXpORGs0TkRnNE1EZ3hOemN3TURVM016STNOekU1TkRJd01EazBNakF3TWpZMU1EVTBORGN5TnpVd05UUTNPRGsxT0RnM05EQTNORGcwTWpJMk1qY3lNekExTlRZNE16YzJNVE0zT1RNNU1UTTNOVFkzT1RnME5UVTNNREU0TkRjeE5EZ3dPVEV5TURreU5qWXpNelEzTURJeU1qZzNPREF5TWpVNE9UUXhNRFE0TnpnNU1EZ3dOalk1TWpNaVhTeGJJbUZqWTI5MWJuUnVkVzFpWlhJaUxDSXhNelk1T1RFek56YzRPRFF5TWpReU1UUTBPRFl5TmpZMU56UTFOVE00TlRrd05EVXpNalV4TWpjNU1qazBOems1TXpJNE1UQTFNRGsxTXpnNE9EUTJOamd6TlRZME9ERTVNalU1TVRVME5qSTRNREkwTXpjek9EUTNOelkzTlRrM05UVXdORFF4T1Rrd05qQXpNREUwTXpNNU1qVTROemt4TkRFMk5qWTNPVEU0T0RJek1EUTVOelUzTkRjME9UZzRORGsyTVRneU5UQTNOelUyTURReE5UUTRNamt4TXprNE1UQXhOVE0yTXpneU5UWXhOemN3TkRJd016STFORFUzTWprM09ESTJNekk1TmpFMk56RTRNRGd5TkRFNE9URXpNVFk1T0RBNU5UVTFOalU0TkRjeE5UVXlOemd4TVRJNU5USTNPRFF6T0RNM016VXhOelEyTURjek1URXpNVFkyTURreE5UQXdOekV5T1RNMU1UWXlOVFUxTXpjek16YzNOemt5TkRjd01URXpPRFEwT0RRMk9UZzFOVGt6T1RBNE9URTNORGd6T0RZNE16RXhNRFkyTWpnNE1qTXdNVFV5TVRnNU16VTRNVFE1TWpNeE5qTXhOVEE0TlRNNE1UQXlNREF4TkRFeU16STVOalEyTnpBMU16ZzVOekF6TVRJeU9ERXhORFF4T1RVM01EUTNORGd6TmpNd09Ea3hNakV3TVRFMU16TTRPREUyTVRNNE9ERXdNVGMxTnpRMk9UazFNekl6TWpRM01UY3lNREU1TURJeE1qUTNOelk1T1RjNE5EQTBOakkzTXpFM09EY3lNamt3T1RJeU1qSXhOVGc0TURjM016RXhPRGN5TlRnMU1qUXlOall4T1RJNE16QTBOelF5TkRjeE5UQTVNRE13TXpNek5ERXdORFl5TXpJMk1qVXlOamt3TlRNeU1EUXpPVEk1T0RFd05UTXhPVE0zT0RNeU1qa3hOVGs0TWpVeU1EZ3dORFk0T1RFM05qQTVOemd5TlRFd05ERXhNalUyT1RRNU9EYzFORFV6TlRZeE9Ea3pNRFEwTkRNMU56WTFNell6TmpNd056azVORGN3TVRBME16UXhORFV6T1RnNE5UazROekV4TmpjNU5ERXdNVEkwTWpJeE5ETTVPRGM1TWpjeU16ZzRPVFU0T1RVMk1qTXlOelU0T1RFek16VTNNREF4TWpNek1EazBJbDBzV3lKMGIzUmhiSGRwZEdoeVlYZDNZV3h6SWl3aU1UWTFNems1TWpVeE1Ea3lPRGcxT1RNMk56ZzNNelV5TkRZMk1EQTVOamt3T0RJMU56RTJNakl4TkRJMU56TXpOakl3TmpjME5UUTVOVGcwTnpFd09USXdNREUwT0Rrd09UUTVOek0zTnpReU16QTNOalF3TXpBMU1EQTVOVEk0TnpFM09EY3hNRGc1TWpnNE5EUTRNRFF3TXpjNE1EZzRNakk1TURZd05URTRNemM1T0RNeE5UUTJOalU0TnpFMU5ETTRPRFExTlRJMU1EZ3hPVEV4TXpJeU5ETTBNemMwT1RVMU1UZzBOemszTkRRNU5UYzVNekE0TlRBeU5EQTJOREl6TkRJd09EZzJOVEkxT0RjNU1qWTNNVFExTWpVMU5EUTFNRFV3TVRJME16UTRNalF4TlRJeU5EQTFPRFEzTVRFMU5qVTFPRGN5TWpNM01ETTBOall6TWpNeU5qTTJNekF6TXpBMk1UVTROak0wTWpZeU1UQTNNVGcyTURnd01USTBNalE0TVRZNU5qVTRORGN6TURnME9ERXlNemczTmpFeE9Ua3hNek15TkRZek5UY3hPRGd6TkRrMk5UUTVPREkxTURVM09UY3pNVFExTXprNU5qQXlORGN5TVRFd056a3hPVGd3TmpRMk5qQXlPVEEzTURBeU5EZ3lNekkwTXpVNU1qVXdNalUxT0RnNU9EYzVORGM1TnpjeE5UZzNPVEF4TnpJMU5UQXlNRE14T0RrME1UUTNORGcyT0Rrek9UYzNPVEF6TkRBd09ETXhPREkzT1RVeU1EUTNPVFV3TkRBME9USXlNVEV3TlRJMk1qVXlPRGs1T0RBME56STNNamN4TURnNE9EVTJOekl4T1RNNE1ERXlOREl6TURRME1qSXdNVEEzTnpjM09UUTFOemMyT0Rnd09EYzNNRGd3T0RNMU16SXdOalV4TVRFMU1EQTJPRFEyTWpRd05qVXhNREUyTWpZM016UTNPVEF3TWpVeU9UY3dOamsyT1RrMU56QTFOVE01TVRVeE1EWXdNalEwT0RrM05UTTFNell5TWprek56RTVORFk1T0RVMU1ETTJPREF5TkRBNU5qTXpOekF6T1RBek1EWXdOVFkzTXprMU9UY3hNekUzTmpRMk5UVTFOVGM0T1RNd056TTBNall6TVRneE9UazBPRGMxTXpJM056RTJOakF6T0RJd05ERTJNelEzTVRReE5pSmRMRnNpYkdGemRHNWhiV1VpTENJeE1UUXhOekl5TmpReE16a3pOems0TWpneU5URTBNemd6T1RRME16Z3lNemcyTVRBd09EWXpNek0xTmpnd05UTTRNVEl5TXpRNE56Z3pNRFF3TWpRd016QTJNREUxTURBek5UZ3hOVGt4TVRZNE1UYzROakkwTmpVME56TTBOelE1TlRRM05EZ3hNRFkwTmpVNE1qY3lPREEyTVRFM05EQTRORFF3T1RFNU1EVXpPVEF3TkRRNE5UWTFOVE13TWpRMk9UQTFOVFV5TWpFMk9ETXpNekUwTWpVM056TTFPRFUwTnprMU5qY3dOREUxTVRneU1UYzJNalUxTVRBMU5EVTRNakE0TXpZME1qVTBOalExTVRrek16azJOamc0TlRrd05qZzFNREE0TlRBNE16STFOalF5TWpjeU1UYzVOemd3TWpJMU5qUXhNVFUwT0RJNU1EZzRNREl5T0RNek5ESTJOams1T1RFMU9UZzFNemc1TkRneE9UazROVEV5TURNME1UTTFPREU1TWpneE5ERTROVFV4TURJNE1EZzNOems1TVRVNE5USTJOemt5TXpNMU5qWXhORE15TVRFMU16QTFNREl5TXpZek5qVXhOemN6TkRnNU5qSXdNamcyTVRNeU16YzJOamd6T1RnME1qYzVOemszTkRJek56SXlOVE0xTlRBd09ETTVNRGs1TmprME16YzVOVEF3TnpBek9EWTVOemd4T1RNMU56UXpORE16TmpRM09UazJOVGszTVRnMk5ERXhPRFEzTURjNE16RTFOakEyTnpBM056YzBOVGsyT1RRNU1EZzFNREE1TVRJek9EZ3hNemswTVRnMk9EZzBPRGc0TkRNME5qSXhOekl4TlRBME1EYzRNalUwT1RrM056TXpOVFF4TURZd05UZzNOekV6TnpBNE56RTBORFk1TmpJNE1ETXpNamN3TnprNU1UQTFOems1Tmprd056QTROVFkzTnpnd05qRTNPRFkyTXpZM016TXdPRGN6TnpBeE1qQTNNRFV5TURZME56azJOREV3T1RBMk1UWTFOelUyTkRreU1qUTNPRGN5TmpJNE9URTRNakEwTURrNE9Ua3dPRE0wTlRJMk1ERTBOVGs1TWpFNU9UVTJOVEExTlRFM016UXpOelV3TkRZNE1URTNNalV6TXpVMk1UQTJOalUwTXpFek16VTRPRFV5TlRrNU16UTFOVEkyTnpVd0lsMHNXeUp6ZEdGMFpXMWxiblJ3WlhKcGIyUWlMQ0l5T1RBek1qVTVORFF4TWpFME5qa3hPREUwTnpVM09USXdPREkxTVRjd05qZ3hORGcxTVRJeE56UTFNakkyTmpJd05URTJPREl4TWpnMU9UTTJPRFF3TWpFMU5qZzFNVE15TnpNek16WXhNalUwT1RRME56YzVNRGcxTVRjM05qZ3lNalE1T0RrM09EUTJORGMxTkRnM056SXlNamsxT1RVMk1ETXpORE0yTlRFeE5EZzJORFF6T1Rjd05UQTBNamcyT1RjeU56TXpNelV6TlRZd01EWXpNRE13TWpFd05UVTNORGMwTnpVeU9EVXdOek0yTXpVNE5qRTBPVFUyT1RVeE5UTXpNVFkwT1RFM01EUTNPVFl6TXpnMU9USXpOalExT1RBM01qTTJNVEk0TURrMk5ESTJOREV5TXpnek16QTJNRFF3TmpnNU9UYzVPREU1TkRNNE56ZzRNVEUzTmpRMk1qUTVORFl5TlRVeE5UQTBNamN6TWpVMk1UWXpOalF5TVRRNU1qUXhOVE01TWpjMk16QTJOemMyTURRME5UVTJOekE0TkRFd01qVXdNREUxT0RNMk1ESXpORGcyTVRJd05Ua3dOamN6TVRJek1UZ3hOamd6TnpFd05ESTROek0yT0RreU9UWXlOREE0TkRrM056WTFOemd4TVRNNU16WTJPRFEwTVRrek1qTXdNVGd3T1RNNE9UUXhNalEyT1RZMU56azBNelkwTlRJNE9UQXhNamcyT0RrM09EYzJOemM0TWpNd09UUTVNRFE0TmpjNU56RXlOREl4T1RrNU5qTTJNRE15TXpNNE1URXhOalkwTmpJMU56VXdOVEU1TkRJeU5EVTJNRFV3TWpJME16TTNORE15T1RFM09UZzJNakl5TXpNeE1EZzJNVGcxT1RFMU9EVXlORE0wTmpZeE16RTVOVEUzT1RBeU5qWXhOemt3TnpVd05qWXpOREkwTnpFM056Z3lNakV3TVRRd05UVTBOemMxTWpNeE1EQTVOREkyTmpjeE5ETXdNekE0TmpJNE1UWXpNVFkxTVRRMU5EUXhPVGcyTURJME9EYzJOemN6T0RVMk5UVTNOVE15T1RZek5EZ3lNRFF6TXpBek9EQTVNRFF4TWpJeE1qVXlNemsxT0RreU1UWXlNVFEwTkRnd016RTBORGt6TVRVMk5qVTJOVEUwTURRMk5UQTFNelUzTWprd05qZzRORFlpWFN4YkltUnZZaUlzSWpFeE5Ea3hPRGN4T0RJNE56RXlNVFUyTmpJeU9URTJOakl3TnpZME5qa3lORGcwT0RJNU5ETXpOamt5TVRNM01EZzJPVE0yTlRBMU1ERTFPVGs1TnpnMU16Z3hPVGd3T0RnMU9ETXdORGcwTWprNU5ERXpOVEExT0RFME5qSTVOemswT1RRek1ERTRNVFU1T0RNeU16UTROak14T0RBeU9EUXlOVEV4TURZM01ESXpNekk1TnpjeE16SXdNVEV4TVRBek5qQTRPRFV4TlRFMk5qZ3pPVGd6T1RjeU9UTTJNRE16T1RBd05EVXdPRFk0TVRnMU9UTXpOalEwTnpRMU5ETXhNemt5TWpJNU5UUTBNREV4TmpNME16QTNNVGcwT1RrNU9Ea3pPVFV5T0RFeU1ERTNNakkxTURZd01UZ3dNVFkwTVRJMk1EWXpOalUyTmpBMk1EUTNOelF3TlRrMk5EZzROVFV6TkRrd01qY3dNakkzTmpBd01qUTFPRGN4TnpjM05USXlOelE0TWpRd05qVTVNVE0xTlRNME16ZzRPVEF5TVRZeU5URTRPVFF4TkRReE1qQTNPVGN4TXpNMU56UTVNRFF3TXpRM05UUTBOREF6TURBek9UUXhOemsxTWpZM05EazNOell6TVRJMU56QXlOakE0T1RVeU1EY3lNREE1TURJM01EYzJOekl5T0RRNE5UZzRNRGt5TVRjMU5EYzBNRGMxTVRBNE1EYzJNVFUzTURZNE1EQXlNalkyT0RreU1UTXpPVFE0TVRZMU9UYzBOakV6TnpnM05UUTBPREF5TnpBMU9ERXhPVGd4TVRZek1qRXhPVEUyTlRRMk56Y3pPREV4T1RrNE16ZzNOamczTURBM05ERXlNems1T0RFeU5qUTFPRFUxTnpFeE16STROVGcxTVRJNE16QTJOamd5TlRFMU1USXdNRFE0TlRnME1UQTNNakF4TmpZM01ETTJNRFU0TVRFd056ZzFPVFEyTXpBMU5qZ3hORE0zTVRBNE9USTNOVFl5T0RBeU1EUXhNekV5TnpnNE1UTXpNamc1TlRJeU16azBPRGt3TnpNM05qRTNNak15TnpjME16VXlPREV3TVRrd05URTRNRFUwT0RnMU1qY3dOVEV3TVRNNE5URTROamMwTlRnMU5qa3dOemc1TlRreE1qZzJPVGs1TURnNE1UVTRNVFUxTlRJNE5URTNNamMzTXpZaVhTeGJJbWxpWVc0aUxDSXhOREk1TlRFMU1EZzNOamM1TVRRek1qY3lOamt5TmpNd01qUTVNekV6TnpZd056SXhNall4TURRM056YzFOVEF3TWpZNU5ETTJOamMxTkRnek5UUTFOalF5TkRZNU5ESTNNek0zTnpBNE9ETTVPRFk0TVRJMU56ZzFOVGMxTXpjMk5qY3pOREUyTWpNd01USXpPREkzTlRJM056WTFNalUwT0RnME5qazNNVGMxTmpJME5UQXlOVGszTXpnMU5EY3lNVFV6TVRNNU9ESTRORE0xTURFMk5UVTVOekV4TnpJeE16RTRNRGczTlRZd05qVXdNRFV3TkRNNU56WXdPVEl5T1RJMU9USTJPVGs1TXprd05UY3hNREF6TmpVME5URTJPVEk1TURnek9UUTJORGt5TURZNU5qZzBPREU0T1RNd056TTNPRGd3TkRReE1qTXdPVFkwTmpJd05UazNOamd6TVRNMk16RTNOakV5TVRVeE9Ea3lOakl5TmpFNE9EYzJNemM0TXpJeE5EWXpOalV3TkRBd09EYzRNVEE0TlRreE5qazVNRE15TmpJd09ETTJNRFl6TlRjMk5UTTBOalkyT0Rjek9EazJOamd3TkRJME1qVXdOek00TWpnMk5qRXhPRGMwTmpRMU5ERXdOVFl5TmpJeU1Ua3pPRE13TWpJNU5UWXdOVGN4TnpVeE5Ua3hNemsxTXpVd09EUTBOakkxT0RFMU5UUTVOalU1TmprNU9ESXpPVFkxT0RRNU5UVXlNVFkzTkRNNE9UWTNNRGd6TWprMk1UZzVOREF5TnprMk9EZzVNVEk0TkRNek5UZzVOamMzTlRBeU1qQXlPRE16TWpJNE5URXlOVGswT0RBME16YzNPVGcxT0RjNE5qSXdPRFUxTmpjMU1UQXlORGcwTnpNeU1UVXhOVGszTnpjME56TTVORFkwTmpBM05qRTNORFU0T0RZMk1qRTJNRFl3TmpBM05ETTNPRFU0TVRNMU56ZzROVGMyTXpVMU5qa3dOREUyTWpneU16UTJPVFUyTURBMU9EQTBNRFl5TURFM01URTFNVEE0TmpjeU16azVPVE16TXprNU5UTTBNRFkxTkRnMU16a3lOVEExTmpFeE5UazNPREEwT1RNek5UUXpOalV5TmpVeE1EVTVNVGc0TlRJd05EZ3pNVFE0TVRRMk9EVTRPREF4T0RneE5UQTVNakkxTkRRME1UazVJbDFkZlN3aWJtOXVZMlVpT2lJNU1EVTROVGs0TURnNU16VXhORFUzTkRNMU5ERTJNVFFpZlE9PSJ9fV0sImNvbW1lbnQiOiJGaW5hbmNpYWwgU3RhdGVtZW50IiwiQHR5cGUiOiJkaWQ6c292OkJ6Q2JzTlloTXJqSGlxWkRUVUFTSGc7c3BlYy9pc3N1ZS1jcmVkZW50aWFsLzEuMC9vZmZlci1jcmVkZW50aWFsIiwiQGlkIjoiMTgwZmVhYTMtNDRhNy00MDc1LTkyYTQtMjY2Mjg2YWYzZWYzIiwifnRocmVhZCI6eyJ0aGlkIjoiM2ZkZDIwYzMtMGRjMi00ODk0LTlmMDYtY2MxYjA0ZGNhNmIyIn19",
      },
    },
  ],
  service: [
    {
      id: "DjxyimUZGNSXdMva38YF6g;indy",
      type: "IndyAgent",
      recipientKeys: ["7wm9PyK1XLLy86tebq2QU4YL5CDMUafKeQsj6XbfAVYs"],
      routingKeys: [
        "7wm9PyK1XLLy86tebq2QU4YL5CDMUafKeQsj6XbfAVYs",
        "3mo3P6XzDzBvuktCgDQarACzzeV7zxrSExnicpuH7t83",
      ],
      serviceEndpoint: "https://vas.evernym.com/agency/msg",
    },
  ],
  profileUrl: "https://i.postimg.cc/DyMxxQ25/Happy-Members-logo.png",
  public_did: "did:sov:PJPdgJuKKiEmwd8jgquw4S",
  id: "9Rp6Jk3-HwcjgSeug-QNeF6Wijb-AqmUTYYxW-mJNgc5k1BMKXPz2xLvqaSuwFapwLwHLzv8kzrj4uSbM8mtWfdfRZRG9dXtJuZsr57ZRFPzwLj7dGpaFff",
  type: "did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/out-of-band/1.0/invitation",
  handshake_protocols: ["did:sov:BzCbsNYhMrjHiqZDTUASHg;spec/connections/1.0"],
};

export {
  connectionsFix,
  connectionRequestData,
  connectionRequestPlaceholder,
  credentialRequestData,
};
