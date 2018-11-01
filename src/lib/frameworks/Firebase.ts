import { TRequestHandler } from '../common/Types';
import IFramework from '../common/IFramework';
import Kiai from '../../Kiai';

const functions = require('firebase-functions');

export default class Firebase implements IFramework {
  public constructor(app: Kiai) {
    app.platforms.forEach(platform => {
      this[platform.IDENTIFIER] = functions.https.onRequest(platform.requestHandler);
    });
  }

  public use(name: string, handler: TRequestHandler): void {
    this[name] = functions.https.onRequest(handler);
  }
}
