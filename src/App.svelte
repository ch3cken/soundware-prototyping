<script>
  import Player from './Player.svelte';
  import Playlist from './Playlist.svelte';
  import Searchbot from "./Searchbot.svelte";
  import Login from "./Login.svelte";

  let playlistComponent;
  let currentPlaylist = [];
  let songPlayingIndex = 0;
  let playlistTitle = '';

  function handlePlayPlaylist(event) {
    currentPlaylist = event.detail.songs;
    songPlayingIndex = 0;
    playlistTitle = event.detail.playlistName || '';
  }

  function handleClearPlaylist(event) {
    currentPlaylist = [];
    songPlayingIndex = 0;
    playlistTitle = '';
  }
</script> 

<div class="container">
  <main>
    <div class="left">
      <!-- disableChatting is for debugging purposes. To send message without prompting the AI and wasting money -->
      <Searchbot disableChatting={false}></Searchbot>
      <Login loginObservers={[playlistComponent]}></Login>
    </div>

    <!-- <div class="droppable" on:dragover={dragoverHandler} on:drop={dropHandler}>Playlist here</div> -->

    <Playlist bind:this={playlistComponent} on:playplaylist={handlePlayPlaylist} on:clearplaylist={handleClearPlaylist}></Playlist>

    <div class="play">
      <div class="play-board">
        <Player {currentPlaylist} bind:songPlayingIndex playlistTitle={playlistTitle} />
      </div>
    </div>
  </main>
</div>

<style>
  .container {
    /* // border: 1px solid rgb(255, 0, 0); */
    max-width: 100vw;
    max-height: 100vh;
    padding: 20px;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }

  main {
    display: flex;
    gap: 10px;
  }

  /* .droppable {
    width: 200px;
  } */

  .play{
    border: 1px solid rgb(87, 76, 42);
    position: static;
    padding: 5px;
    border-radius: 3%;
    left: 30vw;
    /* bottom: 0; */
    background-color: rgb(49, 49, 49);
    width: 45vw;
    height: 9BA0vh;
  }
</style>