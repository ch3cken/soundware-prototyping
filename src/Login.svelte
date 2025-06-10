<script>
    import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
    import { auth } from './lib/firebase.js';
    import { onMount } from 'svelte';

    export let loginObservers = [];

    // Create provider instance
    const provider = new GoogleAuthProvider();

    // Store user data
    let user = null;

    onMount(() => {
        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged((userData) => {
            user = userData;
            notifyObservers();
        });

        // Cleanup subscription on component destroy
        return () => unsubscribe();
    });

    function notifyObservers() {
        loginObservers.forEach((obs) => obs.notify(user));
    }

    async function login() {
        try {
            const result = await signInWithPopup(auth, provider);
            user = result.user;
        } catch (error) {
            console.error("Error during login:", error);
        }
    }

    async function logout() {
        try {
            await signOut(auth);
            notifyObservers()
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    function handleAuthClick() {
        if (user) {
            logout();
        } else {
            login();
        }
    }
</script>

<main>
    <div class="login-block">
        <button 
            on:click={handleAuthClick}
            class={user ? 'log-out' : 'log-in'}
        >
            {#if user}
                Logout
            {:else}
                Login with Google
            {/if}
        </button>
    </div>
</main>

<style>
    .login-block {
        position: absolute;
        top: 20px;
        right: 20px;
        z-index: 100;
        
        /* // background-color: white; */
        /* padding: 10px 15px; */
        border: 3px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);

        font-size: 0.5rem;
    }

    .login-block button {
        padding: 10px 20px;
        background-color:rgb(121, 35, 9);
        color: white;
        cursor: pointer;
        transition: background-color 0.3s;
        font-size: 1rem;
    }

    .log-in {
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .log-in:hover {
        background-color: #f5f5f5;
    }

    .log-out {
        display: flex;
        align-items: center;
        justify-content: center;
        /* // gap: 10px;
        // padding: 10px 20px; */
        border-radius: 4px;
        cursor: pointer;
        background-color: #dc3545;
        color: white;
        border: none;
        transition: background-color 0.3s;
    }

    .log-out:hover {
        background-color: #c82333;
    }
</style>