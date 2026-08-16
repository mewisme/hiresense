export interface DiscordAttachment {
  id: string;
  url: string;
  filename: string;
}

export interface DiscordMessage {
  id: string;
  attachments:
  DiscordAttachment[];
}

export interface DiscordUploadResult {
  messageId: string;
  attachmentId: string;
  filename: string;
  botKey: string;
}