const putGameState = async () => {
    //The URL to which we will send the request
    const url = "http://localhost:3000/api/v1/game-state";

    //Perform a GET request to the url
    try {
        const response = await axios.put(url);
        //When successful, print the received data
        return response.data;
    } catch (error) {
        //When unsuccessful, print the error.
        console.log(error);
        return null;
    }
    // This code is always executed, independent of whether the request succeeds or fails.
};

/**
 * This is the main game function, it plays the sequence of pad clicks for the user,
 * then waits for the user to repeat the sequence before sending it to the backend for validation.
 * this loop continues on forever, allowing the user to play the game as long as they want to.
 * @param {object} gameState - The current gamestate retrieved from the backend
 * @param {object} synth - The synth to be able to play notes for pad clicks
 */
const startGame = async (gameState, synth) => {
    enableButtons();
    // When the replay button is clicked, the sequence plays again
    document.getElementById("replay-btn").addEventListener("click", async () => {
        await playSequence(gameState.gameState.sequence, synth);
    });

    while (true) {
        const sequence = gameState.gameState.sequence
        const highScore = gameState.gameState.highScore
        const level = gameState.gameState.level
        displayHighScore(highScore)
        displayLevel(level)
        // small pause after changing the level and high score
        await new Promise(resolve => setTimeout(resolve, 500));
        await playSequence(sequence, synth);
        const userSequence = await recordInput(sequence.length);
        await new Promise(resolve => setTimeout(resolve, 1000));
        gameState = await postGameState(userSequence);
    }
};

/**
 * This function plays the sequence for the user with a reasonable interval.
 * Also playing a distinct note for each color pad clicked.
 * @param {Array} arr - Array containing the correct sequence
 * @param {object} synth - Synth object for playing notes
 */
const playSequence = async (arr, synth, index=0) => {
    if (index === arr.length) {
        enableButtons();
        return;
    }
    disablePlayButtons()
    const noteMap = {
        "pad-yellow": "D4", "pad-blue": "F4", "pad-red": "C4", "pad-green": "E4"
    }
    const color = arr[index];
    const padToClick = document.getElementById(`pad-${color}`);
    synth.triggerAttackRelease(noteMap[padToClick.id], "8n");
    padToClick.classList.add("active");
    setTimeout(() => {
        padToClick.classList.remove("active");
    }, 400);
    setTimeout(() => {
        playSequence(arr, synth, index + 1)
    }, 1000);

};

/**
 * Enables the play buttons once the start button has been pressed.
 */
const enableButtons = () => {
    document.getElementById("replay-btn").disabled = false;
    document.getElementById("start-btn").disabled = true;
    document.querySelectorAll(".pad").forEach(pad => {
        pad.disabled = false;
    });
};

/**
 * Disables play buttons and replay button.
 */
const disablePlayButtons = () => {
    document.getElementById("replay-btn").disabled = true;
    document.querySelectorAll(".pad").forEach(pad => {
        pad.disabled = true;
    });
};

/**
 * Waits for user to press pads and records what pad was last pressed in an array.
 * once the length of the user sequence is equal to the generated sequence, we
 * return from this function
 * @param {number} lenSequence - Length of generated sequence
 * @returns {Array} - User sequence array
 */
const recordInput = (lenSequence) => {
    return new Promise((resolve) => {
        const userSequence = []
        let count = 0

        const blueHandler = () =>{
            synth.triggerAttackRelease("F4", "8n")
            document.getElementById("pad-blue").classList.add("active")
            setTimeout(() => {
                document.getElementById("pad-blue").classList.remove("active")
            }, 400);
            userSequence.push("blue")
            count++
            if (count === lenSequence) {
                removeListeners()
                resolve(userSequence)
            }
        };

        const yellowHandler = () =>{
            synth.triggerAttackRelease("D4", "8n")
            userSequence.push("yellow")
            document.getElementById("pad-yellow").classList.add("active")
            setTimeout(() => {
                document.getElementById("pad-yellow").classList.remove("active")
            }, 400);
            count++
            if (count === lenSequence) {
                removeListeners()
                resolve(userSequence)
            }
        };

        const greenHandler = () =>{
            synth.triggerAttackRelease("E4", "8n")
            userSequence.push("green")
            document.getElementById("pad-green").classList.add("active")
            setTimeout(() => {
                document.getElementById("pad-green").classList.remove("active")
            }, 400);
            count++
            if (count === lenSequence) {
                removeListeners()
                resolve(userSequence)
            }
        };

        const redHandler = () =>{
            synth.triggerAttackRelease("C4", "8n")
            userSequence.push("red")
            document.getElementById("pad-red").classList.add("active")
            setTimeout(() => {
                document.getElementById("pad-red").classList.remove("active")
            }, 400);
            count++
            if (count === lenSequence) {
                removeListeners()
                resolve(userSequence)
            }
        };

        document.getElementById("pad-red").addEventListener("click", redHandler);
        document.getElementById("pad-blue").addEventListener("click", blueHandler);
        document.getElementById("pad-yellow").addEventListener("click", yellowHandler);
        document.getElementById("pad-green").addEventListener("click", greenHandler);

        const removeListeners = () => {
        document.getElementById("pad-red").removeEventListener("click", redHandler);
        document.getElementById("pad-blue").removeEventListener("click", blueHandler);
        document.getElementById("pad-yellow").removeEventListener("click", yellowHandler);
        document.getElementById("pad-green").removeEventListener("click", greenHandler);
        };
    });
};

/**
 * Sends the user sequence to the backend for validation, if successful, it returns the updated
 * game state for the next level, if not it displays a game over window and resets and returns
 * the game state
 * @param {Array} seq  - user sequence array
 * @returns {object} - Updated game state
 */
const postGameState = async (seq) => {
    const url = "http://localhost:3000/api/v1/game-state/sequence";
    const sequence = {"sequence": seq};

    try {
        const response = await axios.post(url, sequence);
        return response.data
    } catch (error) {
        console.log(error);
        await gameOver();
        gameState = await putGameState();
        return gameState;
    }
};

/**
 * Displays a game over modal window to the user, and waits for the user to click the
 * reset button
 */
const gameOver = async () => {
    const modal = document.querySelector(".modal");
    const resetBtn = document.getElementById("reset-btn");
    disablePlayButtons()
    modal.style.display = "flex";

    return new Promise(resolve => {
        const handleClick = () => {
            modal.style.display = "none";
            resetBtn.removeEventListener("click", handleClick);
            resolve();
        };
        resetBtn.addEventListener("click", handleClick);
    });
};

/**
 * Displays the users high score
 * @param {number} highScore  - High score in current gamestate
 */
const displayHighScore = (highScore) => {
    document.getElementById("high-score").innerHTML = highScore;
};

/**
 * Displays current game level
 * @param {number} level - Level of current game state
 */
const displayLevel = (level) => {
    document.getElementById("level-indicator").innerHTML = level;
};

/**
 * Maps qwas keys to their respective pad according to the HTML to be able to simulate
 * a pad press for each key press
 */
const keyPadMap = () => {
    const redPad = document.getElementById("pad-red");
    const greenPad = document.getElementById("pad-green");
    const yellowPad = document.getElementById("pad-yellow");
    const bluePad = document.getElementById("pad-blue");
    const keyArr = ["q", "w", "a", "s"]
    const padArr = [redPad, yellowPad, greenPad, bluePad]

    document.addEventListener("keydown", (event) => {
        const index = keyArr.indexOf(event.key);
        if (index !== -1) {
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            padArr[index].dispatchEvent(clickEvent);
        }
    });
};

/**
 * Event listener for the dropdown menu to be able to change the oscillator type
 * of the synth for each respective value in the menu.
 */
const changeOscType = () => {
    const dropdown = document.getElementById("sound-select");

    dropdown.addEventListener("change", (event) => {
        synth.oscillator.type = event.target.value;
    })
};

let gameState = null
const synth = new Tone.Synth({
    oscillator: {
        type: "sine"
    }
}).toDestination();

disablePlayButtons();
window.onload = async () => {
    gameState = await putGameState();
    displayHighScore(gameState.gameState.highScore);
};
document.getElementById("start-btn").addEventListener("click", () => startGame(gameState, synth));
keyPadMap();
changeOscType();