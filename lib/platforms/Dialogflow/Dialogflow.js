"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_on_google_1 = require("actions-on-google");
const DialogflowConversation_1 = require("./DialogflowConversation");
const Platform_1 = require("../../common/Platform");
class Dialogflow extends Platform_1.default {
    constructor({ config, clientId = '', debug = false, }) {
        super({ config });
        this.IDENTIFIER = 'dialogflow';
        this.INTENT_DELIMITER = '_';
        this.dialogflow = actions_on_google_1.dialogflow({ clientId, debug });
        this.conversation = new DialogflowConversation_1.default({ config });
        this.registerFlows(config.flows);
        this.registerConfirmationIntents('yes', 'no');
        this.registerPermissionIntents();
    }
    get requestHandler() {
        return this.dialogflow;
    }
    createWrapper(handler) {
        return (conversation, params, ...input) => {
            const intent = conversation.body.queryResult.intent;
            this.conversation.setConversationObject(conversation);
            this.conversation.locale = this.mapLocale(conversation.user.locale);
            this.conversation.params = params || {};
            this.conversation.input = input || [];
            this.conversation.location = conversation.device.location;
            const noInput = !!conversation.arguments.get('REPROMPT_COUNT');
            if (intent.isFallback || noInput) {
                this.conversation.repromptCount++;
            }
            else {
                this.conversation.timesInputRepeated = this.conversation.repromptCount;
                this.conversation.repromptCount = 0;
                this.conversation.clearContext();
                [this.conversation.currentFlow, this.conversation.currentIntent] = intent.displayName.split(this.INTENT_DELIMITER);
            }
            this.conversation.addHandler(handler);
            return this.conversation.handleIntent();
        };
    }
    registerIntent(key, handler) {
        this.dialogflow.intent(key, this.createWrapper(handler));
    }
}
exports.default = Dialogflow;
//# sourceMappingURL=Dialogflow.js.map