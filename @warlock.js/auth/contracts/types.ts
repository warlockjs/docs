import { type Algorithm } from "fast-jwt";
import type { Auth } from "../models/auth";

export type AuthConfigurations = {
  /**
   * Define all user types
   * This is important to differentiate between user types when validating and generating tokens
   */
  userType: {
    [userType: string]: typeof Auth;
  };
  /**
   * JWT configurations
   */
  jwt: {
    secret: string;
    algorithm?: Algorithm;
    refresh?: {
      secret?: string;
      expiresIn?: number | string;
    };
  };
  /**
   * Password configurations
   */
  password?: {
    /**
     * Password salt
     * The higher the salt, the more secure the password is
     * But, it will take more time to generate the password
     * @default 12
     */
    salt?: number;
  };
};
