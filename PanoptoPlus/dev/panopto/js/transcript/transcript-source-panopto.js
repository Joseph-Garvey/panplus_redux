import { Transcript } from "./transcript.js";
import { ContextBridge } from "../context-bridge.js";
import { Cache } from "../../core/cache.js";
import { Settings } from "../../core/settings.js";

/**
 * @file Transcript source using Panopto, responsible for retrieving the transcript data
 */

/**
 * Parses VTT content into the standard transcript format.
 * @param {string} vttContent The raw VTT content as a string.
 * @returns {Array<{time: Number, text: String}>} Parsed transcript data.
 */
const parseVTT = (vttContent) => {
    const lines = vttContent.split('\n');
    const transcript = [];
    let currentTime = null;
    let currentText = '';

    // Basic VTT parsing - might need refinement for edge cases
    for (const line of lines) {
        const timeMatch = line.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->/); // Matches start time
        if (timeMatch) {
            // If we have previous text, push it before starting the new cue
            if (currentTime !== null && currentText.trim()) {
                transcript.push({ time: currentTime, text: currentText.trim() });
            }
            // Calculate time in seconds
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            const milliseconds = parseInt(timeMatch[4], 10);
            currentTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
            currentText = ''; // Reset text for the new cue
        } else if (currentTime !== null && line.trim() && !line.startsWith('WEBVTT') && !line.startsWith('NOTE') && !line.includes('-->')) {
            // Append text lines belonging to the current time cue
            currentText += (currentText ? ' ' : '') + line.trim();
        }
    }
    // Add the last cue
    if (currentTime !== null && currentText.trim()) {
        transcript.push({ time: currentTime, text: currentText.trim() });
    }

    console.log(`Parsed ${transcript.length} cues from VTT.`);
    return transcript;
};

class TranscriptSourcePanopto {
    /**
     * Parses the raw transcript data (now expecting VTT).
     * @param {string} data The raw VTT string.
     * @returns {Array<{time: Number, text: String}>} Parsed transcript data.
     */
    parse(data) {
        // Use the new VTT parser
        return parseVTT(data);
    }

    /**
     * Retrieves the transcript data from Panopto.
     * Fetches DeliveryInfo, then fetches the VTT file URL provided.
     * @returns {Promise<string>} A promise that resolves with the raw VTT transcript data.
     */
    async retrieve() {
        return new Promise(async (resolve, reject) => {
            try {
                const deliveryId = await ContextBridge.getDeliveryID();
                if (!deliveryId) {
                    return reject("Could not get Delivery ID from page.");
                }

                // 1. Fetch DeliveryInfo to get the captions URL
                const deliveryInfoUrl = `/Panopto/Pages/Viewer/DeliveryInfo.aspx?deliveryId=${deliveryId}&responseType=json&invocationId=&isLiveNotes=false`;
                console.log("Fetching DeliveryInfo:", deliveryInfoUrl);
                const deliveryInfoResponse = await fetch(deliveryInfoUrl);

                if (!deliveryInfoResponse.ok) {
                    return reject(`Failed to fetch DeliveryInfo: ${deliveryInfoResponse.statusText}`);
                }

                const deliveryInfoData = await deliveryInfoResponse.json();

                // Find the Captions URL (adjust key name if necessary based on actual JSON structure)
                const captionsUrl = deliveryInfoData?.Delivery?.CaptionsUrl || deliveryInfoData?.CaptionsUrl; // Example keys

                if (!captionsUrl) {
                    console.warn("No CaptionsUrl found in DeliveryInfo response:", deliveryInfoData);
                    // Check if ASR (Automatic Speech Recognition) is disabled
                    const asrEnabled = deliveryInfoData?.Delivery?.IsAsrEnabled;
                    if (asrEnabled === false) {
                         return reject("Transcript retrieval failed: Automatic Speech Recognition (ASR) captions are not enabled for this video.");
                    }
                    return reject("Transcript retrieval failed: Could not find CaptionsUrl in DeliveryInfo response.");
                }

                console.log("Found Captions URL:", captionsUrl);

                // 2. Fetch the actual VTT caption file
                const vttResponse = await fetch(captionsUrl);
                if (!vttResponse.ok) {
                    return reject(`Failed to fetch VTT file: ${vttResponse.statusText}`);
                }

                const vttData = await vttResponse.text();
                resolve(vttData); // Resolve with the raw VTT content

            } catch (error) {
                console.error("Error retrieving transcript:", error);
                reject(`Transcript retrieval failed: ${error.message}`);
            }
        });
    }
}

export { TranscriptSourcePanopto };

/**
 * Format (JSON):
 * {
    "Error": {boolean},
    "ErrorMessage": {null||string?},
    "Events": [
        {
            "AbsoluteTime": 0,
            "Caption": "",
            "CreatedDuringWebcast": {boolean},
            "CreationDateTime": {string},
            "CreationTime": {Number},
            "Data": {null||string?},
            "EventTargetType": {string},
            "ID": {Number},
            "IsQuestionList": {boolean},
            "IsSessionPlaybackBlocking": {boolean},
            "ObjectIdentifier": {string},
            "ObjectPublicIdentifier": {string},
            "ObjectSequenceNumber": {string},
            "ObjectStreamID": {string},
            "PublicId": {string},
            "SessionID": {string},
            "Time": {Number},
            "Url": {null||string?},
            "UserDisplayName": {null||string?},
            "UserInvocationRequiredInUrl": {boolean},
            "UserName": {string}
        },...
    }
    */