import { AppAction } from '../actions';
import { StoreState, DeliveriesState } from '../types';
import { ACCESS_TOKEN_UPDATE, DELIVERIES_LOADED, PRODUCTS_LOADED, ITEM_GROUP_CATEGORY_UPDATE } from '../constants';
import {  Product, ItemGroupCategory } from 'pakkasmarja-client';

export function reducer(storeState: StoreState, action: AppAction): StoreState {
  switch (action.type) {
    case ACCESS_TOKEN_UPDATE:
      const accessToken = action.accessToken;
      return {...storeState, accessToken: accessToken };
    case DELIVERIES_LOADED:
      const deliveries: DeliveriesState = action.deliveries;
      return {...storeState, deliveries: deliveries};
    case PRODUCTS_LOADED:
      const products: Product[] = action.products;
      return {...storeState, products: products};
    case ITEM_GROUP_CATEGORY_UPDATE:
      const itemGroupCategory: ItemGroupCategory = action.itemGroupCategory;
      return {...storeState, itemGroupCategory: itemGroupCategory};
  }

  return storeState;
}