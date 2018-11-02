import Conversation from './Conversation';
import Platform from './Platform';
import App from './App';

export type TKeyValue = {
  [key: string]: string | string[] | number | number[] | TKeyValue | TKeyValue[];
};

export type TMapping = { [key: string]: string };

export type TConfig = { [key: string]: string | number | TConfig };

export type TRequestHandler = (req: any, res: any) => void;

export type TDialogText = { [locale: string]: TMapping };

export type TLocales = { [locale: string]: TMapping };

export type TIntentHandler = (conversation: Conversation) => void | Promise<any>;

export type TFlow = {
  [key: string]: TIntentHandler | { [intentName: string]: TIntentHandler } | string;
};

export type TFlows = {
  [flowName: string]: TFlow;
};

export type TVoiceIndex = { [key: string]: string[] };

export type TTrackingDataCollector = (conversation: Conversation) => TKeyValue;

export type TTrackingConfig = {
  amplitude?: {
    apiKey: string;
  };
  googleAnalytics?: {
    trackingId: string;
  };
  dataCollector?: TTrackingDataCollector
};

export type TStorageConfig = {
  rootUrl?: string;
  paths?: {
    images?: string;
    sfx?: string;
    voice?: string;
  };
};

export type TAppConfig = {
  flows: TFlows;
  locales: TLocales;
  localeMapping: TMapping;
  dialog: TDialogText;
  voice: TVoiceIndex;
  tracking: TTrackingConfig;
  storage: TStorageConfig;
}

export interface IPlatformConstructor {
  new (options: { app: App }): Platform;
}
