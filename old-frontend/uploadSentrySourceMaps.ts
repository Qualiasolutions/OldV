import { exec } from 'child_process';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Command } from 'commander';
import util from 'util';

import appConfig from './app.config';

const { expo, build } = appConfig;

const promisifiedExec = util.promisify(exec);

const uploadAndroidSourceMap = async (easBuild: any, updates: any) => {
  const appVersion = expo.version;

  const androidVersionCode = expo.android.versionCode;
  const androidPackageName = easBuild.env.ANDROID_PACKAGE_NAME;
  const androidUpdateId = updates.find(
    (update: any) => update.platform === 'android'
  ).id;
  await promisifiedExec(
    `mv dist/bundles/android*.js dist/bundles/index.android.bundle`
  );
  await promisifiedExec(`
        SENTRY_AUTH_TOKEN=9b0b8561dec79d15dede6423679440e1f240401db6b6aab99a2d888dd79c1198 \
        node_modules/@sentry/cli/bin/sentry-cli \
        releases \
        --org vuet \
        --project vuet-app \
        files ${androidPackageName}@${appVersion}+${androidVersionCode} \
        upload-sourcemaps \
        --dist ${androidUpdateId} \
        --rewrite \
        dist/bundles/index.android.bundle dist/bundles/android-*.map`);
};

const uploadIosSourceMap = async (easBuild: any, updates: any) => {
  const appVersion = expo.version;

  const iosBuildNumber = expo.ios.buildNumber;
  const iosBundleID = easBuild.env.IOS_BUNDLE_ID;
  const iosUpdateId = updates.find(
    (update: any) => update.platform === 'ios'
  ).id;
  await promisifiedExec(`mv dist/bundles/ios*.js dist/bundles/main.jsbundle`);
  await promisifiedExec(`
        SENTRY_AUTH_TOKEN=9b0b8561dec79d15dede6423679440e1f240401db6b6aab99a2d888dd79c1198 \
        node_modules/@sentry/cli/bin/sentry-cli \
        releases \
        --org vuet \
        --project vuet-app \
        files ${iosBundleID}@${appVersion}+${iosBuildNumber} \
        upload-sourcemaps \
        --dist ${iosUpdateId} \
        --rewrite \
        dist/bundles/main.jsbundle dist/bundles/ios-*.map`);
};

const program = new Command()
  .requiredOption('-p, --profile  [value]', 'EAS profile')
  .action(async (options) => {
    if (!Object.keys(build).includes(options.profile)) {
      console.error('Profile must be includes in : ', Object.keys(build));
    }
    const easBuild = build[options.profile as keyof typeof build];
    const { channel } = easBuild;

    const channelUpdates = await promisifiedExec(
      `eas update:list --branch ${channel} --non-interactive --json`
    );
    if (channelUpdates.stderr) {
      console.error(channelUpdates.stderr);
    }
    const groupID = JSON.parse(channelUpdates.stdout).currentPage[0].group;
    const updates = await promisifiedExec(`eas update:view ${groupID} --json`);
    if (updates.stderr) {
      console.error(updates.stderr);
    }

    await uploadAndroidSourceMap(easBuild, JSON.parse(updates.stdout));
    await uploadIosSourceMap(easBuild, JSON.parse(updates.stdout));
  });

program.parse();
