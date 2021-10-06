import Api from "pakkasmarja-client";
import { PDFService } from "./pdf.service";
import { REACT_APP_API_URL } from 'react-native-dotenv';
import { FileService } from "./file.service";
export * from './pdf.service';

/**
 * Wrapper for api client
 */
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
   * Returns week prediction service
   * 
   * @param token token
   * 
   * @return News article service
   */
  public getWeekDeliveryPredictionsService(token: string) {
    return this.getApi().getWeekDeliveryPredictionsService(token);
  }

  /**
   * Get deliveries service
   * 
   * @param token token
   * @return Deliveries service
   */
  public getDeliveriesService(token: string) {
    return this.getApi().getDeliveriesService(token);
  }

  /**
   * Get delivery loans service
   * 
   * @param token token
   * @return Delivery loans service
   */
  public getDeliveryLoansService(token: string) {
    return this.getApi().getDeliveryLoansService(token);
  }

  /**
   * Get deliveries service
   * 
   * @param token token
   * @return Deliveriy qualities service
   */
  public getDeliveryQualitiesService(token: string) {
    return this.getApi().getDeliveryQualitiesService(token);
  }

  /**
   * Get products service
   * 
   * @param token token
   * @return Products service
   */
  public getProductsService(token: string) {
    return this.getApi().getProductsService(token);
  }

  /**
   * Get product prices service
   * 
   * @param token token
   * @return Product prices service
   */
  public getProductPricesService(token: string) {
    return this.getApi().getProductPricesService(token);
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
   * Returns chat groups service
   * 
   * @param token token
   */
  public getChatGroupsService(token: string) {
    return this.getApi().getChatGroupsService(token);
  }

  /**
   * Returns chat threads service
   * 
   * @param token token
   */
  public getChatThreadsService(token: string) {
    return this.getApi().getChatThreadsService(token);
  }

  /**
   * Returns chat messages service
   * 
   * @param token token
   */
  public getChatMessagesService(token: string) {
    return this.getApi().getChatMessagesService(token);
  }

  /**
   * Returns unreads service
   * 
   * @param token token
   */
  public getUnreadsService(token: string) {
    return this.getApi().getUnreadsService(token);
  }

  /**
   * Get pdf service
   * @param token token
   * @param basePath basePath
   */
  public getPdfService(token: string) {
    return new PDFService(this.basePath, token);
  }

  /**
   * Get file service
   * @param token token
   * @param basePath basePath
   */
  public getFileService(token: string) {
    return new FileService(REACT_APP_API_URL, token);
  }

  /**
   * Get shared files service
   * @param token token
   */
  public getSharedFilesService(token: string) {
    return this.getApi().getSharedFilesService(token);
  }
  
}
