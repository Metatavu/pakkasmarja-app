import RNFetchBlob from 'rn-fetch-blob';

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
   * 
   * @summary Find pdf
   * @param id id
   * @param type type
  */
  public findPdf(id:string, type:string) {
    let dirs = RNFetchBlob.fs.dirs;
    try {
      const url = `${this.basePath}/rest/v1/contracts/${id}/documents/${type}?format=PDF`;
      return RNFetchBlob
        .config({
          path : dirs.DCIMDir + '/path-to-file.pdf'
        })
        .fetch('GET', url, {
          'Authorization': `Bearer ${this.token}`
        })
        .then(async (res: any) => {
          return res.path();
        })
    } catch (e) {
      console.log(e);
      Promise.reject();
    }
  }

}