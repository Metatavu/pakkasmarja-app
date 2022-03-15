import { v4 as uuid } from "uuid";
import RNFetchBlob from "rn-fetch-blob";

/**
 * Interface describing file upload response
 */
export interface FileResponse {
  url: string
}

/**
 * Interface for image base64 response
 */
export interface ImageBase64Response {
  data: string;
}

/**
 * File service
 */
export class FileService {

  private token: string;
  private basePath: string;

  /**
   * Constructor
   *
   * @param basePath basePath
   * @param token token
   */
  constructor(basePath: string, token: string) {
    this.token = token;
    this.basePath = basePath;
  }

  /**
   * Handles file upload
   *
   * @param fileUri uri to find the file to upload
   * @param contentType file content type
   */
  public uploadFile = async (fileUri: string, contentType: string): Promise<FileResponse> => {
    const data = new FormData();

    data.append("file", {
      uri: fileUri,
      type: contentType,
      name: `${uuid()}${this.getFileExtension(contentType)}`
    });

    try {
      const result = await fetch(`${this.basePath}/upload`, {
        headers: {
          "Authorization": `Bearer ${this.token}`
        },
        method: "POST",
        body: data
      });

      return await result.json();
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  /**
 * Resolves file extension
 *
 * @param contentType content type
 */
  private getFileExtension = (contentType: string) => {
    switch (contentType) {
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "image/png":
        return ".png";
      default:
        return "";
    }
  };

  /**
   * Get image
   *
   * @param url file url
   *
   */
  public getFile = async (url: string): Promise<string> => {
    try {
      const result = await RNFetchBlob.fetch("GET", url, {
        Authorization: `Bearer ${this.token}`
      });

      const status = result.info().status;

      if (status !== 200) {
        throw Error(`File download failed with status ${status}`);
      }

      return await result.base64();
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }
}
