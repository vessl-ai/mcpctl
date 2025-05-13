const shouldMaskSecret = () => {
  const env = process.env.MASK_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  // Override masking with MASK_SECRET if provided
  if (env) {
    if (env.toLowerCase() === "true") {
      return true;
    } else {
      return false;
    }
  }

  // Default behavior: no masking in development, mask in other environments
  return nodeEnv !== "development";
};

export const Secret = {
  MASK_SECRET: shouldMaskSecret(),
  SECRET_MASK: "********",
  SECRET_TAG_START: "<secret>",
  SECRET_TAG_END: "</secret>",
  SECRET_STORE: {
    SERVICE_NAME: "mcpctl",
    SHARED_PROFILE: "__shared__",
    NAMESPACE: {
      ROOT: "mcpctl.secrets",
      SHARED: "shared",
      PROFILE: "profile",
    },
  },
};
