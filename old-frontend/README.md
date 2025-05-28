# Vuet Developer Information

This repo contains the code associated to the Vuet frontend.

## Table of Contents

1. [Local setup](#local-setup)
2. [Git Flow](#git-flow)
3. [Deployment](#deployment)
4. [Running on WSL2](#running-on-wsl2)
5. [Swagger Documentation](#swagger-documentation)

## Local setup

To run the frontend locally, we use Expo Go. This should first be downloaded from the Apple App Store or Google Play Store as appropriate.

First get the code. You must be given access to the GitHub repo and then set up an SSH key as described [here](https://www.inmotionhosting.com/support/server/ssh/how-to-add-ssh-keys-to-your-github-account/). Then simply run `git clone git@github.com:Vuet-app/VuetApp.git` in a terminal to pull the code onto your machine. If you don't have Git installed then you will have to install it, simply google how to do this if necessary.

If you don't have Node installed then you will have to install it. The recommended way to do this is vie Node Version Manager (nvm). Instructions to install nvm are provided [here](https://heynode.com/tutorial/install-nodejs-locally-nvm/)

Once nvm is installed you can ensure that you are using the right node version by opening a terminal and running `nvm install 23.5.0` and `nvm use 23.5.0`. To set this as the default node version, run `nvm alias default 23.5.0`.

To install the required node packages locally, open a terminal in the location where you cloned the code and run `yarn`. You also need to install the expo CLI globally by running `yarn global add expo-cli`

Then running `ENV=LOCAL expo start` should start running the app in expo and you can press `w` to see it running in the web simulator.

NOTE - the API has to also be running in order for the frontend to work. Otherwise logging in and any other API requests will always fail.

### Running on a device

If you want to run the app on a device then you must find your computer's local network IP address as described [here](https://www.avast.com/c-how-to-find-ip-address#:~:text=Open%20the%20Start%20menu%20and%20type%20cmd%20to%20open%20the,that%20includes%20your%20IP%20address.). It probably looks like `192.X.Y.Z` and then start expo by running:
`REACT_NATIVE_PACKAGER_HOSTNAME=<MY_IP_ADDRESS> expo start`, replacing `<MY_IP_ADDRESS>` with the IP address that you found above.

You can then scan the bar code that is shown from within the Expo Go app to open the app on your phone.

NOTE - you need your phone to be connected to the same WiFi as the computer that is running the code in order for this to work.

## Git Flow

We don't have too much process around branch naming convention etc. The only rule (which is enforced by GitHub permissions) is to not work directly on the master branch. So the process for making a new feature would typically be something like:

- checkout the master branch (`git checkout master`)
- pull the latest changes (`git pull`)
- check out a new feature branch (`git checkout -b MY_BRANCH_NAME`) where `MY_BRANCH_NAME` is replaced with a descriptive name of the branch.
- do any work
- git add the work that you want to commit (`git add .` adds all changed files. If you don't want to add all changed files then you can add individual files instead. See [here](https://www.earthdatascience.org/workshops/intro-version-control-git/basic-git-commands/#:~:text=git%20add%20%3A%20takes%20a%20modified,associated%20with%20a%20unique%20identifier.))
- commit the work `git commit -m "MY_COMMIT_MESSAGE"`, replacing `MY_COMMIT_MESSAGE` with a descriptive message describing the work that has been done.
- push the feature branch to github (`git push origin HEAD`)

## Deployment

To submit to the Apple app store, we use `eas`. You may need to run `yarn global add eas-cli` The steps are as follows:

- Increment the app version in `app.config.js` - this will need updating in both `expo.version` and `expo.ios.buildNumber`
- Build the app by running `eas build --platform ios` and following the instructions
- Submit the app to the Apple store by running `eas submit -p ios` and following the instructions
- Go to App Store Connect, log in and select TestFlight - there should be a warning next to the most recent version. Click "Manage" and select "None of the above". The app should now be available to test.

For PRODUCTION:
- Click on the "Distribution" tab and distribute the new app version. You may have to remove the current build to add trhe newest one.

The development app is deployed by running `eas update` - only authorised users will be able to do this.

## Running on WSL2

The script at `powershell-scripts/forward-wsl-ports.ps1` should be run as described here:
https://medium.com/weavik/react-native-expo-on-wsl2-aff04b1639f8

Then `REACT_NATIVE_PACKAGER_HOSTNAME` can be set using:

```
export REACT_NATIVE_PACKAGER_HOSTNAME=$(netsh.exe interface ip show address "WiFi" | grep 'IP Address' | sed -r 's/^.*IP Address:\W*//')
```

And then `ENV=LOCAL npx expo start` should run the Metro server that can be accessed by connected devices.

## Swagger documentation

We use a package called [drf-yasg](https://drf-yasg.readthedocs.io/en/stable/) to automatically generate Swagger API documentation on the backend. This can be seen at `http://localhost:8000/docs/swagger/` when the API is running locally. This documentation describes all of the endpoints and their basic functionality, in case new integration is required.

## Reading API Data

The data is pulled from the API using [RTK Query](https://redux-toolkit.js.org/rtk-query/overview), a tool that handles fetching, caching and invalidating data. The RTK Query code is stored in `reduxStore/services/api` and the exported hooks should be used for retrieving the required data from the API.
