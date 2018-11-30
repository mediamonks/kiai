"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GoogleCloudFunctions {
    constructor(app) {
        app.platforms.forEach(platform => {
            this[platform.IDENTIFIER] = platform.requestHandler;
        });
    }
    use(name, handler) {
        this[name] = handler;
    }
}
exports.default = GoogleCloudFunctions;
//# sourceMappingURL=GoogleCloudFunctions.js.map