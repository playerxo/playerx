import { getName, setName } from './helpers/string.js';
import { isMethod, getProperty, getMethod } from './utils/utils.js';
import { getPropertyDescriptor } from './utils/object.js';

export function base(element, player) {
  return {

    /**
     * Set a player property, try player interface first, then internal api.
     * @param  {string} name
     * @param {*} value
     * @return {*}
     */
    set(name, value) {
      let descriptor = getPropertyDescriptor(player, name);
      if (descriptor && descriptor.set) return (player[name] = value);

      const method = setName(name);
      if (isMethod(player, method)) return player[method](value);

      if (!player.api) return;

      descriptor = getPropertyDescriptor(player.api, name);
      if (descriptor && descriptor.set) return (player.api[name] = value);

      if (isMethod(player.api, name)) return player.api[name](value);
      if (isMethod(player.api, method)) return player.api[method](value);
    },

    /**
     * Get a player property, try player interface first, then internal api.
     * @param  {string} name
     * @return {*}
     */
    get(name) {
      let result;
      const method = getName(name);
      if ((result = getProperty(player, name)) !== undefined) return result;
      if ((result = getMethod(player, method)) !== undefined) return result;

      if (!player.api) return;

      if ((result = getProperty(player.api, name)) !== undefined) return result;
      if ((result = getMethod(player.api, name)) !== undefined) return result;
      if ((result = getMethod(player.api, method)) !== undefined) return result;
    },

    remove() {
      return player.api.remove();
    },

    play() {
      return player.api.play();
    },

    pause() {
      return player.api.pause();
    },

    on(eventName, callback) {
      player.api.on(eventName, callback);
    },

    off(eventName, callback) {
      player.api.off(eventName, callback);
    },

    setPlaying(playing) {
      if (!element.paused && !playing) {
        return player.pause();
      }
      if (element.paused && playing) {
        return player.play();
      }
    },

    getEnded() {
      return element.currentTime == element.duration;
    },

    getKey() {
      return player.name.toLowerCase();
    },
  };
}
