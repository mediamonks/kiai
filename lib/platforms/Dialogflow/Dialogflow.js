"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_on_google_1 = require("actions-on-google");
const DialogflowConversation_1 = require("./DialogflowConversation");
const Platform_1 = require("../../common/Platform");
class Dialogflow extends Platform_1.default {
    constructor({ flows = {}, locales = {}, localeMapping = {}, dialog = {}, voice = {}, clientId = '', debug = false, trackingConfig = {}, trackingDataCollector, }) {
        super();
        this.IDENTIFIER = 'dialogflow';
        this.INTENT_DELIMITER = '_';
        this._localeMapping = localeMapping;
        this._dialogflow = actions_on_google_1.dialogflow({ clientId, debug });
        this._conversation = new DialogflowConversation_1.default({
            flows,
            locales,
            platform: this,
            dialog,
            voice,
            trackingConfig,
            trackingDataCollector,
        });
        this.registerFlows(flows);
        this.registerConfirmationIntents('yes', 'no');
        this.registerPermissionIntents();
    }
    get requestHandler() {
        return this._dialogflow;
    }
    createWrapper(handler) {
        return (conversation, params, ...input) => {
            const intent = conversation.body.queryResult.intent;
            this._conversation.conversationObject = conversation;
            this._conversation.locale = this.mapLocale(conversation.user.locale);
            this._conversation.params = params || {};
            this._conversation.input = input || [];
            this._conversation.location = conversation.device.location;
            const noInput = !!conversation.arguments.get('REPROMPT_COUNT');
            if (intent.isFallback || noInput) {
                this._conversation.repromptCount++;
            }
            else {
                this._conversation.timesInputRepeated = this._conversation.repromptCount;
                this._conversation.repromptCount = 0;
                this._conversation.clearContext();
                this._conversation.currentFlow = intent.displayName.split(this.INTENT_DELIMITER)[0];
                this._conversation.currentIntent = intent.displayName.split(this.INTENT_DELIMITER)[1];
            }
            this._conversation.addHandler(handler);
            return this._conversation.handleIntent();
        };
    }
    registerIntent(key, handler) {
        this._dialogflow.intent(key, this.createWrapper(handler));
    }
}
exports.default = Dialogflow;
//# sourceMappingURL=Dialogflow.js.map