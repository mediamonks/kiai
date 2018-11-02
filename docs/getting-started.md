### Getting Started

- Clone or copy the [kiai-skeleton](https://github.com/mediamonks/kiai-skeleton).
- Run `$ yarn`.
- Update the `name`, `version`, `description`, `repository` and `author` fields in `package.json`.
- Create a [Google Cloud](https://console.cloud.google.com) project.
- Create a [Dialogflow](https://console.dialogflow.com) agent and select the Google project you just created.

#### Defining flows
See `./docs/flows.md`

#### Defining dialog lines
See `./docs/dialog.md`

#### Adding recorded voice-overs
See `./docs/voice.md`

#### Adding sound effects
See `./docs/sfx.md`

#### Adding images
See `./docs/dialog.md`

#### Running locally

- Run `$ yarn dev`.
- Copy the public dialogflow endpoint which is printed to the console.
- Go to your Dialogflow agent and create an export via `Properties > Export and Import`.
- Create a new, private, Dialogflow agent and import the exported zip files.
- In this cloned agent, go to `Fulfillment` and paste the copied endpoint URL.

#### Database

##### On Google Datastore

- In the Google Cloud console, go to `Service accounts` under `IAM & admin` and create a new service account.
- Call the account `datastore` or something else appropriate.
- Select the role `Cloud Datastore User` under Datastore.
- Create a key, type JSON.
- Put the contents of the downloaded JSON file in `./config/datastore.json`.
- The module `./lib/datastore.js` provides a simple interface.
- The module `./lib/import.js` provides an endpoint for bulk imports.

#### Deployment

##### To Firebase

- Add [Firebase](https://console.firebase.google.com) to your Google project.
- If this is your first time using firebase CLI, run `$ firebase login` first.
- Get your Google project ID (from e.g. the URL) and put it in `.firebaserc`.
- Run `$ yarn build && yarn deploy` to deploy.
- In the Firebase console, go to `Functions` and copy the URL of your endpoint.
- In Dialogflow, go to `Fullfilment` and paste the URL under `Webhook`.
