export interface ChatListItemModel {
  id: string;
  name: string;
  hasMessages: boolean;
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageBy: string;
  lastMessageById: string;
  lastMessageByAvatar: string;
  unreadMessageCount: number;
}
