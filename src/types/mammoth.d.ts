declare module 'mammoth' {
  export interface MammothOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: any;
    path?: string;
  }

  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function convertToHtml(input: MammothOptions, options?: any): Promise<MammothResult>;
  export function extractRawText(input: MammothOptions, options?: any): Promise<MammothResult>;
}
