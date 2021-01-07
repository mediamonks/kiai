import { noop } from 'lodash';
import { TAppConfig, TFlow, TFlows, TIntentHandler, TMapping } from './types';
import Profiler from './Profiler';
import IProfiler from './IProfiler';

export default abstract class Platform {
  public abstract readonly IDENTIFIER: string;

  public abstract readonly INTENT_DELIMITER: string;

  public abstract readonly requestHandler: () => any;

  public abstract readonly SYSTEM_INTENT_NAMES: {
    PERMISSION: string;
    LOGIN: string;
    CONFIRMATION: string;
    TRANSFER: string;
    NOTIFICATION: string;
  };

  private readonly config: TAppConfig;

  private readonly _profiler: IProfiler = { start: noop, end: noop };

  protected constructor({ config }: { config: TAppConfig }) {
    this.config = config;

    if (config.enableProfiling) this._profiler = new Profiler();
  }

  protected get profiler(): IProfiler {
    return this._profiler;
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
      this.registerIntent(
        [this.SYSTEM_INTENT_NAMES.CONFIRMATION, option].join(this.INTENT_DELIMITER),
        conversation => {
          conversation.handleConfirmation(option);
        },
      );
    });
  }

  protected registerPermissionIntent(): void {
    this.registerIntent(this.SYSTEM_INTENT_NAMES.PERMISSION, conversation => {
      conversation.handlePermission(!!conversation.input[0]);
    });
  }

  protected registerLoginIntent(): void {
    this.registerIntent(this.SYSTEM_INTENT_NAMES.LOGIN, conversation => {
      conversation.handleLogin(conversation.input[0].status === 'OK');
    });
  }

  protected registerTransferIntent(): void {
    this.registerIntent(this.SYSTEM_INTENT_NAMES.TRANSFER, conversation => {
      conversation.handleTransfer();
    });
  }

  protected registerUpdateIntent(): void {
    this.registerIntent(this.SYSTEM_INTENT_NAMES.NOTIFICATION, conversation => {
      conversation.handleUpdateRegistration(conversation.input[0].status === 'OK');
    });
  }

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
