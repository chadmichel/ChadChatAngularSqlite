import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { ChatListItem } from './dtos/chat-list-item';
import { MessageListItem } from './dtos/message-list-item';
import { ChatDetail } from './dtos/chat-detail';
import { ListItem } from './dtos/list-item';
import { MessageModel } from './models/message-model';
import { HttpUtilityService } from './http-utility.service';
import { ChatListItemModel } from './models/chat-list-item-model';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  maxMessages: number = 100;

  chats$: BehaviorSubject<ChatListItemModel[]> = new BehaviorSubject<
    ChatListItemModel[]
  >([]);

  chatDetails$ = new Map<string, BehaviorSubject<ChatDetail>>();

  chatMessages$ = new Map<string, BehaviorSubject<MessageModel[]>>();

  constructor(private http: HttpUtilityService) {
    setInterval(() => {
      this.updateChats();
      this.chatDetails$.forEach((value, key) => {
        this.updateMessages(key);
      });
    }, 1000 * 60);
  }

  getChats(): BehaviorSubject<ChatListItemModel[]> {
    setTimeout(async () => {
      await this.updateChats();
    }, 1);

    return this.chats$;
  }

  private async updateChats() {
    const chats = await this.loadChats();

    const chatModels = chats.map((c: ListItem<ChatListItem>) => {
      return {
        id: c.id,
        name: c.data.name,
        hasMessages:
          c.data.lastMessage != '' && c.data.lastMessageTime != undefined,
        lastMessage: c.data.lastMessage,
        lastMessageTime: new Date(c.data.lastMessageTime),
        lastMessageBy: c.data.lastMessageBy,
        lastMessageById: c.data.lastMessageById,
        lastMessageByAvatar: c.data.lastMessageByAvatar,
        unreadMessageCount: c.data.unreadMessageCount,
      } as ChatListItemModel;
    });

    this.chats$.next(chatModels);
  }

  private async loadChats(): Promise<ListItem<ChatListItem>[]> {
    return await this.http.httpGet<ListItem<ChatListItem>[]>('chats');
  }

  getChat(chatId: string): BehaviorSubject<ChatDetail> {
    // if we already have the chat detail, return it
    let chatDetail$ = this.chatDetails$.get(chatId);

    if (chatDetail$ && chatDetail$.value) {
      return chatDetail$;
    }

    // clear the chat detail
    let chatDetail = {
      name: '',
      lastMessage: '',
      lastMessageTime: new Date(),
      lastMessageBy: '',
      lastMessageById: '',
      lastMessageByAvatar: '',
      chatUsers: [],
    } as ChatDetail;

    chatDetail$ = new BehaviorSubject<ChatDetail>(chatDetail);
    chatDetail$.next(chatDetail);
    this.chatDetails$.set(chatId, chatDetail$);

    // async load the messages
    setTimeout(async () => {
      await this.updateMessages(chatId);
    }, 1);

    return chatDetail$;
  }

  async createChat(email: string) {
    var response = (await this.http.httpPost('chats', {
      name: 'Chat ' + email + ' ' + this.http.currentUser().email,
      chatUsers: [email, this.http.currentUser().email],
    })) as any;
    console.log(response);
    this.reloadChats();
  }

  async reloadChats() {
    const chats = await this.http.httpGet<ListItem<ChatListItem>[]>('chats');
    this.chats$.next(chats);
  }

  async sendMessage(chatId: string, message: string) {
    var response = (await this.http.httpPost('chats/' + chatId + '/messages', {
      message: message,
    })) as any;
    console.log(response);
    this.updateMessages(chatId);
  }

  getChatMessages(chatId: string): BehaviorSubject<MessageModel[]> {
    let chatMessages = this.chatMessages$.get(chatId);
    if (!chatMessages) {
      chatMessages = new BehaviorSubject<MessageModel[]>([]);
      this.chatMessages$.set(chatId, chatMessages);
    }

    setTimeout(async () => {
      await this.updateMessages(chatId);
    }, 1);

    return chatMessages;
  }

  private async updateMessages(chatId: string) {
    console.log('updateMessages ' + chatId);

    const messages = await this.loadChatMessages(chatId);
    let chatMessages = this.chatMessages$.get(chatId);
    if (!chatMessages) {
      chatMessages = new BehaviorSubject<MessageModel[]>([]);
      this.chatMessages$.set(chatId, chatMessages);
    }

    const messageModels = messages
      .map((m: ListItem<MessageListItem>) => {
        return {
          id: m.id,
          chatId: chatId,
          userId: m.data.userId,
          userName: m.data.userName,
          userAvatar: m.data.userAvatar,
          message: m.data.message,
          timestamp: m.data.timestamp,
          isMine: m.data.userId == this.http.currentUser().userId,
          senderDisplayName: m.data.userName,
          createdOn: new Date(m.data.timestamp),
        } as MessageModel;
      })
      .sort((m) => m.timestamp)
      .reverse();

    chatMessages.next(messageModels);
  }

  private async loadChatMessages(
    chatId: string
  ): Promise<ListItem<MessageListItem>[]> {
    return await this.http.httpGet<ListItem<MessageListItem>[]>(
      `chats/${chatId}/messages`
    );
  }
}
