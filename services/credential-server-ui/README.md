# Credential Issuance Server Web Interface

This folder contains a Web Interface to interact with the [Credential Issuance Server](../credential-server)

## Features

    - Connect to a credential issuance server
    - Issue custom credentials
    - Request custom credentials

## Requirements

- Node.js
- npm

## Preparing the App

This web interface needs to be connected to a Credential Issuance Server to request and receive credentials. More instructions on how to run this service can be found [here](../credential-server).

By default, the app tries to connect to an instance of the Credential Issuance Server running locally on port `3002`. To connect this interface to an instance that is not running locally, you need to update the provided [`.env`](.env) file to include the URL and port of the instance.

Before running the app, ensure that all dependencies are installed and the app is built properly. In the project's root directory, run the following command:

```bash
npm i
```

## Running the App

To run the app, execute the following command:

```bash
npm run start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
