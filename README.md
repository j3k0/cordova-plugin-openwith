# cordova-plugin-openwith

<a href="https://fovea.cc"><img alt="Logo Fovea" src="https://fovea.cc/blog/wp-content/uploads/2017/09/fovea-logo-flat-128.png" height="59" /></a> &amp; <a href="https://www.interactivetools.com"><img alt="Logo InteractiveTools" src="https://www.interactivetools.com/assets/images/header/logo.png" height="59" /></a>

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> This plugin for [Apache Cordova](https://cordova.apache.org/) registers your app to handle certain types of files.

## Overview

You'd like your app to be listed in the **Send to...** section for certain types of files, on both **Android** and **iOS**? This is THE plugin! No need to meddle into Android's manifests and iOS's plist files, it's all managed for you by a no brainer one liner installation command.

## Table of Contents

- [Background](#background)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [License](#license)


## Background

iOS and Android each have their own ways of handing files to an app. This plugin abstracts them behind a single and simplified interface. It does not expose all subtleties of each system, be this should be enough for 99% of people. Are you the 1% that needs more? Fork and PR if it makes sense, or [ask for help](mailto://contact@fovea.cc).

The plugin's API mostly follows Android's terminology.

Below is a short introduction to how the technology works on Android and iOS.

#### Android

On Android, the app defines, in its __AndroidManifest.xml__ file, the **mime type** of file types it can handle. Wildcard are accepted, so `image/*` can be used to accept all images regardless of the sub-type. The app also defines the type of actions accepted for this file types. By default, only the [SEND](https://developer.android.com/reference/android/content/Intent.html#ACTION_SEND) event is declared by the plugin. Other events that can be of interest are `SEND_MULTIPLE` and `VIEW`.

When a user send the file to your app, the system provides an [Intent](https://developer.android.com/reference/android/content/Intent.html) to the application. An Intent is just an abstract description of an operation to be performed. This Intent defines an action and can be linked with internal URIs to one or more files, through a ["stream" property](https://developer.android.com/reference/android/content/Intent.html#EXTRA_STREAM) attached to the intent. Starting Android 4.4 KitKat, [ClipData](https://developer.android.com/reference/android/content/ClipData.html) was introduced that mimick a sort of Clipboard used to exchange data. Both methods are supported.

If you are interested to learn more, the documentations for [Intent.ACTION_SEND](https://developer.android.com/reference/android/content/Intent.html#ACTION_SEND), [ClipData](https://developer.android.com/reference/android/content/ClipData.html) and the [Clipboard Framework](https://developer.android.com/guide/topics/text/copy-paste.html) are good places to start.

#### iOS

**TODO**

## Installation

    cordova plugin add cordova-plugin-openwith --variable MIME_TYPE="image/*"

Adjust the `MIME_TYPE` variable to your needs.

_On Android, you might want to define more supported actions (see the "Background" section above to learn more about this)._

#### Advanced installation options

**Android: accept extra actions**

Use the `ANDROID_EXTRA_ACTIONS` to accept additional actions. The variable should contain a valid XML action-element. Example:

    MY_EXTRA_ACTIONS='<action android:name="android.intent.action.VIEW" />'
    cordova plugin add cordova-plugin-openwith --variable MIME_TYPE="image/*" --variable "ANDROID_EXTRA_ACTIONS=$MY_EXTRA_ACTIONS"

To specify more than one extra action, just put them all in the `ANDROID_EXTRA_ACTIONS`:

    MY_EXTRA_ACTIONS='<action ... /><action ... />'

## Usage
_Show developers what a module looks like in action so they can quickly determine whether the example meets their needs. This section should contain clear, runnable code examples._

```js
document.addEventListener('deviceready', setupOpenwith, false);

function setupOpenwith() {

  // Increase verbosity if you need more logs
  //cordova.openwith.setVerbosity(cordova.openwith.DEBUG);

  // Initialize the plugin
  cordova.openwith.init(initSuccess, initError);

  function initSuccess()  { console.log('init success!'); }
  function initError(err) { console.log('init failed: ' + err); }

  // Define your file handler
  cordova.openwith.addHandler(myHandler);

  function myHandler(intent) {
    console.log('intent received');

    console.log('  action: ' + intent.action); // type of action requested by the user
    console.log('  exit: ' + intent.exit); // if true, you should exit the app after processing

    for (var i = 0; i < intent.items.length; ++i) {
      var item = intent.items[i];
      console.log('  type: ' + item.type);   // mime type
      console.log('  uri: ' + item.uri);     // uri to the file, probably NOT a web uri
      console.log('  path: ' + item.path);   // path on the device, might be undefined
    }

    // ...
    // Here, you probably want to do something useful with the data
    // ...
    // An example...

    if (intent.items.length > 0) {
      cordova.openwith.load(intent.items[0], function(data, item) {
        // data is a long base64 string with the content of the file
        console.log("the item weights " + data.length + " bytes");
        uploadToServer(item);
      });
    }
  }
}
```

Check out the [demo project](https://github.com/j3k0/cordova-plugin-openwith-demo) for a fully functional example.

## API

#### cordova.openwith.setVerbosity(level)

Change the verbosity level of the plugin.

`level` can be set to:

 - `cordova.openwith.DEBUG` for maximal verbosity, log everything.
 - `cordova.openwith.INFO` for the default verbosity, log interesting stuff only.
 - `cordova.openwith.WARN` for low verbosity, log only warnings and errors.
 - `cordova.openwith.ERROR` for minimal verbosity, log only errors.

#### cordova.openwith.addHandler(handlerFunction)

Add an handler function, that will get notified when a file is received.

**Handler function**

The signature for the handler function is `function handlerFunction(intent)`. See below for what an intent is.

**Intent**

`intent` describe the operation to perform, toghether with the associated data. It has the following fields:

 - `action`: the desired action. see below for possible values.
 - `exit`: true if the app should exit after processing.
 - `items`: an array containing one or more data descriptor.

**Action**

Here are the possible actions.

 - `cordova.openwith.SEND`: when the user wants to send the file(s)
 - `cordova.openwith.VIEW`: when the user wants to view the file(s)

**Data descriptor**

A data descriptor describe one file. It is a javascript object with the following fields:

 - `uri`: uri to the file, probably NOT a web uri, use `load()` if you want the data from this uri.
 - `path`: path on the device, might be undefined depending on app permissions.
 - `type`: the mime type.
 - `base64`: a long base64 string with the content of the file (will not be defined until `load()` has been called and completed successfully).

#### cordova.openwith.load(dataDescriptor, loadSuccessCallback, loadErrorCallback)

Load data for an item. `dataDescriptor` is an item in an intent's items list, see the section about `addHandler()` above for details.

**loadSuccessCallback**: function (base64, dataDescriptor)

When data has been successfully loaded, `loadSuccessCallback` will be called. It is expected to have the following signature: `function (base64, dataDescriptor)`

`base64` is a long string containing the data. `dataDescriptor` is the loaded `dataDescriptor`, extended to contain the `base64` field.

**loadErrorCallback**: function (err, dataDescriptor)

Called when data can't be loaded.

## Contribute

Contributions in the form of GitHub pull requests are welcome. Please adhere to the following guidelines:
  - Before embarking on a significant change, please create an issue to discuss the proposed change and ensure that it is likely to be merged.
  - Follow the coding conventions used throughout the project. Many conventions are enforced using eslint and pmd. Run `npm t` to make sure of that.
  - Any contributions must be licensed under the MIT license.

## License

[MIT](./LICENSE) © Fovea.cc
