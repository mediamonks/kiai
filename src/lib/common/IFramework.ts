import Kiai from '../../Kiai';
import { TRequestHandler } from './Types';

export default interface IFramework {
  use(name: string, handler: TRequestHandler): void;
}

export interface IFrameworkConstructor {
  new (app: Kiai): IFramework;
}

declare var IFramework: IFrameworkConstructor;
