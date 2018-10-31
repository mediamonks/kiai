"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require('firebase-functions');
class Firebase {
    constructor(app) {
        app.platforms.forEach(platform => {
            this[platform.IDENTIFIER] = functions.https.onRequest(platform.requestHandler);
        });
    }
    use(name, handler) {
        this[name] = functions.https.onRequest(handler);
    }
}
exports.default = Firebase;
//# sourceMappingURL=Firebase.js.map