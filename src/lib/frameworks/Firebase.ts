import { TRequestHandler } from '../common/types';
import IFramework from '../common/IFramework';
import App from '../common/App';

const functions = require('firebase-functions');

let _app: App;

export default class Firebase implements IFramework {
	public constructor(app: App) {
		_app = app;

		app.platforms.forEach(platform => {
			this[platform.IDENTIFIER] = functions
				.region(_app.config.region)
				.https.onRequest(platform.requestHandler);
		});
	}

	public use(name: string, handler: TRequestHandler): void {
		this[name] = functions.region(_app.config.region).https.onRequest(handler);
	}
}
