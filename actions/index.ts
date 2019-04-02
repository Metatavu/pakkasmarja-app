import * as constants from '../constants';
import { AccessToken, DeliveriesState } from '../types';
import { ItemGroupCategory } from 'pakkasmarja-client';


/**
 * Access token update data
 */
export interface AccessTokenUpdate {
  type: constants.ACCESS_TOKEN_UPDATE,
  accessToken: AccessToken
}

/**
 * Item group category update data
 */
export interface ItemGroupCategoryUpdate {
  type: constants.ITEM_GROUP_CATEGORY_UPDATE,
  itemGroupCategory: ItemGroupCategory
}

/**
 * Deliveries loaded
 */
export interface DeliveriesLoaded {
  type: constants.DELIVERIES_LOADED,
  deliveries: DeliveriesState
}

/**
 * Actions
 */
export type AppAction =  AccessTokenUpdate | DeliveriesLoaded | ItemGroupCategoryUpdate;

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
export function deliveriesLoaded(deliveries: DeliveriesState): DeliveriesLoaded {
  return {
    type: constants.DELIVERIES_LOADED,
    deliveries: deliveries
  }
}

/**
 * Store method for item group category
 * 
 * @param itemGroupCategory itemGroupCategory
 */
export function itemGroupCategoryUpdate(itemGroupCategory: ItemGroupCategory): ItemGroupCategoryUpdate {
  return {
    type: constants.ITEM_GROUP_CATEGORY_UPDATE,
    itemGroupCategory: itemGroupCategory
  }
}