import express from "ultimate-express";
import {UltimateExpressWS} from '../src'

const appInstance = express()
const appWS = UltimateExpressWS(appInstance, undefined, {
    wsOptions: {
        clientTracking: true, 
        autoPong: true, 

    }
})
const app = appWS.app



app.use('', () => {})

// Use as normla
app.ws('', () => {})

function main() {

    appWS.cleanup()
    appWS.getRoutes()
    appWS.getWss()
    const clients = appWS.getWss().clients

}