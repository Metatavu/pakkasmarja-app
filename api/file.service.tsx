import uuid from "uuid";
import RNFetchBlob from 'rn-fetch-blob';

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
  public uploadFile(fileUri: string, contentType: string): Promise<FileResponse> {
    const extension = this.getFileExtension(contentType);

    const fileData = {
      uri: fileUri,
      type: contentType,
      name: `${uuid()}${extension}`
    };

    const data = new FormData();
    data.append("file", fileData);

    return fetch(`${this.basePath}/upload`, {
      headers: {
        "Authorization": `Bearer ${this.token}`
      },
      method: "POST",
      body: data
    })
      .then((res) => { return res.json() })
      .catch((err) => { console.log(err) });
  }

  /**
 * Resolves file extension
 * 
 * @param contentType content type
 */
  private getFileExtension(contentType: string) {
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
  public async getFile(url: string): Promise<string> {
    return RNFetchBlob.fetch('GET', url, {
      Authorization: `Bearer ${this.token}`
    })
      .then((res: any) => {
        const status = res.info().status;
        if (status == 200) {
          const base64Str = res.base64()
          return base64Str;
        }
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
