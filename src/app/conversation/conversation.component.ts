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
      this.id = params['id'];
      this.chatDetail = await this.chatService.getChat(this.id);
      this.chatDetail.subscribe((chat) => {
        this.title.setTitle('Chat with ' + chat.name);
        this.scrollToBottom();
      });

      this.messages = await this.chatService.getChatMessages(this.id);

      this.scrollToBottom();
    });
  }

  async sendMessage() {
    if (this.newMessage.length > 0) {
      this.chatService.sendMessage(this.id, this.newMessage);
      this.newMessage = '';
    }
  }

  scrollToBottom() {
    var element = document.getElementById('chatmessages');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}

export interface ChatMessageItem {
  id: string;
  message: string;
  createdOn: Date;
  isMine: boolean;
  senderDisplayName: string;
}
