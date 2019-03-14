
import Api from "../node_modules/pakkasmarja-client";
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
  public getContractsService(token: string) {
    return this.getApi().getContractsService(token);
  }

  /**
   * Returns contacts service
   * 
   * @param token token
   */
  public getContactsService(token: string) {
    return this.getApi().getContactsService(token);
  }

  /**
   * Returns contacts service
   * 
   * @param token token
   */
  public getItemGroupsService(token: string) {
    return this.getApi().getItemGroupsService(token);
  }

  /**
   * Returns delivery places service
   * 
   * @param token token
   */
  public getDeliveryPlacesService(token: string) {
    return this.getApi().getDeliveryPlacesService(token);
  }
  
  /**
   * Returns news article service
   * 
   * @param token token
   * 
   * @return News article service
   */
  public getNewsArticlesService(token: string) {
    return this.getApi().getNewsArticlesService(token);
  }

   /**
   * Returns sign authentication services service
   * 
   * @param token token
   */
  public getSignAuthenticationServicesService(token: string) {
    return this.getApi().getSignAuthenticationServicesService(token);
  }

  /**
   * Get pdf service
   * @param token token
   * @param basePath basePath
   */
  public getPdfService(token: string) {
    return new PDFService(this.basePath, token);
  }
  
}
