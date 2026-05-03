import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

window.onerror = (msg, url, line, col, error) => {
  document.body.innerHTML = `<div style="color:red; padding:20px; background:white; position:fixed; z-index:99999; top:0; left:0; right:0; bottom:0;">
    <h1>Runtime Error</h1>
    <p>${msg}</p>
    <pre>${error?.stack || ''}</pre>
  </div>`;
};

bootstrapApplication(App, appConfig).catch((err) => {
  console.error(err);
  document.body.innerHTML = `<div style="color:red; padding:20px; background:white; position:fixed; z-index:99999; top:0; left:0; bottom:0; right:0;">
    <h1>Bootstrap Error</h1>
    <p>${err.message}</p>
    <pre>${err.stack}</pre>
  </div>`;
});
