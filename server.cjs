// Import required modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const { google } = require('googleapis');

// Firebase
const { initializeApp } = require('firebase/app');

const {
    getDatabase,
    ref,
    child,
    get,
    set,
    onValue,
    push,
} = require('firebase/database');

// Create an instance of the Express application
const app = express();
const port = 3000;

// System string
const systemString = `You are a music recommendation assistant. Your responses MUST:
1. ONLY use the following format for each recommendation:
{"songTitle": "[Song Title]", "artist": "[Artist Name]"}
2. Separate each recommendation with a newline
3. Include at least 7 recommendations
4. ONLY include the recommendations - no other text
5. Make sure song titles and artist names are accurate
6. Consider the conversation history and previous recommendations when making new suggestions
7. If the user asks for similar songs, base recommendations on their previous interests

Example response:
{"songTitle": "Super Shy", "artist": "NewJeans"}
{"songTitle": "Street by Street", "artist": "Laufey"}
{"songTitle": "WE GO", "artist": "fromis_9"}
{"songTitle": "Supernova", "artist": "aespa"}
{"songTitle": "Glue Song", "artist": "beabadoobee"}`;

// Store conversation history
const conversationHistory = [{ role: "system", content: systemString }];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize YouTube API
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Firebase initialization
function firebaseInit() {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: "soundware-prototype.firebaseapp.com",
        projectId: "soundware-prototype",
        storageBucket: "soundware-prototype.firebasestorage.app",
        messagingSenderId: "622926820242",
        appId: "1:622926820242:web:baf1027f3ee3aa56f5474b",
        databaseURL: process.env.FIREBASE_DATABASE_URL
    };

    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig);
    const database = getDatabase(firebaseApp);

    return { database };
}

const { database } = firebaseInit();

// Function to search YouTube video
async function searchYouTubeVideo(songTitle, artist) {
    try {
        const searchQuery = `${songTitle} ${artist} official`;

        // look up the recommendation on youtube search
        const response = await youtube.search.list({
            part: 'snippet',
            q: searchQuery,
            type: 'video',
            maxResults: 1,
            videoEmbeddable: true
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        const videoId = response.data.items[0].id.videoId;
        return `https://youtu.be/${videoId}`;
    } catch (error) {
        console.error('Error searching YouTube video:', error);
        return null;
    }
}

// Chat endpoint
// when frontend sends a message with method POST with fetch(.../chat), this endpoint is called
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // Add user message to history
        conversationHistory.push({ role: "user", content: userMessage });
        
        // Get completion from OpenAI with conversation history
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationHistory,
            temperature: 0.7,
        });

        let response = completion.choices[0].message.content;

        // Add assistant's response to history
        conversationHistory.push({ role: "assistant", content: response });

        // Limit history size to prevent token limit issues (keep last 10 messages)
        if (conversationHistory.length > 11) { // 1 system message + 10 conversation messages
            conversationHistory.splice(1, 2); // Remove oldest user-assistant pair, keep system message
        }

        try {
            // Split into individual recommendation lines and clean them up
            const recommendations = response.trim().split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        console.warn('Failed to parse recommendation:', line);
                        return null;
                    }
                })
                .filter(item => item !== null); // Remove any failed parses

            // Add YouTube links to recommendations
            const promiseArray = recommendations.map(async (rec) => {
                const youtubeLink = await searchYouTubeVideo(rec.songTitle, rec.artist);
                if (youtubeLink) {
                    return {
                        ...rec,
                        link: youtubeLink
                    };
                }
                return null;
            });

            // Wait for all promises to resolve and filter out null values
            const enhancedRecommendations = (await Promise.all(promiseArray)).filter(rec => rec !== null);

            if (enhancedRecommendations.length < 2) {
                throw new Error('Not enough valid recommendations found');
            }

            // send the validated JSON response back to the frontend
            res.json({ 
                message: enhancedRecommendations,
                // sessionId: sessionId // Return sessionId to maintain conversation
            });
        } catch (error) {
            console.error('Error processing recommendations:', error);
            res.status(500).json({ 
                error: 'Failed to process recommendations',
                details: error.message 
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Endpoint for saving playlists
app.post('/save-playlists', async (req, res) => {
    try {
        // userId + their playlists
        const { userId, playlists } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Save playlists to Firebase
        const userPlaylistsRef = ref(database, `users/${userId}`);
        await set(userPlaylistsRef, playlists);

        res.json({ message: 'Playlists saved successfully' });
    } catch (error) {
        console.error('Error saving playlists:', error);
        res.status(500).json({ error: 'Failed to save playlists' });
    }
});

// Endpoint to get user playlists
app.get('/get-playlists/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get playlists from Firebase
        const userPlaylistsRef = ref(database, `users/${userId}`);
        const snapshot = await get(userPlaylistsRef);

        if (snapshot.exists()) {
            res.json(snapshot.val());
        } else {
            res.json({ playlists: [] });
        }
    } catch (error) {
        console.error('Error retrieving playlists:', error);
        res.status(500).json({ error: 'Failed to retrieve playlists' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});