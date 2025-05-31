import type { Request, Response } from "@warlock.js/core";
import { generateGuestToken } from "../services/generate-guest-token";

export async function guestLogin(_request: Request, response: Response) {
  return response.send({
    user: await generateGuestToken(),
  });
}
