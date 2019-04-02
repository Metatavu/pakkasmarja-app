import uuid from "uuid";

/**
 * Interface describing file upload response
 */
export interface FileResponse {
  url: string
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
  
}
