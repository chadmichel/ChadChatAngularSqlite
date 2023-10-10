import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { EmailDialogComponent } from './email-dialog/email-dialog.component';
import { ChatService } from './chat.service';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  pageTitle = 'Chat App';

  constructor(
    private router: Router,
    private title: Title,
    private dialog: MatDialog,
    private chatService: ChatService
  ) {}

  async ngOnInit() {}

  newChat(): void {
    const dialogRef = this.dialog.open(EmailDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        console.log('Email address:', result);
        await this.chatService.createChat(result);
      }
    });
  }

  gotoHome(): void {
    this.router.navigate(['chats']);
  }

  gotoLogin(): void {
    this.router.navigate(['login']);
  }

  newScreenshot(): void {
    html2canvas(document.body).then((canvas) => {
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'screenshot.png';
      link.href = image;
      link.click();
    });
  }
}
