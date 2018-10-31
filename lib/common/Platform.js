"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Kiai_1 = require("../../Kiai");
class Platform {
    registerIntents(flowName, intents) {
        Object.keys(intents).forEach(intentKey => {
            const intentHandler = intents[intentKey];
            if (typeof intentHandler === 'object') {
                return this.registerIntents(flowName, intentHandler);
            }
            if (typeof intentHandler === 'function') {
                this.registerIntent(`${flowName}${Kiai_1.INTENT_DELIMITER}${intentKey}`, intentHandler);
            }
        });
    }
    registerConfirmationIntents(...options) {
        options.forEach(option => {
            this.registerIntent(`confirmation_${option}`, conversation => {
                conversation.handleConfirmation(option);
            });
        });
    }
    registerPermissionIntents() {
        this.registerIntent('permission_confirmation', conversation => {
            conversation.handlePermission(!!conversation.input[0]);
        });
    }
    /* Unfinished feature
      protected registerLoginIntent(): void {
        this.registerIntent('login', conversation => {
          conversation.handleLogin(conversation.input.status === 'OK');
        });
      }
    */
    registerFlows(flows) {
        Object.keys(flows).forEach(flowName => {
            const intents = flows[flowName];
            this.registerIntents(flowName, intents);
        });
    }
    mapLocale(locale) {
        Object.keys(this._localeMapping).find(key => {
            const match = new RegExp(key).test(locale);
            if (match)
                locale = this._localeMapping[key];
            return match;
        });
        return locale;
    }
}
exports.default = Platform;
//# sourceMappingURL=Platform.js.map