import { Spacer } from './../spacer';
import { SettingsPanelPageBackButton } from './../settingspanelpagebackbutton';
import { ListSelectorConfig } from './../listselector';
import { SelectBox } from './../selectbox';
import { SubtitleSettingsLabel } from './../subtitlesettings/subtitlesettingslabel';
import { SettingsPanelPageNavigatorButton } from './../settingspanelpagenavigatorbutton';
import { SettingsPanelPageOpenButton } from './../settingspanelpageopenbutton';
import { AudioFilter, AudioFilterConfig, AudioFilterRange } from 'bitmovin-player/types/audio/API';
import { SettingsPanelItem } from '../settingspanelitem';
import { SeekBar, SeekBarConfig } from './../seekbar';
import { SettingsPanelPage } from './../settingspanelpage';
import { ToggleButton } from './../togglebutton';
import { UIInstanceManager } from '../../uimanager';
import { PlayerAPI } from 'bitmovin-player';
import { SettingsPanel } from '../settingspanel';
import { SubtitleSelectBox } from '../subtitleselectbox';

export class AudioSettingsOverviewPage extends SettingsPanel {

  constructor(availableFilters: AudioFilter[]) {
    super({
      hidden: true,
    });

    const mainPage = new SettingsPanelPage({
      // cssClass: 'audio-settings',
    });
    this.addComponent(mainPage);
    availableFilters.forEach(filter => {
      const filterDetailPage = new AudioSettingsPanelPage(filter, this);
      const audioFilterSettingsOpeneer = new SettingsPanelPageOpenButton({
        targetPage: filterDetailPage,
        container: this,
        text: 'open',
      });
      this.addComponent(filterDetailPage);

      mainPage.addComponent(new SettingsPanelItem(
        new SubtitleSettingsLabel({text: filter.name, opener: audioFilterSettingsOpeneer}),
        new AudioFilterEnableBox(filter)
      ));

    });
  }
}

export class AudioFilterEnableBox extends SelectBox {
  private audioFilter: AudioFilter;
  constructor(filter: AudioFilter, config: ListSelectorConfig = {}) {
    super(config);
    this.audioFilter = filter;

    this.config = this.mergeConfig(config, {
      cssClasses: ['ui-subtitleselectbox'],
    }, this.config);
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    this.addItem('on', 'Enabled');
    this.addItem('off', 'Disabled');

    this.onItemSelected.subscribe((_, key: string) => {
      this.handleItemSelection(player, key);
    });
  }

  private handleItemSelection(player: PlayerAPI, key: string) {
    if (key === 'on') {
      player.audio.activateFilter(this.audioFilter);
    } else {
      player.audio.deactivateFilter(this.audioFilter);
    }
  }
}


export class AudioSettingsPanelPage extends SettingsPanelPage {
  private audioFilter: AudioFilter;
  constructor(filter: AudioFilter, parent: SettingsPanel) {
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

    const backButton = new SettingsPanelPageBackButton({
      container: parent,
      text: 'Back',
    });

    this.addComponent(new SettingsPanelItem(backButton, new Spacer()));
  }
}

export class AudioFilterSlider extends SeekBar {

  private range: AudioFilterRange;
  private filter: AudioFilter;
  private filterConfig: AudioFilterConfig;

  constructor(range: AudioFilterRange, filter: AudioFilter, filterConfig: AudioFilterConfig, config: SeekBarConfig = {}) {
    super(config);

    this.config = this.mergeConfig(config, <SeekBarConfig>{
      cssClass: 'ui-volumeslider',
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