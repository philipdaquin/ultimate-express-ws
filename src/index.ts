const { WebSocketServer } = require("ultimate-ws");
import * as express from "ultimate-express";
import * as core from "express-serve-static-core";
import * as http from "http";
import * as https from "https";
import * as ws from "ws"; // types 
import { pathToRegexp, match } from 'path-to-regexp';




interface Options {
    // Seems unnecessary since the we don't modify the express.Router globally
    leaveRouterUntouched?: boolean | undefined;
    wsOptions?: ws.ServerOptions & {
        perMessageDeflate?: boolean | number; // Compression
        maxPayload?: number; // Max message size
        autoPong?: boolean; // Automatic pings
        verifyClient?: (info: { origin: string; req: any; secure: boolean }) => boolean | Promise<boolean>;
        maxBackpressure?: number;
        idleTimeout?: number;
    };
}
  
interface RouterLike {
  get: express.IRouterMatcher<this>;
  [key: string]: any;
  [key: number]: any;
}

interface Instance {
  app: Application;
  applyTo(target: RouterLike): void;
  getWss(): typeof WebSocketServer;
  getRoutes() : Map<string, WebsocketRequestHandler>,
  cleanup(): void
}
  
type WebsocketRequestHandler = (ws: ws.WebSocket, req: express.Request, next: express.NextFunction) => void;
type WebsocketMethod<T> = (route: core.PathParams, ...middlewares: WebsocketRequestHandler[]) => T;

interface WithWebsocketMethod {
/**
 * Registers a WebSocket route handler.
 * @param route The route pattern (e.g., "/ws/:id")
 * @param middlewares Optional middleware functions
 * @param handler The WebSocket connection handler
 */
  ws: WebsocketMethod<this>;
}

type Application = express.Application & WithWebsocketMethod;
type Router = express.Router & WithWebsocketMethod;
// Helper to find a matching route pattern
// Helper to find a matching route pattern
function findMatchingRoute(
  pathname: string,
  routes: Map<string, WebsocketRequestHandler>
): { pattern: string; handler: WebsocketRequestHandler; params: Record<string, string> } | null {
  for (const [pattern, handler] of routes.entries()) {
      const matcher = match(pattern, { decode: decodeURIComponent });
      const result = matcher(pathname);
      if (result) {
          return {
              pattern,
              handler,
              params: result.params as Record<string, string>, // Type assertion for params
          };
      }
  }
  return null;
}
  
// Helper to extract route params
function extractRouteParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i]?.startsWith(':')) {
        // @ts-ignore
        const paramName = patternParts[i].slice(1);
        // @ts-ignore
        params[paramName] = pathParts[i];
        }
    }
    
    return params;
}
  
// Create a function that adds WebSocket support to your Express app
export function UltimateExpressWS(
    app: express.Application,
    server?: http.Server | https.Server,
    options: Options = {}
): Instance {
    // Store WebSocket route handlers
    // const wsRoutes: { pattern: string; handler: WebsocketRequestHandler }[] = [];
    const wsRoutesMap = new Map<string, WebsocketRequestHandler>()
    
    // Setup WebSocket server with a custom handleUpgrade function
    const wss = new WebSocketServer({
        server: app || server,
        perMessageDeflate: options.wsOptions?.perMessageDeflate,
        maxPayload: options.wsOptions?.maxPayload,
        autoPong: options.wsOptions?.autoPong,
        verifyClient: options.wsOptions?.verifyClient,
        maxBackpressure: options.wsOptions?.maxBackpressure,
        idleTimeout: options.wsOptions?.idleTimeout,
        handleProtocols: (protocols: Set<string>, req: any) => {
            // Example: Return the first supported protocol
            const supported = ['chat', 'graphql-ws'];
            for (const proto of protocols) {
                if (supported.includes(proto)) return proto;
            }
            return null; // No protocol match
        },
        // No need for server.on('upgrade') as ultimate-ws handles this internally
        handleUpgrade: async (request: any) => {
            // Get the path from the request URL
            const url = request.url || '/';
            const pathname = url.split('?')[0]; // Simple path extraction without URL constructor
            
            // Find matching route
            const matchingRoute = findMatchingRoute(pathname, wsRoutesMap);
            
            if (matchingRoute) {
                // Extract route params
                const params = extractRouteParams(matchingRoute.pattern, pathname);
                request.params = params;
                
                // Return the connection handler
                return (ws: ws.WebSocket, req: any) => {
                    try { 
                        // Call the route handler
                        matchingRoute.handler(ws, req, (() => {}) as express.NextFunction);
                                            
                        // Emit connection event
                        wss.emit("connection", ws, req);
                    } catch (err) { 
                        wss.emit('error', err)
                        ws.close(1011, 'Internal Server Error')
                    }
                    
                };
            } 
            // No matching route, reject the connection
            request.res.cork(() => {
                request.res.writeStatus("404 Not Found");
                request.res.end("No WebSocket handler found for this path");
            });
            return false;
        }
    });
    
    // Add the .ws() method to the app with middleware support
    (app as Application).ws = function(route, ...handlers: Array<express.RequestHandler | WebsocketRequestHandler>) {
      const finalHandler = handlers.pop() as WebsocketRequestHandler;
      if (!finalHandler) {
          throw new Error('At least one WebSocket handler is required');
      }

      // Create a handler that chains middleware and the final WebSocket handler
        const chainedHandler: WebsocketRequestHandler = (ws: ws.WebSocket, req: express.Request, next: express.NextFunction) => {
            let index = 0;
            const nextFn = (err?: any) => {
                if (err) {
                    // Handle errors (e.g., close the WebSocket or log)
                    ws.close(1011, 'Internal Server Error');
                    return;
                }
                if (index < handlers.length) {
                    // Execute HTTP middleware
                    // @ts-ignore
                    (handlers[index++] as express.RequestHandler)(req, {} as any, nextFn);
                } else {
                    // Execute the final WebSocket handler
                    finalHandler(ws, req, next);
                }
            };
            nextFn();
        };

        wsRoutesMap.set(route.toString(), chainedHandler);
        return this;
    };    
    const instance: Instance = {
        app: app as Application,
        applyTo(target: RouterLike): void {
            (target as any).ws = (app as Application).ws;
        },
        getWss(): typeof WebSocketServer {
            return wss;
        },
        getRoutes() {
            return wsRoutesMap
        },
        cleanup() {
            wsRoutesMap.clear()
            wss.close()
        }
    };


    return instance
}