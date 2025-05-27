import { getPortPromise } from 'portfinder';

export const findFreePort = async (): Promise<number> => {
  return getPortPromise();
};
