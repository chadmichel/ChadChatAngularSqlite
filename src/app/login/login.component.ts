import { Component } from '@angular/core';
import { ChatService } from '../chat.service';
import { Router } from '@angular/router';
import { HttpUtilityService } from '../http-utility.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string = '';
  code: string = '';
  apiUri: string = '';

  constructor(
    private chatService: ChatService,
    private http: HttpUtilityService,
    private router: Router
  ) {
    this.email = http.getEmail();
    this.apiUri = http.getServiceUrl();
  }

  async login() {
    await this.http.login(this.email);
    this.router.navigate(['/chats']);
  }
}
