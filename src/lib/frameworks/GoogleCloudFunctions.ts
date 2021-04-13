import IFramework from '../common/IFramework';
import App from '../common/App';
import { TRequestHandler } from '../common/types';

export default class GoogleCloudFunctions implements IFramework {
	public endpoints: { [key: string]: TRequestHandler } = {};

	public constructor(app: App) {
		app.platforms.forEach(platform => {
			this.endpoints[platform.IDENTIFIER] = platform.requestHandler;
		});
	}

	public use(name: string, handler: TRequestHandler): void {
		this.endpoints[name] = handler;
	}
}
