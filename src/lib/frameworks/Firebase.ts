import * as functions from 'firebase-functions';
import { TRequestHandler } from '../common/types';
import IFramework from '../common/IFramework';
import App from '../common/App';

let _app: App;

export default class Firebase implements IFramework {
	public endpoints: { [key: string]: TRequestHandler } = {};

	public constructor(app: App) {
		_app = app;

		app.platforms.forEach(platform => {
			this.endpoints[platform.IDENTIFIER] = functions
				.region(_app.config.region)
				.https.onRequest(platform.requestHandler);
		});
	}

	public use(name: string, handler: TRequestHandler): void {
		this.endpoints[name] = functions.region(_app.config.region).https.onRequest(handler);
	}
}
