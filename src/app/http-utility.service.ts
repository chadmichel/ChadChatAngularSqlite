import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpUtilityService {
  token: string = '';
  chatEndpoint: string = '';
  email: string = '';
  userId: string = '';
  tokenExpiresOn: Date | undefined;

  constructor(private http: HttpClient) {
    this.loadFromLocalStorage();
  }

  async login(email: string) {
    var initResponse = (await this.httpPost<any>('auth/token', {
      email: email,
    })) as any;
    console.log(initResponse);
    this.token = initResponse.token;
    this.email = initResponse.email;
    this.userId = initResponse.userId;
    this.tokenExpiresOn = new Date(initResponse.expiresOn);

    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    localStorage.setItem(
      'chatService',
      JSON.stringify({
        token: this.token,
        email: this.email,
        userId: this.userId,
        tokenExpiresOn: this.tokenExpiresOn,
      })
    );
  }

  loadFromLocalStorage() {
    let data = JSON.parse(localStorage.getItem('chatService') || '{}');
    this.token = data.token;
    this.email = data.email;
    this.userId = data.userId;
    this.tokenExpiresOn = new Date(data.tokenExpiresOn);
  }

  currentUser() {
    return {
      token: this.token,
      email: this.email,
      userId: this.userId,
      tokenExpiresOn: this.tokenExpiresOn,
    };
  }

  private requestOptions() {
    return {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.token ?? '',
        userId: this.userId ?? '',
        userEmail: this.email ?? '',
      }),
    };
  }

  getEmail() {
    return this.email;
  }

  private serviceUrl = '';
  getServiceUrl() {
    if (this.serviceUrl == undefined || this.serviceUrl == '') {
      this.serviceUrl = localStorage.getItem('serviceUrl') ?? '';
    }
    if (this.serviceUrl == undefined || this.serviceUrl == '') {
      this.serviceUrl = 'http://localhost:8080/api/chat/v1/'; // default for local dev
    }
    return this.serviceUrl;
  }
  setServiceUrl(url: string) {
    this.serviceUrl = url;
    localStorage.setItem('serviceUrl', url);
  }

  async httpGet<T>(path: string) {
    const url = `${this.getServiceUrl()}${path}`;
    console.log('GET ' + url);
    var response = (await firstValueFrom(
      this.http.get<T>(url, this.requestOptions())
    )) as any;
    if (response.status >= 200 && response.status < 300) {
      if (response.data) {
        return response.data;
      }
      if (response.item) {
        return response.item;
      }
      if (response.items) {
        return response.items;
      }
      return response;
    }
  }

  async httpPost<T>(path: string, body: any) {
    const url = `${this.getServiceUrl()}${path}`;
    console.log('POST ' + url + ' ' + JSON.stringify(body));
    return firstValueFrom(this.http.post(url, body, this.requestOptions()));
  }
}
