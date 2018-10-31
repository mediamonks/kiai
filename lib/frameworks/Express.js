"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
class Express {
    constructor(app) {
        this._express = express();
        this._express.use(bodyParser.json());
        const port = process.env.PORT || 3000;
        app.platforms.forEach(platform => {
            const endpoint = `/${platform.IDENTIFIER}`;
            this._express.post(endpoint, platform.requestHandler);
            console.log(`Endpoint mounted at ${endpoint}`);
        });
        this._express.listen(port, () => {
            console.log(`Server listening on http://localhost:${port}`);
        });
    }
    use(name, handler) {
        const endpoint = `/${name}`;
        this._express.all(endpoint, handler);
        console.log(`Endpoint mounted at ${endpoint}`);
    }
}
exports.default = Express;
//# sourceMappingURL=Express.js.map