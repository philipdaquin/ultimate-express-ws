// In a declaration file (e.g., ultimate-ws.d.ts)
declare module 'ultimate-ws' {
    import { EventEmitter } from 'events';
    import * as ws from 'ws';
    
    export interface WebSocketServerOptions {
      server?: any;
      port?: number;
      path?: string;
      perMessageDeflate?: boolean | number;
      maxPayload?: number;
      autoPong?: boolean;
      verifyClient?: any;
      maxBackpressure?: number;
      idleTimeout?: number;
      clientTracking?: boolean;
      closeOnBackpressureLimit?: boolean;
      allowSynchronousEvents?: boolean;
      WebSocket?: any;
      uwsOptions?: Record<string, unknown>;
      handleProtocols?: (protocols: Set<string>, req: any) => string | null;
      handleUpgrade?: (request: any) => any | false | Function;
      host?: string;
    }
    
    export class WebSocketServer extends EventEmitter {
      constructor(options?: WebSocketServerOptions, callback?: Function);
      
      options: WebSocketServerOptions;
      clients?: Set<any>;
      uwsApp: any;
      ssl: boolean;
      port: number;
      
      createHandler(): void;
      shouldHandle(req: any): boolean;
      address(): { address: string, family: string, port: number };
      listen(port: number | string | Function, callback?: Function): void;
      close(callback?: () => void): void;
      
      on(event: 'connection', listener: (socket: any, request: any) => void): this;
      on(event: 'headers', listener: (headers: string[], request: any) => void): this;
      on(event: 'listening', listener: () => void): this;
      on(event: 'close', listener: () => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      on(event: string, listener: (...args: any[]) => void): this;
      
      emit(event: 'connection', socket: any, request: any): boolean;
      emit(event: 'headers', headers: string[], request: any): boolean;
      emit(event: 'listening'): boolean;
      emit(event: 'close'): boolean;
      emit(event: 'error', error: Error): boolean;
      emit(event: string, ...args: any[]): boolean;
    }

    export interface SendOptions {
      compress?: boolean;
      binary?: boolean;
      fin?: boolean;
    }
    
    export class WebSocket extends EventEmitter {
      constructor(ws: any, req: any, server: WebSocketServer);
      
      ws: any;
      req: any;
      server: WebSocketServer;
      binaryType: 'nodebuffer' | 'arraybuffer' | 'blob' | 'fragments';
      incomingMessages: Array<{message: any, isBinary: boolean}>;
      incomingMessagesSize: number;
      isPaused: boolean;
      maxPayload: number;
      extensions: string;
      readyState: number;
      
      // WebSocket constants
      readonly OPEN: number;
      readonly CLOSING: number;
      readonly CLOSED: number;
      readonly CONNECTING: number;
      
      // Properties
      readonly bufferedAmount: number;
      readonly protocol: string;
      
      // Event handlers
      onmessage: ((event: any) => void) | null;
      onclose: ((event: any) => void) | null;
      onerror: ((event: any) => void) | null;
      onopen: ((event: any) => void) | null;
      
      // Methods
      ping(): void;
      pong(): void;
      close(code?: number, reason?: string): void;
      send(data: string | Buffer | ArrayBuffer | Buffer[], options?: SendOptions | Function, callback?: (err?: Error) => void): number;
      terminate(): void;
      pause(): void;
      resume(): void;
      bufferIncomingMessage(message: any, isBinary: boolean): void;
      parseMessage(data: any, isBinary: boolean): Buffer | ArrayBuffer | Blob | Buffer[];
      
      // Event methods
      addEventListener(type: string, listener: Function, options?: any): void;
      removeEventListener(type: string, listener: Function, options?: any): void;
      
      // Standard EventEmitter methods
      on(event: 'message', listener: (message: any, isBinary: boolean) => void): this;
      on(event: 'close', listener: () => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      on(event: 'open', listener: () => void): this;
      on(event: 'ping', listener: (data: Buffer) => void): this;
      on(event: 'pong', listener: (data: Buffer) => void): this;
      on(event: 'dropped', listener: (data: any, isBinary: boolean) => void): this;
      on(event: 'drain', listener: () => void): this;
      on(event: string, listener: (...args: any[]) => void): this;
      
      emit(event: 'message', message: any, isBinary: boolean): boolean;
      emit(event: 'close'): boolean;
      emit(event: 'error', error: Error): boolean;
      emit(event: 'open'): boolean;
      emit(event: 'ping', data: Buffer): boolean;
      emit(event: 'pong', data: Buffer): boolean;
      emit(event: 'dropped', data: any, isBinary: boolean): boolean;
      emit(event: 'drain'): boolean;
      emit(event: string, ...args: any[]): boolean;
    }
}