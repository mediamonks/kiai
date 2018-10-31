"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const Amplitude = require("amplitude");
const ua = require("universal-analytics");
class Tracking {
    constructor({ config, userId }) {
        this._userId = userId;
        const amplitudeApiKey = lodash_1.get(config, 'amplitude.apiKey');
        if (amplitudeApiKey)
            this._amplitude = new Amplitude(amplitudeApiKey);
        const gaTrackingId = lodash_1.get(config, 'googleAnalytics.trackingId');
        if (gaTrackingId)
            this._ga = ua(gaTrackingId, userId, { strictCidFormat: false });
    }
    trackEvent({ event, data = {}, userData = {}, }) {
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
exports.default = Tracking;
//# sourceMappingURL=Tracking.js.map