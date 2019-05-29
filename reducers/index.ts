import { AppAction } from '../actions';
import { StoreState, DeliveriesState } from '../types';
import { ACCESS_TOKEN_UPDATE, DELIVERIES_LOADED, ITEM_GROUP_CATEGORY_UPDATE, UNREADS_UPDATE, UNREAD_REMOVED } from '../constants';
import { ItemGroupCategory } from 'pakkasmarja-client';

export function reducer(storeState: StoreState, action: AppAction): StoreState {
  switch (action.type) {
    case ACCESS_TOKEN_UPDATE:
      const accessToken = action.accessToken;
      return {...storeState, accessToken: accessToken };
    case DELIVERIES_LOADED:
      const deliveries: DeliveriesState = action.deliveries;
      return {...storeState, deliveries: deliveries};
    case ITEM_GROUP_CATEGORY_UPDATE:
      const itemGroupCategory: ItemGroupCategory = action.itemGroupCategory;
      return {...storeState, itemGroupCategory: itemGroupCategory};
    case UNREADS_UPDATE:
      return { ...storeState, unreads: action.unreads }
    case UNREAD_REMOVED:
      return { ...storeState, unreads: storeState.unreads.filter((unread) => unread.id !== action.unread.id )};
  }

  return storeState;
}