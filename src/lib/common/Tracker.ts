import { get } from 'lodash';
import { TKeyValue, TPrimitive, TPrimitiveArray, TTrackingConfig } from './types';
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
		data?: {
			category?: string;
			label?: string;
			value?: number;
			[key: string]: TPrimitive | TPrimitiveArray | TKeyValue | TKeyValue[];
		};
		userData?: {
			category?: string;
			label?: string;
			value?: number;
			device?: {
				locale?: string;
			};
			[key: string]: TPrimitive | TPrimitiveArray | TKeyValue | TKeyValue[];
		};
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
			const ga = ua(this.gaTrackingId, userId, { strictCidFormat: false });

			userData = userData || {};

			ga.event({
				ec: (data.category || userData.category || '[unspecified]') as string,
				ea: event,
				el: (data.label || userData.label || '') as string,
				ev: (data.value || userData.value) as number,
				ul: userData.device['locale'] as string,
			}).send();
		}
	}
}
