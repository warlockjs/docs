import { fileSize } from "@mongez/fs";
import { Random, ltrim } from "@mongez/reinforcements";
import { v } from "@warlock.js/seal";
import type { Request, Response, UploadedFile } from "../../../http";
import type { RequestHandler } from "../../../router";
import { uploadsPath } from "../../../utils";
import { Upload } from "../models/upload";
import { uploadFromUrl } from "../utils";
import { getUploadsDirectory } from "../utils/get-uploads-directory";

async function uploadFilesList(
  files: UploadedFile[],
  uploads: Upload[],
  baseDirectoryPath: string,
  isRandom: boolean,
  compress: boolean,
) {
  const addFile = async (file: UploadedFile) => {
    const hash = Random.string(64);
    const fileDirectoryPath = baseDirectoryPath + "/" + hash;

    const fileName = file.name;
    const filePath = isRandom
      ? await file.save(fileDirectoryPath)
      : await file.saveAs(fileDirectoryPath, fileName); // relative to uploadsPath

    const fileData: any = {
      name: file.name,
      fileHash: file.hash,
      hash: hash,
      path: ltrim(filePath, "/"),
      directory: fileDirectoryPath,
      size: fileSize(uploadsPath(filePath)),
      mimeType: file.mimeType,
      extension: file.extension,
      compress,
    };

    if (file.isImage) {
      const { width, height } = await file.dimensions();
      fileData.width = width;
      fileData.height = height;
    }

    const upload = new Upload(fileData);

    await upload.save();

    uploads.push(upload);

    return upload;
  };

  if (Array.isArray(files)) {
    await Promise.all(files.map(addFile));
  } else {
    await addFile(files as UploadedFile);
  }
}

async function uploadFromUrlsList(
  urls: string[],
  uploads: Upload[],
  baseDirectoryPath: string,
) {
  await Promise.all(
    urls.map(async url => {
      const upload = await uploadFromUrl(url, baseDirectoryPath);

      uploads.push(upload);
    }),
  );
}

export const uploadFiles: RequestHandler = async (
  request: Request,
  response: Response,
) => {
  const { urls, directory, isRandom, compress } = request.validated();

  const files = request.files("uploads");

  const uploads: Upload[] = [];
  const baseDirectoryPath = await getUploadsDirectory(directory);

  if (urls) {
    await uploadFromUrlsList(urls, uploads, baseDirectoryPath);
  }

  if (files) {
    await uploadFilesList(
      files,
      uploads,
      baseDirectoryPath,
      isRandom,
      compress,
    );
  }

  return response.success({
    uploads,
  });
};

uploadFiles.validation = {
  schema: v.object({
    uploads: v.array(v.file()).requiredWithout("urls"),
    urls: v.array(v.string().url()).requiredWithout("uploads"),
    directory: v.string(),
    random: v.boolean(),
    compress: v.boolean().default(true),
  }),
};
