declare module 'pdfjs-dist/build/pdf.worker.entry' {
  const worker: unknown;
  export default worker;
}

declare module 'pdfjs-dist' {
  export * from 'pdfjs-dist/types/pdf';
  
  interface GlobalWorkerOptions {
    workerSrc: string;
  }
  
  export const GlobalWorkerOptions: GlobalWorkerOptions;
  export function getDocument(source: string | Uint8Array | any): any;
}