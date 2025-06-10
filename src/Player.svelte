<script>
    import Playlist from './Playlist.svelte';
    import { createEventDispatcher, onMount } from 'svelte';
    
    export let playlistTitle = "My Playlist";
    
    let isPlaying = false;
    let lpStateClass = "";
    let tonearmClass = "";
    let volume = 0.5;
    let tonearmAngle = 0;
    let tonearmInterval;

    const emptySong = { title: "No song", artist: "Unknown Artist", link: "" }

    $: currentSong = currentPlaylist[songPlayingIndex] || emptySong;

    $: title = currentSong.title?.trim() || "Untitled";
    $: artist = currentSong.artist?.trim() || "Unknown Artist";

    export let currentPlaylist = [];
    export let songPlayingIndex = 0;

    let num = 0;

    // Helper to extract YouTube video ID from a link
    function getYouTubeId(url) {
        const match = url && url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : '';
    }

    $: youtubeId = getYouTubeId(currentSong.link);

    // Control iframe src for play/pause
    // $: iframeSrc = youtubeId && isPlaying
    //     ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
    //     : undefined;

    function PlayMusic() {
        if (isPlaying) {
            isPlaying = false;
            tonearmClass = "turntable-off";
            lpStateClass = "rotate-to-zero";
            tonearmAngle = 0;
            if (player) player.pauseVideo();
        } else {
            isPlaying = true;
            tonearmClass = "turntable-on";
            setTimeout(() => {
                lpStateClass = "spin";
            }, 800);
            updateTonearmAngle();
            if (player) player.playVideo();
        }
    }

    function previous() {
        if (songPlayingIndex > 0) {
            songPlayingIndex -= 1;
            isPlaying = true;
            tonearmClass = "turntable-on";
            setTimeout(() => {
                lpStateClass = "spin";
            }, 800);
        }
    }

    function next() {
        if (songPlayingIndex < currentPlaylist.length - 1) {
            songPlayingIndex += 1;
            isPlaying = true;
            tonearmClass = "turntable-on";
            setTimeout(() => {
                lpStateClass = "spin";
            }, 800);
        }
    }

    const dispatch = createEventDispatcher();

    function handlePlayButton() {
        dispatch('playPlaylist');
    }

    export function playCurrentPlaylist() {
        // logic to play the current playlist, e.g., dispatch an event or set state
    }

    $: if (currentPlaylist && currentPlaylist.length > 0 && songPlayingIndex === 0) {
        isPlaying = true;
        tonearmClass = "turntable-on";
        setTimeout(() => {
            lpStateClass = "spin";
        }, 800);
    }

    function handlePlayPlaylist(event) {
        currentPlaylist = event.detail.songs;
        songPlayingIndex = 0; // Always start from the first song
    }

    let player;
    let apiLoaded = false;

    function onYouTubeIframeAPIReady() {
        apiLoaded = true;
        player = new window['YT'].Player('ytplayer', {
            height: '0',
            width: '0',
            videoId: youtubeId,
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }

    function onPlayerReady(event) {
        player.setVolume(volume * 100);
        if (isPlaying) {
            player.playVideo();
        }
    }

    function onPlayerStateChange(event) {
        // 0 means ended
        if (event.data === window['YT'].PlayerState.ENDED) {
            if (songPlayingIndex < currentPlaylist.length - 1) {
                songPlayingIndex += 1;
            } else if (currentPlaylist.length > 0) {
                songPlayingIndex = 0; // Loop to the first song
            }
        }
    }

    let prevYoutubeId;
    let prevVolume = volume;

    $: if (apiLoaded && player) {
        // Only load a new video if the song changes
        if (youtubeId && youtubeId !== prevYoutubeId) {
            player.loadVideoById(youtubeId);
            prevYoutubeId = youtubeId;
            if (isPlaying) {
                player.playVideo();
            } else {
                player.pauseVideo();
            }
        }
        // Only set volume if it changes
        if (volume !== prevVolume) {
            player.setVolume(volume * 100);
            prevVolume = volume;
        }
    }

    // $: if (player) {
    //     player.setVolume(volume * 100);
    // }

    function updateTonearmAngle() {
        if (player && player.getDuration && player.getCurrentTime) {
            const duration = player.getDuration();
            const currentTime = player.getCurrentTime();
            if (duration > 0) {
                // Move from 15deg (start) to 30deg (end)
                tonearmAngle = 15 + (14 * (currentTime / duration));
            } else {
                tonearmAngle = 15;
            }
        }
    }

    $: if (isPlaying && player) {
        clearInterval(tonearmInterval);
        tonearmInterval = setInterval(updateTonearmAngle, 200);
    } else {
        clearInterval(tonearmInterval);
    }

    // Reset tonearm when song changes
    $: if (youtubeId) {
        tonearmAngle = 15;
    }

    onMount(() => {
        if (!window['YT']) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            window['onYouTubeIframeAPIReady'] = onYouTubeIframeAPIReady;
        } else {
            onYouTubeIframeAPIReady();
        }
    });

    currentPlaylist = currentPlaylist.filter(song => song && song.title && song.artist && song.link);

</script>

<head>
    <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    />
</head>

<div class="player">
    
    <h1 class="playlist-title">Playing {playlistTitle} 🎵</h1>

    <!-- Hidden YouTube audio player -->
    <div style="position: fixed; top: -9999px; left: -9999px;">
        <div id="ytplayer"></div>
    </div>

    <div class="lp-style">

        <div class="lp-style-disk">
            <div class="lp-center-circle"></div>
            <img alt="LP" src="assets/lp.png"  class={lpStateClass} />
        </div>
        
        <div class="lp-style-tonearm">
            <img alt="tonearm" src="assets/tonearm.png" style="transform: rotate({tonearmAngle}deg); transform-origin: 50% 25%;" />
        </div>

    </div>

    <div class="song-info">
        <p class="song-title">{title}</p>
        <p class="song-artist">{artist}</p>
    </div>

    <div class="controller">
        <div class="playbutton">
            <button on:click={previous} aria-label="Previous Song">
                <i class="fa-solid fa-backward"></i>
            </button>
            <button on:click={PlayMusic} aria-label="Play or Pause">
                <i class={isPlaying ? 'fas fa-pause' : 'fas fa-play'}></i>
            </button>
            <button on:click={next} aria-label="Next Song">
                <i class="fa-solid fa-forward"></i>
            </button>
        </div>
        
        <div class="volumeControl">
            <label for="volume-control">
                Volume: <span class="volume-number">{volume.toFixed(2)}</span>
            </label>

            <input 
                id="volume-control"
                type="range"
                min="0"
                max="1"
                step="0.01"
                bind:value={volume}
                class="custom-slider"
            />
        </div>
    </div>
</div>

<style>
    * {
        box-sizing: border-box;
    }

    .playlist-title {
        text-align: center;
        font-size: 1.4rem;
        font-weight: bold;
        margin-bottom: 1rem;
        color: rgb(32, 32, 32);
        background-color: rgba(255, 255, 255, 0.6);
        padding: 0.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .player{
        border: 6px solid rgb(56, 32, 0);
        background-image:
            url("/assets/wood-texture-base.jpg");
        border-radius: 2%;
        /* gap: 20px; */
        padding: 20px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .lp-style{
        border: 10px solid rgb(0, 0, 0);
        border-radius: 5%;
        background-image: url("/assets/wood-texture.jpg");
        background-size: cover;
        width: 41vw;
        height: 40vw;
        justify-content: center;
        position: relative;
        /* overflow: hidden; */
        margin-bottom: 1rem;

        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .lp-style img {
        position: relative;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        z-index: 2;
    }

    .lp-style-disk {
        position: relative;
        /* border: 1px solid red; */
        width: 90%;
        height: 100%;
        /* margin-left: -5%; */
    }

    .lp-center-circle {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 31vw;
        height: 32vw;
        border: 5px solid rgba(49, 49, 49, 0.7);
        background-color: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;

        box-shadow: 0 3px 5px rgba(0, 0, 0, 0.7);
    }

    .lp-style-tonearm{
        position: relative;
        /* border: 1px solid blue; */
        right: -40%;
        top: -110%;
        width: 90%;
        height: 100%;
        /* object-fit: contain; */
    }

    .song-info{
        border: 5px solid rgb(121, 110, 13);
        background-color: rgba(0, 99, 18, 0.86);

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        width: 41vw;
        /* height: 5vw; */
        padding: 0.2rem;
        margin-bottom: 1rem;

        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);

        font-family: monospace;
    }

    .song-title {
        font-size: 1.2rem;
        color: #e7e4dc;
        font-weight: bold;
        margin: 0;
    }

    .song-artist {
        font-size: 1rem;
        color: #e7e4dc;
        font-style: italic;
        margin: 0;
    }

    .controller{
        border: 5px solid rgb(70, 70, 70);
        background-color: rgba(0, 0, 0, 0.75);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 41vw;
        height: 6vw;

        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .playbutton {
        margin-bottom: 0.5rem;
    }

    .volumeControl {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: monospace;
    }

    .volumeControl label {
        color: #e6e6c2;
        font-size: 1rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    .volume-number {
        display: inline-block;
        width: 3.2ch;
        text-align: right;
        color: rgb(225, 232, 215);
        font-size: 1rem;
        font-weight: bold;
    }

    .custom-slider {
        /* -webkit-appearance: none; */
        width: 120px;
        height: 2px;
        background: linear-gradient(to right, #c9a31b,rgb(255, 174, 0));
        border-radius: 5px;
        outline: none;
        transition: background 0.3s ease;
    }

    .custom-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 8px;
        height: 18px;
        background: #fff7d6;
        border: 1px solid rgb(102, 66, 0);
        border-radius: 3px;
        cursor: pointer;
    }

    .custom-slider::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: #fff7d6;
        border: 2px solid #6e4b00;
        border-radius: 50%;
        cursor: pointer;
    }
    
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes turntable-on{
        from {
            transform: rotate(0deg);
        }
        to{
            transform: rotate(18deg);
        }
    }

    @keyframes turntable-off{
        from{
            transform: rotate(18deg);
        }
        to{
            transform: rotate(0deg);
        }
    }

    img.spin {
        animation: spin 3s linear infinite;
        transform-origin: 48% 50%; 
    }

    .rotate-to-zero {
        transform: rotate(0deg);
        transition: transform 1s ease;
        transform-origin: 48% 50%;
    }

    img.turntable-on {
        animation: turntable-on 0.8s ease forwards;
        transform-origin: 50% 25%;
    }

    img.turntable-off {
        animation: turntable-off 0.8s ease forwards;
        transform-origin: 50% 25%;
    }

    /* .lp-style-disk::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: red; 
        border-radius: 50%;
        left: 48%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 999;
        pointer-events: none;
    } */

    .lp-style-tonearm::after {
        content: '';
        position: absolute;
        width: 22%;
        height: 20%;
        background: rgba(0, 0, 0, 0.9); 
        border-radius: 50%;
        left: 50%;
        top: 27%;
        transform: translate(-50%, -50%);
        z-index: 0;
        pointer-events: none;

        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
    }

    .lp-style-tonearm img {
        transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }

</style>