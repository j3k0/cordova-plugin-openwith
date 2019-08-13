//
//  iosRemoveTarget.js
//  This hook runs for the iOS platform when the plugin or platform is removed.
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

const PLUGIN_ID = "cc.fovea.cordova.openwith";
const BUNDLE_SUFFIX = ".shareextension";

var fs = require('fs');
var path = require('path');

function redError(message) {
    return new Error('"' + PLUGIN_ID + '" \x1b[1m\x1b[31m' + message + '\x1b[0m');
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

console.log('Removing target "' + PLUGIN_ID + '/ShareExtension" to XCode project');

module.exports = function (context) {

  var Q = require('q');
  var deferral = new Q.defer();

  findXCodeproject(context, function(projectFolder, projectName) {

    console.log('  - Folder containing your iOS project: ' + iosFolder(context));

    var pbxProjectPath = path.join(projectFolder, 'project.pbxproj');
    var pbxProject = parsePbxProject(context, pbxProjectPath);
    var files = getShareExtensionFiles(context);

    // Find if the project already contains the target and group
    var target = pbxProject.pbxTargetByName('ShareExtension');
    var pbxGroupKey = pbxProject.findPBXGroupKey({name: 'ShareExtension'});

    // Remove the PbxGroup from cordovas "CustomTemplate"-group
    if (pbxGroupKey) {
      var customTemplateKey = pbxProject.findPBXGroupKey({name: 'CustomTemplate'});
      pbxProject.removeFromPbxGroup(pbxGroupKey, customTemplateKey);

      // Remove files which are not part of any build phase (config)
      files.plist.forEach(function (file) {
        pbxProject.removeFile(file.name, pbxGroupKey);
      });

      // Remove source files to our PbxGroup and our newly created PBXSourcesBuildPhase
      files.source.forEach(function(file) {
        pbxProject.removeSourceFile(file.name, {target: target.uuid}, pbxGroupKey);
      });

      //  Remove the resource file and include it into the targest PbxResourcesBuildPhase and PbxGroup
      files.resource.forEach(function(file) {
        pbxProject.removeResourceFile(file.name, {target: target.uuid}, pbxGroupKey);
      });
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

    // if (resourcesBuildPhase) {
    //   console.log('    Successfully added PBXResourcesBuildPhase!');
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
    console.log('Removed ShareExtension from XCode project');

    deferral.resolve();
  });

  return deferral.promise;
};
