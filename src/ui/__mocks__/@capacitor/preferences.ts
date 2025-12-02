export const Preferences = {
  async get(_data: { key: string }): Promise<{ value: string | undefined }> {
    return { value: undefined };
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async set(_data: { key: string; value: string }): Promise<void> {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async remove(): Promise<void> {},
};
