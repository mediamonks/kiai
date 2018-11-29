import IFramework from '../common/IFramework';
import App from '../common/App';
import { TRequestHandler } from '../common/types';
import * as express from 'express';
import * as bodyParser from 'body-parser';

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}`;

export default class Express implements IFramework {
  private express: express.Express;
  
  public endpoints = [];

  public constructor(app: App) {
    this.express = express();

    this.express.use(bodyParser.json());

    app.platforms.forEach(platform => {
      const endpoint = `/${platform.IDENTIFIER}`;
      this.express.post(endpoint, platform.requestHandler);
      this.endpoints.push(endpoint);
    });

    this.express.listen(PORT, () => {
      console.log('Server started.\nLocal endpoints:');
      this.endpoints.forEach(endpoint => {
        console.log(`${URL}${endpoint}`);
      })
    });
  }

  public use(name: string, handler: TRequestHandler): void {
    const endpoint = `/${name}`;
    this.express.all(endpoint, handler);
    this.endpoints.push(endpoint);
  }
}
