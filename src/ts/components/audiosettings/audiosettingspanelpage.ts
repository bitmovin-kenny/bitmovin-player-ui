import { AudioFilter, AudioFilterConfig, AudioFilterRange } from 'bitmovin-player/types/audio/API';
import { SettingsPanelItem } from '../settingspanelitem';
import { SeekBar, SeekBarConfig } from './../seekbar';
import { SettingsPanelPage } from './../settingspanelpage';
import { ToggleButton } from './../togglebutton';
import { UIInstanceManager } from '../../uimanager';
import { PlayerAPI } from 'bitmovin-player';

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
        this.addComponent(new SettingsPanelItem(conf.name, new AudioFilterSlider(conf.value as AudioFilterRange, this.audioFilter, conf)));
      }
      else {
        throw 'Unknown filter config type: ' + conf.type;
      }
    });
  }
}

export class AudioFilterSlider extends SeekBar {

  private range: AudioFilterRange;
  private filter: AudioFilter;
  private filterConfig: AudioFilterConfig;

  constructor(range: AudioFilterRange, filter: AudioFilter, filterConfig: AudioFilterConfig, config: SeekBarConfig = {}) {
    super(config);

    this.config = this.mergeConfig(config, <SeekBarConfig>{
      cssClass: 'ui-volumeslider ui-audio-filter',
    }, this.config);

    this.range = range;
    this.filter = filter;
    this.filterConfig = filterConfig;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager, false);

    const totalRange = this.range.max - this.range.min;
    this.setPlaybackPosition((this.range.current / totalRange) * 100);

    this.onSeeked.subscribe((sender, percentage) => {
      (this.filterConfig.value as any).current = totalRange * (percentage / 100);
      player.audio.updateFilter(this.filter);
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