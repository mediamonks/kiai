import App from './App';
import { TConfig, TRequestHandler } from './types';

export default interface IFramework {
	use(name: string, handler: TRequestHandler): void;
	endpoints: { [key: string]: TRequestHandler };
}

export interface IFrameworkConstructor {
	new (app: App, options: TConfig): IFramework;
}

declare const IFramework: IFrameworkConstructor;
