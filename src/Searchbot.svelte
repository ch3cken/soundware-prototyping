<script>
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

  // For debugging purposes
  const delay = (timeMs) => new Promise((resFn, rejFn) => setTimeout(resFn, timeMs));
  export let disableChatting = true;

  // DOM Elements
  let chatMessages;
  let userInput;
  let userInputHTML;
  let recContainer;

  function dragStartHandler(event) {
    event.dataTransfer.setData("text", event.target.id)
  }

  function createMessageDiv(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = message;
    return messageDiv;
  }

  function addMessageDiv(messageDiv)
  {
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // // Function to add a message to the chat
  function addMessage(message, isUser = false) {
      const messageDiv = createMessageDiv(message, isUser)
      addMessageDiv(messageDiv)
  }

  function addRecommendations(recommendations) {
    recommendations.forEach((rec) => {
      const message = rec.songTitle + " ~ " + rec.artist;
      const div = createMessageDiv(message);
      div.draggable = true;
      div.ondragstart = dragStartHandler;
      div.id = rec.songTitle + "SEPA!RATOR" + rec.artist + "SEPA!RATOR" + rec.link;
      addMessageDiv(div);
    })
  }

  // // Function to send message to the server
  async function sendMessage(message) {
      try {
          userInputHTML.disabled = true;
          userInputHTML.placeholder = "Waiting response...";

          if(!disableChatting) {
            const response = await fetch(`${serverUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addRecommendations(data.message);
            userInputHTML.disabled = false;
            userInputHTML.placeholder = "Type your message here...";
            return "[Sent to console]";
          }
          else {
            // await delay(5000);
            const exampleRecommendations = [
              {
                artist: "NewJeans",
                link: "https://youtu.be/11cta61wi0g?si=M4qj-0vLrYfEE5Ho",
                songTitle: "Hype Boy"
              },
              {
                artist: "NewJeans",
                link: "https://youtu.be/js1CtxSY38I?si=S0iq-P7g0m6yVnb8",
                songTitle: "Attention"
              },
              {
                artist: "Laufey",
                link: "https://youtu.be/INmi-teOQLA?si=g9mV6GWR68dDa2xJ",
                songTitle: "Beautiful Stranger"
              },
              {
                artist: "Helena Noguerra",
                link: "https://youtu.be/6bkY9ZS-9BA?si=REUeGmmoTp1GmoIx",
                songTitle: "Theme of Bayonetta - Mysterious Destiny"
              },
              {
                artist: "TWICE",
                link: "https://youtu.be/Q4Rb5_kjS2M?si=qqDiFJJpx4HvqV-N",
                songTitle: "Queen of Hearts"
              }
            ];
            userInputHTML.disabled = false;
            userInputHTML.placeholder = "Type your message here...";

            addRecommendations(exampleRecommendations)
            return "(Message not actually sent to ChatGPT)";
          }
          
      } catch (error) {
          console.error('Error:', error);
          return 'Sorry, something went wrong. Please try again.';
      }
  }

  // // Handle send button click
  async function handleSend() {
      const message = userInput.trim();
      if (message === '') return;

      // Add user message to chat
      addMessage(message, true);
      userInput = "";

      // // Get and add bot response
      await sendMessage(message);
  }

  const checkIfEnter = (e) => {
    if(e.key == "Enter") handleSend();
  }
</script>

<div class="recommendation-container" bind:this={recContainer}>

</div>


<div class="chat-container">
  <div class="chat-header">
    <h1>Searchbot</h1>
  </div>
  <div class="chat-messages" id="chat-messages" bind:this={chatMessages}>
    <div class="message bot">
        Hello! I'm Searchbot, your personal assistant for great music recommendations! &#128512; <br>
        Let me know anything you want to listen to. <br> <br>
        Examples of prompts: "Give me popular Latin American songs to dance to!".
    </div>
  </div>

  <div class="chat-input">
    <input type="text"
      id="user-input"
      placeholder="Type your message here..."
      bind:value={userInput}
      on:keypress={checkIfEnter}
      bind:this={userInputHTML}>
    <button id="send-button" on:click={handleSend}>Send</button>
  </div>
</div>



<style>
  .chat-container{
    display: flex;
    flex-direction: column;

    height: 100%;

    border: 2px solid black;
    background-color:rgba(254, 250, 224, 0.1);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    /* // position: static;
		// left: 0; */
		width: 25vw;
		height: 90vh;
    overflow: hidden;
    border-radius: 12px;

    scrollbar-width: thin;
    scrollbar-color: #333 rgba(255, 248, 220, 0);
  }

  :global(.droppableList::-webkit-scrollbar) {
    width: 8px;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .chat-messages {
    flex: 1;
    /* //flex-grow: 1; */
    padding: 20px;
    overflow-y: auto;
    background-color:rgba(255, 248, 220, 0.1);
  }

  .chat-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color:rgba(255, 255, 255, 0.5); 
    text-align: center;
}

  .chat-header h1 {
      font-size: 1.5rem;
      color: #333;
  }


  :global(.message) {
      margin-bottom: 15px;
      padding: 10px 15px;
      border-radius: 15px;
      max-width: 80%;
      word-wrap: break-word;
    }

  :global(.bot) {
    cursor: pointer;
    background-color:rgb(255, 255, 255);
    border: 2px solid black;
    color: #333;
  }

  .chat-input {
    flex-shrink: 0;
    padding: 15px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 10px;
    background-color:rgba(254, 250, 224, 0.1)
  }

  #user-input {
      flex-grow: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      outline: none;
  }

  #send-button {
      padding: 10px 20px;
      background-color:rgb(121, 35, 9);
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
  }

  #send-button:hover {
      background-color:rgb(255, 102, 0);
  }

  :global(.user) {
    background-color:rgb(63, 30, 17);
    color: white;
    margin-left: auto;
  }
  
</style>