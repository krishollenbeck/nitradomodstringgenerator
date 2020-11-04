const { shell } = require('electron')

module.exports = function(){
    return [
        {
            label: 'File',
            submenu: [
            { label: 'Exit', role: 'quit' }
            ]
        },
        {
            label: 'Nitrado',
            click() { shell.openExternal('https://server.nitrado.net/') }
        }
    ]
}