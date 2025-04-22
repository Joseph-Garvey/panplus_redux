/**
 * @file This is basically main(...){}
 * @global
 */

// --- Add Imports for Message Listener ---
// NOTE: These imports will FAIL unless you fix module loading (e.g., with a bundler)
// If not using modules, ensure these classes are globally available when this runs.
import { TranscriptRequester } from './transcript/transcript-requester.js';
import { TranscriptSourcePanopto } from './transcript/transcript-source-panopto.js';
// --- End Imports ---

(() => {
    App = {};
    //return;
    //Wait for page load
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(function(mutations, observer) {
        //Check if DOM has been loaded
        if (mutations.length > 200 
            || (document.querySelector('header[role="banner"]') !== null && document.querySelector('header[role="banner"]').children[0].style.display !== "none")) {
            observer.disconnect();
            //Put initialization code here
            console.log("DOM loaded!");
            //Initialize cache & settings
            Cache.init().then(() => {
                Settings.init().then(() => {
                    let settings = Settings.getDataAsObject();
                    //debugger;
                    //Initialize app
                    
                    App = {
                        // loggerDisabler: new LoggerDisabler(settings),
                        sidebar: new Sidebar(settings),
                        speedSlider: new SpeedSlider(settings),
                        transcriptDisplay: new TranscriptDisplay(settings),
                        silenceCueManager: new SilenceCueManager(settings),
                        tsTracker: new TSTracker(settings),
                        carouselManager: new CarouselManager(settings),
                        delayDisabler: new DelayDisabler(settings),
                        videoAudioContextManager: new VideoAudioContextManager(settings),
                        //volumeBooster: new VolumeBooster(settings),//Moved into VideoAudioContextManager
                        //whiteNoiseReducer: new WhiteNoiseReducer(settings),//Moved into VideoAudioContextManager
                    };

                    //Initialize initial settings
                    console.log("FIN");

                    // --- Add Message Listener ---
                    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                        if (message.type === "GET_VTT_DATA") {
                            console.log("Content script received GET_VTT_DATA request.");

                            // Use async function to handle promise from TranscriptRequester
                            (async () => {
                                try {
                                    // Ensure TranscriptRequester and Source are available
                                    if (typeof TranscriptRequester === 'undefined' || typeof TranscriptSourcePanopto === 'undefined') {
                                        throw new Error("Transcript components not loaded (module issue?).");
                                    }
                                    // Fetch the transcript data using existing logic
                                    const transcript = await TranscriptRequester.get(new TranscriptSourcePanopto());

                                    // Check if we have the necessary data (might be null if loaded from cache)
                                    if (transcript && transcript.rawVtt && transcript.deliveryId) {
                                        console.log("Sending VTT data back to requester.");
                                        sendResponse({
                                            success: true,
                                            rawVtt: transcript.rawVtt,
                                            deliveryId: transcript.deliveryId
                                        });
                                    } else {
                                        console.warn("VTT data not available (possibly loaded from cache or fetch failed).");
                                        sendResponse({
                                            success: false,
                                            error: "Raw VTT data not available. It might have been loaded from cache. Please refresh the Panopto page and try again."
                                        });
                                    }
                                } catch (error) {
                                    console.error("Error fetching transcript in content script:", error);
                                    sendResponse({
                                        success: false,
                                        error: `Failed to fetch transcript: ${error.message}`
                                    });
                                }
                            })();

                            // Return true to indicate you will send a response asynchronously
                            return true;
                        }
                        // Handle other message types if needed
                    });
                    // --- End Message Listener ---

                    //Todo: Abstract this to another class
                    const UPDATE_MESSAGE = "Update: Resolved issue preventing silence trimming.";
                    //Show notify for new users, or update prompt
                    Cache.load(Cache.FIRST_TIME_KEY).then((result) => {
                        if (!result) {
                            sleep(1500).then(() => {
                                $.notify("It appears this is your first time using this Chrome extension!",{className: "success", position: "bottom right", autoHideDelay: 15000});
                            }).then(sleep(3000).then(() => {
                                $.notify("You might want to access the settings tab on the right to customize your user interface.",{className: "success", position: "bottom right", autoHideDelay: 15000});
                                sleep(1500).then(() => {$.notify("You can change tabs here.",{className: "success", position: "top left", autoHideDelay: 15000})});
                            }));
                            Cache.save(Cache.FIRST_TIME_KEY, true, 99999);
                        } else {
                            Cache.load(Cache.UPDATE_MESSAGE).then((result) => {
                                if (!result || UPDATE_MESSAGE !== result) {
                                    $.notify(UPDATE_MESSAGE,{className: "info", position: "top right", autoHide: false, clickToHide: true});
                                    Cache.save(Cache.UPDATE_MESSAGE, UPDATE_MESSAGE, 99999);
                                }
                            })

                            $.notify("If there is an issue with silence trimming, please disable / configure in the settings tab.",{className: "info", position: "bottom right", autoHideDelay: 7000});
                        }
                    })
                });
            });
        }
    });
    observer.observe(document, {subtree: true, attributes: true});
})();