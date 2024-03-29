import Dialogflow from '../platforms/Dialogflow/Dialogflow';
import IFramework, { IFrameworkConstructor } from './IFramework';
import Express from '../frameworks/Express';
import Firebase from '../frameworks/Firebase';
import GoogleCloudFunctions from '../frameworks/GoogleCloudFunctions';
import Platform from './Platform';
import { IPlatformConstructor, TAppConfig, TConfig } from './types';

export default class App {
	public static INTENT_DELIMITER = ':';

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
		region: 'us-central1',
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

	public setFramework(Framework: IFrameworkConstructor, options: TConfig): IFramework {
		this._framework = new Framework(this, options);
		return this._framework;
	}
}
