const { WebSocketServer, WebSocket } = require("ultimate-ws");
import * as express from "express";
import * as core from "express-serve-static-core";
import * as http from "http";
import * as https from "https";
import * as ws from "ws"; // types 
import { pathToRegexp, match } from 'path-to-regexp';




interface Options {
    // Seems unnecessary since the we don't modify the express.Router globally
    // leaveRouterUntouched?: boolean | undefined;
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
  getRoutes() : {pattern: string, handler: WebsocketRequestHandler}[]
}
  
type WebsocketRequestHandler = (ws: WebSocket, req: express.Request, next: express.NextFunction) => void;
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
function findMatchingRoute(pathname: string, routes: any[]): any {
    for (const route of routes) {
        const matcher = match(route.pattern, { decode: decodeURIComponent });
        const result = matcher(pathname);
        if (result) {
            route.params = result.params; // Attach params to route object
            return route;
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
    const wsRoutes: { pattern: string; handler: WebsocketRequestHandler }[] = [];
    
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
            const matchingRoute = findMatchingRoute(pathname, wsRoutes);
            
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
    
    // Add the .ws() method to the app
    (app as Application).ws = function(route, ...handlers) {

        const handlerStack = handlers.map(handler => ({handler}))
        wsRoutes.push({ 
            pattern: route.toString(),
            handler: (ws: WebSocket, req: express.Request, next: express.NextFunction) => {
                let index = 0;
                const nextFn = () => {
                    if (index < handlerStack.length) {
                        handlerStack[index++].handler(ws, req, nextFn);
                    }
                };
                nextFn();
            }
        })
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
        getRoutes() : {pattern: string, handler: WebsocketRequestHandler}[] {
            return wsRoutes
        }
    };


    return instance
}