// import { Configuration } from "famifarm-client";
import { AccessToken } from "./Auth";
import { FileRef } from '../types';


export default class ApiClient {

  /*getConfiguration(token: AccessToken): Configuration {
    return new Configuration({
      basePath: "https://famifarm-api.metatavu.io/v1",
      apiKey: `Bearer ${token.access_token}`
    })
  }*/

  uploadFile(file: any): Promise<FileRef> {
    if (!file) {
      return Promise.reject("file is missing");
    }

    const fileData = {
      uri: file.uri,
      type: 'image/jpeg',
      name: 'photo.jpg'
    };

    const data = new FormData();
    data.append("file", fileData);

    return fetch("https://famifarm-api.metatavu.io/files", {
      method: "POST",
      body: data
    })
    .then((res) => { return res.json() })
    .catch((err) => { console.log(err) });
  }

  async getRPT(response: Response | null, accessToken: AccessToken, headerObject?: any) : Promise<string> {
    const ticket = response && response.headers ? this.getUMATicket(response) : this.getUMATicket(null, headerObject);
    if (!ticket) {
      return Promise.reject();
    }
    const headers = {
      "Authorization": `Bearer ${accessToken.access_token}`,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    const url = accessToken.url;
    const params = {
      "grant_type": "urn:ietf:params:oauth:grant-type:uma-ticket",
      "ticket": ticket
    }

    try {
      const res = await fetch(url, { method: "POST", headers: headers, body: this.encodeFormBody(params) });
      if (res.status !== 200) {
        return Promise.reject();
      }
      const data = await res.json();
      return data["access_token"];
    } catch(err) {
      return Promise.reject(err);
    }
  }

  private getUMATicket(response: Response | null, headerObject?: any): string | undefined {
    if (!response && !headerObject) {
      return undefined;
    }

    let wwwAuthenticateHeader = null;

    if (response) {
      wwwAuthenticateHeader = response.headers.get("www-authenticate");
    } else {
      wwwAuthenticateHeader = headerObject['WWW-Authenticate'];
    }
    
    if (!wwwAuthenticateHeader) {
      return undefined;
    }

    const headerComponents = wwwAuthenticateHeader.split(",");
    let ticket = undefined;
    headerComponents.forEach((component: string) => {
      if (component.startsWith("ticket")) {
        ticket = component.split("=")[1].replace(/"/g, "");
      }
    });

    return ticket;
  }

  private encodeFormBody(params: any): string {
    let formBody = [];
    for (let property in params) {
        let encodedKey = encodeURIComponent(property);
        let encodedValue = encodeURIComponent(params[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    
    return formBody.join("&");
  }
}