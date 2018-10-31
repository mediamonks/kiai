import { dialogflow } from 'actions-on-google';
import DialogflowConversation from './DialogflowConversation';
import Platform from '../../common/Platform';
import {
  TDialogText,
  TFlows,
  TIntentHandler,
  TLocales,
  TMapping,
  TTrackingConfig,
  TTrackingDataCollector,
  TVoiceIndex,
} from '../../common/Types';

export default class Dialogflow extends Platform {
  private readonly _dialogflow: any;

  private readonly _conversation: DialogflowConversation;

  public readonly IDENTIFIER: string = 'dialogflow';
  
  public readonly INTENT_DELIMITER: string = '_';
  
  constructor({
    flows = {},
    locales = {},
    localeMapping = {},
    dialog = {},
    voice = {},
    clientId = '',
    debug = false,
    trackingConfig = {},
    trackingDataCollector,
  }: {
    flows: TFlows;
    locales: TLocales;
    localeMapping: TMapping;
    dialog: TDialogText;
    voice: TVoiceIndex;
    clientId: string;
    debug: boolean;
    trackingConfig: TTrackingConfig;
    trackingDataCollector?: TTrackingDataCollector;
  }) {
    super();

    this._localeMapping = localeMapping;
    this._dialogflow = dialogflow({ clientId, debug });

    this._conversation = new DialogflowConversation({
      flows,
      locales,
      platform: this,
      dialog,
      voice,
      trackingConfig,
      trackingDataCollector,
    });

    this.registerFlows(flows);

    this.registerConfirmationIntents('yes', 'no');

    this.registerPermissionIntents();
  }

  get requestHandler(): () => any {
    return this._dialogflow;
  }

  private createWrapper(
    handler: TIntentHandler,
  ): (conversation: any, params?: { [key: string]: any }) => Promise<any> {
    return (conversation, params, ...input): Promise<any> => {
      const intent = conversation.body.queryResult.intent;

      this._conversation.conversationObject = conversation;
      this._conversation.locale = this.mapLocale(conversation.user.locale);
      this._conversation.params = params || {};
      this._conversation.input = input || [];
      this._conversation.location = conversation.device.location;

      const noInput = !!conversation.arguments.get('REPROMPT_COUNT');

      if (intent.isFallback || noInput) {
        this._conversation.repromptCount++;
      } else {
        this._conversation.timesInputRepeated = this._conversation.repromptCount;
        this._conversation.repromptCount = 0;
        this._conversation.clearContext();
        this._conversation.currentFlow = intent.displayName.split(this.INTENT_DELIMITER)[0];
        this._conversation.currentIntent = intent.displayName.split(this.INTENT_DELIMITER)[1];
      }

      this._conversation.addHandler(handler);

      return this._conversation.handleIntent();
    };
  }

  protected registerIntent(key: string, handler: TIntentHandler): void {
    this._dialogflow.intent(key, this.createWrapper(handler));
  }
}
