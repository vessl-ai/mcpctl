import { Argument, Command } from "commander";
import { App } from "../../app";


const buildProfileCreateCommand = (app: App): Command => {
  const profileCreateCommand = new Command("create")
    .description("Create a new profile")
    .addArgument(new Argument("name"))
  
  profileCreateCommand.action(async (name) => {
    app.getProfileService().createProfile(name);
    console.log(`✨ Profile '${name}' created successfully!`);
  });


  return profileCreateCommand;
}

export { buildProfileCreateCommand };
