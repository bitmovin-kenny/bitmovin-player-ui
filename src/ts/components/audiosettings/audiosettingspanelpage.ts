import { AudioFilter, AudioFilterConfig } from 'bitmovin-player/types/audio/API';
import { SettingsPanelItem } from '../settingspanelitem';
import { SeekBar, SeekBarConfig } from './../seekbar';
import { SettingsPanelPage } from './../settingspanelpage';
import { ToggleButton } from './../togglebutton';
import { PlayerAPI } from 'bitmovin-player';
import { UIInstanceManager } from '../../uimanager';

export class AudioSettingsPanelPage extends SettingsPanelPage {
  private audioFilter: AudioFilter;
  constructor(filter: AudioFilter) {
    super({});
    this.audioFilter = filter;
    filter.config.forEach((conf: AudioFilterConfig) => {
      if (conf.type === 'bool') {
        this.addComponent(new SettingsPanelItem(conf.name, new ToggleButton({})));
      }
      else if (conf.type === 'range') {
        this.addComponent(new SettingsPanelItem(conf.name, new AudioFilterSlider(conf.value as Range, this.audioFilter, conf)));
      }
      else {
        throw 'Unknown filter config type: ' + conf.type;
      }
    });
  }
}

interface Range {
  min: number;
  max: number;
}

export class AudioFilterSlider extends SeekBar {

  private totalRange: number;
  private filter: AudioFilter;
  private filterConfig: AudioFilterConfig;

  constructor(range: Range, filter: AudioFilter, filterConfig: AudioFilterConfig, config: SeekBarConfig = {}) {
    super(config);

    this.config = this.mergeConfig(config, <SeekBarConfig>{
      cssClass: 'ui-volumeslider',
      hideIfVolumeControlProhibited: true,
    }, this.config);

    this.totalRange = range.max - range.min;
    this.filter = filter;
    this.filterConfig = filterConfig;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager, false);

    this.onSeeked.subscribe((sender, percentage) => {
      (this.filterConfig.value as any).current = this.totalRange * (percentage / 100);
    });

    player.on(player.exports.PlayerEvent.PlayerResized, () => {
      this.refreshPlaybackPosition();
    });
    uimanager.onConfigured.subscribe(() => {
      this.refreshPlaybackPosition();
    });
    uimanager.getConfig().events.onUpdated.subscribe(() => {
      this.refreshPlaybackPosition();
    });
    uimanager.onComponentShow.subscribe(() => {
      this.refreshPlaybackPosition();
    });
    uimanager.onComponentHide.subscribe(() => {
      this.refreshPlaybackPosition();
    });
  }
}