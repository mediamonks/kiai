import { get, isArray, sample } from 'lodash';
import * as MessageFormat from 'messageformat';
import * as uniqid from 'uniqid';
import App from './App';
import {
  TAppConfig,
  TFlows,
  THistoryItem,
  TIntentHandler,
  TKeyValue,
  TLocales,
  TMapping,
  TSpeech,
  TTrackingDataCollector,
} from './types';
import Tracker from './Tracker';
import Platform from './Platform';

export default abstract class Conversation {
  public abstract readonly PERMISSIONS: {
    NAME: string;
    DEVICE_PRECISE_LOCATION: string;
    DEVICE_COARSE_LOCATION: string;
  };

  public abstract readonly CAPABILITIES: {
    SCREEN_OUTPUT: string,
    WEB_BROWSER: string,
  };

  public abstract readonly TEXT_BUBBLE_LIMIT: Number;

  public abstract readonly sessionData: TKeyValue;

  public abstract readonly userData: TKeyValue;

  public abstract readonly userProfile: TKeyValue;

  public params: TKeyValue;

  public input: any[];

  public location: any;

  public currentIntent: string;

  public platform: Platform;

  public noInput: boolean = false;

  public scene: any;

  protected readonly config: TAppConfig;

  protected _locale: string = 'en-US';

  protected output: any[] = [];

  protected endConversation: boolean = false;

  protected suggestions: string[] = [];

  protected lastSpeech: TSpeech = { key: '' };

  private intentHandlers: { handler: TIntentHandler; payload: any }[] = [];

  private tracker: Tracker;

  public constructor({ config, platform }: { config: TAppConfig; platform: Platform }) {
    this.config = config;
    this.platform = platform;
  }

  public get userId(): string {
    let userId = this.userData.id;
    if (!userId) {
      userId = uniqid();
      this.userData.id = userId;
    }
    return <string>userId;
  }

  public set locale(locale: string) {
    if (!this.locales[locale]) return;
    this._locale = locale;
  }

  public get locale(): string {
    return this._locale;
  }

  public set repromptCount(count: number) {
    this.sessionData.__repromptCount = count;
  }

  public get repromptCount(): number {
    return +(this.sessionData.__repromptCount || 0);
  }

  public set currentFlow(flow: string) {
    this.sessionData.__flow = flow;
  }

  public get currentFlow(): string {
    return <string>(this.sessionData.__flow || '');
  }

  public set timesInputRepeated(count: number) {
    this.sessionData.__timesInputRepeated = count;
  }

  public get timesInputRepeated(): number {
    return <number>(this.sessionData.__timesInputRepeated || 0);
  }

  public get history(): THistoryItem[] {
    this.sessionData.__history = this.sessionData.__history || [];
    return <THistoryItem[]>(<any[]>this.sessionData.__history);
  }

  public set version(version: string) {
    this.sessionData.__version = version;
  }

  protected set context(context: string) {
    this.sessionData.__context = context;
  }

  protected get context(): string {
    return <string>this.sessionData.__context;
  }

  protected set previousContext(context: string) {
    this.sessionData.__previousContext = context;
  }

  protected get previousContext(): string {
    return <string>this.sessionData.__previousContext;
  }

  protected set previousSpeech(speech: TSpeech) {
    this.sessionData.__lastSpeech = speech;
  }

  protected get previousSpeech(): TSpeech {
    return <TSpeech>(this.sessionData.__lastSpeech || { key: '' });
  }

  protected set previousSuggestions(suggestions: string[]) {
    this.sessionData.__lastSuggestions = suggestions;
  }

  protected get previousSuggestions(): string[] {
    return <string[]>(this.sessionData.__lastSuggestions || []);
  }

  protected get lastUsedDialogVariants(): { [key: string]: string } {
    this.sessionData.__lastVariants = this.sessionData.__lastVariants || {};
    return <{ [key: string]: string }>this.sessionData.__lastVariants;
  }

  protected set permissionCallbacks(callbacks: [string, string]) {
    this.sessionData.__permissionCallbacks = callbacks;
  }

  protected get permissionCallbacks(): [string, string] {
    return <[string, string]>(this.sessionData.__permissionCallbacks || ['', '']);
  }

  protected get storageUrl(): string {
    return <string>(this.config.storage.rootUrl || '');
  }

  protected get voice(): string[] {
    return this.config.voice[this.locale] || [];
  }

  protected set loginCallback(callbackIntent: string) {
    this.sessionData.__loginCallback = this.resolveIntent(callbackIntent);
  }

  protected get loginCallback(): string {
    return <string>(this.sessionData.__loginCallback || '');
  }

  protected get updateRegistrationCallback(): string {
    return <string>(this.sessionData.__updateRegistrationCallback || '');
  }

  protected set updateRegistrationCallback(callbackIntent: string) {
    this.sessionData.__updateRegistrationCallback = this.resolveIntent(callbackIntent);
  }

  private set confirmationCallbacks(options: TMapping) {
    this.sessionData.__confirmation = options;
  }

  private get confirmationCallbacks(): TMapping {
    return <TMapping>this.sessionData.__confirmation;
  }

  private get returnDirectives(): string[] {
    if (!this.sessionData.__callbacks) this.sessionData.__callbacks = <string[]>[];
    return <string[]>this.sessionData.__callbacks;
  }

  private get dialog(): TKeyValue {
    return this.config.dialog[this.locale] || {};
  }

  private get flows(): TFlows {
    return this.config.flows;
  }

  private get locales(): TLocales {
    return this.config.locales;
  }

  private get trackingDataCollector(): TTrackingDataCollector {
    return this.config.tracking.dataCollector;
  }

  public abstract canLinkOut(): boolean;

  public abstract show(image: string, alt?: string): Conversation;

  public abstract canTransfer(...capabilities: any[]): boolean;

  public abstract transfer(...capabilities: any[]): Conversation;

  public abstract canRedirect(): boolean;

  public abstract redirect({
    url,
    name,
    description,
  }: {
    url: string;
    name: string;
    description?: string;
  }): Conversation;

  public abstract play(sound: string, fallback?: string): Conversation;

  public abstract speak(voice: string, text?: string): Conversation;

  public abstract login(callbackIntent: string, speech?: string): Conversation;

  // public abstract event(event: string): Conversation;

  public abstract showCard({
    title,
    subtitle,
    text,
    image,
    buttons,
  }: {
    title?: string;
    subtitle?: string;
    text?: string;
    image?: string;
    buttons?: { url: string; title: string }[];
  }): Conversation;

  public abstract requestPermission(
    permissions: string[] | string,
    deniedIntent: string,
    text?: string,
    extra?: TKeyValue
  ): Conversation;

  public abstract requestNotificationPermission(
    intent: string,
    deniedIntent: string,
    text?: string,
    payload?: TKeyValue
  ): Conversation

  public abstract respond(): Conversation;

  public abstract list(options: {
    title?: string;
    items: {
      title: string;
      synonyms?: string[];
      description?: string;
      image?: string;
      key?: string;
    }[];
  }): Conversation;

  public abstract enableDailyNotification(intent: string, callbackIntent: string, payload?: TMapping): Conversation;

  protected abstract sendResponse(): Conversation;

  public suggest(...suggestions: string[]): Conversation {
    this.suggestions = this.suggestions.concat(suggestions);
    return this;
  }

  public translate(path: string, params?: TMapping | string[]): string {
    let msgSrc = get(this.locales[this.locale], path);

    if (!msgSrc) {
      // if it contains anything other than lowercase letters, digits and underscores, it's probably not a key, so we don't show a warning
      if (!path.match(/^[\w\d]+$/))
        console.warn(`Translation not defined for language "${this.locale}", path "${path}"`);
      return path;
    }

    if (isArray(msgSrc)) msgSrc = <string>sample(msgSrc);

    const mf = new MessageFormat(this.locale);
    const msg = mf.compile(<string>msgSrc);

    return msg({ ...params });
  }

  public say(key: string, params?: TMapping | string[]): Conversation {
    key = String(key);

    this.lastSpeech = { key, params };

    const regex = new RegExp(`^${key.replace('*', '\\d+')}$`);
    let dialogVariants = Object.keys(this.dialog).filter(key => regex.test(key));

    let speech;
    let voices;
    if (!dialogVariants.length) {
      speech = key;
    } else {
      let dialogVariant;
      if (dialogVariants.length === 1) {
        dialogVariant = dialogVariants[0];
      } else {
        const lastUsedVariant = this.lastUsedDialogVariants[key];
        if (lastUsedVariant) {
          dialogVariants = dialogVariants.filter(variant => variant !== lastUsedVariant);
        }

        dialogVariant = sample(dialogVariants);
        this.lastUsedDialogVariants[key] = dialogVariant;
      }

      speech = this.dialog[dialogVariant];

      voices = this.voice.filter(key => new RegExp(`^${dialogVariant}_?[A-Z]`).test(key));
    }

    if (params) {
      Object.keys(params).forEach(key => {
        speech = speech.replace(`{${key}}`, params[key]);
      });
    }

    if (voices && voices.length) {
      return this.speak(sample(voices), speech);
    }

    speech = speech.split('\b');
    if (speech.length > this.TEXT_BUBBLE_LIMIT) {
      throw new Error(
        `More than ${this.TEXT_BUBBLE_LIMIT} text bubbles are currently not supported.`,
      );
    }

    while (speech.length > 1) {
      this.add(speech.shift()).respond();
    }

    return this.add(speech.pop());
  }

  public next(intent: string, payload?: any): Conversation {
    intent = this.resolveIntent(intent);

    let [flowName, intentName] = intent.split(App.INTENT_DELIMITER);

    const handler = this.flows[flowName][intentName];

    if (typeof handler !== 'function') {
      throw new Error(`Target intent not found: "${flowName}${App.INTENT_DELIMITER}${intentName}"`);
    }

    this.currentFlow = flowName;
    this.currentIntent = intentName;

    this.addHistory(flowName, intentName, false);

    return this.addHandler(handler, payload);
  }

  public returnTo(intent: string): Conversation {
    this.returnDirectives.push(this.resolveIntent(intent));
    return this;
  }

  public end(): Conversation {
    this.endConversation = true;
    return this;
  }

  public compare(string1: string, string2: string): boolean {
    return !string1.localeCompare(string2, this.locale, {
      usage: 'search',
      sensitivity: 'base',
      ignorePunctuation: true,
    });
  }

  public expect(context: string): Conversation {
    this.context = context;
    return this;
  }

  public repeat(): Conversation {
    if (this.previousSpeech.key) this.say(this.previousSpeech.key, this.previousSpeech.params);

    this
      .suggest(...this.previousSuggestions)
      .expect(this.previousContext);

    return this;
  }

  public pause(seconds: number = 0.5): Conversation {
    this.add(`\n<break time="${seconds}s"/>`);
    return this;
  }

  public return(payload?: TKeyValue): Conversation {
    const intentDirective = this.returnDirectives.pop();

    if (!intentDirective) throw new Error('Conversation.return() called but no return intent set.');

    return this.next(intentDirective, payload);
  }

  public confirm(options: TMapping): Conversation {
    const confirmationOptions = Object.keys(options);

    confirmationOptions.forEach(key => (options[key] = this.resolveIntent(options[key])));

    this.confirmationCallbacks = options;

    return this.suggest(...confirmationOptions).expect('confirmation');
  }

  public track(event: string, data?: TKeyValue): Conversation {
    this.tracker = this.tracker || new Tracker(this.config.tracking);

    let userData;
    if (typeof this.trackingDataCollector === 'function')
      userData = this.trackingDataCollector(this);

    this.tracker.trackEvent({ userId: this.userId, event, data, userData });

    return this;
  }

  public addHandler(handler: TIntentHandler, payload?: any): Conversation {
    this.intentHandlers.push({ handler, payload });
    return this;
  }

  public handleConfirmation(option: string): Conversation {
    const intent = this.confirmationCallbacks[option];
    this.confirmationCallbacks = {};
    return this.next(intent);
  }

  public handlePermission(granted: boolean): Conversation {
    return this.next(this.permissionCallbacks[+!granted], granted);
  }

  public handleIntent(): Promise<any> {
    return new Promise(resolve => {
      const executeHandler = (): void => {
        if (!this.intentHandlers.length) {
          resolve();
        } else {
          const { handler, payload } = this.intentHandlers.shift();
          Promise.resolve(handler(this, payload))
            .then(() => executeHandler())
            .catch(error => {
              this.handleError(error);
              resolve();
            });
        }
      };

      setTimeout(executeHandler, 0);
    }).then(() => this.sendResponse());
  }

  public addHistory(flow: string, intent: string, user: boolean = false): Conversation {
    this.history.push({ flow, intent, user });
    return this;
  }

  public handleLogin(wasSuccessful: boolean): Conversation {
    return this.next(this.loginCallback, wasSuccessful);
  }

  public handleUpdateRegistration(confirmed: boolean): Conversation {
    return this.next(this.updateRegistrationCallback, confirmed);
  }

  public abstract hasDisplay(): boolean;

  public abstract hasBrowser(): boolean;

  protected add(output: any): Conversation {
    this.output.push(output);
    return this;
  }

  protected resolveIntent(intent: string): string {
    let [flowName, intentName] = intent.split(App.INTENT_DELIMITER);

    if (!flowName) flowName = this.currentFlow;

    if (!intentName) {
      const flow = this.flows[flowName];
      if (!flow) throw new Error(`Target flow not found: "${flowName}"`);
      intentName = <string>flow.entryPoint || 'start';
    }

    return `${flowName}${App.INTENT_DELIMITER}${intentName}`;
  }

  private handleError(error: Error): Conversation {
    this.say('error_*', { error: error.toString() });
    console.error(error.stack);
    return this;
  }
}
