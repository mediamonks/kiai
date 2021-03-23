import { get } from 'lodash';
import { TKeyValue, TTrackingConfig } from './types';
import Amplitude from 'amplitude';
import * as ua from 'universal-analytics';

export default class Tracker {
	private readonly amplitude: Amplitude;
	private readonly gaTrackingId: string;

	public constructor(config: TTrackingConfig) {
		const amplitudeApiKey = get(config, 'amplitude.apiKey');
		if (amplitudeApiKey) this.amplitude = new Amplitude(amplitudeApiKey);

		this.gaTrackingId = get(config, 'googleAnalytics.trackingId');
	}

	public trackEvent({
		userId,
		event,
		data = {},
		userData = {},
	}: {
		userId: string;
		event: string;
		data?: TKeyValue;
		userData?: TKeyValue;
	}): void {
		if (this.amplitude) {
			this.amplitude.track({
				eventType: event,
				userId,
				sessionId: Date.now(),
				eventProperties: data,
				userProperties: userData,
			});
		}

		if (this.gaTrackingId) {
			const ga = ua(this.gaTrackingId, { uid: userId });

			userData = userData || {};

			ga.event({
				ec: data.category || userData.category || '[unspecified]',
				ea: event,
				el: data.label || userData.label || '',
				ev: data.value || userData.value,
				ul: userData.device['locale'],
			}).send();
		}
	}
}
