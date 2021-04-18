// https://docs.api.video/docs/video-player-sdk

import { apivideo as MATCH_SRC } from '../constants/src-regex.js';
import { getVideoId, createEmbedIframe } from '../helpers.js';
import {
  loadScript,
  publicPromise,
  uniqueId,
  promisify,
} from '../utils.js';

const EMBED_BASE = 'https://embed.api.video/vod';
const API_URL = 'https://unpkg.com/@api.video/player-sdk@1.2.5/dist/index.js';
const API_GLOBAL = 'PlayerSdk';

/**
 * @see https://docs.api.video/docs/video-playback-features
 * @param  {Object} props
 * @return {string} e.g. autoplay;loop
 */
function serialize(props) {
  return Object.keys(props)
    .map((key) => props[key] && key)
    .filter(Boolean)
    .join(';');
}

export function createPlayer(element) {
  let api;
  let iframe;
  let ready = publicPromise();

  function getOptions() {
    return {
      autoplay: element.playing || element.autoplay,
      muted: element.muted,
      loop: element.loop,
      hideControls: !element.controls,
      'hide-controls': !element.controls,
      id: getVideoId(MATCH_SRC, element.src),
      ...element.config.apivideo,
    };
  }

  async function init() {
    const opts = getOptions();
    const videoId = getVideoId(MATCH_SRC, element.src);
    const src = `${EMBED_BASE}/${videoId}#${serialize(opts)}`;
    const id = uniqueId('av');
    iframe = createEmbedIframe({ src, id });

    const PlayerSdk = await loadScript(opts.apiUrl || API_URL, API_GLOBAL);
    api = new PlayerSdk(`#${id}`);

    await promisify(api.addEventListener, api)('ready');
    ready.resolve();
  }

  const customEvents = {
  };

  const unsupported = {
    playbackRate: undefined,
  };

  const methods = {
    name: 'api.video',
    key: 'apivideo',
    version: '1.x.x',
    unsupported,

    get element() {
      return iframe;
    },

    get api() {
      return api;
    },

    get videoId() {
      return getVideoId(MATCH_SRC, element.src);
    },

    ready() {
      return ready;
    },

    remove() {
      return api.destroy();
    },

    async stop() {
      await api.pause();
      return api.setCurrentTime(0);
    },

    on(eventName, callback) {
      if (eventName in customEvents) return;
      api.addEventListener(eventName, callback);
    },

    off(eventName, callback) {
      if (eventName in customEvents) return;
      if (api.removeEventListener) {
        api.removeEventListener(eventName, callback);
      }
    },

    setSrc() {
      return api.loadConfig(getOptions());
    },

    setControls() {
      return api.loadConfig(getOptions());
    },

    set muted(muted) {
      muted ? api.mute() : api.unmute();
    },
  };

  init();

  return methods;
}