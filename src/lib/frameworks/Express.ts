import IFramework from '../common/IFramework';
import App from '../common/App';
import { TRequestHandler } from '../common/types';
import * as express from 'express';
import * as bodyParser from 'body-parser';

export default class Express implements IFramework {
	private express: express.Express;

	public endpoints = [];

	public constructor(
		app: App,
		{ port = parseInt(process.env.PORT, 10) || 3000 }: { port?: number } = {},
	) {
		this.express = express();

		this.express.use(bodyParser.json());

		const url = `http://localhost:${port}`;

		app.platforms.forEach(platform => {
			const endpoint = `/${platform.IDENTIFIER}`;
			this.express.post(endpoint, platform.requestHandler);
			this.endpoints.push(endpoint);
		});

		try {
			this.express.listen(port, () => {
				console.log('Server started.\nLocal endpoints:');
				this.endpoints.forEach(endpoint => {
					console.log(`${url}${endpoint}`);
				});
			});
		} catch (error) {
			console.error(error);
		}
	}

	public use(name: string, handler: TRequestHandler): void {
		const endpoint = `/${name}`;
		this.express.all(endpoint, handler);
		this.endpoints.push(endpoint);
	}
}
