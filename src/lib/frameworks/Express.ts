import IFramework from '../common/IFramework';
import Kiai from '../../Kiai';
import { TRequestHandler } from '../common/Types';
import * as express from 'express';
import * as bodyParser from 'body-parser';

export default class Express implements IFramework {
  private _express: express.Express;

  constructor(app: Kiai) {
    this._express = express();

    this._express.use(bodyParser.json());

    const port = process.env.PORT || 3000;

    app.platforms.forEach(platform => {
      const endpoint = `/${platform.IDENTIFIER}`;

      this._express.post(endpoint, platform.requestHandler);

      console.log(`Endpoint mounted at ${endpoint}`);
    });

    this._express.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  }

  use(name: string, handler: TRequestHandler): void {
    const endpoint = `/${name}`;
    this._express.all(endpoint, handler);
    console.log(`Endpoint mounted at ${endpoint}`);
  }
}
