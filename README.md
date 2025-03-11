# Ultimate-Express-WS (alpha)
Drop in replacement for `Express-WS` library in favour of Ultimate-WS over the _traditional_ WS library.

Makes it easy to add Websocket Endpoints to your Express app while using uWebsockets under the hood through Ultimate-WS. 

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


```

** Use it at your own risk **
