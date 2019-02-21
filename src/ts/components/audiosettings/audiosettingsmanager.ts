import { AudioFilter } from 'bitmovin-player/types/audio/API';
import { AudioSettingsPanelPage } from './audiosettingspanelpage';


export class AudioSettingsManager {

  public static getComponentsForFilters(availbleFilters: AudioFilter[]): AudioSettingsPanelPage[] {
    return availbleFilters.map(filter => {
       return new AudioSettingsPanelPage(filter);
    });
  }
}

