import Dialogflow from './lib/platforms/Dialogflow/Dialogflow';
import IFramework, { IFrameworkConstructor } from './lib/common/IFramework';
import Express from './lib/frameworks/Express';
import Firebase from './lib/frameworks/Firebase';
import GoogleCloudFunctions from './lib/frameworks/GoogleCloudFunctions';
import {
  IPlatformConstructor,
  TConfig,
  TDialogText,
  TFlows,
  TLocales,
  TMapping,
  TTrackingConfig,
  TTrackingDataCollector,
  TVoiceIndex,
} from './lib/common/Types';
import Platform from './lib/common/Platform';

export const INTENT_DELIMITER: string = ':';

export default class Kiai {
  public readonly PLATFORMS = {
    DIALOGFLOW: Dialogflow,
  };

  public readonly FRAMEWORKS = {
    EXPRESS: Express,
    FIREBASE: Firebase,
    GOOGLE_CLOUD_FUNCTIONS: GoogleCloudFunctions,
  };

  public readonly flows: TFlows = {};

  public readonly locales: TLocales = {};

  public readonly localeMapping: TMapping = {};

  public readonly dialog: TDialogText = {};

  public readonly voice: TVoiceIndex = {};

  public readonly trackingConfig: TConfig = {};

  public readonly trackingDataCollector: TTrackingDataCollector;

  public readonly storageConfig: TConfig = {};

  private _platforms: Platform[] = [];

  private _framework: IFramework;

  public constructor({
    flows = {},
    locales = {},
    localeMapping = {},
    dialog = {},
    voice = {},
    trackingConfig = {},
    trackingDataCollector,
    storageConfig = {},
  }: {
    flows: TFlows;
    locales: TLocales;
    localeMapping: TMapping;
    dialog: TDialogText;
    voice: TVoiceIndex;
    trackingConfig: TTrackingConfig;
    trackingDataCollector?: TTrackingDataCollector;
    storageConfig: TConfig;
  }) {
    this.flows = flows;
    this.locales = locales;
    this.localeMapping = localeMapping;
    this.dialog = dialog;
    this.voice = voice;
    this.trackingConfig = trackingConfig;
    this.trackingDataCollector = trackingDataCollector;
    this.storageConfig = storageConfig;
  }

  public get platforms(): Platform[] {
    return this._platforms;
  }

  public get framework(): IFramework {
    return this._framework;
  }

  public addPlatform(Platform: IPlatformConstructor, options: TConfig): Platform {
    const platform = new Platform({
      app: this,
      ...options,
    });
    this._platforms.push(platform);
    return platform;
  }

  public setFramework(Framework: IFrameworkConstructor): IFramework {
    this._framework = new Framework(this);
    return this._framework;
  }
}
