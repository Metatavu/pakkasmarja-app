import { AppAction } from '../actions';
import { StoreState } from '../types';
import { ACCESS_TOKEN_UPDATE, DELIVERIES_LOADED, PRODUCTS_LOADED } from '../constants';
import { Delivery, Product } from 'pakkasmarja-client';

export function reducer(storeState: StoreState, action: AppAction): StoreState {
  switch (action.type) {
    case ACCESS_TOKEN_UPDATE:
      const accessToken = action.accessToken;
      return {...storeState, accessToken: accessToken };
    case DELIVERIES_LOADED:
      const deliveries: Delivery[] = action.deliveries;
      return {...storeState, deliveries: deliveries};
    case PRODUCTS_LOADED:
      const products: Product[] = action.products;
      return {...storeState, products: products};
  }

  return storeState;
}