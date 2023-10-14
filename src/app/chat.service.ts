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

  lastChatId: string = '';
  lastAction: Date = new Date();
  chatDetails$ = new Map<string, BehaviorSubject<ChatDetail>>();
  chatMessages$ = new Map<string, BehaviorSubject<MessageModel[]>>();

  constructor(private http: HttpUtilityService) {
    setTimeout(() => {
      this.backgroundRefresh();
    }, 1000 * 60); // 1 minute
  }

  backgroundRefresh() {
    console.log('background refresh');
    this.updateChats();
    if (this.lastChatId != '') {
      this.updateMessages(this.lastChatId);
    }

    var timeout = 1000 * 60; // 1 minute

    // if last action was more than 5 minutes ago, refresh every 5 minutes
    if (new Date().getTime() - this.lastAction.getTime() > 1000 * 60 * 5) {
      timeout = 1000 * 60 * 5; // 5 minutes
    }

    // if last action was more than 30 minutes ago, refresh every 30 minutes
    if (new Date().getTime() - this.lastAction.getTime() > 1000 * 60 * 30) {
      timeout = 1000 * 60 * 30; // 30 minutes
    }

    // if last action was more than 1 hour ago, refresh in 1 day
    if (new Date().getTime() - this.lastAction.getTime() > 1000 * 60 * 60) {
      timeout = 1000 * 60 * 60 * 24; // 1 day
    }

    setTimeout(() => {
      this.backgroundRefresh();
    }, timeout);
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

    for (let chatModel of chatModels) {
      if (this.chatDetails$.has(chatModel.id)) {
        const prev = this.chatDetails$.get(chatModel.id)?.value;
        this.chatDetails$.get(chatModel.id)?.next({
          name: chatModel.name,
          lastMessage: chatModel.lastMessage,
          lastMessageTime: chatModel.lastMessageTime,
          lastMessageBy: chatModel.lastMessageBy,
          lastMessageById: chatModel.lastMessageById,
          lastMessageByAvatar: chatModel.lastMessageByAvatar,
          chatUsers: prev?.chatUsers ?? [],
        });
      }
    }

    this.chats$.next(chatModels);
  }

  private async loadChats(): Promise<ListItem<ChatListItem>[]> {
    return await this.http.httpGet<ListItem<ChatListItem>[]>('chats');
  }

  getChat(chatId: string): BehaviorSubject<ChatDetail> {
    this.lastAction = new Date();
    // if we already have the chat detail, return it

    this.lastChatId = chatId;
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
      await this.updateChat(chatId);
      await this.updateMessages(chatId);
    }, 1);

    return chatDetail$;
  }

  async updateChat(chatId: string) {
    const chat = await this.loadChat(chatId);
    const chatDetailModel = this.chatDetails$.get(chatId);
    if (chatDetailModel) {
      chatDetailModel.next({
        name: chat.name,
        lastMessage: chat.lastMessage,
        lastMessageTime: new Date(chat.lastMessageTime),
        lastMessageBy: chat.lastMessageBy,
        lastMessageById: chat.lastMessageById,
        lastMessageByAvatar: chat.lastMessageByAvatar,
        chatUsers: chat.chatUsers,
      });
    }
  }

  async loadChat(chatId: string): Promise<ChatDetail> {
    return await this.http.httpGet<ChatDetail>('chats/' + chatId);
  }

  async createChat(email: string) {
    this.lastAction = new Date();
    var response = (await this.http.httpPost('chats', {
      name: 'Chat ' + email + ' ' + this.http.currentUser().email,
      chatUsers: [email, this.http.currentUser().email],
    })) as any;
    console.log(response);
    this.updateChats();
  }

  async sendMessage(chatId: string, message: string) {
    this.lastAction = new Date();
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
