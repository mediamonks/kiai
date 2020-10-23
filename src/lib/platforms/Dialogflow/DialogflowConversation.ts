import {
  DialogflowConversation as GoogleDialogflowConversation,
  Image,
  SignIn,
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
  SimpleResponse,
  Carousel,
  BrowseCarousel,
  BrowseCarouselItem,
  BrowseCarouselItemOptions,
  ImageOptions,
} from 'actions-on-google';
import { sample, range, without } from 'lodash';
import Conversation from '../../common/Conversation';
import { TKeyValue, TMapping, TImmersiveResponse, TLinkOutType } from '../../common/types';
import App from '../../common/App';

export default class DialogflowConversation extends Conversation {
  public readonly PERMISSIONS = {
    NAME: 'NAME',
    DEVICE_PRECISE_LOCATION: 'DEVICE_PRECISE_LOCATION',
    DEVICE_COARSE_LOCATION: 'DEVICE_COARSE_LOCATION',
  };

  public readonly CAPABILITIES = {
    SCREEN_OUTPUT: 'actions.capability.SCREEN_OUTPUT' as SurfaceCapability,
    WEB_BROWSER: 'actions.capability.WEB_BROWSER' as SurfaceCapability,
  };

  public readonly TEXT_BUBBLE_LIMIT: Number = 2;

  private conversationObject: GoogleDialogflowConversation;

  private followUpEvent: string;

  private responses: any[] = [];

  public get sessionData(): TKeyValue {
    return this.conversationObject.data;
  }

  public get userData(): TKeyValue {
    return this.conversationObject.user.storage;
  }

  public get userProfile(): TKeyValue {
    return <TKeyValue>(<any>this.conversationObject.user.profile.payload);
  }

  private set immersiveUrlSent(hasBeenSent: boolean) {
    this.sessionData.__immersiveUrlSent = hasBeenSent;
  }

  private get immersiveUrlSent(): boolean {
    return <boolean>(this.sessionData.__immersiveUrlSent || false);
  }

  public setConversationObject(conversationObject: GoogleDialogflowConversation) {
    this.conversationObject = conversationObject;
  }

  public show(image: string, alt: string = image): Conversation {
    const wildcard = /{(\d+)}/;
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
      this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER)
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

    if (this.canTransfer(this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER)) {
      return this.transfer(
        [this.CAPABILITIES.SCREEN_OUTPUT, this.CAPABILITIES.WEB_BROWSER],
        description,
      );
    }

    return this;
  }

  public linkOut(
    url: string,
    title: string,
    type: TLinkOutType = this.LINK_OUT_TYPE.SUGGESTION,
  ): Conversation {
    if (type === this.LINK_OUT_TYPE.BUTTON) {
      return this.add(new Button({ url, title }));
    }

    return this.add(new LinkOutSuggestion({ url, name: title }));
  }

  public transfer(capabilities: SurfaceCapability[], description: string): Conversation {
    return this.add(
      new NewSurface({
        context: description,
        notification: description,
        capabilities,
      }),
    );
  }

  public play(sound: string, fallback: string = ''): Conversation {
    return this.add(`<audio src="${this.getAssetUrl('sfx', sound)}">${fallback}</audio>`);
  }

  public speak(voice: string, text: string = ''): Conversation {
    if (!this.voice.find(key => key === voice)) {
      return this.add(new SimpleResponse({ speech: voice, text }));
    }

    const fileName = `${this.locale}/${voice}`;

    return this.add(`<audio src="${this.getAssetUrl('voice', fileName)}">${text}</audio>`);
  }

  public login(callbackIntent: string, speech: string = ''): Conversation {
    this.loginCallback = callbackIntent;
    return this.add(new SignIn(speech));
  }

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
    extra?: TKeyValue,
  ): Conversation {
    if (typeof permissions === 'string') permissions = [permissions];

    const grantedIntent = this.resolveIntent(`:${this.currentIntent}`);
    deniedIntent = this.resolveIntent(deniedIntent);

    this.permissionCallbacks = [grantedIntent, deniedIntent];

    return this.add(
      new Permission({
        context: text,
        permissions: permissions as GoogleActionsV2PermissionValueSpecPermissions[],
        extra,
      }),
    ).expect('permission_confirmation');
  }

  public requestNotificationPermission(
    intent: string,
    deniedIntent: string,
    text?: string,
    payload: TKeyValue = {},
  ) {
    return this.requestPermission('UPDATE', deniedIntent, text, {
      updatePermissionValueSpec: { intent, arguments: [payload] },
    });
  }

  public enableDailyNotification(
    intent: string,
    callbackIntent: string = `:${this.currentIntent}`,
    payload: TMapping = {},
  ): Conversation {
    const args = Object.keys(payload).map(name => ({
      name,
      textValue: payload[name],
    }));

    intent = this.resolveIntent(intent).replace(
      App.INTENT_DELIMITER,
      this.platform.INTENT_DELIMITER,
    );

    this.updateRegistrationCallback = callbackIntent;

    return this.add(new RegisterUpdate({ intent, arguments: args, frequency: 'DAILY' }));
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
    let imageUrl = image && this.getImageUrl(image);

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

  public list({
    title,
    items,
  }: {
    title?: string;
    items: {
      title: string;
      synonyms?: string[];
      description?: string;
      image?: string;
      key?: string;
    }[];
  }): Conversation {
    const listItems = items.map(item => ({
      title: item.title,
      optionInfo: { key: item.key || item.title, synonyms: item.synonyms },
      description: item.description,
      image: item.image && new Image({ url: this.getImageUrl(item.image), alt: item.title }),
    }));

    return this.add(new List({ title, items: listItems }));
  }

  public carousel({
    items,
  }: {
    items: {
      title?: string;
      description?: string;
      image?: string | ImageOptions;
      synonyms?: string[];
      url?: string;
      footer?: string;
      key?: string;
    }[];
  }): Conversation {
    const isBrowse = !!items.find(item => !!item.url);

    const hasKeys = !!items.find(item => !!item.key);

    if (isBrowse && hasKeys)
      throw new Error('Carousel items can have either all "url"s, or all "key"s, but not a mix');

    if (items.length < 2 || items.length > 10)
      throw new Error('Carousel requires a minimum of 2 and a maximum of 10 items');

    const listItems = hasKeys ? {} : [];

    items.forEach(item => {
      if (!isBrowse && item.footer) throw new Error("Carousel item can't have footer without url");

      if (isBrowse && !item.title) throw new Error("Carousel items with a url require a title");

      if (hasKeys && !item.key)
        throw new Error("Either all or none of a carousel's items should have a key");

      if (typeof item.image === 'string') {
        item.image = { url: item.image, alt: '' };
      }

      item.image.url = this.getImageUrl(item.image.url);
      item.image.alt = item.image.alt || item.title || item.description;

      let listItem = { ...item, image: new Image(item.image) };

      if (isBrowse) {
        (listItems as BrowseCarouselItem[]).push(
          new BrowseCarouselItem(listItem as BrowseCarouselItemOptions),
        );
        return;
      }

      delete listItem.key;
      listItems[item.key] = listItem;
    });

    if (isBrowse) {
      return this.add(new BrowseCarousel({ items: listItems as BrowseCarouselItem[] }));
    } else {
      return this.add(new Carousel({ items: listItems }));
    }
  }

  public respond(): DialogflowConversation {
    const simpleResponses = this.output.filter(response => typeof response === 'string');

    if (simpleResponses.length) {
      let responseText = simpleResponses.join(' ');
      if (!this.config.disableSsml) responseText = `<speak>${responseText}</speak>`;
      this.responses.push(responseText);
    }

    this.responses = this.responses.concat(
      this.output.filter(response => typeof response !== 'string'),
    );

    this.output = [];

    return this;
  }

  public hasDisplay(): boolean {
    return this.conversationObject.surface.capabilities.has(this.CAPABILITIES.SCREEN_OUTPUT);
  }

  public hasBrowser(): boolean {
    return this.conversationObject.surface.capabilities.has(this.CAPABILITIES.WEB_BROWSER);
  }

  public canLinkOut(): boolean {
    const capabilities = this.conversationObject.surface.capabilities;
    return (
      capabilities.has(this.CAPABILITIES.SCREEN_OUTPUT) &&
      capabilities.has(this.CAPABILITIES.WEB_BROWSER)
    );
  }

  protected sendResponse(): DialogflowConversation {
    this.conversationObject.contexts.output = this.context
      ? { [this.context]: { lifespan: 1 } }
      : {};

    this.previousContext = this.context;
    this.context = '';

    // TODO temporary measure to solve undefined suggestions causing crash
    this.suggestions = this.suggestions.filter(suggestion => typeof suggestion === 'string');

    this.previousSuggestions = this.suggestions;

    if (this.suggestions.length) {
      this.add(
        new Suggestions(
          this.suggestions.map(suggestion => this.translate(suggestion).substring(0, 25)),
        ),
      );
      this.suggestions = [];
    }

    this.respond();

    if (this.config.viewUrl) {
      const simpleResponses = this.responses.filter(response => typeof response === 'string');

      if (this.responses.length > simpleResponses.length) {
        console.warn('Rich responses are ignored when using ImmersiveResponse (viewUrl).');
      }

      const immersiveResponse: TImmersiveResponse = {
        updatedState: {
          fields: { userData: this.userData, sessionData: this.sessionData, scene: this.scene },
        },
      };

      if (!this.immersiveUrlSent) immersiveResponse.loadImmersiveUrl = this.config.viewUrl;

      this.immersiveUrlSent = true;

      this.responses = [{ immersiveResponse, ...simpleResponses }];
    } else {
      const imagesAndCards = this.responses.filter(
        response => response instanceof Image || response instanceof BasicCard,
      );

      if (imagesAndCards.length > 1) {
        console.warn(
          'Only 1 image or card per response allowed. Only the last image will be shown.',
        );
        imagesAndCards.pop();
        this.responses = without(this.responses, ...imagesAndCards);
      }
    }

    this.conversationObject.add(...this.responses);

    this.responses = [];

    this.previousSpeech = this.lastSpeech;
    this.lastSpeech = { key: '' };

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
}
