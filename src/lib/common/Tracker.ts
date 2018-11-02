import { get } from 'lodash';
import { TKeyValue, TTrackingConfig } from './Types';
import * as Amplitude from 'amplitude';
import * as ua from 'universal-analytics';

export default class Tracker {
  private readonly amplitude: Amplitude;
  private readonly ga: any;
  private readonly userId: string;

  public constructor({ config, userId }: { config: TTrackingConfig; userId: string }) {
    this.userId = userId;

    const amplitudeApiKey = get(config, 'amplitude.apiKey');
    if (amplitudeApiKey) this.amplitude = new Amplitude(amplitudeApiKey);

    const gaTrackingId = get(config, 'googleAnalytics.trackingId');
    if (gaTrackingId) this.ga = ua(gaTrackingId, userId, { strictCidFormat: false });
  }

  public trackEvent({
    event,
    data = {},
    userData = {},
  }: {
    event: string;
    data?: TKeyValue;
    userData?: TKeyValue;
  }): void {
    if (this.amplitude) {
      this.amplitude.track({
        eventType: event,
        userId: this.userId,
        sessionId: Date.now(),
        eventProperties: data,
        userProperties: userData,
      });
    }

    if (this.ga) {
      this.ga.event({
        ec: data.category || '[unspecified]',
        ea: event,
        el: data.label || '',
        ev: data.value,
      });
    }
  }
}
