export interface ExtractResumeTextInput {
  file: Buffer;
  filename: string;
  contentType: string;
}

export interface ExtractResumeTextResponse {
  text: string;
  pageCount: number;
  textLength: number;
  warnings: string[];
}