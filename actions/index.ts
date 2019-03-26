import * as constants from '../constants';
import { AccessToken } from '../types';
import { Delivery, Product } from 'pakkasmarja-client';


/**
 * Access token update data
 */
export interface AccessTokenUpdate {
  type: constants.ACCESS_TOKEN_UPDATE,
  accessToken: AccessToken
}

/**
 * Deliveries loaded
 */
export interface DeliveriesLoaded {
  type: constants.DELIVERIES_LOADED,
  deliveries: Delivery[]
}

/**
 * Products loaded
 */
export interface ProductsLoaded {
  type: constants.PRODUCTS_LOADED,
  products: Product[]
}

/**
 * Actions
 */
export type AppAction =  AccessTokenUpdate | DeliveriesLoaded | ProductsLoaded;

/**
 * Store update method for access token
 * 
 * @param accessToken access token
 */
export function accessTokenUpdate(accessToken: AccessToken): AccessTokenUpdate {
  return {
    type: constants.ACCESS_TOKEN_UPDATE,
    accessToken: accessToken
  }
}

/**
 * Store method for deliveries
 * 
 * @param deliveries deliveries
 */
export function deliveriesLoaded(deliveries: Delivery[]): DeliveriesLoaded {
  return {
    type: constants.DELIVERIES_LOADED,
    deliveries: deliveries
  }
}

/**
 * Store method for products
 * 
 * @param deliveries deliveries
 */
export function productsLoaded(products: Product[]): ProductsLoaded {
  return {
    type: constants.PRODUCTS_LOADED,
    products: products
  }
}