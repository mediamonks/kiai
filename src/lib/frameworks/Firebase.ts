import { TRequestHandler } from '../common/types';
import IFramework from '../common/IFramework';
import App from '../common/App';

const functions = require('firebase-functions');

export default class Firebase implements IFramework {
  private app: App;
  
  public constructor(app: App) {
    this.app = app;
    
    app.platforms.forEach(platform => {
      this[platform.IDENTIFIER] = functions.https.onRequest(platform.requestHandler);
    });
  }

  public use(name: string, handler: TRequestHandler): void {
    this[name] = functions.region(this.app.config.region).https.onRequest(handler);
  }
}
