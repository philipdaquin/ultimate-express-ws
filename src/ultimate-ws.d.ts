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
}