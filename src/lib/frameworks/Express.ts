import IFramework from '../common/IFramework';
import Kiai from '../../Kiai';
import { TRequestHandler } from '../common/Types';
import * as express from 'express';
import * as bodyParser from 'body-parser';

export default class Express implements IFramework {
  private express: express.Express;

  public constructor(app: Kiai) {
    this.express = express();

    this.express.use(bodyParser.json());

    const port = process.env.PORT || 3000;

    app.platforms.forEach(platform => {
      const endpoint = `/${platform.IDENTIFIER}`;

      this.express.post(endpoint, platform.requestHandler);

      console.log(`Endpoint mounted at ${endpoint}`);
    });

    this.express.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  }

  public use(name: string, handler: TRequestHandler): void {
    const endpoint = `/${name}`;
    this.express.all(endpoint, handler);
    console.log(`Endpoint mounted at ${endpoint}`);
  }
}
