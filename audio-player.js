class AudioPlayer {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.selectedTrack = null;
    this.isPlaying = false;

    // Playback features
    this.shuffle = false;
    this.repeat = false; // true = repeat current track, false = no repeat
    this.currentPlaylist = []; // Actual play order
    this.playlistIndex = 0;
    this.showFavoritesOnly = false;

    // Hover tracking
    this.hoveredTrack = null;
    this.hoveredButton = null;
    this.closeButtonHovered = false;

    // Animation state
    this.openProgress = 0;
    this.scrollOffset = 0;
    this.maxScroll = 0;

    // Track end listener
    this.trackEndListener = null;

    // Initialize unlocked tracks if not exists
    if (!this.game.unlockedTracks) {
      this.game.unlockedTracks = ['menu-music'];
    }

    // Initialize favorites if not exists
    if (!this.game.favoriteTracks) {
      this.game.favoriteTracks = [];
    }

    // Initialize play counts if not exists
    if (!this.game.trackPlayCounts) {
      this.game.trackPlayCounts = {};
    }

    // Available music tracks with metadata
    this.tracks = [
      { id: 'menu-music', name: 'Menu Theme', type: 'menu', duration: '2:15' },
      { id: 'menu-music-1', name: 'Menu Theme - Variant 1', type: 'menu', duration: '2:20' },
      { id: 'menu-music-2', name: 'Menu Theme - Variant 2', type: 'menu', duration: '2:18' },
      { id: 'menu-music-3', name: 'Menu Theme - Variant 3', type: 'menu', duration: '2:22' },
      { id: 'match-music', name: 'Matching Time - Easy', type: 'match', difficulty: 0, duration: '1:45' },
      { id: 'match-music-1', name: 'Matching Time - NG+1', type: 'match', difficulty: 1, duration: '1:50' },
      { id: 'match-music-2', name: 'Matching Time - NG+2', type: 'match', difficulty: 2, duration: '1:48' },
      { id: 'match-music-3', name: 'Matching Time - NG+3', type: 'match', difficulty: 3, duration: '1:52' },
      { id: 'throwing-music', name: 'Sockball Showdown - Easy', type: 'throwing', difficulty: 0, duration: '2:30' },
      { id: 'throwing-music-1', name: 'Sockball Showdown - NG+1', type: 'throwing', difficulty: 1, duration: '2:35' },
      { id: 'throwing-music-2', name: 'Sockball Showdown - NG+2', type: 'throwing', difficulty: 2, duration: '2:33' },
      { id: 'throwing-music-3', name: 'Sockball Showdown - NG+3', type: 'throwing', difficulty: 3, duration: '2:38' },
      { id: 'victory-music', name: 'Victory!', type: 'victory', duration: '0:45' },
      { id: 'defeat-music', name: 'Defeat', type: 'defeat', duration: '0:40' },
    ];
  }

  unlockTrack(trackId) {
    if (!this.game.unlockedTracks.includes(trackId)) {
      this.game.unlockedTracks.push(trackId);
      this.game.saveGameData();
      return true;
    }
    return false;
  }

  isTrackUnlocked(trackId) {
    return this.game.unlockedTracks.includes(trackId);
  }

  isFavorite(trackId) {
    return this.game.favoriteTracks.includes(trackId);
  }

  toggleFavorite(trackId) {
    if (!this.isTrackUnlocked(trackId)) return;

    const index = this.game.favoriteTracks.indexOf(trackId);
    if (index > -1) {
      this.game.favoriteTracks.splice(index, 1);
    } else {
      this.game.favoriteTracks.push(trackId);
    }
    this.game.saveGameData();
  }

  getPlayCount(trackId) {
    return this.game.trackPlayCounts[trackId] || 0;
  }

  incrementPlayCount(trackId) {
    if (!this.game.trackPlayCounts[trackId]) {
      this.game.trackPlayCounts[trackId] = 0;
    }
    this.game.trackPlayCounts[trackId]++;
    this.game.saveGameData();

    // Unlock THATS_MY_SONG achievement: listen to a single song 10 times
    if (this.game.trackPlayCounts[trackId] === GameConfig.ACHIEVEMENTS.THATS_MY_SONG.threshold) {
      this.game.unlockAchievement("thats_my_song");
    }
  }

  toggleShowFavorites() {
    this.showFavoritesOnly = !this.showFavoritesOnly;
    this.scrollOffset = 0;
    this.rebuildPlaylist();
  }

  toggleShuffle() {
    this.shuffle = !this.shuffle;
    this.rebuildPlaylist();
  }

  toggleRepeat() {
    this.repeat = !this.repeat;
  }

  getVisibleTracks() {
    // Always show all tracks (locked and unlocked) in All Tracks view
    if (!this.showFavoritesOnly) {
      return this.tracks;
    }
    // Only show unlocked favorites in Favorites view
    return this.tracks.filter(t => this.isTrackUnlocked(t.id) && this.isFavorite(t.id));
  }

  rebuildPlaylist() {
    // Playlist only contains unlocked tracks
    let playableTracks = this.tracks.filter(t => this.isTrackUnlocked(t.id));

    if (this.showFavoritesOnly) {
      playableTracks = playableTracks.filter(t => this.isFavorite(t.id));
    }

    if (this.shuffle) {
      this.currentPlaylist = [...playableTracks];
      for (let i = this.currentPlaylist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.currentPlaylist[i], this.currentPlaylist[j]] = [this.currentPlaylist[j], this.currentPlaylist[i]];
      }
    } else {
      this.currentPlaylist = playableTracks;
    }

    if (this.selectedTrack) {
      this.playlistIndex = this.currentPlaylist.findIndex(t => t.id === this.selectedTrack);
      if (this.playlistIndex === -1) this.playlistIndex = 0;
    }
  }

  open() {
    this.isOpen = true;
    this.openProgress = 0;
    this.rebuildPlaylist();
    this.game.audioManager.pauseMusic();
  }

  close() {
    this.isOpen = false;
    this.stopCurrentTrack();
    this.repeat = false; // Turn off repeat when closing
    this.openProgress = 0;
    this.hoveredTrack = null;
    this.hoveredButton = null;
    this.game.audioManager.resumeMusic();
  }

  selectTrack(trackId) {
    if (!this.isTrackUnlocked(trackId)) return;

    // Only stop if selecting a different track
    if (this.isPlaying && this.selectedTrack && this.selectedTrack !== trackId) {
      this.game.audioManager.stopMusic();
      this.isPlaying = false;
      // Turn off repeat when selecting a new track
      this.repeat = false;
    }

    this.selectedTrack = trackId;

    this.playlistIndex = this.currentPlaylist.findIndex(t => t.id === trackId);
    if (this.playlistIndex === -1) {
      this.rebuildPlaylist();
    }

    // Automatically start playing the selected track
    this.playCurrentTrack();
  }

  playCurrentTrack() {
    if (!this.selectedTrack || !this.isTrackUnlocked(this.selectedTrack)) return;

    // Play with loop disabled so we can handle track end ourselves
    this.game.audioManager.playMusic(this.selectedTrack, false, 0.5);
    this.isPlaying = true;
    this.incrementPlayCount(this.selectedTrack);

    // Unlock CD_PLAYER achievement: open audio player and play a song
    this.game.unlockAchievement("cd_player");

    // Unlock MY_FAVORITE achievement: favorite a song and play it from favorites tab
    if (this.isFavorite(this.selectedTrack) && this.showFavoritesOnly) {
      this.game.unlockAchievement("my_favorite");
    }

    // Check AUDIOPHILE achievement: play all tracks at least once
    // Since tracks can't be played until unlocked, just check play counts
    const allPlayed = this.tracks.every(t => this.getPlayCount(t.id) > 0);
    if (allPlayed) {
      this.game.unlockAchievement("audiophile");
    }

    // Add event listener for when track ends
    if (this.game.audioManager.currentMusic) {
      const music = this.game.audioManager.currentMusic;

      // Remove any existing listener first
      if (this.trackEndListener) {
        music.removeEventListener('ended', this.trackEndListener);
      }

      // Add new listener
      this.trackEndListener = () => {
        if (this.isOpen && this.isPlaying) {
          this.playNext();
        }
      };

      music.addEventListener('ended', this.trackEndListener);
    }
  }

  pauseCurrentTrack() {
    this.game.audioManager.pauseMusic();
    this.isPlaying = false;
  }

  stopCurrentTrack() {
    if (this.selectedTrack) {
      this.game.audioManager.stopMusic();
      this.isPlaying = false;
    }
  }

  playNext() {
    if (this.currentPlaylist.length === 0) return;

    // If repeat is on, just replay the current track
    if (this.repeat) {
      this.stopCurrentTrack();
      this.playCurrentTrack();
      return;
    }

    // Move to next track
    this.playlistIndex++;
    if (this.playlistIndex >= this.currentPlaylist.length) {
      // Reached end of playlist, cycle back to first track
      this.playlistIndex = 0;
    }

    const nextTrack = this.currentPlaylist[this.playlistIndex];
    if (nextTrack) {
      this.selectedTrack = nextTrack.id;
      this.stopCurrentTrack();
      this.playCurrentTrack();
    }
  }

  playPrevious() {
    if (this.currentPlaylist.length === 0) return;

    // If repeat is on, just replay the current track
    if (this.repeat) {
      this.stopCurrentTrack();
      this.playCurrentTrack();
      return;
    }

    // Move to previous track
    this.playlistIndex--;
    if (this.playlistIndex < 0) {
      // At beginning of playlist, stay at first track
      this.playlistIndex = 0;
      return;
    }

    const prevTrack = this.currentPlaylist[this.playlistIndex];
    if (prevTrack) {
      this.selectedTrack = prevTrack.id;
      this.stopCurrentTrack();
      this.playCurrentTrack();
    }
  }

  update(deltaTime) {
    if (!this.isOpen) return;

    if (this.openProgress < 1) {
      this.openProgress = Math.min(1, this.openProgress + deltaTime * 0.005);
    }
  }

  isAnyElementHovered() {
    if (!this.isOpen) return false;
    return this.closeButtonHovered || this.hoveredTrack !== null || this.hoveredButton !== null;
  }

  updateHover(x, y, canvas) {
    if (!this.isOpen) {
      this.hoveredTrack = null;
      this.hoveredButton = null;
      this.closeButtonHovered = false;
      return;
    }

    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(650, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    // Close button hover
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    const dx = x - (closeButtonX + closeButtonSize / 2);
    const dy = y - (closeButtonY + closeButtonSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.closeButtonHovered = distance <= closeButtonSize / 2;

    // Track list hover
    const listStartY = playerY + 120;
    const trackHeight = 55;
    const listHeight = playerHeight - 280;

    this.hoveredTrack = null;
    const visibleTracks = this.getVisibleTracks();
    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < visibleTracks.length; i++) {
      const track = visibleTracks[i];
      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      if (trackY + trackH >= listStartY && trackY <= listStartY + listHeight) {
        if (x >= trackX && x <= trackX + trackW &&
            y >= trackY && y <= trackY + trackH &&
            y >= listStartY && y <= listStartY + listHeight) {
          this.hoveredTrack = track.id;
          break;
        }
      }

      currentY += trackHeight;
    }

    // Button hovers
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 50;
    const buttonSpacing = 15;
    const totalWidth = (buttonSize * 5) + (buttonSpacing * 4);
    let buttonX = (canvas.width - totalWidth) / 2;

    this.hoveredButton = null;

    const buttonChecks = ['prev', 'play', 'next', 'shuffle', 'repeat'];
    for (let i = 0; i < buttonChecks.length; i++) {
      if (x >= buttonX && x <= buttonX + buttonSize &&
          y >= controlsY && y <= controlsY + buttonSize) {
        this.hoveredButton = buttonChecks[i];
        break;
      }
      buttonX += buttonSize + buttonSpacing;
    }

    // Filter buttons
    const filterY = playerY + 80;
    const filterButtonWidth = 120;
    const filterButtonHeight = 30;
    const allButtonX = playerX + 20;
    const favButtonX = allButtonX + filterButtonWidth + 10;

    if (y >= filterY && y <= filterY + filterButtonHeight) {
      if (x >= allButtonX && x <= allButtonX + filterButtonWidth) {
        this.hoveredButton = 'filter-all';
      } else if (x >= favButtonX && x <= favButtonX + filterButtonWidth) {
        this.hoveredButton = 'filter-fav';
      }
    }
  }

  render(ctx) {
    if (!this.isOpen) return;

    const canvas = ctx.canvas;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const progress = easeOut(this.openProgress);

    ctx.fillStyle = `rgba(0, 0, 0, ${0.85 * progress})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(650, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    ctx.save();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(0.8 + 0.2 * progress, 0.8 + 0.2 * progress);
    ctx.translate(-centerX, -centerY);

    // Background
    const gradient = ctx.createLinearGradient(playerX, playerY, playerX, playerY + playerHeight);
    gradient.addColorStop(0, '#2a2a3a');
    gradient.addColorStop(1, '#1a1a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight);

    // Border
    ctx.shadowColor = '#4a9eff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 4;
    ctx.strokeRect(playerX, playerY, playerWidth, playerHeight);
    ctx.shadowBlur = 0;

    // Title bar
    ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
    ctx.fillRect(playerX, playerY, playerWidth, 70);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Music Player", canvas.width / 2, playerY + 35);
    ctx.textBaseline = "alphabetic";

    // Close button
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    // Draw circle outline
    ctx.strokeStyle = this.closeButtonHovered ? "#ff4444" : "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(closeButtonX + closeButtonSize / 2, closeButtonY + closeButtonSize / 2,
            closeButtonSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw red X icon
    const redXIcon = this.game.images["icon-redx.png"];
    if (redXIcon && redXIcon.complete) {
      const iconSize = 24;
      const iconX = closeButtonX + closeButtonSize / 2 - iconSize / 2;
      const iconY = closeButtonY + closeButtonSize / 2 - iconSize / 2;

      if (this.closeButtonHovered) {
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 10;
      }

      ctx.drawImage(redXIcon, iconX, iconY, iconSize, iconSize);
      ctx.shadowBlur = 0;
    }

    // Filter buttons
    const filterY = playerY + 80;
    const filterButtonWidth = 120;
    const filterButtonHeight = 30;
    const allButtonX = playerX + 20;
    const favButtonX = allButtonX + filterButtonWidth + 10;

    // All button
    ctx.fillStyle = !this.showFavoritesOnly ? '#4a9eff' : '#3a3a4a';
    if (this.hoveredButton === 'filter-all') {
      ctx.shadowColor = '#4a9eff';
      ctx.shadowBlur = 10;
    }
    this.renderRoundedRect(ctx, allButtonX, filterY, filterButtonWidth, filterButtonHeight, 5);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('All Tracks', allButtonX + filterButtonWidth / 2, filterY + filterButtonHeight / 2);

    // Favorites button with heart icon
    const favCount = this.game.favoriteTracks.length;
    ctx.fillStyle = this.showFavoritesOnly ? '#ff6b9d' : '#3a3a4a';
    if (this.hoveredButton === 'filter-fav') {
      ctx.shadowColor = '#ff6b9d';
      ctx.shadowBlur = 10;
    }
    this.renderRoundedRect(ctx, favButtonX, filterY, filterButtonWidth, filterButtonHeight, 5);
    ctx.shadowBlur = 0;

    // Draw heart icon
    const heartIcon = this.game.images['icon-heart.png'];
    if (heartIcon && heartIcon.complete) {
      const heartSize = 16;
      ctx.drawImage(heartIcon, favButtonX + 8, filterY + filterButtonHeight / 2 - heartSize / 2, heartSize, heartSize);
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Favorites (${favCount})`, favButtonX + filterButtonWidth / 2 + 8, filterY + filterButtonHeight / 2);
    ctx.textBaseline = 'alphabetic';

    // Track list
    const listStartY = playerY + 120;
    const trackHeight = 55;
    const listHeight = playerHeight - 280;

    const visibleTracks = this.getVisibleTracks();
    const totalTracksHeight = visibleTracks.length * trackHeight;
    this.maxScroll = Math.max(0, totalTracksHeight - listHeight);

    ctx.save();
    ctx.beginPath();
    ctx.rect(playerX + 10, listStartY, playerWidth - 20, listHeight);
    ctx.clip();

    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < visibleTracks.length; i++) {
      const track = visibleTracks[i];
      const isUnlocked = this.isTrackUnlocked(track.id);
      const isSelected = this.selectedTrack === track.id;
      const isHovered = this.hoveredTrack === track.id;
      const isFavorited = this.isFavorite(track.id);

      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      if (trackY + trackH >= listStartY && trackY <= listStartY + listHeight) {
        // Background
        if (isSelected) {
          const trackGradient = ctx.createLinearGradient(trackX, trackY, trackX, trackY + trackH);
          trackGradient.addColorStop(0, '#4a9eff');
          trackGradient.addColorStop(1, '#2d7dd2');
          ctx.fillStyle = trackGradient;
        } else if (isHovered && isUnlocked) {
          ctx.fillStyle = "#4a4a5a";
        } else if (isUnlocked) {
          ctx.fillStyle = "#3a3a4a";
        } else {
          ctx.fillStyle = "#2a2a3a";
        }

        this.renderRoundedRect(ctx, trackX, trackY, trackW, trackH, 8);

        // Border
        if (isHovered && isUnlocked) {
          ctx.shadowColor = '#4a9eff';
          ctx.shadowBlur = 8;
        }
        ctx.strokeStyle = isSelected ? "#6ab7ff" : (isUnlocked ? "#5a5a6a" : "#3a3a4a");
        ctx.lineWidth = 2;
        ctx.strokeRect(trackX, trackY, trackW, trackH);
        ctx.shadowBlur = 0;

        // Track info
        ctx.font = isSelected ? "bold 16px Arial" : "16px Arial";
        ctx.fillStyle = isUnlocked ? "#ffffff" : "#666666";
        ctx.textAlign = "left";

        const displayName = isUnlocked ? track.name : "???";
        ctx.fillText(displayName, trackX + 15, trackY + 22);

        // Duration and play count (only for unlocked)
        if (isUnlocked) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "#aaaaaa";
          const playCount = this.getPlayCount(track.id);
          ctx.fillText(`${track.duration} • Played ${playCount}x`, trackX + 15, trackY + 40);

          // Heart icon using game asset
          const heartImg = this.game.images[isFavorited ? 'icon-heart.png' : 'btn-favorite.png'];
          if (heartImg && heartImg.complete) {
            const heartSize = 24;
            ctx.save();
            if (!isFavorited) {
              ctx.globalAlpha = 0.4;
            }
            ctx.drawImage(heartImg, trackX + trackW - heartSize - 10, trackY + 13, heartSize, heartSize);
            ctx.restore();
          } else {
            // Fallback to unicode heart
            ctx.font = "18px Arial";
            ctx.fillStyle = isFavorited ? "#ff6b9d" : "#666666";
            ctx.textAlign = "right";
            ctx.fillText(isFavorited ? "♥" : "♡", trackX + trackW - 15, trackY + 30);
          }

          // Progress bar for currently playing track
          if (isSelected && this.isPlaying && this.game.audioManager.currentMusic) {
            const music = this.game.audioManager.currentMusic;
            const currentTime = music.currentTime || 0;
            const duration = music.duration || 0;

            if (duration > 0) {
              // Format time helper
              const formatTime = (seconds) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
              };

              // Progress bar on the track
              const progressBarWidth = (trackW - 30) * 0.5; // 50% of original width
              const progressBarHeight = 14;
              const progressBarX = trackX + (trackW / 2) - (progressBarWidth / 2); // Centered
              const progressBarY = trackY + 36;

              // Background
              ctx.fillStyle = "#1a1a2a";
              ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

              // Progress fill
              const progress = currentTime / duration;
              const fillWidth = progressBarWidth * progress;

              if (fillWidth > 0) {
                const progressGradient = ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + fillWidth, progressBarY);
                progressGradient.addColorStop(0, '#4a9eff');
                progressGradient.addColorStop(1, '#2d7dd2');
                ctx.fillStyle = progressGradient;
                ctx.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);
              }

              // Time display centered on the bar
              const timeText = `${formatTime(currentTime)}/${formatTime(duration)}`;
              ctx.fillStyle = "#ffffff";
              ctx.font = "11px Arial";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(timeText, progressBarX + progressBarWidth / 2, progressBarY + progressBarHeight / 2);
              ctx.textBaseline = "alphabetic";
            }
          }
        } else {
          // Locked status text (no icon)
          ctx.font = "12px Arial";
          ctx.fillStyle = "#666666";
          ctx.textAlign = "left";
          ctx.fillText("Locked", trackX + 15, trackY + 40);
        }
      }

      currentY += trackHeight;
    }

    ctx.restore();

    // Scrollbar
    if (this.maxScroll > 0) {
      const scrollbarHeight = (listHeight / totalTracksHeight) * listHeight;
      const scrollbarY = listStartY + (this.scrollOffset / this.maxScroll) * (listHeight - scrollbarHeight);

      ctx.fillStyle = "rgba(74, 158, 255, 0.5)";
      this.renderRoundedRect(ctx, playerX + playerWidth - 15, scrollbarY, 5, scrollbarHeight, 2);
    }

    // Controls area
    const controlsAreaY = playerY + playerHeight - 150;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(playerX, controlsAreaY, playerWidth, 150);

    // Now playing text
    if (this.selectedTrack) {
      const track = this.tracks.find(t => t.id === this.selectedTrack);
      if (this.isPlaying) {
        ctx.fillStyle = "#4a9eff";
        ctx.font = "bold 18px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Now Playing: ${track.name}`, canvas.width / 2, controlsAreaY + 30);
      } else {
        ctx.fillStyle = "#888888";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Selected: ${track.name}`, canvas.width / 2, controlsAreaY + 30);
      }
    } else {
      ctx.fillStyle = "#666666";
      ctx.font = "italic 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Select a track to play", canvas.width / 2, controlsAreaY + 30);
    }

    // Control buttons
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 50;
    const buttonSpacing = 15;
    const totalWidth = (buttonSize * 5) + (buttonSpacing * 4);
    let buttonX = (canvas.width - totalWidth) / 2;

    const canPlay = this.selectedTrack && this.isTrackUnlocked(this.selectedTrack);

    this.renderControlButton(ctx, buttonX, controlsY, buttonSize, 'prev', canPlay);
    buttonX += buttonSize + buttonSpacing;

    this.renderControlButton(ctx, buttonX, controlsY, buttonSize, 'play', canPlay);
    buttonX += buttonSize + buttonSpacing;

    this.renderControlButton(ctx, buttonX, controlsY, buttonSize, 'next', canPlay);
    buttonX += buttonSize + buttonSpacing;

    this.renderControlButton(ctx, buttonX, controlsY, buttonSize, 'shuffle', true);
    buttonX += buttonSize + buttonSpacing;

    this.renderControlButton(ctx, buttonX, controlsY, buttonSize, 'repeat', true);

    // Status text
    const unlockedCount = this.tracks.filter(t => this.isTrackUnlocked(t.id)).length;
    const percentUnlocked = Math.round((unlockedCount / this.tracks.length) * 100);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";

    let statusText = `Collection: ${unlockedCount}/${this.tracks.length} (${percentUnlocked}%)`;
    if (this.shuffle) statusText += ' • Shuffle ON';
    if (this.repeat) statusText += ' • Repeat ON';

    ctx.fillText(statusText, canvas.width / 2, playerY + playerHeight - 20);

    ctx.restore();
  }

  renderRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  renderControlButton(ctx, x, y, size, type, enabled) {
    const isHovered = this.hoveredButton === type;

    // Determine which image to use
    let imageName = null;
    let isActive = false;

    switch (type) {
      case 'prev':
        imageName = 'btn-audioback.png';
        break;
      case 'play':
        imageName = this.isPlaying ? 'btn-audiopause.png' : 'btn-audioplay.png';
        break;
      case 'next':
        imageName = 'btn-audionext.png';
        break;
      case 'shuffle':
        imageName = 'btn-shuffle.png';
        isActive = this.shuffle;
        break;
      case 'repeat':
        imageName = 'btn-repeat.png';
        isActive = this.repeat;
        break;
    }

    // Get the image
    const img = this.game.images[imageName];

    if (img && img.complete) {
      // Apply hover effects
      if (isHovered && enabled) {
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 15;
      }

      // Apply tint for disabled or active state
      ctx.save();

      if (!enabled) {
        ctx.globalAlpha = 0.3;
      } else if (isActive) {
        // Draw with blue tint for active buttons
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 20;
      }

      ctx.drawImage(img, x, y, size, size);

      ctx.restore();
      ctx.shadowBlur = 0;
    } else {
      // Fallback to old drawn icons if image not loaded
      if (type === 'shuffle') {
        ctx.fillStyle = this.shuffle ? '#4a9eff' : (enabled ? '#3a3a4a' : '#2a2a2a');
      } else if (type === 'repeat') {
        ctx.fillStyle = this.repeat ? '#4a9eff' : (enabled ? '#3a3a4a' : '#2a2a2a');
      } else {
        ctx.fillStyle = enabled ? (type === 'play' && this.isPlaying ? '#5a5a6a' : '#3a3a4a') : '#2a2a2a';
      }

      if (isHovered && enabled) {
        ctx.shadowColor = '#4a9eff';
        ctx.shadowBlur = 15;
      }

      this.renderRoundedRect(ctx, x, y, size, size, 10);
      ctx.shadowBlur = 0;

      ctx.strokeStyle = enabled ? "#ffffff" : "#5a5a6a";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);
    }
  }

  handleClick(x, y, canvas) {
    if (!this.isOpen) return false;

    const playerWidth = Math.min(700, canvas.width - 100);
    const playerHeight = Math.min(650, canvas.height - 100);
    const playerX = (canvas.width - playerWidth) / 2;
    const playerY = (canvas.height - playerHeight) / 2;

    // Close button
    const closeButtonX = playerX + playerWidth - 50;
    const closeButtonY = playerY + 10;
    const closeButtonSize = 40;

    const dx = x - (closeButtonX + closeButtonSize / 2);
    const dy = y - (closeButtonY + closeButtonSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= closeButtonSize / 2) {
      this.close();
      this.game.audioManager.playSound("button-click", false, 0.5);
      return true;
    }

    // Filter buttons
    const filterY = playerY + 80;
    const filterButtonWidth = 120;
    const filterButtonHeight = 30;
    const allButtonX = playerX + 20;
    const favButtonX = allButtonX + filterButtonWidth + 10;

    if (y >= filterY && y <= filterY + filterButtonHeight) {
      if (x >= allButtonX && x <= allButtonX + filterButtonWidth) {
        this.showFavoritesOnly = false;
        this.scrollOffset = 0;
        this.rebuildPlaylist();
        this.game.audioManager.playSound("button-click", false, 0.5);
        return true;
      } else if (x >= favButtonX && x <= favButtonX + filterButtonWidth) {
        this.showFavoritesOnly = true;
        this.scrollOffset = 0;
        this.rebuildPlaylist();
        this.game.audioManager.playSound("button-click", false, 0.5);
        return true;
      }
    }

    // Track list
    const listStartY = playerY + 120;
    const trackHeight = 55;
    const listHeight = playerHeight - 280;

    const visibleTracks = this.getVisibleTracks();
    let currentY = listStartY - this.scrollOffset;

    for (let i = 0; i < visibleTracks.length; i++) {
      const track = visibleTracks[i];
      const trackX = playerX + 20;
      const trackY = currentY;
      const trackW = playerWidth - 40;
      const trackH = trackHeight - 5;

      if (x >= trackX && x <= trackX + trackW &&
          y >= trackY && y <= trackY + trackH &&
          y >= listStartY && y <= listStartY + listHeight) {

        const isUnlocked = this.isTrackUnlocked(track.id);

        // Check heart click (heart is 24px icon at trackX + trackW - 34)
        const heartSize = 24;
        const heartX = trackX + trackW - heartSize - 10;
        if (isUnlocked && x >= heartX && x <= heartX + heartSize &&
            y >= trackY + 13 && y <= trackY + 13 + heartSize) {
          this.toggleFavorite(track.id);
          this.game.audioManager.playSound("button-click", false, 0.5);
          return true;
        }

        if (isUnlocked) {
          this.selectTrack(track.id);
          this.game.audioManager.playSound("button-click", false, 0.5);
        } else {
          this.game.audioManager.playSound("sock-mismatch", false, 0.3);
        }
        return true;
      }

      currentY += trackHeight;
    }

    // Control buttons
    const controlsY = playerY + playerHeight - 100;
    const buttonSize = 50;
    const buttonSpacing = 15;
    const totalWidth = (buttonSize * 5) + (buttonSpacing * 4);
    let buttonX = (canvas.width - totalWidth) / 2;

    // Previous
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      if (this.selectedTrack && this.isTrackUnlocked(this.selectedTrack)) {
        this.playPrevious();
        this.game.audioManager.playSound("button-click", false, 0.5);
      }
      return true;
    }
    buttonX += buttonSize + buttonSpacing;

    // Play/Pause
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      if (this.selectedTrack && this.isTrackUnlocked(this.selectedTrack)) {
        if (this.isPlaying) {
          this.pauseCurrentTrack();
        } else {
          this.playCurrentTrack();
        }
        this.game.audioManager.playSound("button-click", false, 0.5);
      }
      return true;
    }
    buttonX += buttonSize + buttonSpacing;

    // Next
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      if (this.selectedTrack && this.isTrackUnlocked(this.selectedTrack)) {
        this.playNext();
        this.game.audioManager.playSound("button-click", false, 0.5);
      }
      return true;
    }
    buttonX += buttonSize + buttonSpacing;

    // Shuffle
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      this.toggleShuffle();
      this.game.audioManager.playSound("button-click", false, 0.5);
      return true;
    }
    buttonX += buttonSize + buttonSpacing;

    // Repeat
    if (x >= buttonX && x <= buttonX + buttonSize &&
        y >= controlsY && y <= controlsY + buttonSize) {
      this.toggleRepeat();
      this.game.audioManager.playSound("button-click", false, 0.5);
      return true;
    }

    return true;
  }

  handleScroll(deltaY) {
    if (!this.isOpen || this.maxScroll === 0) return;

    this.scrollOffset += deltaY;
    this.scrollOffset = Math.max(0, Math.min(this.maxScroll, this.scrollOffset));
  }

  handleReticleMove(x, y) {
    if (!this.isOpen) return;

    // Reuse the existing hover detection logic
    this.updateHover(x, y, this.game.canvas);

    // Update controller reticle hover state if something is hovered
    if (this.game.controllerManager) {
      const isHovering = this.isAnyElementHovered();
      this.game.controllerManager.setReticleHoverState(isHovering);
    }
  }

  handleReticleAction(x, y) {
    if (!this.isOpen) return false;

    // Reuse the existing click logic
    return this.handleClick(x, y, this.game.canvas);
  }
}
