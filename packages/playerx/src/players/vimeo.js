// https://github.com/vimeo/player.js

import { define } from '../define.js';
import { createEmbedIframe } from '../helpers/dom.js';
import { createResponsiveStyle } from '../helpers/css.js';
import { extend } from '../utils/object.js';
import { loadScript } from '../utils/load-script.js';
import { publicPromise } from '../utils/promise.js';
import { serialize, boolToBinary } from '../utils/url.js';
import { once } from '../utils/utils.js';
import { createTimeRanges } from '../utils/time-ranges.js';

const EMBED_BASE = 'https://player.vimeo.com/video';
const API_URL = 'https://player.vimeo.com/api/player.js';
const API_GLOBAL = 'Vimeo';
const MATCH_URL = /vimeo\.com\/(?:video\/)?(\d+)/;

vimeo.canPlay = src => MATCH_URL.test(src);

export function vimeo(element) {
  let api;
  let iframe;
  let firePlaying;
  let ready = publicPromise();
  let style = createResponsiveStyle(element);

  function getOptions() {
    return {
      autoplay: element.playing || element.autoplay,
      loop: element.loop,
      playsinline: element.playsinline,
      controls: element.controls,
      url: element.src,
      ...element.config.vimeo,
    };
  }

  function getVideoId(src) {
    let match;
    return (match = src.match(MATCH_URL)) && match[1];
  }

  async function init() {
    const options = getOptions();
    const videoId = getVideoId(element.src);
    const src = `${EMBED_BASE}/${videoId}?${serialize(boolToBinary(options))}`;
    iframe = createEmbedIframe({ src });

    const Vimeo = await loadScript(API_URL, API_GLOBAL);
    api = new Vimeo.Player(iframe);

    api.on('play', () => {
      firePlaying = once(() => element.fire('playing'));
    });

    api.on('timeupdate', () => firePlaying());

    api.on('playbackratechange', ({ playbackRate }) => {
      element.refresh('playbackRate', playbackRate);
    });

    await api.ready();
    ready.resolve();
  }

  const eventAliases = {
    ratechange: 'playbackratechange',
  };

  const customEvents = {
    playing: undefined,
  };

  const methods = {

    get element() {
      return iframe;
    },

    get api() {
      return api;
    },

    ready() {
      return ready;
    },

    remove() {
      return api.destroy();
    },

    stop() {
      return api.unload();
    },

    on(eventName, callback) {
      if (eventName in customEvents) return;
      api.on(eventAliases[eventName] || eventName, callback);
    },

    off(eventName, callback) {
      if (eventName in customEvents) return;
      api.off(eventAliases[eventName] || eventName, callback);
    },

    set src(value) {
      style.update(element);
      api.loadVideo(getOptions());
    },

    set controls(value) {
      api.loadVideo(getOptions());
    },

    async getBuffered() {
      return createTimeRanges(await api.getBuffered());
    },
  };

  init();

  return extend(style.methods, methods);
}

export const Vimeo = define('player-vimeo', vimeo);
