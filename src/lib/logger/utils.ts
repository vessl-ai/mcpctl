import { GLOBAL_CONSTANTS } from "../constants";
import { GLOBAL_ENV } from "../env";

export function maskSecret(message: string): string {
  if (
    GLOBAL_ENV.MASK_SECRET &&
    message.includes(GLOBAL_CONSTANTS.SECRET_TAG_START) &&
    message.includes(GLOBAL_CONSTANTS.SECRET_TAG_END)
  ) {
    return message.replace(
      new RegExp(
        `${GLOBAL_CONSTANTS.SECRET_TAG_START}.*?${GLOBAL_CONSTANTS.SECRET_TAG_END}`,
        "g"
      ),
      GLOBAL_CONSTANTS.SECRET_MASK
    );
  } else {
    return message.replace(
      new RegExp(
        `${GLOBAL_CONSTANTS.SECRET_TAG_START}|${GLOBAL_CONSTANTS.SECRET_TAG_END}`,
        "g"
      ),
      ""
    );
  }
}
