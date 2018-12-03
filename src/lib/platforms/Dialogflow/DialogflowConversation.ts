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
  BasicCard,
  List,
  Button,
  RegisterUpdate,
  RegisterUpdateOptions,
} from 'actions-on-google';
import { sample, range, without, get } from 'lodash';
import Conversation from '../../common/Conversation';
import { TKeyValue } from '../../common/types';
import App from 'Kiai';

export default class DialogflowConversation extends Conversation {
  public readonly PERMISSIONS = {
    NAME: 'NAME',
    DEVICE_PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
    DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION',
  };

  public static CAPABILITIES: { [key: string]: SurfaceCapability } = {
    SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT',
    WEB_BROWSER: 'actions.capability.WEB_BROWSER',
  };

  private conversationObject: GoogleDialogflowConversation;

  private followUpEvent: string;

  private responses: any[] = [];

  public get sessionData(): TKeyValue {
    return this.conversationObject.data;
  }

  public get userData(): TKeyValue {
    return this.conversationObject.user.storage;
  }

  public setConversationObject(conversationObject: GoogleDialogflowConversation) {
    this.conversationObject = conversationObject;
  }

  public resetContext(): DialogflowConversation {
    this.previousContext = this.context;
    this.context = '';

    return this;
  }

  public show(image: string, alt: string = image): Conversation {
    const wildcard = /\{(\d+)\}/;
    const matches = image.match(wildcard);

    if (matches) {
      image = image.replace(wildcard, String(sample(range(+matches[1])) + 1));
    }

    const url = this.getImageUrl(image);

    return this.add(new Image({ url, alt }));
  }

  public canTransfer(...capabilities: SurfaceCapability[]): boolean {
    const availableCapabilities = this.conversationObject.available.surfaces.capabilities;
    return capabilities.reduce(
      (result, capability) => result && availableCapabilities.has(capability),
      true,
    );
  }

  public canRedirect(): boolean {
    return (
      this.canLinkOut() ||
      this.canTransfer(
        DialogflowConversation.CAPABILITIES.SCREEN_OUTPUT,
        DialogflowConversation.CAPABILITIES.WEB_BROWSER,
      )
    );
  }

  public redirect({
    url,
    name,
    description = name,
  }: {
    url: string;
    name: string;
    description?: string;
  }): Conversation {
    if (this.canLinkOut()) return this.add(new LinkOutSuggestion({ url, name }));

    if (
      this.canTransfer(
        DialogflowConversation.CAPABILITIES.SCREEN_OUTPUT,
        DialogflowConversation.CAPABILITIES.WEB_BROWSER,
      )
    ) {
      return this.add(
        new NewSurface({
          context: description,
          notification: description,
          capabilities: [
            DialogflowConversation.CAPABILITIES.SCREEN_OUTPUT,
            DialogflowConversation.CAPABILITIES.WEB_BROWSER,
          ],
        }),
      );
    }

    return this;
  }

  public play(sound: string, fallback: string = ''): Conversation {
    const path = `${this.config.storage.rootUrl}${this.config.storage.paths.sfx}`;
    const extension = get(this.config, ['sfx', 'extension'], 'mp3');
    return this.add(`<audio src="${path}${sound}.${extension}">${fallback}</audio>`);
  }

  public speak(voice: string, text: string = ''): Conversation {
    return this.add(
      `<audio src="${this.config.storage.rootUrl}${this.config.storage.paths.voice}${
        this.locale
      }/${voice}.wav">${text}</audio>`,
    );
  }

  /*
  login(callbackIntent: string, speech: string = ''): Conversation {
    this.sessionData.__loginCallback = callbackIntent;
    return this.add(new SignIn(speech));
  }
*/

  /*
  event(event: string): DialogflowConversation {
    this.followUpEvent = event;
    return this;
  }
*/

  public requestPermission(
    permissions: string[] | string,
    deniedIntent: string,
    text?: string,
  ): Conversation {
    if (typeof permissions === 'string') permissions = [permissions];

    const grantedIntent = this.resolveIntent(`:${this.currentIntent}`);
    deniedIntent = this.resolveIntent(deniedIntent);

    this.permissionCallbacks = [grantedIntent, deniedIntent];

    return this.add(
      new Permission({
        context: text,
        permissions: permissions as GoogleActionsV2PermissionValueSpecPermissions[],
      }),
    ).expect('permission_confirmation');
  }

  /** You also have to add the 'intentName' specified in @param options.
   To the AoG Console and enable user engagement for it. */
  public enableTimedNotification(options: RegisterUpdateOptions): Conversation {
    const intent = options.intent.replace(App.INTENT_DELIMITER, '_');
    return this.add(new RegisterUpdate({ ...options, intent }));
  }

  public showCard({
    title,
    subtitle,
    text,
    image,
    buttons = [],
  }: {
    title?: string;
    subtitle?: string;
    text?: string;
    image?: string;
    buttons?: { url: string; title: string }[];
  }): Conversation {
    let imageUrl = this.getImageUrl(image);
    
    return this.add(
      new BasicCard({
        title,
        subtitle,
        text,
        image: imageUrl && new Image({ url: imageUrl, alt: image }),
        buttons: buttons.map(button => new Button(button)),
      }),
    );
  }

  public list(
    title: string,
    items: { title: string; synonyms?: string[]; description?: string; imageUrl?: string }[],
  ): Conversation {
    items = items.map(item => ({
      title: item.title,
      optionInfo: { key: item.title, synonyms: item.synonyms },
      description: item.description,
      image: item.imageUrl && new Image({ url: item.imageUrl, alt: item.title }),
    }));

    return this.add(new List({ title, items }));
  }

  public respond(): DialogflowConversation {
    const simpleResponses = this.output.filter(response => typeof response === 'string');

    if (simpleResponses.length) this.responses.push(`<speak>${simpleResponses.join(' ')}</speak>`);

    this.responses = this.responses.concat(
      this.output.filter(response => typeof response !== 'string'),
    );

    this.output = [];

    return this;
  }

  public hasDisplay(): boolean {
    return this.conversationObject.surface.capabilities.has(
      DialogflowConversation.CAPABILITIES.SCREEN_OUTPUT,
    );
  }

  public hasBrowser(): boolean {
    return this.conversationObject.surface.capabilities.has(
      DialogflowConversation.CAPABILITIES.WEB_BROWSER,
    );
  }

  protected add(output: any): Conversation {
    this.output.push(output);
    return this;
  }

  protected sendResponse(): DialogflowConversation {
    if (this.context) this.conversationObject.contexts.set(this.context, 999);

    if (this.previousContext && this.previousContext !== this.context) {
      this.conversationObject.contexts.delete(this.previousContext);
      this.conversationObject.contexts.delete(this.previousContext.toLowerCase());
    }

    this.respond();

    const imagesAndCards = this.responses.filter(
      response => response instanceof Image || response instanceof BasicCard,
    );
    if (imagesAndCards.length > 1) {
      console.warn('Only 1 image or card per response allowed. Only the last image will be shown.');
      imagesAndCards.pop();
      this.responses = without(this.responses, ...imagesAndCards);
    }

    this.responses.forEach(item => {
      this.conversationObject.add(item);
    });

    this.responses = [];

    this.previousSpeech = this.lastSpeech;
    this.lastSpeech = { key: '' };

    this.previousSuggestions = this.suggestions;
    if (this.suggestions.length) {
      this.conversationObject.add(
        new Suggestions(
          this.suggestions.map(suggestion => this.translate(suggestion).substring(0, 25)),
        ),
      );
      this.suggestions = [];
    }

    if (this.endConversation) {
      this.conversationObject.close();
      this.endConversation = false;
    }

    if (this.followUpEvent) {
      this.conversationObject.followup(this.followUpEvent);
      this.followUpEvent = '';
    }

    return this;
  }

  private canLinkOut(): boolean {
    const capabilities = this.conversationObject.surface.capabilities;
    return (
      capabilities.has(DialogflowConversation.CAPABILITIES.SCREEN_OUTPUT) &&
      capabilities.has(DialogflowConversation.CAPABILITIES.WEB_BROWSER)
    );
  }
  
  private getImageUrl(image): string {
    if (image.match(/^https?:\/\//)) return image;
    
    return `${this.storageUrl}images/${image}.png`;
  }
}
