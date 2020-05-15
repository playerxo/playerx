// https://developers.facebook.com/docs/plugins/embedded-video-player/api/

import { define } from '../define.js';
import { createResponsiveStyle } from '../helpers/css.js';
import { getVideoId } from '../helpers/url.js';
import { createElement } from '../utils/dom.js';
import { extend } from '../utils/object.js';
import { loadScript } from '../utils/load-script.js';
import { publicPromise } from '../utils/promise.js';
import { uniqueId } from '../utils/utils.js';
import { addCssRule } from '../utils/css.js';
import { createPlayPromise } from '../helpers/video.js';
import { options } from '../options.js';
export { options };

const API_URL = 'https://connect.facebook.net/en_US/sdk.js';
const API_GLOBAL = 'FB';
const API_GLOBAL_READY = 'fbAsyncInit';
const MATCH_URL = /facebook\.com\/.*videos\/(\d+)/;

facebook.canPlay = src => MATCH_URL.test(src);

export function facebook(element) {
  let api;
  let div;
  let ready;
  let style = createResponsiveStyle(element, 'div > span > iframe');

  function getOptions() {
    return {
      autoplay: element.playing || element.autoplay,
      controls: element.controls,
      url: element.src,
      ...element.config.facebook,
    };
  }

  async function init() {
    ready = publicPromise();

    const opts = getOptions();
    const id = uniqueId('fb');

    div = createElement('div', {
      id,
      class: 'fb-video',
      style: 'position:absolute;width:100%;height:100%',
      'data-href': opts.url,
      'data-autoplay': '' + opts.autoplay,
      'data-allowfullscreen': 'true',
      'data-controls': '' + opts.controls,
    });

    const selector = `player-x[src="${opts.url}"] > div > span`;
    addCssRule(selector, {
      width: '100% !important',
      height: '100% !important',
    });

    const FB = await loadScript(opts.apiUrl || API_URL, API_GLOBAL, API_GLOBAL_READY);
    FB.init({
      appId: opts.appId,
      version: opts.version,
      xfbml: true,
    });

    FB.Event.subscribe('xfbml.ready', msg => {
      if (msg.type === 'video' && msg.id === id) {
        api = msg.instance;
        ready.resolve();
      }
    });
  }

  const eventAliases = {
    pause: 'paused',
    play: 'startedPlaying',
    ended: 'finishedPlaying',
    bufferstart: 'startedBuffering',
    bufferend: 'finishedBuffering',
  };

  const methods = {
    name: 'Facebook',
    version: '1.x.x',

    get element() {
      return div;
    },

    get api() {
      return api;
    },

    get videoId() {
      return getVideoId(MATCH_URL, element.src);
    },

    ready() {
      return ready;
    },

    remove() {
      div.remove();
    },

    play() {
      // fb.play doesn't return a play promise.
      api.play();
      return createPlayPromise(element);
    },

    stop() {
      api.seek(0);
      api.pause();
    },

    on(eventName, callback) {
      (callback._listeners || (callback._listeners = {}))[eventName] =
        api.subscribe(eventAliases[eventName] || eventName, callback);
    },

    off(eventName, callback) {
      callback._listeners[eventName].release();
    },

    set src(value) {
      style.update(element);
      element.load();
    },

    set controls(value) {
      element.load();
    },

    get currentTime() {
      return api.getCurrentPosition();
    },

    set currentTime(seconds) {
      api.seek(seconds);
    },

    set volume(volume) {
      api.setVolume(+volume);
    },

    set muted(muted) {
      muted ? api.mute() : api.unmute();
    },

    get muted() {
      return api.isMuted();
    },
  };

  init();

  return extend(style.methods, methods);
}

export const Facebook = define('player-facebook', facebook);