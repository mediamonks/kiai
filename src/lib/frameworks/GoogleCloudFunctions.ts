import IFramework from '../common/IFramework';
import Kiai from '../../Kiai';
import { TRequestHandler } from '../common/Types';

export default class GoogleCloudFunctions implements IFramework {
  public constructor(app: Kiai) {
    app.platforms.forEach(platform => {
      this[platform.IDENTIFIER] = platform.requestHandler;
    });
  }

  public use(name: string, handler: TRequestHandler): void {
    this[name] = handler;
  }
}
