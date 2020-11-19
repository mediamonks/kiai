import { dialogflow } from 'actions-on-google';
import DialogflowConversation from './DialogflowConversation';
import Platform from '../../common/Platform';
import { TAppConfig, TIntentHandler, TKeyValue } from '../../common/types';

const VERSION = require('../../../../package.json').version;

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

    this.profiler.start('Dialogflow init library');

    this.dialogflow = dialogflow({ clientId, debug });

    this.conversation = new DialogflowConversation({ config, platform: this });

    this.profiler.end('Dialogflow init library');
    this.profiler.start('Dialogflow register handlers');

    this.registerFlows(config.flows);

    this.registerConfirmationIntents('yes', 'no');

    this.registerPermissionIntents();

    this.registerLoginIntent();

    this.registerUpdateIntent();

    this.registerTransferIntent();

    this.profiler.end('Dialogflow register handlers');
  }

  public get requestHandler(): () => any {
    return this.dialogflow;
  }

  private createWrapper(
    handler: TIntentHandler,
  ): (conversation: any, params?: TKeyValue) => Promise<any> {
    return (conversation, params, ...input): Promise<any> => {
      const intent = conversation.body.queryResult.intent;

      this.profiler.start(`Dialogflow init conversation`);

      // TODO: test this code
      if (!Object.keys(conversation.contexts.input).length) {
        console.warn('No input contexts found. Possibly deleted by Dialogflow. Please check the output intent field of the last intent triggered.');
      }

      this.conversation.setConversationObject(conversation);
      this.conversation.version = VERSION;
      this.conversation.locale = this.mapLocale(conversation.user.locale);
      this.conversation.params = params || {};
      this.conversation.input = input || [];
      this.conversation.location = conversation.device.location;
      this.conversation.noInput = !!conversation.arguments.get('REPROMPT_COUNT');
      delete this.conversation.scene;

      const [flowName, intentName] = intent.displayName.split(this.INTENT_DELIMITER);

      if (intent.isFallback || this.conversation.noInput) {
        this.conversation.repromptCount++;
      } else {
        this.conversation.timesInputRepeated = this.conversation.repromptCount;
        this.conversation.repromptCount = 0;
        this.conversation.currentFlow = flowName;
        this.conversation.currentIntent = intentName;
      }
      this.conversation.addHistory(flowName, intentName, true);

      this.conversation.addHandler(handler);

      this.profiler.end(`Dialogflow init conversation`);

      this.profiler.start(`Dialogflow handle intent "${intent}"`);

      return this.conversation.handleIntent().then(conv => {
        this.profiler.end(`Dialogflow handle intent "${intent}"`);
        return conv;
      });
    };
  }

  protected registerIntent(key: string, handler: TIntentHandler): void {
    this.dialogflow.intent(key, this.createWrapper(handler));
  }
}
