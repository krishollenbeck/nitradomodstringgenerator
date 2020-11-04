### Package app
electron-packager . app --platform win32 --arch x64 --out dist/ --overwrite

### Package app for windows
electron-installer-windows --src dist/app-win32-x64/ --dest dist/installers/