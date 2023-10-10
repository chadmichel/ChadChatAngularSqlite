export interface MessageModel {
  // list item props
  id: string;

  // message props
  chatId: string;
  userId: string;
  message: string;
  timestamp: number;
  userName: string;
  userAvatar: string;

  // computed props
  isMine: boolean;
  senderDisplayName: string;
  createdOn: Date;
}
