<script>
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
    
    import Player from './Player.svelte';
    let playerRef;

    let playlistHolder;
    let user = null;

    let isLoading = false;

    export let currentPlaylist = [];
    export let songPlayingIndex = 0;

    $: currentSong = currentPlaylist[songPlayingIndex] || { title: "No song", artist: "Unknown Artist", link: "" };

    function autoSave() {
        if (!user || isLoading) return;
        savePlaylists();
    }

    export function notify(newUser)
    {
        user = newUser
        clearPlaylists();

        dispatch('clearplaylist');

        if(user) loadPlaylists();
    }

    async function savePlaylists() {
        if (!user) {
            alert('Please log in to save playlists');
            return;
        }

        try {
            playlistList.forEach((playlist) => playlist.saveName());

            // Convert playlists to a proper JSON structure
            const playlistsData = {
                playlists: playlistList.map(playlist => ({
                    playlistName: playlist.getName(),
                    songs: playlist.songs.map(song => ({
                        title: song.getTitle(),
                        artist: song.getArtist(),
                        link: song.getLink()
                    }))
                }))
            };

            const response = await fetch(`${serverUrl}/save-playlists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.uid,
                    playlists: playlistsData
                })
            });

            // Try to get the response text first
            const responseText = await response.text();

            // Only try to parse if we have content
            let data;
            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Failed to parse response:', parseError);
                    throw new Error('Invalid response from server');
                }
            } else {
                throw new Error('Empty response from server');
            }
            
            if (response.ok) {
                //alert('Playlists saved successfully!');
            } else {
                throw new Error(data?.error || 'Failed to save playlists');
            }
        } catch (error) {
            console.error('Full error details:', error);
            alert(`Failed to save playlists: ${error.message}`);
        }
    }

    async function loadPlaylists() {
        isLoading = true;

        try {
            const response = await fetch(`${serverUrl}/get-playlists/${user.uid}`);
            
            console.log(response);

            const data = await response.json();
            
            if (data.playlists) {
                // Clear existing playlists
                playlistHolder.innerHTML = '';
                playlistList = [];

                // Recreate playlists from saved data
                data.playlists.forEach(playlistData => {
                    const playlist = new Playlist(playlistData.playlistName);
                    if (playlistData.songs) {
                        playlistData.songs.forEach(songData => {
                            const song = new Song(songData.title, songData.artist, songData.link);
                            playlist.addSong(song, playlist.divElement);
                        });
                    }
                    addPlaylist(playlist);
                });
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
        }  finally {
            isLoading = false;
        }
    }

    function clearPlaylists() {
        playlistList.forEach((playlist) => playlist.deletePlaylist())
    }

    function dragoverHandler(event) {
        event.preventDefault();
    }

    class Song {
        constructor(title, artist, link) {
            this.title = title;
            this.artist = artist;
            this.link = link;
        }

        getTitle() { return this.title }
        getArtist() { return this.artist }
        getLink() { return this.link }
    }

    class Playlist {
        constructor(name) {
            this.songs = [];
            this.playlistName = name;
            this.isOpen = false;

            this.playlistContainer = document.createElement("div");
            this.playlistContainer.className = "playlist-container";

            const headerSection = document.createElement("div");
            headerSection.className = "playlist-header";

            this.divElement = document.createElement('div');
            this.divElement.className = "droppableList";
            this.divElement.ondragover = dragoverHandler;
            this.divElement.ondrop = this.dropToThisPlaylist();
            this.divElement.style.display = "none";

            this.titleInput = document.createElement("input");
            this.titleInput.type = "text";
            this.titleInput.placeholder = "Playlist Title";
            this.titleInput.className = "playlist-title";
            this.titleInput.value = name;
            this.titleInput.oninput = () => {
                if (!isLoading) autoSave();
            };

            const buttonContainer = document.createElement("div");
		    buttonContainer.className = "playlist-buttons";

            // Dropdown playlist
            const toggleButton = document.createElement("button");
            toggleButton.className = "button";
            toggleButton.onclick = () => {
                this.isOpen = !this.isOpen;
                this.divElement.style.display = this.isOpen ? "block" : "none";
                toggleImg.classList.toggle("rotated", this.isOpen);
            };
            const toggleImg = document.createElement("img");
            toggleImg.src = "/assets/dropdown-icon.png"; 
            toggleImg.alt = "Toggle";
            toggleImg.className = "icon-img";
            toggleButton.appendChild(toggleImg);

            headerSection.appendChild(toggleButton);
            headerSection.appendChild(this.titleInput);

            // Play playlist
            const playButton = document.createElement("button");
            playButton.className = "button";
            playButton.onclick = () => {
                dispatch('playplaylist', {
                    songs: this.songs.map(song => ({
                        title: song.getTitle(),
                        artist: song.getArtist(),
                        link: song.getLink()
                    })),
                    playlistName: this.getName()
                });
                const lpImage = document.createElement("img");
                lpImage.src = "/assets/lp.png";
                lpImage.className = "lp-fly-in";
                document.body.appendChild(lpImage);
                lpImage.addEventListener("animationend", () => {
                    lpImage.remove();
                });
            };
            const playImg = document.createElement("img");
            playImg.src = "/assets/play-icon.png";
            playImg.alt = "Play";
            playImg.className = "icon-img";
            playButton.appendChild(playImg);

            // Mixplaylist button
            const mixButton = document.createElement("button");
            mixButton.className = "button";
            mixButton.onclick = () => {
                this.songs = this.songs.sort(() => Math.random() - 0.5);
                dispatch('playplaylist', {
                    songs: this.songs.map(song => ({
                        title: song.getTitle(),
                        artist: song.getArtist(),
                        link: song.getLink()
                    })),
                    playlistName: this.getName()
                });
                alert("Playlist shuffled!");
            };
            const mixImg = document.createElement("img");
            mixImg.src = "/assets/mix-icon.png";
            mixImg.alt = "Mix";
            mixImg.className = "icon-img";
            mixButton.appendChild(mixImg);

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.className = "button";
            deleteButton.onclick = () => {
                if(window.confirm(`Are you sure you want to delete playlist ${this.playlistName}?`)) {
                    this.deletePlaylist();
                }
            };
            const deleteImg = document.createElement("img");
            deleteImg.src = "/assets/delete-icon.png";
            deleteImg.alt = "Delete";
            deleteImg.className = "icon-img";
            deleteButton.appendChild(deleteImg);

            const footerButtons = document.createElement("div");
            footerButtons.className = "playlist-controls";
            footerButtons.append(playButton, mixButton, deleteButton);

            this.playlistContainer.appendChild(headerSection);
            this.playlistContainer.appendChild(this.divElement);
            this.playlistContainer.appendChild(footerButtons);
            playlistHolder.appendChild(this.playlistContainer);
        }

        dropToThisPlaylist() {
            const associatedPlaylist = this;
            return (event) => {
                if(event.target.className.startsWith("droppable")) {
                    event.preventDefault();
                    const songid = event.dataTransfer.getData("text");
                    const [songTitle, songArtist, songLink] = songid.split("SEPA!RATOR")
                    associatedPlaylist.addSong(new Song(songTitle, songArtist, songLink), event.target)
                }
                else if(event.target.className == "song")
                {
                    // in case the song is dropped into another song, then it will be dropped in the playlist that the song belongs in
                    event.preventDefault();
                    const songid = event.dataTransfer.getData("text");
                    const [songTitle, songArtist, songLink] = songid.split("SEPA!RATOR")
                    associatedPlaylist.addSong(new Song(songTitle, songArtist, songLink), event.target.parentElement)
                }
            }
        }

        addSong(song, playlistDiv) {
            this.saveName();
            const songDiv = document.createElement("div");
            songDiv.className = "song";
            songDiv.innerHTML = song.getTitle() + " ~ " + song.getArtist();

            const deleteSongButton = document.createElement("button");
            deleteSongButton.className = "song-delete";
            deleteSongButton.innerHTML = " - ";
            deleteSongButton.onclick = () => {
                this.songs = this.songs.filter((s) => s != song)
                songDiv.remove();
                deleteSongButton.remove();
                if (!isLoading) autoSave();
            }
            songDiv.appendChild(deleteSongButton);

            playlistDiv.appendChild(songDiv);
            this.songs.push(song);

            if (!isLoading) autoSave();
        }

        deletePlaylist() {
            playlistList = playlistList.filter(playlist => playlist != this);
            this.playlistContainer.remove();
            if (!isLoading) autoSave();
        }

        saveName() {
            this.playlistName = this.titleInput.value;
        }

        getName() {
            this.saveName();
            return this.playlistName;
        }
    }

    let playlistList = [];

    function addNewPlaylist() {
        playlistList = [...playlistList, new Playlist("New #" + playlistList.length)];
        autoSave();
    }

    function addPlaylist(playlist) {
        playlistList = [...playlistList, playlist];
        autoSave();
    }

    function handlePlayPlaylist(event) {
        currentPlaylist = event.detail.songs;
        songPlayingIndex = 0; // Start from the first song
    }
</script>

<div class="list">
    <div class="playlist-header-bar">
        <h1>My Playlist</h1>
        <button class="add-playlist" on:click={addNewPlaylist}> + </button>
        <!-- <button on:click={savePlaylists}>Save Playlists</button> -->
    </div>

    <div class="playlistHolder" bind:this={playlistHolder}>
    </div>
</div>

<style>
    .list {
        display: flex;
        position: fixed;
        flex-direction: column;

        border: 1px solid black;
        border-radius: 15PX;
        position: static;
        padding: 5px;
        left: 60vw;
        /* bottom: 0; */
        background-color: rgb(168, 161, 131);
        width: 25vw;
        height: 89vh;

        overflow: hidden;

        scrollbar-width: thin;
        scrollbar-color: #333 rgb(168, 161, 131);

        /* // box-sizing: border-box; */
        
    }

    .playlistHolder {
        flex: 1;
        overflow-y: auto;
        padding-right: 4px;
        scrollbar-width: thin;
        scrollbar-color: #333 rgb(168, 161, 131);
    }

    :global(.playlist-container){
        border: 2px solid #444;
        border-radius: 8px;
        margin-bottom: 16px;
        padding: 8px;
        background-color: #d9c171;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    :global(.playlist-title-container) {
        font-size: 0.8rem;
        flex: 1;
        text-align: center;
    }

    :global(.button) {
		margin: 0;
		padding: 0;
		font-size: 1.4rem;
		font-weight: 700;
		cursor: pointer;
        
        align-items: center;
        text-align: center;
    }

    :global(.droppableList){
        width: 100%;
        height: 150px;
        background: rgba(random(0,1), random(0,1), random(0,1), 1);
        border: 1px solid black;
        overflow: scroll;

        scrollbar-width: thin;
        scrollbar-color: #333 #d9c171;
    }

    :global(.droppableList::-webkit-scrollbar) {
        width: 8px;
    }

    :global(.droppableList::-webkit-scrollbar-track) {
        background: #d9c171;
        border-radius: 8px;
    }

    :global(.droppableList::-webkit-scrollbar-thumb) {
        background-color: #333;
        border-radius: 8px;
        border: 2px solid #d9c171;
    }

    :global(.playlist-header-bar) {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 1px;
        border-bottom: 1px solid #e0e0e0;
    }

    :global(.playlist-header-bar h1) {
        font-size: 1.4rem;
        margin: 20px auto;
    }

    :global(.playlist-header-bar .add-playlist) {
        position: absolute;
        right: 0;
        margin-right: 8px;
        font-size: 1.2rem;
        padding: 2px 8px;
        border-radius: 50%;
    }

    :global(.song) {
        /* margin-bottom: 15px; */
        padding: 10px;
        border-radius: 8px;
        border-block: solid;
        /* max-width: 100%; */
        word-wrap: break-word;
        overflow-y: auto;
        background-color: #b69f8e;
        color: #333;
        border-block-color: #291e1e;
        border-width: 1px;
        /* align-items: center;
        align-content: center; */

        display: flex;
        justify-content: space-between;

        max-width: 100%;
        box-sizing: border-box;
    }

    :global(.song-delete) {
        display: flex;
        /* // osition: relative; */

        align-items: center;
        text-align: center;
        justify-content: center;
        
        width: 20px;
        height: 20px;
        margin-left: 1%;
        padding: 0;
        font-size: 1rem;
        font-weight: 300;
        cursor: pointer;

        
        background-color: rgb(233, 233, 233);
        color: rgb(43, 43, 43);
        border-radius: 8px;

        font-size: 1rem;
        font-weight: bold;

        flex-shrink: 0;
    }

    :global(.song-delete:hover) {
        background-color: rgb(197, 46, 0);
    }

    :global(.icon-button) {
        background: none;
        border: none;
        padding: 5px;
        margin: 0 5px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    :global(.icon-img) {
        width: 24px;
        height: 24px;
        object-fit: contain;
        transition: transform 0.3s ease;
    }

    :global(.icon-img.rotated) {
        transform-origin: center;
        transform: rotate(-90deg);
    }

    :global(.playlist-title) {
        font-size: 1rem;
        margin-left: 8px;
        padding: 4px;
        border: 1px solid #aaa;
        border-radius: 4px;
    }

    :global(.playlist-controls) {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: auto;
    }

    :global(.lp-fly-in) {
        position: fixed;
        top: 14vh;
        left: -50px;
        width: 38vw;
        height: 36vw;
        z-index: 1000;
        pointer-events: none;
        animation: fly-in-out 2.2s ease-out forwards;
    }

    @keyframes fly-in-out {
        0% {
            transform: translateX(35vw);
            opacity: 0;
        }
        20% {
            opacity: 1;
        }
        80% {
            transform: translateX(57vw);
            opacity: 1;
        }
        100% {
            transform: translateX(58vw);
            opacity: 0;
        }
    }
</style>