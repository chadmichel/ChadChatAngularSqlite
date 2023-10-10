import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ChatService } from '../chat.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ChatListItem } from '../dtos/chat-list-item';
import { ListItem } from '../dtos/list-item';
import { ChatListItemModel } from '../models/chat-list-item-model';

@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.scss'],
})
export class ConversationListComponent {
  chats$: BehaviorSubject<ChatListItemModel[]> = new BehaviorSubject<
    ChatListItemModel[]
  >([]);
  //chats: ListItem<ChatListItem>[] = [];
  isLoaded: boolean = false;

  constructor(
    private title: Title,
    private chatService: ChatService,
    private router: Router
  ) {
    this.title.setTitle('Conversation List');
  }

  ngOnInit() {
    this.chats$ = this.chatService.getChats();
    this.chats$.subscribe((chats) => {
      console.log('loaded');
      console.log(chats.length);
      this.isLoaded = true;
      console.log('setting title');
      this.title.setTitle('Conversation List (' + chats.length + ')');
    });
  }

  openChat(chat: ChatListItemModel) {
    this.router.navigate(['/chats', chat.id]);
  }
}
