import App from './App';
import { TRequestHandler } from './Types';

export default interface IFramework {
  use(name: string, handler: TRequestHandler): void;
}

export interface IFrameworkConstructor {
  new (app: App): IFramework;
}

declare var IFramework: IFrameworkConstructor;
