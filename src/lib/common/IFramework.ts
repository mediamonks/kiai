import App from './App';
import { TConfig, TRequestHandler } from './types';

export default interface IFramework {
  use(name: string, handler: TRequestHandler): void;
  endpoints?: string[];
}

export interface IFrameworkConstructor {
  new (app: App, options: TConfig): IFramework;
}

declare var IFramework: IFrameworkConstructor;
