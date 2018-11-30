"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const Amplitude = require("amplitude");
const ua = require("universal-analytics");
class Tracker {
    constructor({ config, userId }) {
        this.userId = userId;
        const amplitudeApiKey = lodash_1.get(config, 'amplitude.apiKey');
        if (amplitudeApiKey)
            this.amplitude = new Amplitude(amplitudeApiKey);
        const gaTrackingId = lodash_1.get(config, 'googleAnalytics.trackingId');
        if (gaTrackingId)
            this.ga = ua(gaTrackingId, userId, { strictCidFormat: false });
    }
    trackEvent({ event, data = {}, userData = {}, }) {
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
exports.default = Tracker;
//# sourceMappingURL=Tracker.js.map