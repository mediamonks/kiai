import { get } from 'lodash';
import { TConfig, TKeyValue } from './Types';
import * as Amplitude from 'amplitude';
import * as ua from 'universal-analytics';

export default class Tracking {
  private readonly _amplitude: Amplitude;
  private readonly _ga: any;
  private readonly _userId: string;

  constructor({ config, userId }: { config: TConfig; userId: string }) {
    this._userId = userId;

    const amplitudeApiKey = get(config, 'amplitude.apiKey');
    if (amplitudeApiKey) this._amplitude = new Amplitude(amplitudeApiKey);

    const gaTrackingId = get(config, 'googleAnalytics.trackingId');
    if (gaTrackingId) this._ga = ua(gaTrackingId, userId, { strictCidFormat: false });
  }

  trackEvent({
    event,
    data = {},
    userData = {},
  }: {
    event: string;
    data?: TKeyValue;
    userData?: TKeyValue;
  }): void {
    if (this._amplitude)
      this._amplitude.track({
        eventType: event,
        userId: this._userId,
        sessionId: Date.now(),
        eventProperties: data,
        userProperties: userData,
      });

    if (this._ga)
      this._ga.event({
        ec: data.category || '',
        ea: event,
        el: data.label || '',
        ev: data.value,
      });
  }
}
