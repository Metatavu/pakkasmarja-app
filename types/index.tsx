
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