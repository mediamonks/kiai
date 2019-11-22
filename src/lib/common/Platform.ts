import { TAppConfig, TFlow, TFlows, TIntentHandler, TMapping } from './types';

export default abstract class Platform {
  public abstract readonly IDENTIFIER: string;
  
  public abstract readonly INTENT_DELIMITER: string;

  public abstract readonly requestHandler: () => any;

  private readonly config: TAppConfig;

  protected constructor({ config }: { config: TAppConfig }) {
    this.config = config;
  }

  private get localeMapping(): TMapping {
    return this.config.localeMapping;
  }

  protected abstract registerIntent(key: string, handler: TIntentHandler): void;

  protected registerIntents(flowName: string, intents: TFlow) {
    Object.keys(intents).forEach(intentKey => {
      const intentHandler = intents[intentKey];

      if (typeof intentHandler === 'object') {
        return this.registerIntents(flowName, intentHandler);
      }

      if (typeof intentHandler === 'function') {
        this.registerIntent(`${flowName}${this.INTENT_DELIMITER}${intentKey}`, intentHandler);
      }
    });
  }

  protected registerConfirmationIntents(...options: string[]): void {
    options.forEach(option => {
      this.registerIntent(`confirmation_${option}`, conversation => {
        conversation.handleConfirmation(option);
      });
    });
  }

  protected registerPermissionIntents(): void {
    this.registerIntent('permission_confirmation', conversation => {
      conversation.handlePermission(!!conversation.input[0]);
    });
  }

  protected registerLoginIntent(): void {
    this.registerIntent('login', conversation => {
      conversation.handleLogin(conversation.input[0].status === 'OK');
    });
  }

  protected registerFlows(flows: TFlows): void {
    Object.keys(flows).forEach(flowName => {
      const intents = flows[flowName];
      this.registerIntents(flowName, intents);
    });
  }

  protected registerUpdateIntent(): void {
    this.registerIntent('notification_confirm', conversation => {
      conversation.handleUpdateRegistration(conversation.input[0].status === 'OK');
    });
  }

  protected mapLocale(locale: string): string {
    Object.keys(this.localeMapping).find(key => {
      const match = new RegExp(key).test(locale);
      if (match) locale = this.localeMapping[key];
      return match;
    });

    return locale;
  }
}
