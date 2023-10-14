import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ChatService } from '../chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ChatDetail } from '../dtos/chat-detail';
import { MessageListItem } from '../dtos/message-list-item';
import { ListItem } from '../dtos/list-item';
import { MessageModel } from '../models/message-model';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss'],
})
export class ConversationComponent {
  newMessage: string = '';
  id: string = '';

  chatDetail: BehaviorSubject<ChatDetail> = new BehaviorSubject<ChatDetail>({
    name: '',
    lastMessage: '',
    lastMessageTime: new Date(),
    lastMessageBy: '',
    lastMessageById: '',
    lastMessageByAvatar: '',
    chatUsers: [],
  });

  messages: BehaviorSubject<MessageModel[]> = new BehaviorSubject<
    MessageModel[]
  >([]);

  constructor(
    private title: Title,
    private chatService: ChatService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {
    this.title.setTitle('Conversation');
  }

  async ngOnInit() {
    this.activeRoute.params.subscribe(async (params) => {
      if (this.chatDetail) {
        console.log('unsubscribing chatDetail');
        this.chatDetail.unsubscribe();
      }

      this.id = params['id'];
      this.chatDetail = await this.chatService.getChat(this.id);
      this.chatDetail.subscribe((chat) => {
        this.title.setTitle('Chat with ' + chat.name);
      });

      if (this.messages) {
        console.log('unsubscribing messages');
        this.messages.unsubscribe();
      }

      this.messages = await this.chatService.getChatMessages(this.id);
      this.messages.subscribe((messages) => {
        if (messages.length > 0) {
          this.scrollToBottom();
        }
      });
    });
  }

  async sendMessage() {
    if (this.newMessage.length > 0) {
      this.chatService.sendMessage(this.id, this.newMessage);
      this.newMessage = '';
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      var element = document.getElementById('chatmessages');
      if (element) {
        element.scrollTop = element.scrollHeight + 1000;
        console.log('scrolling to ' + element.scrollHeight);
      }
    }, 500);
  }
}
