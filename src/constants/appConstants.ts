const MNEMONIC_FIFTEEN_WORDS = 15;
const MNEMONIC_TWENTYFOUR_WORDS = 24;
const FIFTEEN_WORDS_BIT_LENGTH = 160;
const TWENTYFOUR_WORDS_BIT_LENGTH = 256;
const DISPLAY_NAME_LENGTH = 32;
const GENERATE_SEED_PHRASE_STATE = {
  type: {
    onboarding: "onboarding",
    additional: "additional",
    restore: "restore",
  },
};

export {
  MNEMONIC_FIFTEEN_WORDS,
  MNEMONIC_TWENTYFOUR_WORDS,
  FIFTEEN_WORDS_BIT_LENGTH,
  TWENTYFOUR_WORDS_BIT_LENGTH,
  DISPLAY_NAME_LENGTH,
  GENERATE_SEED_PHRASE_STATE,
};
