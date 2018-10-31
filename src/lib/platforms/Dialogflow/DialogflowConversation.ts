import {
  DialogflowConversation as GoogleDialogflowConversation,
  Image,
  // SignIn,
  Suggestions,
  LinkOutSuggestion,
  Permission,
  GoogleActionsV2PermissionValueSpecPermissions,
  NewSurface,
  SurfaceCapability,
} from 'actions-on-google';
import Conversation from '../../common/Conversation';
import { TKeyValue } from '../../common/Types';
import { sample, range } from 'lodash';

const storageUrl = require('../../../../config/storage.json').bucketUrl;

export default class DialogflowConversation extends Conversation {
  readonly PERMISSIONS = {
    NAME: 'NAME',
    DEVICE_PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
    DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION',
  };

  readonly CAPABILITIES: { [key: string]: SurfaceCapability } = {
    SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT',
    WEB_BROWSER: 'actions.capability.WEB_BROWSER',
  };

  private _conversationObject: GoogleDialogflowConversation;

  private _followUpEvent: string;

  private _responses: any[] = [];

  get sessionData(): TKeyValue {
    return this._conversationObject.data;
  }

  get userData(): TKeyValue {
    return this._conversationObject.user.storage;
  }

  set conversationObject(conversationObject: GoogleDialogflowConversation) {
    this._conversationObject = conversationObject;
  }

  private canLinkOut(): boolean {
    const capabilities = this._conversationObject.surface.capabilities;
    return (
      capabilities.has(this.CAPABILITIES.SCREEN_OUTPUT) &&
      capabilities.has(this.CAPABILITIES.WEB_BROWSER)
    );
  }

  protected add(output: any): Conversation {
    this._output.push(output);
    return this;
  }

  protected sendResponse(): DialogflowConversation {
    this._conversationObject.contexts.set(this.currentFlow, 1);
    if (this.context) this._conversationObject.contexts.set(this.context, 1);

    this.respond();

    const images = this._responses.filter(response => response instanceof Image);
    if (images.length > 1) {
      const image = images.pop();
      this._responses = this._responses.filter(
        response => !(response instanceof Image) || response === image,
      );
    }

    this._responses.forEach(item => {
      this._conversationObject.add(item);
    });

    this._responses = [];
    
    this.previousSpeech = this._lastSpeech;
    this._lastSpeech = '';

    this.previousSuggestions = this._suggestions;
    if (this._suggestions.length) {
      this._conversationObject.add(
        new Suggestions(
          this._suggestions.map(suggestion => this.translate(suggestion).substring(0, 25)),
        ),
      );
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

  clearContext(): void {
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

  show(image: string, alt: string = image): Conversation {
    const wildcard = /\{(\d+)\}/;
    const matches = image.match(wildcard);

    if (matches) {
      image = image.replace(wildcard, String(sample(range(+matches[1])) + 1));
    }

    const url = `${storageUrl}images/${image}.png`;
    return this.add(new Image({ url, alt }));
  }

  canTransfer(...capabilities: SurfaceCapability[]): boolean {
    const availableCapabilities = this._conversationObject.available.surfaces.capabilities;
    return capabilities.reduce(
      (result, capability) => result && availableCapabilities.has(capability),
      true,
    );
  }

  canRedirect(): boolean {
    return (
      this.canLinkOut() ||
      this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER)
    );
  }

  redirect({
    url,
    name,
    description = name,
  }: {
    url: string;
    name: string;
    description?: string;
  }): Conversation {
    if (this.canLinkOut()) return this.add(new LinkOutSuggestion({ url, name }));

    if (this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER)) {
      return this.add(
        new NewSurface({
          context: description,
          notification: description,
          capabilities: [this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER],
        }),
      );
    }

    return this;
  }

  play(sound: string, fallback: string = ''): Conversation {
    return this.add(`<audio src="${storageUrl}audio/${sound}.mp3">${fallback}</audio>`);
  }

  speak(voice: string, text: string): Conversation {
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

  requestPermission(
    permissions: string[] | string,
    deniedIntent: string,
    text?: string,
  ): Conversation {
    if (typeof permissions === 'string') permissions = [permissions];

    const grantedIntent = this.resolveIntent(this.currentIntent);
    deniedIntent = this.resolveIntent(deniedIntent);

    this.permissionCallbacks = [grantedIntent, deniedIntent];

    return this.add(
      new Permission({
        context: text,
        permissions: permissions as GoogleActionsV2PermissionValueSpecPermissions[],
      }),
    ).expect('permission_confirmation');
  }

  respond(): DialogflowConversation {
    const simpleResponses = this._output.filter(response => typeof response === 'string');

    if (simpleResponses.length) this._responses.push(`<speak>${simpleResponses.join(' ')}</speak>`);

    this._responses = this._responses.concat(
      this._output.filter(response => typeof response !== 'string'),
    );

    this._output = [];

    return this;
  }
}
