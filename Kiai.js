"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Dialogflow_1 = require("./lib/platforms/Dialogflow/Dialogflow");
const Express_1 = require("./lib/frameworks/Express");
const Firebase_1 = require("./lib/frameworks/Firebase");
const GoogleCloudFunctions_1 = require("./lib/frameworks/GoogleCloudFunctions");
exports.INTENT_DELIMITER = ':';
class Kiai {
    constructor({ flows = {}, locales = {}, localeMapping = {}, dialog = {}, voice = {}, trackingConfig = {}, trackingDataCollector, }) {
        this.PLATFORMS = {
            DIALOGFLOW: Dialogflow_1.default,
        };
        this.FRAMEWORKS = {
            EXPRESS: Express_1.default,
            FIREBASE: Firebase_1.default,
            GOOGLE_CLOUD_FUNCTIONS: GoogleCloudFunctions_1.default,
        };
        this._flows = {};
        this._locales = {};
        this._localeMapping = {};
        this._dialog = {};
        this._voice = {};
        this._trackingConfig = {};
        this._platforms = [];
        this._flows = flows;
        this._locales = locales;
        this._localeMapping = localeMapping;
        this._dialog = dialog;
        this._voice = voice;
        this._trackingConfig = trackingConfig;
        this._trackingDataCollector = trackingDataCollector;
    }
    get platforms() {
        return this._platforms;
    }
    get framework() {
        return this._framework;
    }
    addPlatform(Platform, options) {
        const platform = new Platform(Object.assign({ flows: this._flows, locales: this._locales, localeMapping: this._localeMapping, dialog: this._dialog, voice: this._voice, trackingConfig: this._trackingConfig, trackingDataCollector: this._trackingDataCollector }, options));
        this._platforms.push(platform);
        return platform;
    }
    setFramework(Framework) {
        this._framework = new Framework(this);
        return this._framework;
    }
}
exports.default = Kiai;
//# sourceMappingURL=Kiai.js.map