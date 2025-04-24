const shouldMaskSecret = () => {
  const env = process.env.MASK_SECRET;
  const nodeEnv = process.env.NODE_ENV;
  // Override masking with MASK_SECRET if provided
  if (env) {
    if (env.toLowerCase() === 'true') {
      return true;
    } else {
      return false;
    }
  }

  // Default behavior: no masking in development, mask in other environments
  return nodeEnv !== 'development';
};

export const GLOBAL_ENV = {
  MASK_SECRET: shouldMaskSecret(),
};
