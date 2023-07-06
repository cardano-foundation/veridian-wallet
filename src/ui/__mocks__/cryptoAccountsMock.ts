import { CryptoAccountProps } from "../pages/Crypto/Crypto.types";
import CardanoLogo from "../assets/images/CardanoLogo.jpg";

const cryptoAccountsMock: CryptoAccountProps[] = [
  {
    address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
    name: "Test wallet 1",
    blockchain: "Cardano",
    currency: "ADA",
    logo: CardanoLogo,
    balance: {
      main: {
        nativeBalance: 3678.05563949,
        usdBalance: 1012.0,
      },
      reward: {
        nativeBalance: 52.8638809,
        usdBalance: 15.45,
      },
    },
    usesIdentitySeedPhrase: false,
    assets: [
      {
        name: "ADA",
        logo: CardanoLogo,
        balance: 1000.0,
        currentPrice: 0.36,
        performance: -2.94,
      },
      {
        name: "Snek",
        logo: CardanoLogo,
        balance: 10,
        currentPrice: 0.0012,
        performance: -8.13,
      },
      {
        name: "Aada DAO Token",
        logo: CardanoLogo,
        balance: 1.0,
        currentPrice: 1.92367,
        performance: +169.9,
      },
      {
        name: "HOSKY Token",
        logo: CardanoLogo,
        balance: 1,
        currentPrice: 0.039821,
        performance: -1.54,
      },
    ],
    transactions: [
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "send",
        timestamp: "2023-07-05T14:48:00.000Z",
        amount: 30.0,
        currency: "ADA",
        status: "pending",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "send",
        timestamp: "2023-05-04T04:16:00.000Z",
        amount: 100.0,
        currency: "ADA",
        status: "confirmed",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "receive",
        timestamp: "2023-06-02T12:03:00.000Z",
        amount: 15.0,
        currency: "ADA",
        status: "confirmed",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "receive",
        timestamp: "2023-03-27T10:30:00.000Z",
        amount: 120.0,
        currency: "ADA",
        status: "confirmed",
      },
    ],
  },
  {
    address: "stake1u9eauga0y2das8xvmmptq4kqdzvqjdmc6e357qplyrpatfgu2w47a",
    name: "Test wallet 2",
    blockchain: "Cardano",
    currency: "ADA",
    logo: CardanoLogo,
    balance: {
      main: {
        nativeBalance: 47526.01302044,
        usdBalance: 13000.0,
      },
      reward: {
        nativeBalance: 362.04059792,
        usdBalance: 105.81,
      },
    },
    usesIdentitySeedPhrase: false,
    assets: [
      {
        name: "ADA",
        logo: CardanoLogo,
        balance: 1000.0,
        currentPrice: 0.36,
        performance: -2.94,
      },
      {
        name: "Snek",
        logo: CardanoLogo,
        balance: 10,
        currentPrice: 0.0012,
        performance: -8.13,
      },
      {
        name: "Aada DAO Token",
        logo: CardanoLogo,
        balance: 1.0,
        currentPrice: 1.92367,
        performance: +169.9,
      },
      {
        name: "HOSKY Token",
        logo: CardanoLogo,
        balance: 1,
        currentPrice: 0.039821,
        performance: -1.54,
      },
    ],
    transactions: [
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "send",
        timestamp: "2023-07-05T14:48:00.000Z",
        amount: 30.0,
        currency: "ADA",
        status: "pending",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "send",
        timestamp: "2023-05-04T04:16:00.000Z",
        amount: 100.0,
        currency: "ADA",
        status: "confirmed",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "receive",
        timestamp: "2023-06-02T12:03:00.000Z",
        amount: 15.0,
        currency: "ADA",
        status: "confirmed",
      },
      {
        address: "stake1u9f9v0z5zzlldgx58n8tklphu8mf7h4jvp2j2gddluemnssjfnkzz",
        type: "assets",
        operation: "receive",
        timestamp: "2023-03-27T10:30:00.000Z",
        amount: 120.0,
        currency: "ADA",
        status: "confirmed",
      },
    ],
  },
];

export { cryptoAccountsMock };
