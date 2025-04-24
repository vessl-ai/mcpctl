// Secret Store 관련 상수
export const SECRET_STORE = {
  SERVICE_NAME: 'mcpctl',
  SHARED_PROFILE: '__shared__',
  NAMESPACE: {
    ROOT: 'mcpctl.secrets',
    SHARED: 'shared',
    PROFILE: 'profile',
  },
} as const;
