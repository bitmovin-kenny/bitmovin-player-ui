import { ToggleButton, ToggleButtonConfig } from './togglebutton';
import { UIInstanceManager } from '../uimanager';
import { PlayerAPI } from 'bitmovin-player';
import { i18n } from '../localization/i18n';
import { VideoQualitySelectBox } from './videoqualityselectbox';

let clicked = false;
let isOn = false;
let adaptationConfig: any;
export class EcoModeToggle extends ToggleButton<ToggleButtonConfig> {
  constructor(config: ToggleButtonConfig = {}) {
    super(config);

    const defaultConfig: ToggleButtonConfig = {
      text: i18n.getLocalizer('ecoMode'),
      cssClass: 'ui-ecoModetogglebutton',
      onClass: 'on',
      offClass: 'off',
      ariaLabel: i18n.getLocalizer('ecoMode'),
    };

    this.config = this.mergeConfig(config, defaultConfig, this.config);
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    console.log(uimanager.getConfig());

    this.onClick.subscribe(() => {
      clicked = true;
      if (clicked === true && !isOn) {
        this.on();
        clicked = false;
        isOn = true;
        adaptationConfig = player.adaptation.getConfig();

        if (player.getAvailableVideoQualities()[0].codec.includes('avc')) {
          player.adaptation.setConfig({
            resolution: { maxSelectableVideoHeight: 720 },
          } as any);
        }
        if (
          player.getAvailableVideoQualities()[0].codec.includes('hvc') ||
          player.getAvailableVideoQualities()[0].codec.includes('hev')
        ) {
          player.adaptation.setConfig({
            resolution: { maxSelectableVideoHeight: 1080 },
          } as any);
        }
        if (
          player.getAvailableVideoQualities()[0].codec.includes('av1') ||
          player.getAvailableVideoQualities()[0].codec.includes('av01')
        ) {
          player.adaptation.setConfig({
            resolution: { maxSelectableVideoHeight: 1440 },
          } as any);
        }
      } else {
        this.off();
        clicked = false;
        isOn = false;
        player.adaptation.setConfig(adaptationConfig);
      }
    });
    const selectBox = document.getElementById('bmpui-id-131');

    //uimanager.getConfig().events.onUpdated.subscribe(updateVideoQualities);
  }
}
