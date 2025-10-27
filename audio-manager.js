// Audio Manager Class
class AudioManager {
  constructor() {
    this.enabled = false;
    this.sounds = {};
    this.currentMusic = null;
    this.currentMusicName = null;
    this.musicVolume = 0.4;
    this.sfxVolume = 0.7;
    this.isFading = false;
    this.fadeInterval = null;

    // Enable audio on first user interaction
    document.addEventListener(
      "click",
      () => {
        this.enable();
      },
      { once: true }
    );
  }

  enable() {
    this.enabled = true;
  }

  preloadAudio(name, src) {
    if (!this.sounds[name]) {
      this.sounds[name] = new Audio(src);
      this.sounds[name].preload = "auto";
    }
  }

  playMusic(musicName, loop = true, volume = null) {
    if (!this.enabled) return;

    const actualVolume = volume !== null ? volume : this.musicVolume;
    const audioPath = `audio/${musicName}.mp3`;

    // Stop current music if different
    if (this.currentMusic && this.currentMusicName !== musicName) {
      this.stopMusic();
    }

    // Fix Bug #16: Don't restart if same music is already playing (and not ended)
    if (
      this.currentMusicName === musicName &&
      this.currentMusic &&
      !this.currentMusic.paused &&
      !this.currentMusic.ended
    ) {
      return;
    }

    // Preload if not already loaded
    this.preloadAudio(musicName, audioPath);

    this.currentMusic = this.sounds[musicName];
    this.currentMusicName = musicName;
    this.currentMusic.loop = loop;
    this.currentMusic.volume = actualVolume;
    this.currentMusic.currentTime = 0;
    this.isFading = false;

    this.currentMusic.play().catch((e) => {
      console.warn(`Music playback failed for ${musicName}:`, e);
    });
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentMusicName = null;
      this.isFading = false;
    }

    // Clear any active fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }

  pauseMusic() {
    if (this.currentMusic && !this.currentMusic.paused) {
      console.log(`⏸️ Pausing music: ${this.currentMusicName}`);
      this.currentMusic.pause();
    }
  }

  resumeMusic() {
    if (this.currentMusic && this.currentMusic.paused) {
      console.log(`▶️ Resuming music: ${this.currentMusicName}`);
      this.currentMusic.play().catch((e) => {
        console.warn(`Music resume failed for ${this.currentMusicName}:`, e);
      });
    }
  }

  fadeOutMusic(duration = 1000) {
    if (!this.currentMusic || this.isFading) return;

    // Clear any existing fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    this.isFading = true;

    const startVolume = this.currentMusic.volume;
    const fadeSteps = 20;
    const stepDuration = duration / fadeSteps;
    const volumeStep = startVolume / fadeSteps;

    let step = 0;
    this.fadeInterval = setInterval(() => {
      if (!this.currentMusic || !this.isFading) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        return;
      }

      step++;
      this.currentMusic.volume = Math.max(0, startVolume - volumeStep * step);

      if (step >= fadeSteps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.stopMusic();
      }
    }, stepDuration);
  }

  playSound(soundName, loop = false, volume = null) {
    if (!this.enabled) return;

    const actualVolume = volume !== null ? volume : this.sfxVolume;
    const audioPath = `audio/${soundName}.mp3`;

    // Preload if not already loaded
    this.preloadAudio(soundName, audioPath);

    const sound = this.sounds[soundName];
    sound.loop = loop;
    sound.volume = actualVolume;
    sound.currentTime = 0;

    sound.play().catch((e) => {
      console.warn(`Sound playback failed for ${soundName}:`, e);
    });
  }

  playRandomSound(soundPrefix, count, loop = false, volume = null) {
    if (!this.enabled) return;

    // Pick a random sound from the group (1 to count)
    const randomIndex = Math.floor(Math.random() * count) + 1;
    const soundName = `${soundPrefix}${randomIndex}`;

    // Check if any sound from this group is currently playing
    for (let i = 1; i <= count; i++) {
      const checkSoundName = `${soundPrefix}${i}`;
      const sound = this.sounds[checkSoundName];
      if (sound && !sound.paused && !sound.ended) {
        return;
      }
    }

    // Play the randomly selected sound
    this.playSound(soundName, loop, volume);
  }

  stopSound(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;

    this.sounds[soundName].pause();
    this.sounds[soundName].currentTime = 0;
  }

  stopAllSounds() {
    Object.keys(this.sounds).forEach((soundName) => {
      if (soundName !== this.currentMusicName) {
        this.stopSound(soundName);
      }
    });
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume;
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  cleanup() {
    console.log("🧹 Cleaning up AudioManager...");

    // Clear fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Stop and cleanup all sounds
    Object.keys(this.sounds).forEach((soundName) => {
      const audio = this.sounds[soundName];
      audio.pause();
      audio.currentTime = 0;
      audio.src = ""; // Release audio source
    });

    this.sounds = {};
    this.currentMusic = null;
    this.currentMusicName = null;
    this.isFading = false;
  }
}
