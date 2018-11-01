"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dialogflow_1 = require("./lib/platforms/Dialogflow/Dialogflow");
const Express_1 = require("./lib/frameworks/Express");
const Firebase_1 = require("./lib/frameworks/Firebase");
const GoogleCloudFunctions_1 = require("./lib/frameworks/GoogleCloudFunctions");
class Kiai {
    constructor({ flows = {}, locales = {}, localeMapping = {}, dialog = {}, voice = {}, trackingConfig = {}, trackingDataCollector, storageConfig = {}, }) {
        this.flows = {};
        this.locales = {};
        this.localeMapping = {};
        this.dialog = {};
        this.voice = {};
        this.trackingConfig = {};
        this.storageConfig = {};
        this._platforms = [];
        this.flows = flows;
        this.locales = locales;
        this.localeMapping = localeMapping;
        this.dialog = dialog;
        this.voice = voice;
        this.trackingConfig = trackingConfig;
        this.trackingDataCollector = trackingDataCollector;
        this.storageConfig = storageConfig;
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
Kiai.INTENT_DELIMITER = ':';
Kiai.PLATFORMS = {
    DIALOGFLOW: Dialogflow_1.default,
};
Kiai.FRAMEWORKS = {
    EXPRESS: Express_1.default,
    FIREBASE: Firebase_1.default,
    GOOGLE_CLOUD_FUNCTIONS: GoogleCloudFunctions_1.default,
};
exports.default = Kiai;
//# sourceMappingURL=Kiai.js.map