### Kiai VoiceAction Framework

A framework for quickly and easily setting up and deploying Actions on Google projects.

Features include:

- An easy-to use API for defining flows
- Running on and deploying to Express, Firebase or Google Cloud Functions
- Multi-language support
- Integrated support for voice-over and dialog variants
- SFX, images, permissions, link outs, redirects, device capabilities
- Tracking to Google Analytics and/or Amplitude

Planned features:

- Support for Alexa skills
- Deployment to Lambda
- Login, events
- Integrated DB support
- Integrated notifications

#### Getting started

```bash
$ npm add kiai
```

Create an `./index.js` with the following code:

```javascript
const Kiai = require('kiai').default;

const flows = {
  main: require('./flows/main'),
};

const app = new Kiai({ flows });

app.addPlatform(Kiai.PLATFORMS.DIALOGFLOW);

app.setFramework(Kiai.FRAMEWORKS.EXPRESS);
```

- Add [ngrok](https://www.npmjs.com/package/ngrok) to your project.
- Create a [Dialogflow](https://console.dialogflow.com) project.
- In your Dialogflow project, create an intent called `main_welcome` and add the `WELCOME` event to it.
- Run `$ ngrok http 3000` to create a publicly accessible tunnel to your local machine on the default port of 3000, and paste the https URL it outputs in the `Fullfilment` section of your Dialogflow project, adding the `/dialogflow` endpoint.
- Create a `./flows/main.js` file and put in the following:

```javascript
module.exports = {
  welcome(conv) {
    conv.say('Hello world!').end();
  },
};
```

- Run `index.js`
- In Dialogflow, click the link on the right to test your Action in the Actions on Google simulator.

For a skeleton project including full boilerplate and example code, look here: [Kiai Skeleton](https://github.com/mediamonks/kiai-skeleton)

Documentation:
[Getting Started](https://github.com/mediamonks/kiai-skeleton/blob/master/docs/getting-started.md)
