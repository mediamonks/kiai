import { get, isArray, sample } from 'lodash';
import * as MessageFormat from 'messageformat';
import * as uniqid from 'uniqid';
import App from './App';
import {
  TAppConfig,
  TFlows,
  TIntentHandler,
  TKeyValue,
  TLocales,
  TMapping,
  TTrackingDataCollector,
} from './Types';
import Tracker from './Tracker';

export default abstract class Conversation {
  public abstract readonly PERMISSIONS: {
    NAME: string;
    DEVICE_PRECISE_LOCATION: string;
    DEVICE_COARSE_LOCATION: string;
  };

  public abstract readonly sessionData: TKeyValue;

  public abstract readonly userData: TKeyValue;

  public params: TKeyValue;

  public input: (string | boolean)[];

  public location: any;

  public currentIntent: string;

  protected readonly config: TAppConfig;

  protected _locale: string = 'en-US';

  protected output: any[] = [];

  protected endConversation: boolean = false;

  protected suggestions: string[] = [];

  protected lastSpeech: string = '';

  private intentHandlers: { handler: TIntentHandler, payload: any}[] = [];

  private tracker: Tracker;

  public constructor({ config }: { config: TAppConfig }) {
    this.config = config;
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

  protected set previousSpeech(speech: string) {
    this.sessionData.__lastSpeech = speech;
  }

  protected get previousSpeech(): string {
    return <string>(this.sessionData.__lastSpeech || '');
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

  private get payloads(): any[] {
    if (!this.sessionData.__payloads) this.sessionData.__payloads = <any[]>[];
    return <any[]>this.sessionData.__payloads;
  }

  private get dialog(): TKeyValue {
    return this.config.dialog[this.locale];
  }

  private get voice(): string[] {
    return this.config.voice[this.locale] || [];
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

  public abstract show(image: string, alt?: string): Conversation;

  public abstract canTransfer(...capabilities: any[]): boolean;

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

  public abstract speak(voice: string, text: string): Conversation;

  // public abstract login(speech?: string): void;

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
  ): Conversation;

  public abstract respond(): Conversation;

  protected abstract add(output: any): Conversation;

  protected abstract sendResponse(): Conversation;

  public suggest(...suggestions: string[]): Conversation {
    this.suggestions = this.suggestions.concat(suggestions);
    return this;
  }

  public translate(path: string, params: string[] = []): string {
    let msgSrc = get(this.locales[this.locale], path);

    if (!msgSrc) {
      console.warn(`Translation not defined for language "${this.locale}", path "${path}"`);
      return path;
    }

    if (isArray(msgSrc)) msgSrc = <string>sample(msgSrc);

    const mf = new MessageFormat(this.locale);
    const msg = mf.compile(<string>msgSrc);

    return msg({ ...params });
  }

  public say(key: string, params?: string[]): Conversation {
    key = String(key);

    this.lastSpeech = key;

    const regex = new RegExp(`^${key.replace('*', '\\d+')}$`);
    let dialogVariants = Object.keys(this.dialog).filter(key => regex.test(key));

    let speech;
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

      if (params) {
        params.forEach((value, index) => {
          speech = speech.replace(`{${index}}`, value);
        });
      }

      const voices = this.voice.filter(key => new RegExp(`^${dialogVariant}_?[A-Z]`).test(key));
      if (voices.length) {
        return this.speak(sample(voices), speech);
      }
    }

    return this.add(speech);
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
    if (this.previousSpeech) this.say(this.previousSpeech);
    this.suggest(...this.previousSuggestions);
    return this;
  }

  public pause(): Conversation {
    this.add('\n  <break time=".5s"/>');
    return this;
  }

  public return(payload: TKeyValue): Conversation {
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
    this.tracker =
      this.tracker || new Tracker({ config: this.config.tracking, userId: this.userId });
    let userData;
    if (typeof this.trackingDataCollector === 'function')
      userData = this.trackingDataCollector(this);
    this.tracker.trackEvent({ event, data, userData });

    return this;
  }

  public addHandler(handler: TIntentHandler, payload?: any): Conversation {
    this.intentHandlers.push({ handler, payload });
    this.payloads.push(payload);
    return this;
  }

  public handleConfirmation(option: string): Conversation {
    const intent = this.confirmationCallbacks[option];
    this.confirmationCallbacks = {};
    return this.next(intent);
  }

  public handlePermission(granted: boolean): Conversation {
    return this.next(this.permissionCallbacks[+!granted]);
  }

  public handleIntent(): Promise<any> {
    return new Promise(resolve => {
      const executeHandler = (): void => {
        if (!this.intentHandlers.length) {
          resolve();
        } else {
          const { handler, payload } = this.intentHandlers.shift();
          Promise.resolve(handler(this, payload)).then(() =>
            executeHandler(),
          );
        }
      };

      setTimeout(executeHandler, 0);
    }).then(() => this.sendResponse());
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
}
