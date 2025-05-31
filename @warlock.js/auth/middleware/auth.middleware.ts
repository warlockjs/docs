import config from "@mongez/config";
import type { Middleware, Request, Response } from "@warlock.js/core";
import { log } from "@warlock.js/logger";
import { AccessToken } from "../models/access-token";
import { jwt } from "../services/jwt";

export function authMiddleware(allowedUserType?: string | string[]) {
  const allowedTypes = !allowedUserType
    ? []
    : Array.isArray(allowedUserType)
      ? allowedUserType
      : [allowedUserType];

  const auth: Middleware = async (request: Request, response: Response) => {
    try {
      const authorizationValue = request.authorizationValue;

      if (!allowedTypes.length && !authorizationValue) return;

      if (!authorizationValue) {
        return response.unauthorized({
          // TODO: translate this message
          error: "Unauthorized: Access Token is missing",
        });
      }

      // get current user jwt
      const user = await jwt.verify(authorizationValue);

      // use our own jwt verify to verify the token
      const accessToken = await AccessToken.first({
        token: authorizationValue,
      });

      if (!accessToken) {
        return response.unauthorized({
          // TODO: translate this message
          error: "Unauthorized: Invalid Access Token",
        });
      }

      // now, we need to get an instance of user using its corresponding model
      const userType = user.userType || accessToken.get("userType");

      // check if the user type is allowed
      if (allowedTypes.length && !allowedTypes.includes(userType)) {
        return response.unauthorized({
          // TODO: translate this message
          error: "You are not allowed to access this resource",
        });
      }

      // get user model class
      const UserModel = config.get(`auth.userType.${userType}`);

      if (!UserModel) {
        // TODO: translate this message
        throw new Error(`User type ${userType} is unknown type.`);
      }

      // get user model instance
      const currentUser = await UserModel.find(user.id);

      if (!currentUser) {
        accessToken.destroy();
        return response.unauthorized({
          // TODO: translate this message
          error: "Unauthorized: Invalid Access Token",
        });
      }

      // update last access
      accessToken.silentSaving({
        lastAccess: new Date(),
      });

      // set current user
      request.user = currentUser;
    } catch (err: any) {
      log.error("http", "auth", err);

      // unset current user
      request.clearCurrentUser();

      return response.unauthorized({
        // TODO: translate this message
        error: "Unauthorized: Invalid Access Token",
      });
    }
  };

  if (allowedUserType) {
    const userAccessTokenKey = `${allowedUserType}AccessToken`;
    const userAccessTokenKeyNameHeader = `${allowedUserType}AccessTokenHeader`;
    auth.postman = {
      onCollectingVariables(variables) {
        if (
          variables.find(
            variable => variable.key === userAccessTokenKeyNameHeader,
          )
        )
          return;

        variables.push({
          key: userAccessTokenKey,
          value: "YOUR_TOKEN_HERE",
        });

        variables.push({
          key: userAccessTokenKeyNameHeader,
          value: `Bearer {{${userAccessTokenKey}}}`,
        });
      },
      onAddingRequest({ request }) {
        request.header.push({
          key: "Authorization",
          value: `{{${userAccessTokenKeyNameHeader}}}`,
        });
      },
    };
  }

  return auth;
}
