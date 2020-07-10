import Reactive from './Reactive';
import {l} from '../js/i18n';

class Notify extends Reactive {
  constructor() {
    super();

    this.prop('persist', 'notificationCloseDelay', 5000);
    this.prop('persist', 'wantNotifications', null);
    this.prop('ro', 'desktopAccess', () => this.Notification.permission);
    this.prop('rw', 'documentVisible', !document.hidden);

    this.Notification = window.Notification || {permission: 'denied'};

    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  requestDesktopAccess() {
    if (!this.Notification.requestPermission) return this;
    this.Notification.requestPermission(() => this.update({desktopAccess: true}));
    return this;
  }

  show(message, params = {}) {
    if (!params.title) params.title = document.title;
    return this._cannotShowOnDesktop(params) ? this._showInConsole(message, params) : this._showOnDesktop(message, params);
  }

  update(params) {
    const prevWantNotifications = this.wantNotifications;
    super.update(params);
    if (params.wantNotifications && !prevWantNotifications) this.show(l('You have enabled notifications.'), {force: true});
    return this;
  }

  _cannotShowOnDesktop(params = {}) {
    if (this.Notification.permission != 'granted') return this.Notification.permission || 'unknown';
    if (!this.wantNotifications) return 'wantNotifications=false';
    if (!params.force && !this.documentVisible) return 'window.focus=false';
    return '';
  }

  _onClick(e, notification, params) {
    notification.close();
    window.focus();
    this.emit('click', {...params, sourceEvent: e});
  }

  _onVisibilityChange(e) {
    this.update({documentVisible: !document.hidden});
  }

  _showInConsole(message, params) {
    console.info('[Notify]', message, params);
  }

  _showOnDesktop(message, params) {
    const notification = new Notification(params.title, {...params, body: message});
    notification.onclick = (e) => this._onClick(e, notification, params);
    setTimeout(() => notification.close(), this.notificationCloseDelay);
  }
}

export const notify = (message, params) => (message ? notify.singleton.show(message, params) : notify.singleton);
notify.singleton = new Notify();
