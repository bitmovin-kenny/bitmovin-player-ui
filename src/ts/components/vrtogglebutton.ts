import {ToggleButton, ToggleButtonConfig} from './togglebutton';
import {UIInstanceManager} from '../uimanager';
import { PlayerAPI, PlayerEvent, WarningEvent } from 'bitmovin-player';

/**
 * A button that toggles the video view between normal/mono and VR/stereo.
 */
export class VRToggleButton extends ToggleButton<ToggleButtonConfig> {

  constructor(config: ToggleButtonConfig = {}) {
    super(config);

    this.config = this.mergeConfig(config, {
      cssClass: 'ui-vrtogglebutton',
      text: 'VR',
    }, this.config);
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    let isVRConfigured = () => {
      // VR availability cannot be checked through getVRStatus() because it is asynchronously populated and not
      // available at UI initialization. As an alternative, we check the VR settings in the config.
      // TODO use getVRStatus() through isVRStereoAvailable() once the player has been rewritten and the status is
      // available in Ready
      const source = player.getSource();
      return source && Boolean(source.vr);
    };

    let isVRStereoAvailable = () => {
      const source = player.getSource();
      return player.vr && Boolean(source.vr);
    };

    let vrStateHandler = (ev: PlayerEvent) => {
      if (ev.type === player.exports.Event.Warning
        && (ev as WarningEvent).code !== player.exports.WarningCode.VR_RENDERING_ERROR) {
        // a code of 5006 signals a VR Error, so don't do anything on other warnings
        return;
      }

      if (isVRConfigured() && isVRStereoAvailable()) {
        this.show(); // show button in case it is hidden

        if (player.vr && player.vr.getStereo()) {
          this.on();
        } else {
          this.off();
        }
      } else {
        this.hide(); // hide button if no stereo mode available
      }
    };

    let vrButtonVisibilityHandler = () => {
      if (isVRConfigured()) {
        this.show();
      } else {
        this.hide();
      }
    };

    player.on(player.exports.Event.VRStereoChanged, vrStateHandler);
    player.on(player.exports.Event.Warning, vrStateHandler);
    // Hide button when VR source goes away
    player.on(player.exports.Event.SourceUnloaded, vrButtonVisibilityHandler);
    // Show button when a new source is loaded and it's VR
    player.on(player.exports.Event.SourceLoaded, vrButtonVisibilityHandler);

    this.onClick.subscribe(() => {
      if (!isVRStereoAvailable()) {
        if (console) {
          console.log('No VR content');
        }
      } else {
        if (player.vr && player.vr.getStereo()) {
          player.vr.setStereo(false);
        } else {
          player.vr.setStereo(true);
        }
      }
    });

    // Set startup visibility
    vrButtonVisibilityHandler();
  }
}