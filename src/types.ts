
export interface Message {
  id?: string;
  role: "user" | "model";
  content: string;
  sources?: string[];
  modelUsed?: string;
  createdAt?: Date;
  conversationId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt?: Date;
  userId?: string;
}
