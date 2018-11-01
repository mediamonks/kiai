"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
class Express {
    constructor(app) {
        this.express = express();
        this.express.use(bodyParser.json());
        const port = process.env.PORT || 3000;
        app.platforms.forEach(platform => {
            const endpoint = `/${platform.IDENTIFIER}`;
            this.express.post(endpoint, platform.requestHandler);
            console.log(`Endpoint mounted at ${endpoint}`);
        });
        this.express.listen(port, () => {
            console.log(`Server listening on http://localhost:${port}`);
        });
    }
    use(name, handler) {
        const endpoint = `/${name}`;
        this.express.all(endpoint, handler);
        console.log(`Endpoint mounted at ${endpoint}`);
    }
}
exports.default = Express;
//# sourceMappingURL=Express.js.map