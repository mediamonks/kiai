"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;
class Express {
    constructor(app) {
        this.endpoints = [];
        this.express = express();
        this.express.use(bodyParser.json());
        app.platforms.forEach(platform => {
            const endpoint = `/${platform.IDENTIFIER}`;
            this.express.post(endpoint, platform.requestHandler);
            this.endpoints.push(endpoint);
        });
        this.express.listen(PORT, () => {
            console.log('Server started.\nLocal endpoints:');
            this.endpoints.forEach(endpoint => {
                console.log(`${URL}${endpoint}`);
            });
        });
    }
    use(name, handler) {
        const endpoint = `/${name}`;
        this.express.all(endpoint, handler);
        this.endpoints.push(endpoint);
    }
}
exports.default = Express;
//# sourceMappingURL=Express.js.map