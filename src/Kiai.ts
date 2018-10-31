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
  TKeyValue,
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

  private readonly _flows: TFlows = {};

  private readonly _locales: TLocales = {};

  private readonly _localeMapping: TMapping = {};

  private readonly _dialog: TDialogText = {};

  private readonly _voice: TVoiceIndex = {};

  private readonly _trackingConfig: TConfig = {};

  private readonly _trackingDataCollector: TTrackingDataCollector;

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
  }: {
    flows: TFlows;
    locales: TLocales;
    localeMapping: TMapping;
    dialog: TDialogText;
    voice: TVoiceIndex;
    trackingConfig: TTrackingConfig;
    trackingDataCollector?: TTrackingDataCollector;
  }) {
    this._flows = flows;
    this._locales = locales;
    this._localeMapping = localeMapping;
    this._dialog = dialog;
    this._voice = voice;
    this._trackingConfig = trackingConfig;
    this._trackingDataCollector = trackingDataCollector;
  }

  public get platforms(): Platform[] {
    return this._platforms;
  }

  public get framework(): IFramework {
    return this._framework;
  }

  public addPlatform(Platform: IPlatformConstructor, options: TKeyValue): Platform {
    const platform = new Platform({
      flows: this._flows,
      locales: this._locales,
      localeMapping: this._localeMapping,
      dialog: this._dialog,
      voice: this._voice,
      trackingConfig: this._trackingConfig,
      trackingDataCollector: this._trackingDataCollector,
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
