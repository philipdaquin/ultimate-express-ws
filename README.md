# Ultimate-Express-WS (alpha)
Drop in replacement for `Express-WS` library in favour of Ultimate-WS over the _traditional_ WS library.

Makes it easy to add Websocket Endpoints to your Express app while using uWebsockets under the hood through Ultimate-WS. 

Checkout 
- Ultimate-WS [https://github.com/dimdenGD/ultimate-ws]
- Ultimate-express [https://github.com/dimdenGD/ultimate-express]

***NOTE**
If you are already using `bun`, these libraries will fail (trust me lol)! You have to uninstall `bun` first and switch to Node JS for these libraries to work.


Main Changes: 
- leverages Ultimate-WS features 
- Type safety
- Support Subprotocols (like Graphql) [untested]
- Middleware support + Map Based route storage
- added custom `getRoutes()` to view all Websocket endpoints (for debugging)

### Installation 
```
npm i ultimate-express-ws
```

### Example With Ultimate-Express 
```
const express = require("ultimate-express"); // or express 
const expressApp = express();
import handleWebsocket from '/services/handleWebsocket.ts'
import {UltimateExpressWS} from 'ultimate-express-ws'

// EXPRESSWS
// export const appInstance = ExpressWS(expressApp, undefined, 
// { 
//    wsOptions: {
//    perMessageDeflate: true,
//    clientTracking: true,
//    autoPong: true, 
//  }
// });
export const appInstance = UltimateExpressWS(expressApp, undefined, 
 { 
    wsOptions: {
    perMessageDeflate: true,
    clientTracking: true,
    autoPong: true, 
  }
});
const app = appInstance.app

// Add your websocket endpoint
app.ws('/ws', handleWebsocket)

// appInstance.getRoutes() -- Lists all for your ws routes
// appInstance.getWss() -- the main WebSocket server
// appInstance.app - express app



```

** Use it at your own risk **
