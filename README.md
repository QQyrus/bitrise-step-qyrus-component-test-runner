# bitrise-step-qyrus-component-test-runner

This step uploads the apk or ipa to Qyrus cloud test platform and runs the test on a real devices.

## Limitations

You can run only the test suites but not the test scripts

If you need to increase the upload limit on the number of apps please contact support@qyrus.com

## How to use this Step

Add the *qyrus-component-test-runner* step into your worflow.

Initialize inputs variables from the bitrise form.

* Qyrus gateway URL `$GATEWAY_URL` **required**

**Note:** 
* Its necessary to specify bundle id if the device OS is iOS and app activity if your device OS is android.
* If you are not uploading apk/ipa then, you have to specify the app name which you had already uploaded to Qyrus.
* please set the $QYRUS_PASSWORD under secrets.

Prints additional debug information in logs if this option is enabled

## Support
Please write us at support@qyrus.com