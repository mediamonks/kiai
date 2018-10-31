import { get, isArray, sample } from 'lodash';
import * as MessageFormat from 'messageformat';
import * as uniqid from 'uniqid';
import Platform from './Platform';
import { INTENT_DELIMITER } from '../../Kiai';
import {
  TConfig,
  TDialogText,
  TFlows,
  TIntentHandler,
  TKeyValue,
  TLocales,
  TMapping,
  TTrackingConfig,
  TTrackingDataCollector,
  TVoiceIndex,
} from './Types';
import Tracking from './Tracking';

export default abstract class Conversation {
  public abstract readonly PERMISSIONS: {
    NAME: string;
    DEVICE_PRECISE_LOCATION: string;
    DEVICE_COARSE_LOCATION: string;
  };

  public abstract sessionData: TKeyValue;

  public abstract userData: TKeyValue;

  public params: TKeyValue;

  public input: (string | boolean)[];

  public location: any;

  public currentIntent: string;

  protected _output: any[] = [];

  protected _endConversation: boolean = false;

  protected _locale: string = 'en-US';

  protected _platform: Platform;
  
  protected _suggestions: string[] = [];
  
  protected _lastSpeech: string = '';

  private readonly _flows: TFlows = {};

  private readonly _locales: TLocales = {};

  private readonly _dialog: TDialogText = {};

  private readonly _voice: TVoiceIndex = {};

  private readonly _trackingDataCollector: TTrackingDataCollector;

  private readonly _tracking: TConfig;

  private _handlers: TIntentHandler[] = [];

  private _tracker: Tracking;

  constructor({
    flows = {},
    locales = {},
    platform,
    dialog = {},
    voice = {},
    trackingConfig = {},
    trackingDataCollector,
  }: {
    flows: TFlows;
    locales: TLocales;
    platform: Platform;
    dialog: TDialogText;
    voice: TVoiceIndex;
    trackingConfig: TTrackingConfig;
    trackingDataCollector?: TTrackingDataCollector;
  }) {
    this._flows = flows;
    this._locales = locales;
    this._platform = platform;
    this._dialog = dialog;
    this._voice = voice;
    this._tracking = trackingConfig;
    this._trackingDataCollector = trackingDataCollector;
  }

  get platform(): Platform {
    return this._platform;
  }

  get userId(): string {
    let userId = this.userData.id;
    if (!userId) {
      userId = uniqid();
      this.userData.id = userId;
    }
    return <string>userId;
  }

  set locale(locale: string) {
    if (!this._locales[locale]) return;
    this._locale = locale;
  }

  get locale(): string {
    return this._locale;
  }

  set repromptCount(count: number) {
    this.sessionData.__repromptCount = count;
  }

  get repromptCount(): number {
    return +(this.sessionData.__repromptCount || 0);
  }

  set currentFlow(flow: string) {
    this.sessionData.__flow = flow;
  }

  get currentFlow(): string {
    return <string>(this.sessionData.__flow || '');
  }

  set timesInputRepeated(count: number) {
    this.sessionData.__timesInputRepeated = count;
  }

  get timesInputRepeated(): number {
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
    return this._dialog[this._locale];
  }

  private get voice(): string[] {
    return this._voice[this.locale] || [];
  }

  abstract show(image: string, alt?: string): void;
  
  abstract redirect({
    url,
    name,
    description,
  }: {
    url: string;
    name: string;
    description: string;
  }): Conversation;

  abstract play(sound: string, fallback?: string): Conversation;

  abstract speak(voice: string, text: string): Conversation;

  // abstract login(speech?: string): void;

  // abstract event(event: string): Conversation;

  abstract respond(): Conversation;

  protected abstract add(output: any): Conversation;

  protected abstract sendResponse(): Conversation;
  
  suggest(...suggestions: string[]): Conversation {
    this._suggestions = this._suggestions.concat(suggestions);
    return this;
  }
  
  translate(path: string, params: string[] = []): string {
    let msgSrc = get(this._locales[this._locale], path);

    if (!msgSrc) {
      console.warn(`Translation not defined for language "${this._locale}", path "${path}"`);
      return path;
    }

    if (isArray(msgSrc)) msgSrc = <string>sample(msgSrc);

    const mf = new MessageFormat(this._locale);
    const msg = mf.compile(<string>msgSrc);

    return msg({ ...params });
  }

  say(key: string, params?: string[]): Conversation {
    key = String(key);
    
    this._lastSpeech = key;
    
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

  next(intent: string): Conversation {
    intent = this.resolveIntent(intent);

    let [flowName, intentName] = intent.split(INTENT_DELIMITER);

    this.currentFlow = flowName;
    
    const handler = this._flows[flowName][intentName];

    if (typeof handler !== 'function') {
      throw new Error(
        `Target intent not found: "${flowName}${INTENT_DELIMITER}${intentName}"`,
      );
    }

    return this.addHandler(handler);
  }

  returnTo(intent: string): Conversation {
    this.returnDirectives.push(this.resolveIntent(intent));
    return this;
  }

  end(): Conversation {
    this._endConversation = true;
    return this;
  }

  compare(string1: string, string2: string): boolean {
    return !string1.localeCompare(string2, this._locale, {
      usage: 'search',
      sensitivity: 'base',
      ignorePunctuation: true,
    });
  }

  expect(context: string): Conversation {
    this.context = context;
    return this;
  }

  repeat(): Conversation {
    if (this.previousSpeech) this.say(this.previousSpeech);
    this.suggest(...this.previousSuggestions);
    return this;
  }

  pause(): Conversation {
    this.add('\n  <break time=".5s"/>');
    return this;
  }

  return(): Conversation {
    const intentDirective = this.returnDirectives.pop();

    if (!intentDirective) throw new Error('Conversation.return() called but no return intent set.');

    return this.next(intentDirective);
  }

  confirm(options: TMapping): Conversation {
    const confirmationOptions = Object.keys(options);
    
    confirmationOptions.forEach(key => options[key] = this.resolveIntent(options[key]));
    
    this.confirmationCallbacks = options;

    return this.suggest(...confirmationOptions).expect('confirmation');
  }

  track(event: string, data?: TKeyValue): Conversation {
    this._tracker = this._tracker || new Tracking({ config: this._tracking, userId: this.userId });
    let userData;
    if (typeof this._trackingDataCollector === 'function')
      userData = this._trackingDataCollector(this);
    this._tracker.trackEvent({ event, data, userData });

    return this;
  }

  addHandler(handler: TIntentHandler): Conversation {
    this._handlers.push(handler);
    return this;
  }

  handleConfirmation(option: string): Conversation {
    const intent = this.confirmationCallbacks[option];
    this.confirmationCallbacks = {};
    return this.next(intent);
  }

  handlePermission(granted: boolean): Conversation {
    return this.next(this.permissionCallbacks[+!granted]);
  }

  handleIntent(): Promise<any> {
    return new Promise(resolve => {
      const executeHandler = (): void => {
        if (!this._handlers.length) resolve();
        else Promise.resolve(this._handlers.shift()(this)).then(() => executeHandler());
      };

      setTimeout(executeHandler, 0);
    }).then(() => this.sendResponse());
  }

  protected resolveIntent(intent: string): string {
    let [flowName, intentName] = intent.split(INTENT_DELIMITER);
    
    if (!flowName) flowName = this.currentFlow;
    
    if (!intentName) {
      const flow = this._flows[flowName];
      if (!flow) throw new Error(`Target flow not found: "${flowName}"`);
      intentName = <string>flow.entryPoint || 'start';
    }
    
    return `${flowName}${INTENT_DELIMITER}${intentName}`;
  }
}
