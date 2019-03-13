
import Api from "pakkasmarja-client";
import { PDFService } from "./pdf.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
export * from './pdf.service';

export default class PakkasmarjaApi {

  private basePath: string;

  /**
   * Constructor
   * 
   * @param basePath base path
   */
  constructor(basePath?: string) {
    this.basePath = basePath ? basePath : `${REACT_APP_API_URL}/rest/v1`;
  }

  private getApi() {
    Api.configure(this.basePath);
    return Api;
  }

  /**
   * Returns contracts service
   * 
   * @param token token
   */
  getContractsService(token: string) {
    return this.getApi().getContractsService(token);
  }

  /**
   * Returns contacts service
   * 
   * @param token token
   */
  getContactsService(token: string) {
    return this.getApi().getContactsService(token);
  }

  /**
   * Returns contacts service
   * 
   * @param token token
   */
  getItemGroupsService(token: string) {
    return this.getApi().getItemGroupsService(token);
  }

  /**
   * Returns delivery places service
   * 
   * @param token token
   */
  getDeliveryPlacesService(token: string) {
    return this.getApi().getDeliveryPlacesService(token);
  }

   /**
   * Returns sign authentication services service
   * 
   * @param token token
   */
  getSignAuthenticationServicesService(token: string) {
    return this.getApi().getSignAuthenticationServicesService(token);
  }

  /**
   * Get pdf service
   * @param token token
   * @param basePath basePath
   */
  getPdfService(token: string) {
    return new PDFService(this.basePath, token);
  }
  
}
