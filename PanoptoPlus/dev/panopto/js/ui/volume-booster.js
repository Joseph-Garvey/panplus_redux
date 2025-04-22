/**
 * @file VolumeBooster, includes code that will modify the volume node to include a volume booster (gain modifier)
 */
class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gains = [];
        this.compressorEnabled = false; // Default: compressor is disabled
        this.speechEnhancerEnabled = false; // Default: speech EQ is disabled
        this.analyserEnabled = false; // Default: analyser is disabled
    }

    createAudioChain(source) {
        const gainNode = this.audioContext.createGain();
        const compressorNode = this.audioContext.createDynamicsCompressor();
        const analyserNode = this.audioContext.createAnalyser();
        const speechEnhancer = this.audioContext.createBiquadFilter();

        // Configure the compressor for better clarity
        compressorNode.threshold.setValueAtTime(-50, this.audioContext.currentTime); // Start compressing at -50 dB
        compressorNode.knee.setValueAtTime(40, this.audioContext.currentTime);      // Smooth transition
        compressorNode.ratio.setValueAtTime(12, this.audioContext.currentTime);     // Compression ratio
        compressorNode.attack.setValueAtTime(0.003, this.audioContext.currentTime); // Attack time
        compressorNode.release.setValueAtTime(0.25, this.audioContext.currentTime); // Release time

        // Configure the speech enhancer (bandpass filter for speech frequencies)
        speechEnhancer.type = "bandpass";
        speechEnhancer.frequency.setValueAtTime(1500, this.audioContext.currentTime); // Center frequency for speech
        speechEnhancer.Q.setValueAtTime(1, this.audioContext.currentTime); // Quality factor

        this.gains.push(gainNode);

        // Connect the audio chain: source -> analyser -> [speechEnhancer] -> [compressor] -> gain -> destination
        source.connect(analyserNode);

        if (this.speechEnhancerEnabled) {
            analyserNode.connect(speechEnhancer);
        }

        if (this.compressorEnabled) {
            (this.speechEnhancerEnabled ? speechEnhancer : analyserNode).connect(compressorNode);
            compressorNode.connect(gainNode);
        } else {
            (this.speechEnhancerEnabled ? speechEnhancer : analyserNode).connect(gainNode);
        }

        gainNode.connect(this.audioContext.destination);

        // If analyser is enabled, visualize input/output levels
        if (this.analyserEnabled) {
            this.visualize(analyserNode, gainNode);
        }

        gainNode.gain.value = 1; // Default gain

        return { gainNode, analyserNode, compressorNode, speechEnhancer };
    }

    setGain(value) {
        const safeGain = Math.min(value, 3); // Cap gain at 3
        this.gains.forEach((gainNode) => {
            gainNode.gain.value = safeGain;
        });
    }

    toggleCompressor() {
        this.compressorEnabled = !this.compressorEnabled;
    }

    toggleSpeechEnhancer() {
        this.speechEnhancerEnabled = !this.speechEnhancerEnabled;
    }

    toggleAnalyser() {
        this.analyserEnabled = !this.analyserEnabled;
    }

    visualize(analyserNode, gainNode) {
        const inputCanvas = document.getElementById('input-vu-meter');
        const outputCanvas = document.getElementById('output-vu-meter');
        const inputCtx = inputCanvas.getContext('2d');
        const outputCtx = outputCanvas.getContext('2d');
        const inputDataArray = new Uint8Array(analyserNode.frequencyBinCount);
        const outputDataArray = new Uint8Array(analyserNode.frequencyBinCount);

        const draw = () => {
            analyserNode.getByteFrequencyData(inputDataArray);
            gainNode.gain.value = Math.min(gainNode.gain.value, 3); // Ensure gain stays within limits

            // Clear and draw input VU meter
            inputCtx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
            inputCtx.fillStyle = 'green';
            const inputLevel = inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length;
            inputCtx.fillRect(0, inputCanvas.height - inputLevel, inputCanvas.width, inputLevel);

            // Clear and draw output VU meter
            outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            outputCtx.fillStyle = 'blue';
            const outputLevel = gainNode.gain.value * 100; // Simulate output level
            outputCtx.fillRect(0, outputCanvas.height - outputLevel, outputCanvas.width, outputLevel);

            requestAnimationFrame(draw);
        };

        draw();
    }
}

class VolumeBooster {
    constructor() {
        this.audioManager = new AudioManager();
        this.init();
    }

    /**
     * Init: initialize volume booster. First grabs slider template, then initializes.
     * @returns {undefined}
     */
    init() {
        VideosLoadedEvent.subscribe(() => {
            Template.get('volume-booster.html').then((template) => {
                $("#volumeFlyout").append(template);

                // Handle gain slider input
                $('#vol-boost-gain').on('input', () => {
                    const gain = parseFloat($('#vol-boost-gain').val());
                    if (!isNaN(gain)) {
                        this.audioManager.setGain(gain);
                    }
                });

                // Add a button to toggle the compressor
                const compressorToggle = $('<button id="toggle-compressor">Toggle Compressor</button>');
                $("#volumeFlyout").append(compressorToggle);
                compressorToggle.on('click', () => {
                    this.audioManager.toggleCompressor();
                    alert(`Compressor is now ${this.audioManager.compressorEnabled ? 'enabled' : 'disabled'}`);
                });

                // Add a button to toggle the speech enhancer
                const speechEnhancerToggle = $('<button id="toggle-speech-enhancer">Toggle Speech EQ</button>');
                $("#volumeFlyout").append(speechEnhancerToggle);
                speechEnhancerToggle.on('click', () => {
                    this.audioManager.toggleSpeechEnhancer();
                    alert(`Speech EQ is now ${this.audioManager.speechEnhancerEnabled ? 'enabled' : 'disabled'}`);
                });

                // Add a button to toggle the analyser
                const analyserToggle = $('<button id="toggle-analyser">Toggle Analyser</button>');
                $("#volumeFlyout").append(analyserToggle);
                analyserToggle.on('click', () => {
                    this.audioManager.toggleAnalyser();
                    alert(`Analyser is now ${this.audioManager.analyserEnabled ? 'enabled' : 'disabled'}`);
                });

                // Prevent slider key events from propagating
                $('#vol-boost-gain').keydown((event) => event.stopPropagation())
                    .keyup((event) => event.stopPropagation());
            });
        });
    }

    /**
     * Modify gain to push volume beyond max
     * @param {AudioContext} audioContext The audio context
     * @param {MediaElementAudioSourceNode} currentSource The media element's audio source
     * @returns {GainNode} The gain node
     */
    linkToAudioContextThenReturnTail(audioContext, currentSource) {
        const { gainNode, analyserNode } = this.audioManager.createAudioChain(currentSource);

        // Optional: Monitor audio levels and adjust gain dynamically
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        const adjustGain = () => {
            analyserNode.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            if (average < 50) {
                gainNode.gain.value = Math.min(gainNode.gain.value + 0.1, 3); // Boost gain if audio is too quiet
            }
            requestAnimationFrame(adjustGain);
        };
        adjustGain();

        return gainNode;
    }
}

let volumeBooster = new VolumeBooster();