const assert = require('assert');

module.exports = function(player) {
  const plxo = browser.capabilities['plx:options'] || {};

  describe(`Playback${plxo.saucenetwork ? ` (${plxo.saucenetwork})` : ''}: ${player}`, function() {

    it(`plays the test video`, function() {
      // Specify this test to only retry up to 2 times
      this.retries(2);

      let url = `https://dev.playerx.io/${plxo.page || 'demo'}/${player}/`;
      if (plxo.clip > 1) {
        url += `${plxo.clip}/`;
      }
      if (process.env.MUX_ENV) {
        url += `?dennis=ahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagicwordahahahyoudidntsaythemagic`;
        url += `&muxenv=${process.env.MUX_ENV}`;
      }

      if (plxo.saucenetwork) {
        // @see https://webdriver.io/docs/api/saucelabs.html#parameters-1
        // network condition to set (e.g. 'online', 'offline', 'GPRS', 'Regular 2G', 'Good 2G', 'Regular 3G', 'Good 3G', 'Regular 4G', 'DSL', 'Wifi')
        browser.throttleNetwork(plxo.saucenetwork);
      }

      browser.url(url);
      browser.setTimeout({ script: 30000 });

      expect(browser).toHaveTitleContaining('Playerx');

      console.warn(`Wait ready for ${player}`);
      assert(browser.executeAsync(async function(done) {
        const plx = document.querySelector('player-x');
        await plx.ready();
        done(true);
      }));

      console.warn(`Starting playback for ${player}`);

      if (player === 'facebook' && plxo.os === 'android') {
        // switch in the video iframe
        const fbiframe = browser.$('iframe');
        browser.switchToFrame(fbiframe);
        // find the facebook play button and click it
        const playBtn = browser.$('div[data-sigil="m-video-play-button playInlineVideo"]');
        playBtn.click();
        browser.switchToParentFrame();
      }

      assert(browser.executeAsync(async function(done) {
        const plx = document.querySelector('player-x');

        // facebook on Android doesn't fire a playing event.
        const onTime = () => {
          plx.removeEventListener('timeupdate', onTime);
          done(true);
        };
        plx.addEventListener('timeupdate', onTime);

        plx.play();
        setTimeout(() => {
          if (plx.paused) plx.click();
        }, 1000);
      }));

      if (plxo.seek) {
        console.warn(`Seeking 10s from the end for ${player}`);
        assert(browser.executeAsync(async function(done) {
          setTimeout(() => {
            const plx = document.querySelector('player-x');
            plx.currentTime = plx.duration - 10;
            done(true);
          }, 10000);
        }));
      } else {
        // If we don't seek play the whole clip of ~1.5min.
        browser.setTimeout({ script: 2 * 60 * 1000 });
      }

      console.warn(`Waiting until ended for ${player}`);
      assert(browser.executeAsync(async function(done) {
        const plx = document.querySelector('player-x');
        plx.on('ended', () => done(true));

        // facebook on Android doesn't fire an ended event.
        plx.addEventListener('timeupdate', () => {
          if (plx.currentTime >= Math.floor(plx.duration)) {
            done(true);
          }
        });
      }));

    });

  });

};
