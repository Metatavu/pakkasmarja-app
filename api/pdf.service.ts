import RNFetchBlob from 'rn-fetch-blob';
import { REACT_APP_API_URL } from 'react-native-dotenv';

export class PDFService {

  private token: string;
  private basePath: string;

  constructor(basePath: string, token: string) {
    this.token = token;
    this.basePath = basePath;
  }


  /**
   * 
   * @summary Find pdf
   * @param token token
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