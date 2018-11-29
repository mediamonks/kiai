import App from './App';
import { TRequestHandler } from './types';

export default interface IFramework {
  use(name: string, handler: TRequestHandler): void;
  endpoints?: string[];
}

export interface IFrameworkConstructor {
  new (app: App): IFramework;
}

declare var IFramework: IFrameworkConstructor;
