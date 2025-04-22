import { Cache } from "../../core/cache.js";
import { Settings } from "../../core/settings.js";
import { Transcript } from "./transcript.js";
// Assuming ContextBridge is globally available or correctly managed if needed here
// import { ContextBridge } from "../core/context-bridge.js";

/**
 * @file TranscriptRequester class manages the retrieval and caching of transcripts.
 */
let TranscriptRequester = (() => {
    const DEBUG_TRANSCRIPT_REQUEST = 0;
    //Private static variables
    /**Problem: Multiple parts of our code needs the transcript. 
     * We don't want to call the AJAX function multiple times, so everytime it is required and it's not ready, we add it to callbacks
     * Once it's ready, we call all these callbacks as required.
     * http://api.jquery.com/category/callbacks-object/
     */
    let callbacks = $.Callbacks();
    let cachedTranscript = null; //Transcript object
    let isGettingTranscript = false;
    //All panopto webcast websites have a form (the search bar)
    //let key = `transcript-${getWebcastId()}`;

    /**
     * private static function to process transcript get if cache doesn't hit
     * @private
     * @static
     * @param {TranscriptSource} transcriptSrc transcript source
     * @param {function} resolve Resolve of 1 parameter of Array.<{time: Number, text: String}>
     * @return {undefined}
     */
    function getTranscript(transcriptSrc, resolve) {
        transcriptSrc.retrieve().then((data) => {
            Cache.saveTranscript(data);
            //let kvp = {};
            //kvp[key] = data;
            //chrome.storage.local.set(kvp, () => console.log("Saved " + key));
            return finishGettingTranscript(resolve, data);
        });
    }

    /**
     * private static method, helper class to abstract repeated stuff upon finish transcript get
     * @private
     * @static
     * @param {TranscriptSource} source The source object used (contains parse method)
     * @param {string} rawVttData The raw VTT string fetched from the source.
     * @param {string} deliveryId The delivery ID used for fetching/caching.
     * @returns {Transcript} The processed and cached Transcript object.
     */
    function finishGettingTranscriptInternal(source, rawVttData, deliveryId) { // Renamed slightly to avoid conflict if static method exists
        console.log("TranscriptRequester: finishGettingTranscriptInternal called.");
        const parsedData = source.parse(rawVttData); // Parse the raw VTT

        if (!parsedData || parsedData.length === 0) {
            console.warn("TranscriptRequester: Parsing resulted in empty data.");
        }

        // Create transcript object with parsed data
        const transcript = new Transcript(parsedData);
        // Store raw data and deliveryId on the object
        transcript.rawVtt = rawVttData; // <-- STORE RAW VTT
        transcript.deliveryId = deliveryId; // <-- STORE DELIVERY ID

        cachedTranscript = transcript; // Update memory cache
        Cache.saveTranscript(deliveryId, parsedData); // Save parsed data to storage cache

        // If using the callback pattern from original code:
        if (typeof callbacks !== 'undefined' && callbacks.fire) {
             callbacks.fire();
             callbacks.empty();
        }

        return cachedTranscript;
    }

    /**
     * TranscriptRequester class manages the retrieval and caching of transcripts.
     */
    class TranscriptRequester {
        /**
         * Constructor is empty
         */
        constructor() {}

        /**
         * Get transcript from transcript source and cache if needed
         * @param {TranscriptSource} transcriptSrc Transcript source to get transcript from
         * @returns {Promise} promise to get the transcript using transcript source
         */
        static async get(source) {
            console.log("TranscriptRequester: Get method called."); // <-- ADDED LOG
            if (cachedTranscript) {
                console.log("TranscriptRequester: Returning memory-cached transcript."); // <-- ADDED LOG
                // Ensure cached transcript has the needed properties if loaded from storage
                if (!cachedTranscript.deliveryId) {
                     // Attempt to get deliveryId again if missing from memory cache
                     try {
                        cachedTranscript.deliveryId = await ContextBridge.getDeliveryID();
                     } catch(e) { console.warn("Could not get deliveryId for cached transcript"); }
                }
                 // Note: Raw VTT won't be available if loaded from storage cache, only parsed data.
                 // The download button will only work if the transcript was fetched fresh in this session.
                return cachedTranscript;
            }

            let deliveryId;
            try {
                 deliveryId = await ContextBridge.getDeliveryID();
                 if (!deliveryId) throw new Error("Delivery ID not found");
            } catch (e) {
                 console.error("TranscriptRequester: Failed to get Delivery ID.", e);
                 throw new Error("Could not get Delivery ID to fetch or check cache.");
            }

            const cachedData = await Cache.loadTranscript(deliveryId);

            if (cachedData) {
                console.log("TranscriptRequester: Returning local storage cached transcript."); // <-- ADDED LOG
                // Create transcript object from cached *parsed* data
                cachedTranscript = new Transcript(cachedData);
                cachedTranscript.deliveryId = deliveryId; // Add deliveryId
                // Raw VTT is not available here. Download button won't have data.
                console.warn("Transcript loaded from cache. Raw VTT not available for download this session.");
                return cachedTranscript;
            } else {
                console.log("TranscriptRequester: No cache hit, calling source.retrieve()."); // <-- ADDED LOG
                try {
                    const rawVttData = await source.retrieve(); // Fetch raw VTT
                    // Process and cache using the internal helper
                    return finishGettingTranscriptInternal(source, rawVttData, deliveryId);
                } catch (error) {
                    console.error("TranscriptRequester: Error during source.retrieve():", error);
                    throw error; // Re-throw the error
                }
            }
        }

        // Keep the static finishGettingTranscript if it's directly called elsewhere,
        // but ensure it calls the internal version or replicates the logic
        // including setting rawVtt and deliveryId.
        // Based on the code, it seems the .then() in the old 'get' called it,
        // the new async/await calls the internal one directly.
        /*
        static finishGettingTranscript(source, data, deliveryId) {
             // This might be redundant now with the async/await structure
             console.log("TranscriptRequester: Static finishGettingTranscript called.");
             return finishGettingTranscriptInternal(source, data, deliveryId);
        }
        */
    }
    return TranscriptRequester;
})();

export { TranscriptRequester };