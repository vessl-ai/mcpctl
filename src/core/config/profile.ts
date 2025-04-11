type ProfileConfig = {
  // Profile config
  // ...
  currentActiveProfile: string;
  allProfiles: string[];
};

const defaultProfileConfig: ProfileConfig = {
  // Profile config
  // ...
  currentActiveProfile: "default",
  allProfiles: ["default"],
};

export {
  defaultProfileConfig, ProfileConfig
};

