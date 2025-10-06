class HIITTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.currentCycle = 1;
        this.currentRound = 1;
        this.currentPhase = 'prepare'; // 'work', 'rest', 'prepare'
        this.workoutConfig = null;
        this.intervalId = null;
        this.audioContext = null;
        
        this.initializeAudio();
    }
    
    initializeAudio() {
        // Create audio context for beep sounds
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioEnabled = false;
            
            // Safari-specific: Check if we're in Safari
            this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            
            if (this.isSafari) {
                console.log('Safari detected - using enhanced audio handling');
            }
        } catch (e) {
            console.log('Audio not supported');
            this.audioContext = null;
        }
        
        // Enable audio on first user interaction (required for mobile browsers)
        this.enableAudioOnInteraction();
    }
    
    enableAudioOnInteraction() {
        const enableAudio = async () => {
            if (this.audioContext) {
                try {
                    // Safari-specific: Create a silent buffer to unlock audio
                    if (this.isSafari) {
                        const buffer = this.audioContext.createBuffer(1, 1, 22050);
                        const source = this.audioContext.createBufferSource();
                        source.buffer = buffer;
                        source.connect(this.audioContext.destination);
                        source.start(0);
                    }
                    
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    
                    // Safari-specific: Additional resume attempt
                    if (this.isSafari && this.audioContext.state === 'suspended') {
                        setTimeout(async () => {
                            try {
                                await this.audioContext.resume();
                            } catch (e) {
                                console.log('Safari audio resume failed:', e);
                            }
                        }, 100);
                    }
                    
                    this.audioEnabled = true;
                    this.updateAudioStatus();
                    console.log('Audio enabled');
                } catch (e) {
                    console.log('Failed to enable audio:', e);
                }
            }
            // Remove listeners after first interaction
            document.removeEventListener('touchstart', enableAudio);
            document.removeEventListener('click', enableAudio);
            document.removeEventListener('touchend', enableAudio);
        };
        
        // Listen for various interaction types
        document.addEventListener('touchstart', enableAudio, { once: true });
        document.addEventListener('click', enableAudio, { once: true });
        document.addEventListener('touchend', enableAudio, { once: true });
    }
    
    playBeep(frequency = 800, duration = 200) {
        if (!this.audioContext || !this.audioEnabled) return;
        
        try {
            // Safari-specific: Ensure audio context is running
            if (this.isSafari && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.playBeepSound(frequency, duration);
                }).catch(e => {
                    console.log('Safari audio resume failed:', e);
                });
                return;
            }
            
            this.playBeepSound(frequency, duration);
        } catch (e) {
            console.log('Failed to play beep:', e);
        }
    }
    
    playBeepSound(frequency = 800, duration = 200) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            // Set volume (higher for Safari, lower for mobile)
            const volume = this.isSafari ? 0.4 : 0.2;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.log('Failed to play beep sound:', e);
        }
    }
    
    updateAudioStatus() {
        const audioStatus = document.getElementById('audioStatus');
        const testAudioBtn = document.getElementById('testAudio');
        
        if (audioStatus) {
            if (this.audioEnabled) {
                audioStatus.textContent = '🔊 Audio enabled';
                audioStatus.className = 'audio-status audio-enabled';
                if (testAudioBtn) testAudioBtn.style.display = 'inline-block';
            } else {
                if (this.isSafari) {
                    audioStatus.textContent = '🔇 Safari: Tap "Test Audio" to enable';
                } else {
                    audioStatus.textContent = '🔇 Tap "Test Audio" to enable';
                }
                audioStatus.className = 'audio-status';
                if (testAudioBtn) testAudioBtn.style.display = 'inline-block';
            }
        }
        
        // Also update config panel status
        updateConfigAudioStatus();
    }
    
    startWorkout() {
        const cycles = parseInt(document.getElementById('cycles').value);
        const restPeriod = parseInt(document.getElementById('restPeriod').value);
        const roundDurations = Array.from(document.querySelectorAll('.round-duration'))
            .map(input => parseInt(input.value))
            .filter(duration => duration >= 0); // Keep all non-negative durations for validation
        
        // Input validation
        if (cycles < 1 || cycles > 10) {
            alert('Number of cycles must be between 1 and 10');
            return;
        }
        
        if (restPeriod < 0 || restPeriod > 300) {
            alert('Rest period must be between 0 and 300 seconds');
            return;
        }
        
        if (roundDurations.length === 0) {
            alert('Please add at least one round duration');
            return;
        }
        
        // Check for invalid round durations
        const invalidRounds = roundDurations.filter(duration => duration < 0 || duration > 600);
        if (invalidRounds.length > 0) {
            alert('All round durations must be between 0 and 600 seconds');
            return;
        }
        
        this.workoutConfig = {
            cycles,
            restPeriod,
            roundDurations
        };
        
        this.resetTimer();
        this.showTimerPanel();
        
        // Enable audio on workout start if not already enabled
        if (this.audioContext && !this.audioEnabled) {
            this.enableAudioOnInteraction();
        }
        
        this.startPhase('prepare', 5); // 5 second preparation
    }
    
    showTimerPanel() {
        document.getElementById('configPanel').style.display = 'none';
        document.getElementById('timerPanel').style.display = 'block';
    }
    
    showConfigPanel() {
        document.getElementById('configPanel').style.display = 'block';
        document.getElementById('timerPanel').style.display = 'none';
    }
    
    startPhase(phase, duration) {
        this.currentPhase = phase;
        this.currentTime = duration;
        this.totalTime = duration;
        this.isRunning = true;
        this.isPaused = false;
        
        this.updateDisplay();
        this.startInterval();
    }
    
    startInterval() {
        this.intervalId = setInterval(() => {
            if (!this.isPaused) {
                this.currentTime--;
                this.updateDisplay();
                
                if (this.currentTime <= 0) {
                    this.playBeep();
                    this.nextPhase();
                } else if (this.currentTime <= 3) {
                    this.playBeep(600, 100);
                }
            }
        }, 1000);
    }
    
    nextPhase() {
        clearInterval(this.intervalId);
        
        if (this.currentPhase === 'prepare') {
            this.startWorkPhase();
        } else if (this.currentPhase === 'work') {
            if (this.currentRound < this.workoutConfig.roundDurations.length) {
                // Only rest if rest period is greater than 0
                if (this.workoutConfig.restPeriod > 0) {
                    this.startRestPhase();
                } else {
                    this.currentRound++;
                    this.startWorkPhase();
                }
            } else {
                this.nextCycle();
            }
        } else if (this.currentPhase === 'rest') {
            // Check if this is a rest between cycles or between rounds
            if (this.currentRound === 1) {
                // This is rest between cycles, don't increment round
                this.startWorkPhase();
            } else {
                // This is rest between rounds, increment round
                this.currentRound++;
                this.startWorkPhase();
            }
        }
    }
    
    startWorkPhase() {
        // Safety check to prevent array index out of bounds
        if (this.currentRound < 1 || this.currentRound > this.workoutConfig.roundDurations.length) {
            console.error('Invalid round number:', this.currentRound);
            this.completeWorkout();
            return;
        }
        const duration = this.workoutConfig.roundDurations[this.currentRound - 1];
        this.startPhase('work', duration);
    }
    
    startRestPhase() {
        this.startPhase('rest', this.workoutConfig.restPeriod);
    }
    
    nextCycle() {
        if (this.currentCycle < this.workoutConfig.cycles) {
            this.currentCycle++;
            this.currentRound = 1;
            // Only rest between cycles if there are multiple rounds AND rest period > 0
            if (this.workoutConfig.roundDurations.length > 1 && this.workoutConfig.restPeriod > 0) {
                this.startRestPhase(); // Rest between cycles
            } else {
                this.startWorkPhase(); // Go directly to next cycle's work
            }
        } else {
            this.completeWorkout();
        }
    }
    
    completeWorkout() {
        this.isRunning = false;
        this.playBeep(1000, 500);
        this.playBeep(1000, 500);
        this.playBeep(1000, 500);
        
        document.getElementById('currentPhase').textContent = 'Workout Complete! 🎉';
        document.getElementById('currentPhase').className = 'current-phase prepare-phase';
        document.getElementById('timeDisplay').textContent = '00:00';
        document.getElementById('progressInfo').textContent = 'Great job!';
        document.getElementById('progressFill').style.width = '100%';
        
        // Hide controls except reset
        document.getElementById('pauseBtn').style.display = 'none';
        document.getElementById('skipBtn').style.display = 'none';
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timeDisplay = document.getElementById('timeDisplay');
        timeDisplay.textContent = timeString;
        timeDisplay.setAttribute('aria-label', `${minutes} minutes and ${seconds} seconds remaining`);
        
        // Update phase display
        const phaseElement = document.getElementById('currentPhase');
        const progressElement = document.getElementById('progressInfo');
        const progressBar = document.querySelector('.progress-bar');
        
        if (this.currentPhase === 'prepare') {
            phaseElement.textContent = 'Get Ready!';
            phaseElement.className = 'current-phase prepare-phase';
            progressElement.textContent = 'Starting in...';
        } else if (this.currentPhase === 'work') {
            phaseElement.textContent = 'WORK!';
            phaseElement.className = 'current-phase work-phase';
            progressElement.textContent = `Cycle ${this.currentCycle} of ${this.workoutConfig.cycles} • Round ${this.currentRound} of ${this.workoutConfig.roundDurations.length}`;
        } else if (this.currentPhase === 'rest') {
            phaseElement.textContent = 'REST';
            phaseElement.className = 'current-phase rest-phase';
            progressElement.textContent = `Cycle ${this.currentCycle} of ${this.workoutConfig.cycles} • Round ${this.currentRound} of ${this.workoutConfig.roundDurations.length}`;
        }
        
        // Update progress bar
        const progress = this.totalTime > 0 ? ((this.totalTime - this.currentTime) / this.totalTime) * 100 : 0;
        document.getElementById('progressFill').style.width = `${Math.max(0, Math.min(100, progress))}%`;
        progressBar.setAttribute('aria-valuenow', Math.round(Math.max(0, Math.min(100, progress))));
    }
    
    pauseTimer() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
    }
    
    skipPhase() {
        if (this.isRunning) {
            this.playBeep();
            this.nextPhase();
        }
    }
    
    resetTimer() {
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 0;
        this.totalTime = 0;
        this.currentCycle = 1;
        this.currentRound = 1;
        this.currentPhase = 'prepare';
        
        // Reset display
        document.getElementById('timeDisplay').textContent = '00:00';
        document.getElementById('currentPhase').textContent = 'Get Ready!';
        document.getElementById('currentPhase').className = 'current-phase prepare-phase';
        document.getElementById('progressInfo').textContent = 'Cycle 1 of 1 • Round 1 of 1';
        document.getElementById('progressFill').style.width = '0%';
        
        // Reset controls
        document.getElementById('pauseBtn').textContent = 'Pause';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('skipBtn').style.display = 'inline-block';
        
        this.showConfigPanel();
        this.updateAudioStatus();
    }
}

// Global timer instance
const timer = new HIITTimer();

// Set random background image on page load
function setRandomBackground() {
    const images = [
        'images/IMG_4281.jpeg',
        'images/IMG_4282.jpeg',
        'images/IMG_4285.jpeg',
        'images/IMG_4286.jpeg',
        'images/IMG_4287.jpeg',
        'images/IMG_4288.jpeg',
        'images/IMG_4289.jpeg'
    ];
    
    const randomImage = images[Math.floor(Math.random() * images.length)];
    document.body.style.setProperty('--bg-image', `url('${randomImage}')`);
}

// Initialize random background when page loads
document.addEventListener('DOMContentLoaded', setRandomBackground);

// Global functions for HTML onclick handlers
function startWorkout() {
    timer.startWorkout();
}

function pauseTimer() {
    timer.pauseTimer();
}

function skipPhase() {
    timer.skipPhase();
}

function resetTimer() {
    timer.resetTimer();
}

function addRound() {
    const container = document.getElementById('roundsContainer');
    const roundCount = container.children.length + 1;
    const roundInput = document.createElement('div');
    roundInput.className = 'round-input';
    roundInput.innerHTML = `
        <input type="number" class="round-duration" min="0" max="600" value="30" placeholder="Duration" aria-label="Round ${roundCount} duration in seconds">
        <button type="button" class="remove-round" onclick="removeRound(this)" aria-label="Remove round ${roundCount}">×</button>
    `;
    container.appendChild(roundInput);
}

function removeRound(button) {
    const container = document.getElementById('roundsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('You need at least one round');
    }
}

function testAudio() {
    if (timer.audioContext && !timer.audioEnabled) {
        // Force enable audio for Safari
        timer.enableAudioOnInteraction();
        // Play a test beep
        setTimeout(() => {
            timer.playBeep(600, 300);
            updateConfigAudioStatus();
        }, 100);
    } else if (timer.audioEnabled) {
        // Play a test beep
        timer.playBeep(600, 300);
        updateConfigAudioStatus();
    }
}

function updateConfigAudioStatus() {
    const configAudioStatus = document.getElementById('configAudioStatus');
    if (configAudioStatus) {
        if (timer.audioEnabled) {
            configAudioStatus.textContent = '🔊 Audio enabled';
            configAudioStatus.className = 'audio-status audio-enabled';
        } else {
            configAudioStatus.textContent = '🔇 Audio not enabled';
            configAudioStatus.className = 'audio-status';
        }
    }
}

// Social Sharing Functions
function shareOnTwitter() {
    const text = "Check out this free HIIT timer for high intensity interval training workouts! Perfect for Tabata, circuit training, and HIIT exercises. No registration required!";
    const url = "https://hiit-timer.co.uk";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=HIIT,WorkoutTimer,Tabata,Fitness`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

function shareOnFacebook() {
    const url = "https://hiit-timer.co.uk";
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
}

function shareOnLinkedIn() {
    const url = "https://hiit-timer.co.uk";
    const title = "Free HIIT Timer - High Intensity Interval Training Timer";
    const summary = "Free online HIIT timer for high intensity interval training workouts. Customizable workout cycles, rest periods, and round durations.";
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=400');
}
