export const normalizeSecretKey = (key: string) => {
  let ref = key.toLowerCase();
  ref = ref.replace(/[^a-z0-9]/g, "-");
  return ref;
};
