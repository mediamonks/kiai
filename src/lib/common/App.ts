import Dialogflow from '../platforms/Dialogflow/Dialogflow';
import IFramework, { IFrameworkConstructor } from './IFramework';
import Express from '../frameworks/Express';
import Firebase from '../frameworks/Firebase';
import GoogleCloudFunctions from '../frameworks/GoogleCloudFunctions';
import Platform from './Platform';
import {
  IPlatformConstructor,
  TAppConfig,
  TConfig,
} from './Types';

export default class App {
  public static INTENT_DELIMITER: string = ':';

  public static PLATFORMS = {
    DIALOGFLOW: Dialogflow,
  };

  public static FRAMEWORKS = {
    EXPRESS: Express,
    FIREBASE: Firebase,
    GOOGLE_CLOUD_FUNCTIONS: GoogleCloudFunctions,
  };

  public readonly config: TAppConfig = {
    flows: {},
    locales: {},
    localeMapping: {},
    dialog: {},
    voice: {},
    tracking: {},
    storage: {},
  };

  private _platforms: Platform[] = [];

  private _framework: IFramework;

  public constructor(config: TAppConfig) {
    Object.assign(this.config, config);
  }

  public get platforms(): Platform[] {
    return this._platforms;
  }

  public get framework(): IFramework {
    return this._framework;
  }

  public addPlatform(Platform: IPlatformConstructor, options: TConfig): Platform {
    const platform = new Platform({
      config: this.config,
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
