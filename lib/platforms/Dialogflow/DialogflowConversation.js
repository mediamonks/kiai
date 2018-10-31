"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const actions_on_google_1 = require("actions-on-google");
const Conversation_1 = require("../../common/Conversation");
const lodash_1 = require("lodash");
const storageUrl = require('../../../../config/storage.json').bucketUrl;
class DialogflowConversation extends Conversation_1.default {
    constructor() {
        super(...arguments);
        this.PERMISSIONS = {
            NAME: 'NAME',
            DEVICE_PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
            DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION',
        };
        this.CAPABILITIES = {
            SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT',
            WEB_BROWSER: 'actions.capability.WEB_BROWSER',
        };
        this._responses = [];
    }
    get sessionData() {
        return this._conversationObject.data;
    }
    get userData() {
        return this._conversationObject.user.storage;
    }
    set conversationObject(conversationObject) {
        this._conversationObject = conversationObject;
    }
    canLinkOut() {
        const capabilities = this._conversationObject.surface.capabilities;
        return (capabilities.has(this.CAPABILITIES.SCREEN_OUTPUT) &&
            capabilities.has(this.CAPABILITIES.WEB_BROWSER));
    }
    add(output) {
        this._output.push(output);
        return this;
    }
    sendResponse() {
        this._conversationObject.contexts.set(this.currentFlow, 1);
        if (this.context)
            this._conversationObject.contexts.set(this.context, 1);
        this.respond();
        const images = this._responses.filter(response => response instanceof actions_on_google_1.Image);
        if (images.length > 1) {
            const image = images.pop();
            this._responses = this._responses.filter(response => !(response instanceof actions_on_google_1.Image) || response === image);
        }
        this._responses.forEach(item => {
            this._conversationObject.add(item);
        });
        this._responses = [];
        this.previousSpeech = this._lastSpeech;
        this._lastSpeech = '';
        this.previousSuggestions = this._suggestions;
        if (this._suggestions.length) {
            this._conversationObject.add(new actions_on_google_1.Suggestions(this._suggestions.map(suggestion => this.translate(suggestion).substring(0, 25))));
            this._suggestions = [];
        }
        if (this._endConversation) {
            this._conversationObject.close();
            this._endConversation = false;
        }
        if (this._followUpEvent) {
            this._conversationObject.followup(this._followUpEvent);
            this._followUpEvent = '';
        }
        return this;
    }
    clearContext() {
        if (this.currentFlow) {
            this._conversationObject.contexts.delete(this.currentFlow);
            this._conversationObject.contexts.delete(this.currentFlow.toLowerCase());
        }
        if (this.context) {
            this._conversationObject.contexts.delete(this.context);
            this._conversationObject.contexts.delete(this.context.toLowerCase());
            this.previousContext = this.context;
            this.context = '';
        }
    }
    show(image, alt = image) {
        const wildcard = /\{(\d+)\}/;
        const matches = image.match(wildcard);
        if (matches) {
            image = image.replace(wildcard, String(lodash_1.sample(lodash_1.range(+matches[1])) + 1));
        }
        const url = `${storageUrl}images/${image}.png`;
        return this.add(new actions_on_google_1.Image({ url, alt }));
    }
    canTransfer(...capabilities) {
        const availableCapabilities = this._conversationObject.available.surfaces.capabilities;
        return capabilities.reduce((result, capability) => result && availableCapabilities.has(capability), true);
    }
    canRedirect() {
        return (this.canLinkOut() ||
            this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER));
    }
    redirect({ url, name, description = name, }) {
        if (this.canLinkOut())
            return this.add(new actions_on_google_1.LinkOutSuggestion({ url, name }));
        if (this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER)) {
            return this.add(new actions_on_google_1.NewSurface({
                context: description,
                notification: description,
                capabilities: [this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER],
            }));
        }
        return this;
    }
    play(sound, fallback = '') {
        return this.add(`<audio src="${storageUrl}audio/${sound}.mp3">${fallback}</audio>`);
    }
    speak(voice, text) {
        return this.add(`<audio src="${storageUrl}voice/${this.locale}/${voice}.wav">${text}</audio>`);
    }
    /*
    login(callbackIntent: string, speech: string = ''): Conversation {
      this.sessionData.__loginCallback = callbackIntent;
      return this.add(new SignIn(speech));
    }
  */
    /*
    event(event: string): DialogflowConversation {
      this._followUpEvent = event;
      return this;
    }
  */
    requestPermission(permissions, deniedIntent, text) {
        if (typeof permissions === 'string')
            permissions = [permissions];
        const grantedIntent = this.resolveIntent(this.currentIntent);
        deniedIntent = this.resolveIntent(deniedIntent);
        this.permissionCallbacks = [grantedIntent, deniedIntent];
        return this.add(new actions_on_google_1.Permission({
            context: text,
            permissions: permissions,
        })).expect('permission_confirmation');
    }
    respond() {
        const simpleResponses = this._output.filter(response => typeof response === 'string');
        if (simpleResponses.length)
            this._responses.push(`<speak>${simpleResponses.join(' ')}</speak>`);
        this._responses = this._responses.concat(this._output.filter(response => typeof response !== 'string'));
        this._output = [];
        return this;
    }
}
exports.default = DialogflowConversation;
//# sourceMappingURL=DialogflowConversation.js.map