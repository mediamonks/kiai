import { TFlow, TFlows, TIntentHandler, TMapping } from './Types';
import Kiai from '../../Kiai';

export default abstract class Platform {
  abstract readonly IDENTIFIER: string;

  abstract readonly INTENT_DELIMITER: string;

  abstract readonly requestHandler: () => any;

  private readonly app: Kiai;

  protected constructor({ app }: { app: Kiai }) {
    this.app = app;
  }

  private get localeMapping(): TMapping {
    return this.app.localeMapping;
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

  /* Unfinished feature
  protected registerLoginIntent(): void {
    this.registerIntent('login', conversation => {
      conversation.handleLogin(conversation.input.status === 'OK');
    });
  }
*/

  protected registerFlows(flows: TFlows): void {
    Object.keys(flows).forEach(flowName => {
      const intents = flows[flowName];
      this.registerIntents(flowName, intents);
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
