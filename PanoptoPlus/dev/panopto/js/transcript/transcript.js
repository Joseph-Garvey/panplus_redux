/**
 * @file Transcript class, holds transcript data and provides methods to convert to VTTCue array
 */
class Transcript {
    /**
     * Constructor
     * @param {Array.<{time: Number, text: String}>} data Transcript data
     */
    constructor(data) {
        this.data = data;
        this.rawVtt = null; // <-- ADDED: To store raw VTT content
        this.deliveryId = null; // <-- ADDED: To store delivery ID for filename
    }

    /**
     * Convert transcript data to VTTCue array
     * @returns {Array.<VTTCue>} Array of VTTCue objects
     */
    toVTTCueArray() {
        let result = [];
        if (!this.data || this.data.length === 0) {
            return result;
        }
        for (let i = 0; i < this.data.length; i++) {
            let endTime = (i + 1 < this.data.length) ? this.data[i + 1].time : this.data[i].time + 5; // Estimate end time for last cue
            // Ensure start time is strictly less than end time
            if (this.data[i].time < endTime) {
                 result.push(new VTTCue(this.data[i].time, endTime, this.data[i].text));
            } else {
                 // Handle cases where start time might equal end time (e.g., consecutive identical timestamps)
                 // Add a small duration, e.g., 1 second
                 result.push(new VTTCue(this.data[i].time, this.data[i].time + 1, this.data[i].text));
            }
        }
        return result;
    }
}

export { Transcript };