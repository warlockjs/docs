import { fileExistsAsync } from "@mongez/fs";
import {
  uploadsPath,
  type Request,
  type RequestHandler,
  type Response,
} from "@warlock.js/core";

export const downloadFileHandler: RequestHandler = async (
  request: Request,
  response: Response,
) => {
  const path = uploadsPath(request.input("*"));

  if (!(await fileExistsAsync(path))) {
    return response.notFound({
      error: "File not found",
    });
  }

  return response.download(path);
};

downloadFileHandler.description = "Download File From Uploads Directory";
