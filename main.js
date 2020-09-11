const { app, BrowserWindow } = require('electron');
const { Level, Map } = require('classes/maps/content.js');

app.once('ready', () => {
  let win = new BrowserWindow();
  win.loadFile("test.html");
  win.show();
  win.maximize();
});
