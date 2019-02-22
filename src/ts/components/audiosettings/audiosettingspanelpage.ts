import { PlayerAPI } from 'bitmovin-player';
import { AudioFilter, AudioFilterConfig, AudioFilterList, AudioFilterRange } from 'bitmovin-player/types/audio/API';
import { UIInstanceManager } from '../../uimanager';
import { SettingsPanel } from '../settingspanel';
import { SettingsPanelItem } from '../settingspanelitem';
import { ListSelectorConfig } from './../listselector';
import { SeekBar, SeekBarConfig } from './../seekbar';
import { SelectBox } from './../selectbox';
import { SettingsPanelPage } from './../settingspanelpage';
import { SettingsPanelPageBackButton } from './../settingspanelpagebackbutton';
import { SettingsPanelPageOpenButton } from './../settingspanelpageopenbutton';
import { Spacer } from './../spacer';
import { SubtitleSettingsLabel } from './../subtitlesettings/subtitlesettingslabel';
import { ToggleButton } from './../togglebutton';
import { ListBox } from '../listbox';

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

    this.selectItem('off');

    this.onItemSelected.subscribe((_, key: string) => {
      this.handleItemSelection(player, key);
    });
  }

  private handleItemSelection(player: PlayerAPI, key: string) {
    if (key === 'on') {
      if (!this.audioFilter.id) {
        // TODO: last index instead of 0
        const update = player.audio.addFilter(this.audioFilter, 0);
        this.audioFilter.id = update.id;
      }
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
      else if (conf.type === 'list') {
        this.addComponent(new SettingsPanelItem(conf.name, new ReverbSelectBox(filter, conf)));
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

export class ReverbSelectBox extends SelectBox {

  private filter: AudioFilter;
  private filterConfig: AudioFilterConfig;

  constructor(filter: AudioFilter, config: AudioFilterConfig) {
    super({});

    this.filter = filter;
    this.filterConfig = config;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager);

    (this.filterConfig.value as AudioFilterList).list.forEach((impulseResponseName: string) => {
      this.addItem(impulseResponseName, impulseResponseName);
    });

    this.onItemSelected.subscribe((_, key: string) => {
      if (!this.filter.id) {
        this.filter = player.audio.addFilter(this.filter, 0);
      }

      (this.filterConfig.value as AudioFilterList).current = key;

      player.audio.updateFilter(this.filter);
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
      cssClass: 'ui-volumeslider',
    }, this.config);

    this.range = range;
    this.filter = filter;
    this.filterConfig = filterConfig;
  }

  configure(player: PlayerAPI, uimanager: UIInstanceManager): void {
    super.configure(player, uimanager, false);

    const totalRange = this.range.max - this.range.min;

    const updateFilterForPosition = (percentage: number) => {
      const range: AudioFilterRange = this.filterConfig.value as AudioFilterRange;
      range.current = range.min + (totalRange * (percentage / 100));
      this.setPlaybackPosition(percentage);
      // only update when it has been added
      if (this.filter.id) {
        player.audio.updateFilter(this.filter);
      }
    };

    this.onSeeked.subscribe((_, percentage) => {
      updateFilterForPosition(percentage);
    });
    this.onSeekPreview.subscribeRateLimited((_, args) => {
      if (args.scrubbing) {
        updateFilterForPosition(args.position);
      }
    }, 50);

    player.on(player.exports.PlayerEvent.PlayerResized, () => {
      this.refreshPlaybackPosition();
    });
    uimanager.getConfig().events.onUpdated.subscribe(() => {
      this.refreshPlaybackPosition();
    });
  }

  refreshPlaybackPosition() {
    console.warn('refreshPlaybackPosition', this.seekBar.width());
    const totalRange = this.range.max - this.range.min;
    const percentage = ((this.range.current - this.range.min) / totalRange) * 100;
    this.setPlaybackPosition(percentage);
  }
}