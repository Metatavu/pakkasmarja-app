import * as querystring from "query-string";
import moment from "moment";
import { AuthConfig, AccessToken } from "../types";
import jwt_decode from "jwt-decode";
import { AsyncStorage } from "react-native";

const ACCESS_TOKEN_STORAGE_KEY = "pakkasmarja-access";

export default class Auth {

  /**
   * Logs user in with provided configuration
   * 
   * @param config login configuration
   */
  static async login(config: AuthConfig) {
    const created = new Date();
    const response = await fetch(config.url, { 
      method: 'POST',
      body: querystring.stringify({
        grant_type: 'password',
        username: config.username,
        password: config.password,
        client_id: config.clientId
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      } 
    });

    const tokenData = await response.json();
    return await this.buildToken(tokenData, created, config.url, config.clientId, config.realmId);
  }

  /**
   * Gets stored token and returns it.
   * Refreshes expired token if it can be done.
   * return null if token is not found or cannot be refreshed
   */
  static async getToken() {
    const accessTokenData = await AsyncStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!accessTokenData) {
      return null;
    }

    try {
      const accessToken = JSON.parse(accessTokenData);
      if (Auth.isTokenValid(accessToken)) {
        return accessToken;
      }

      return await Auth.refreshToken(accessToken);
    } catch {
      return null;
    }
  }

  /**
   * Removes token from storage
   */
  static async removeToken(){
    await AsyncStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  /**
   * Refreshes access token if it can be done
   * 
   * @param accessToken Access token
   */
  static async refreshToken(accessToken: AccessToken) {
    if (!Auth.canTokenRefresh(accessToken)) {
      return null;
    }

    const created = new Date();
    const response = await fetch(accessToken.url, { 
      method: 'POST',
      body: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: accessToken.refresh_token,
        client_id: accessToken.client_id
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      } 
    });

    const tokenData = await response.json();
    return await this.buildToken(tokenData, created, accessToken.url, accessToken.client_id, accessToken.realmId);
  }

  /**
   * Returns true if token is valid, false otherwise
   * 
   * @param token Access token 
   * @param slackSeconds seconds to use as slack
   */
  static isTokenValid(token: AccessToken, slackSeconds?: number) {
    const slack = slackSeconds || 5;
    const expires = moment(token.created)
      .add(token.expires_in, "seconds")
      .subtract(slack);

    return expires.isAfter(moment());
  }

  /**
   * Returns true if token can be refreshed using refresh token, false otherwise
   * 
   * @param token Access token
   * @param slackSeconds seconds to use as slack
   */
  static canTokenRefresh(token: AccessToken, slackSeconds?: number) {
    const slack = slackSeconds || 5;
    const expires = moment(token.created)
      .add(token.refresh_expires_in, "seconds")
      .subtract(slack);

    return expires.isAfter(moment());
  }

  /**
   * Builds access token object from login data
   * 
   * @param tokenData token data
   * @param created creation time
   * @param url url
   * @param clientId client id 
   * @param realmId realm id
   */
  private static async buildToken(tokenData: any, created: Date, url: string, clientId: string, realmId: string) {
    const decodedToken: any = jwt_decode(tokenData.access_token);
    const token = {
      realmRoles: decodedToken.realm_access.roles,
      created: created,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token,
      refresh_expires_in: tokenData.refresh_expires_in,
      url: url,
      client_id: clientId,
      realmId: realmId,
      firstName: decodedToken.given_name,
      lastName: decodedToken.family_name,
      userId: decodedToken.sub,
      receiveFromPlaceCode: decodedToken.receiveFromPlaceCode
    };

    await AsyncStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, JSON.stringify(token));
    return token;
  }

}