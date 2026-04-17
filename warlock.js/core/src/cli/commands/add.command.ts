import { addCommandAction } from "../../generations/add-command.action";
import { command } from "../cli-command";

export const addCommand = command({
  name: "add <features...>",
  description: "Add new feature(s) to the project",
  action: addCommandAction,
  options: [
    {
      text: "--package-manager -pm",
      description: "Package manager to use, if not passed, it will be detected automatically",
    },
    {
      text: "--list, -l",
      description: "List available features",
    },
  ],
});
