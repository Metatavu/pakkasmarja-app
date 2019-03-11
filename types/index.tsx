
export interface StoreState {
  accessToken?: AccessToken,
}

export interface AuthConfig {
  url: string
  realmId: string
  clientId: string
  username: string
  password: string
}

export interface AccessToken {
  created: Date
  access_token: string
  expires_in: number
  refresh_token: number
  refresh_expires_in: number
  url: string
  client_id: string
  realmId: string,
  firstName: string,
  lastName: string
}

/**
 * Delete
 */

export interface ContractModel {
  id: number,
  externalId: string,
  userId: string,
  itemGroupId: number,
  deliveryPlaceId: number,
  proposedDeliveryPlaceId: number,
  sapId?: string,
  contractQuantity: number,
  deliveredQuantity: number,
  proposedQuantity: number,
  year: number,
  startDate: Date,
  endDate: Date,
  signDate: Date,
  termDate: Date,
  status: 'APPROVED' | 'ON_HOLD' | 'DRAFT' | 'TERMINATED' | 'REJECTED',
  areaDetails: string,
  deliverAll: boolean,
  remarks: string,
  deliveryPlaceComment: string,
  quantityComment: string,
  rejectComment: string,
  createdAt: Date,
  updatedAt: Date
}

export interface ItemGroup { 
  id: string  | null;
  name: string  | null;
  displayName: string  | null;
  category: string  | null;
  minimumProfitEstimation: number  | null;
  prerequisiteContractItemGroupId: string  | null;
}

export interface Contact { 
  id: string  | null;
  sapId: string  | null;
  firstName: string  | null;
  lastName: string  | null;
  companyName: string  | null;
  phoneNumbers: Array<string>  | null;
  email: string  | null;
  addresses: string[]  | null;
  BIC: string  | null;
  IBAN: string  | null;
  taxCode: string  | null;
  audit: string  | null;
} 

export interface Price { 
  id: string  | null;
  group: string ;
  year: number ;
  unit: string ;
  price: string ;
} 