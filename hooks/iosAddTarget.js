//
//  iosAddTarget.js
//  This hook runs for the iOS platform when the plugin or platform is added.
//
// Source: https://github.com/DavidStrausz/cordova-plugin-today-widget
//

//
// The MIT License (MIT)
//
// Copyright (c) 2017 DavidStrausz
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//

const PLUGIN_ID = 'cc.fovea.cordova.openwith';
const BUNDLE_SUFFIX = '.shareextension';

var fs = require('fs');
var path = require('path');
var packageJson;
var bundleIdentifier;

function redError(message) {
    return new Error('"' + PLUGIN_ID + '" \x1b[1m\x1b[31m' + message + '\x1b[0m');
}

function replacePreferencesInFile(filePath, preferences) {
    var content = fs.readFileSync(filePath, 'utf8');
    for (var i = 0; i < preferences.length; i++) {
        var pref = preferences[i];
        var regexp = new RegExp(pref.key, "g");
        content = content.replace(regexp, pref.value);
    }
    fs.writeFileSync(filePath, content);
}

// Determine the full path to the app's xcode project file.
function findXCodeproject(context, callback) {
  fs.readdir(iosFolder(context), function(err, data) {
    var projectFolder;
    var projectName;
    // Find the project folder by looking for *.xcodeproj
    if (data && data.length) {
      data.forEach(function(folder) {
        if (folder.match(/\.xcodeproj$/)) {
          projectFolder = path.join(iosFolder(context), folder);
          projectName = path.basename(folder, '.xcodeproj');
        }
      });
    }

    if (!projectFolder || !projectName) {
      throw redError('Could not find an .xcodeproj folder in: ' + iosFolder(context));
    }

    if (err) {
      throw redError(err);
    }

    callback(projectFolder, projectName);
  });
}

// Determine the full path to the ios platform
function iosFolder(context) {
  return context.opts.cordova.project
    ? context.opts.cordova.project.root
    : path.join(context.opts.projectRoot, 'platforms/ios/');
}

function getPreferenceValue(configXml, name) {
  var value = configXml.match(new RegExp('name="' + name + '" value="(.*?)"', "i"));
  if (value && value[1]) {
    return value[1];
  } else {
    return null;
  }
}

function getCordovaParameter(configXml, variableName) {
  var variable = packageJson.cordova.plugins[PLUGIN_ID][variableName];
  if (!variable) {
    variable = getPreferenceValue(configXml, variableName);
  }
  return variable;
}

// Get the bundle id from config.xml
function getBundleId(context, configXml) {
  var elementTree = require('elementtree');
  var etree = elementTree.parse(configXml);
  return etree.getroot().get('id');
}

function parsePbxProject(context, pbxProjectPath) {
  var xcode = require('xcode');
  console.log('    Parsing existing project at location: ' + pbxProjectPath + '...');
  var pbxProject;
  if (context.opts.cordova.project) {
    pbxProject = context.opts.cordova.project.parseProjectFile(context.opts.projectRoot).xcode;
  } else {
    pbxProject = xcode.project(pbxProjectPath);
    pbxProject.parseSync();
  }
  return pbxProject;
}

function forEachShareExtensionFile(context, callback) {
  var shareExtensionFolder = path.join(iosFolder(context), 'ShareExtension');
  if (!fs.existsSync(shareExtensionFolder)) {
    console.error('!!  Shared extension files have not been copied yet!!');
    return;
  }
  fs.readdirSync(shareExtensionFolder).forEach(function(name) {
    // Ignore junk files like .DS_Store
    if (!/^\..*/.test(name)) {
      callback({
        name:name,
        path:path.join(shareExtensionFolder, name),
        extension:path.extname(name)
      });
    }
  });
}

function projectPlistPath(context, projectName) {
  return path.join(iosFolder(context), projectName, projectName + '-Info.plist');
}

function projectPlistJson(context, projectName) {
  var plist = require('plist');
  var path = projectPlistPath(context, projectName);
  return plist.parse(fs.readFileSync(path, 'utf8'));
}

function getPreferences(context, configXml, projectName) {
  var plist = projectPlistJson(context, projectName);
  var group = "group." + bundleIdentifier + BUNDLE_SUFFIX;
  if (getCordovaParameter(configXml, 'IOS_GROUP_IDENTIFIER')) {
    group = getCordovaParameter(configXml, 'IOS_GROUP_IDENTIFIER');
  }
  return [{
    key: '__DISPLAY_NAME__',
    value: projectName
  }, {
    key: '__BUNDLE_IDENTIFIER__',
    value: bundleIdentifier + BUNDLE_SUFFIX
  } ,{
      key: '__GROUP_IDENTIFIER__',
      value: group
  }, {
    key: '__BUNDLE_SHORT_VERSION_STRING__',
    value: plist.CFBundleShortVersionString
  }, {
    key: '__BUNDLE_VERSION__',
    value: plist.CFBundleVersion
  }, {
    key: '__URL_SCHEME__',
    value: getCordovaParameter(configXml, 'IOS_URL_SCHEME')
  }, {
    key: '__UNIFORM_TYPE_IDENTIFIER__',
    value: getCordovaParameter(configXml, 'IOS_UNIFORM_TYPE_IDENTIFIER')
  }];
}

// Return the list of files in the share extension project, organized by type
function getShareExtensionFiles(context) {
  var files = {source:[],plist:[],resource:[]};
  var FILE_TYPES = { '.h':'source', '.m':'source', '.plist':'plist' };
  forEachShareExtensionFile(context, function(file) {
    var fileType = FILE_TYPES[file.extension] || 'resource';
    files[fileType].push(file);
  });
  return files;
}

function printShareExtensionFiles(files) {
  console.log('    Found following files in your ShareExtension folder:');
  console.log('    Source files:');
  files.source.forEach(function(file) {
    console.log('     - ', file.name);
  });

  console.log('    Plist files:');
  files.plist.forEach(function(file) {
    console.log('     - ', file.name);
  });

  console.log('    Resource files:');
  files.resource.forEach(function(file) {
    console.log('     - ', file.name);
  });
}

console.log('Adding target "' + PLUGIN_ID + '/ShareExtension" to XCode project');

module.exports = function (context) {

  var Q = require('q');
  var deferral = new Q.defer();

  packageJson = require(path.join(context.opts.projectRoot, 'package.json'));

  // if (context.opts.cordova.platforms.indexOf('ios') < 0) {
  //   log('You have to add the ios platform before adding this plugin!', 'error');
  // }

  var configXml = fs.readFileSync(path.join(context.opts.projectRoot, 'config.xml'), 'utf-8');
  if (configXml) {
    configXml = configXml.substring(configXml.indexOf('<'));
  }

  bundleIdentifier = getBundleId(context, configXml);

  findXCodeproject(context, function(projectFolder, projectName) {

    console.log('  - Folder containing your iOS project: ' + iosFolder(context));

    var pbxProjectPath = path.join(projectFolder, 'project.pbxproj');
    var pbxProject = parsePbxProject(context, pbxProjectPath);

    var files = getShareExtensionFiles(context);
    // printShareExtensionFiles(files);

    var preferences = getPreferences(context, configXml, projectName);
    files.plist.concat(files.source).forEach(function(file) {
      replacePreferencesInFile(file.path, preferences);
      // console.log('    Successfully updated ' + file.name);
    });

    // Find if the project already contains the target and group
    var target = pbxProject.pbxTargetByName('ShareExt') || pbxProject.pbxTargetByName('"ShareExt"');
    if (target) {
      console.log('    ShareExt target already exists.');
    }

    if (!target) {
      // Add PBXNativeTarget to the project
      target = pbxProject.addTarget('ShareExt', 'app_extension', 'ShareExtension');

      // Add a new PBXSourcesBuildPhase for our ShareViewController
      // (we can't add it to the existing one because an extension is kind of an extra app)
      pbxProject.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);

      // Add a new PBXResourcesBuildPhase for the Resources used by the Share Extension
      // (MainInterface.storyboard)
      pbxProject.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
    }

    // Create a separate PBXGroup for the shareExtensions files, name has to be unique and path must be in quotation marks
    var pbxGroupKey = pbxProject.findPBXGroupKey({name: 'ShareExtension'});
    if (pbxGroupKey) {
      console.log('    ShareExtension group already exists.');
    }
    if (!pbxGroupKey) {
      pbxGroupKey = pbxProject.pbxCreateGroup('ShareExtension', 'ShareExtension');

      // Add the PbxGroup to cordovas "CustomTemplate"-group
      var customTemplateKey = pbxProject.findPBXGroupKey({name: 'CustomTemplate'});
      pbxProject.addToPbxGroup(pbxGroupKey, customTemplateKey);
    }

    // Add files which are not part of any build phase (config)
    files.plist.forEach(function (file) {
      pbxProject.addFile(file.name, pbxGroupKey);
    });

    // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase
    files.source.forEach(function(file) {
      pbxProject.addSourceFile(file.name, {target: target.uuid}, pbxGroupKey);
    });

    //  Add the resource file and include it into the targest PbxResourcesBuildPhase and PbxGroup
    files.resource.forEach(function(file) {
      pbxProject.addResourceFile(file.name, {target: target.uuid}, pbxGroupKey);
    });

    var configurations = pbxProject.pbxXCBuildConfigurationSection();
    for (var key in configurations) {
      if (typeof configurations[key].buildSettings !== 'undefined') {
        var buildSettingsObj = configurations[key].buildSettings;
        if (typeof buildSettingsObj['PRODUCT_NAME'] !== 'undefined') {
          buildSettingsObj['CODE_SIGN_ENTITLEMENTS'] = '"ShareExtension/ShareExtension-Entitlements.plist"';
          var productName = buildSettingsObj['PRODUCT_NAME'];
          if (productName.indexOf('ShareExt') >= 0) {
            buildSettingsObj['PRODUCT_BUNDLE_IDENTIFIER'] = bundleIdentifier+BUNDLE_SUFFIX;
          }
        }
      }
    }

    //Add development team and provisioning profile
    var PROVISIONING_PROFILE = getCordovaParameter(configXml, 'SHAREEXT_PROVISIONING_PROFILE');
    var DEVELOPMENT_TEAM = getCordovaParameter(configXml, 'SHAREEXT_DEVELOPMENT_TEAM');
    console.log('Adding team', DEVELOPMENT_TEAM, 'and provisoning profile', PROVISIONING_PROFILE);
    if (PROVISIONING_PROFILE && DEVELOPMENT_TEAM) {
      var configurations = pbxProject.pbxXCBuildConfigurationSection();
      for (var key in configurations) {
        if (typeof configurations[key].buildSettings !== 'undefined') {
          var buildSettingsObj = configurations[key].buildSettings;
          if (typeof buildSettingsObj['PRODUCT_NAME'] !== 'undefined') {
            var productName = buildSettingsObj['PRODUCT_NAME'];
            if (productName.indexOf('ShareExt') >= 0) {
              buildSettingsObj['PROVISIONING_PROFILE'] = PROVISIONING_PROFILE;
              buildSettingsObj['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM;
              buildSettingsObj['CODE_SIGN_STYLE'] = 'Manual';
              buildSettingsObj['CODE_SIGN_IDENTITY'] = '"iPhone Distribution"';
              console.log('Added signing identities for extension!');
            }
          }
        }
      }
    }

    // Add a new PBXFrameworksBuildPhase for the Frameworks used by the Share Extension
    // (NotificationCenter.framework, libCordova.a)
    // var frameworksBuildPhase = pbxProject.addBuildPhase(
    //   [],
    //   'PBXFrameworksBuildPhase',
    //   'Frameworks',
    //   target.uuid
    // );
    // if (frameworksBuildPhase) {
    //   log('Successfully added PBXFrameworksBuildPhase!', 'info');
    // }

    // Add the frameworks needed by our shareExtension, add them to the existing Frameworks PbxGroup and PBXFrameworksBuildPhase
    // var frameworkFile1 = pbxProject.addFramework(
    //   'NotificationCenter.framework',
    //   { target: target.uuid }
    // );
    // var frameworkFile2 = pbxProject.addFramework('libCordova.a', {
    //   target: target.uuid,
    // }); // seems to work because the first target is built before the second one
    // if (frameworkFile1 && frameworkFile2) {
    //   log('Successfully added frameworks needed by the share extension!', 'info');
    // }

    // Add build settings for Swift support, bridging header and xcconfig files
    // var configurations = pbxProject.pbxXCBuildConfigurationSection();
    // for (var key in configurations) {
    //   if (typeof configurations[key].buildSettings !== 'undefined') {
    //     var buildSettingsObj = configurations[key].buildSettings;
    //     if (typeof buildSettingsObj['PRODUCT_NAME'] !== 'undefined') {
    //       var productName = buildSettingsObj['PRODUCT_NAME'];
    //       if (productName.indexOf('ShareExtension') >= 0) {
    //         if (addXcconfig) {
    //           configurations[key].baseConfigurationReference =
    //             xcconfigReference + ' /* ' + xcconfigFileName + ' */';
    //           log('Added xcconfig file reference to build settings!', 'info');
    //         }
    //         if (addEntitlementsFile) {
    //           buildSettingsObj['CODE_SIGN_ENTITLEMENTS'] = '"' + 'ShareExtension' + '/' + entitlementsFileName + '"';
    //           log('Added entitlements file reference to build settings!', 'info');
    //         }
    //       }
    //     }
    //   }
    // }

    // Write the modified project back to disc
    // console.log('    Writing the modified project back to disk...');
    fs.writeFileSync(pbxProjectPath, pbxProject.writeSync());
    console.log('Added ShareExtension to XCode project');

    deferral.resolve();
  });

  return deferral.promise;
};
