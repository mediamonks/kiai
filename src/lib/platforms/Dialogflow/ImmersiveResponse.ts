import SSML from './ssml';
import { TKeyValue } from '../../common/types';
const { deepClean } = require('./object');

/**
 * Placeholder for future ImmersiveResponse fulfillment method.
 * While that is not in place, however, this class will provide a pretty
 * way to send an ImmersiveResponse.
 */
export default class ImmersiveResponse {
  
  public response: { updatedState: { fields: TKeyValue }, loadImmersiveUrl?: string };
  
  /**
   * @constructor
   * @param {*} [payload] A free-form object, to be sent to the client.
   * @param {string} [immersiveUrl]
   */
  constructor(payload: TKeyValue = {}, immersiveUrl?: string) {
    this.response = {
      updatedState: {
        fields: payload,
      },
    };
    
    if (immersiveUrl) {
      this.response.loadImmersiveUrl = immersiveUrl;
    }
  }
  
  /**
   * Returns an ImmersiveResponse object where only the SSML field is set;
   * meant to reproduce "voice-only" responses, while still being handled on
   * the front-end
   * @param {string[]} ssml
   * @return {ImmersiveResponse}
   */
  ssml(...ssml) {
    this.response.updatedState.fields.ssml = SSML.merge(ssml);
    return this;
  }
  
  /**
   * Clean the SSML fields, and remove all undefined properties.
   * @param {*} obj
   * @return {*}
   */
  static clean(obj) {
    if (obj.ssml) {
      obj.ssml = SSML.clean(obj.ssml).trim();
    }
    if (obj.next) {
      obj.next = ImmersiveResponse.clean(obj.next);
    }
    obj = deepClean(obj);
    return obj;
  }
  
  /**
   * Generate an actions-on-google friendly object, for use as callback in the
   * intent callback.
   * @return {{immersiveResponse: *}}
   */
  get flat() {
    const fields = ImmersiveResponse.clean(this.response.updatedState.fields);
    return {
      immersiveResponse: {
        ...this.response,
        updatedState: {fields},
      },
    };
  }
}
