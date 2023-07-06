import { Ionic$ } from '..';
import { ElementActionOptions } from '../..';
import { IonicComponent } from './component';

export interface TapButtonOptions extends ElementActionOptions {
  /**
   * Whether to scroll the element into view first. Default: true
   */
  scroll?: boolean;
}

export class IonicButton extends IonicComponent {
  constructor(selector: string) {
    super(selector);
  }

  static withText(buttonText: string): IonicButton {
    const selector = `ion-button >> text=${buttonText}`;
    return new IonicButton(selector);
  }

  async click({
    visibilityTimeout = 5000,
    scroll = true,
  }: TapButtonOptions = {}) {
    const button = await Ionic$.$testid(this.selector as string);
    await button.waitForDisplayed({ timeout: visibilityTimeout });
    if (scroll) {
      await button.scrollIntoView();
    }
    return button.click();
  }
}
