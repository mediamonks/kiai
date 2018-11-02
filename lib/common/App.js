"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dialogflow_1 = require("../platforms/Dialogflow/Dialogflow");
const Express_1 = require("../frameworks/Express");
const Firebase_1 = require("../frameworks/Firebase");
const GoogleCloudFunctions_1 = require("../frameworks/GoogleCloudFunctions");
class App {
    constructor({ flows = {}, locales = {}, localeMapping = {}, dialog = {}, voice = {}, tracking = {}, storage = {}, }) {
        this.config = {
            flows: {},
            locales: {},
            localeMapping: {},
            dialog: {},
            voice: {},
            tracking: {},
            storage: {},
        };
        this._platforms = [];
        this.config = {
            flows,
            locales,
            localeMapping,
            dialog,
            voice,
            tracking,
            storage,
        };
    }
    get platforms() {
        return this._platforms;
    }
    get framework() {
        return this._framework;
    }
    addPlatform(Platform, options) {
        const platform = new Platform(Object.assign({ app: this }, options));
        this._platforms.push(platform);
        return platform;
    }
    setFramework(Framework) {
        this._framework = new Framework(this);
        return this._framework;
    }
}
App.INTENT_DELIMITER = ':';
App.PLATFORMS = {
    DIALOGFLOW: Dialogflow_1.default,
};
App.FRAMEWORKS = {
    EXPRESS: Express_1.default,
    FIREBASE: Firebase_1.default,
    GOOGLE_CLOUD_FUNCTIONS: GoogleCloudFunctions_1.default,
};
exports.default = App;
//# sourceMappingURL=App.js.map