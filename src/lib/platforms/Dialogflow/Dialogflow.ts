import { dialogflow } from 'actions-on-google';
import DialogflowConversation from './DialogflowConversation';
import Platform from '../../common/Platform';
import { TAppConfig, TIntentHandler, TKeyValue } from '../../common/Types';

export default class Dialogflow extends Platform {
  private readonly dialogflow: any;

  private readonly conversation: DialogflowConversation;

  public readonly IDENTIFIER: string = 'dialogflow';

  public readonly INTENT_DELIMITER: string = '_';

  public constructor({
    config,
    clientId = '',
    debug = false,
  }: {
    config: TAppConfig;
    clientId: string;
    debug: boolean;
  }) {
    super({ config });

    this.dialogflow = dialogflow({ clientId, debug });

    this.conversation = new DialogflowConversation({ config });

    this.registerFlows(config.flows);

    this.registerConfirmationIntents('yes', 'no');

    this.registerPermissionIntents();
  }

  public get requestHandler(): () => any {
    return this.dialogflow;
  }

  private createWrapper(
    handler: TIntentHandler,
  ): (conversation: any, params?: TKeyValue) => Promise<any> {
    return (conversation, params, ...input): Promise<any> => {
      const intent = conversation.body.queryResult.intent;

      this.conversation.setConversationObject(conversation);
      this.conversation.locale = this.mapLocale(conversation.user.locale);
      this.conversation.params = params || {};
      this.conversation.input = input || [];
      this.conversation.location = conversation.device.location;

      const noInput = !!conversation.arguments.get('REPROMPT_COUNT');

      if (intent.isFallback || noInput) {
        this.conversation.repromptCount++;
      } else {
        this.conversation.timesInputRepeated = this.conversation.repromptCount;
        this.conversation.repromptCount = 0;
        this.conversation.clearContext();
        [this.conversation.currentFlow, this.conversation.currentIntent] = intent.displayName.split(
          this.INTENT_DELIMITER,
        );
      }

      this.conversation.addHandler(handler);

      return this.conversation.handleIntent();
    };
  }

  protected registerIntent(key: string, handler: TIntentHandler): void {
    this.dialogflow.intent(key, this.createWrapper(handler));
  }
}
