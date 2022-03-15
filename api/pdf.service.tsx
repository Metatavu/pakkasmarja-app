import RNFetchBlob from 'rn-fetch-blob';

/**
 * Pdf service
 */
export class PDFService {

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
   * Find pdf
   *
   * @summary Find pdf
   * @param id id
   * @param type type
  */
  public findPdf(id: string, type: string, fileName: string) {
    const dirs = RNFetchBlob.fs.dirs;
    try {
      const url = `${this.basePath}/rest/v1/contracts/${id}/documents/${type}?format=PDF`;
      return RNFetchBlob
        .config({
          path : `${dirs.DCIMDir}/${fileName}`
        })
        .fetch('GET', url, {
          'Authorization': `Bearer ${this.token}`
        })
        .then(async (res: any) => {
          return res.path();
        })
    } catch (error) {
      console.warn(error);
      Promise.reject();
    }
  }

}