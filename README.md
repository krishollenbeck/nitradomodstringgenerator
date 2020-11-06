### Package app
`npm install electron-packager --save-dev`
`npm install electron-packager -g`
electron-packager . nmsg --platform win32 --arch x64 --out dist/ --overwrite

### Package app for windows
`npm install -g electron-installer-windows`
`npm install --save-dev electron-installer-windows`
electron-installer-windows --src dist/nmsg-win32-x64/ --dest dist/installers/