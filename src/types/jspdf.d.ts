declare module "jspdf" {
  export class jsPDF {
    constructor();
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    output(type: string): Uint8Array;
  }
}