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

const startGame = async (gameState, synth) => {
    enableButtons();
    document.getElementById("replay-btn").addEventListener("click", async () => {
        await playSequence(gameState.gameState.sequence, synth);
    });

    while (true) {
        let sequence = gameState.gameState.sequence
        let highScore = gameState.gameState.highScore
        let level = gameState.gameState.level
        displayHighScore(highScore)
        displayLevel(level)
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("high score " + highScore)
        console.log("current level " + level)
        await playSequence(sequence, synth);
        const userSequence = await recordInput(sequence.length);
        console.log("user sequence: " + userSequence);
        await new Promise(resolve => setTimeout(resolve, 1000));
        gameState = await postGameState(userSequence);
    }
};

const playSequence = async (arr, synth) => {
    disablePlayButtons()
    console.log(arr)
    // const yellowPad = document.getElementById("pad-yellow");
    // const bluePad = document.getElementById("pad-blue");
    // const redPad = document.getElementById("pad-red");
    // const greenPad = document.getElementById("pad-green");
    const noteMap = {
        "pad-yellow": "D4", "pad-blue": "F4", "pad-red": "C4", "pad-green": "E4"
    }
    for (let i=0; i<arr.length; i++) {
        const padToClick = document.getElementById(`pad-${arr[i]}`);
        setTimeout(() => {
            synth.triggerAttackRelease(noteMap[padToClick.id], "8n");
        }, 0);
        padToClick.classList.add("active-effect");
        await new Promise(resolve => setTimeout(resolve, 500)); // wait for 500ms
        padToClick.classList.remove("active-effect");
        console.log(arr[i] + " pad clicked");
        await new Promise(resolve => setTimeout(resolve, 500)); // wait for 500ms before playing the next sound
    }
    enableButtons()
};

const enableButtons = () => {
    document.getElementById("replay-btn").disabled = false;
    document.getElementById("start-btn").disabled = true;
    document.querySelectorAll(".pad").forEach(pad => {
        pad.disabled = false;
    });
};

const disablePlayButtons = () => {
    document.getElementById("replay-btn").disabled = true;
    document.querySelectorAll(".pad").forEach(pad => {
        pad.disabled = true;
    });
};

const recordInput = (lenSequence) => {
    console.log("current sequence length: " + lenSequence)
    return new Promise((resolve) => {
        const userSequence = []
        let count = 0

        document.getElementById("pad-blue").addEventListener("click", () =>{
            userSequence.push("blue")
            count++
            if (count === lenSequence) {
                resolve(userSequence)
            }
        })
        document.getElementById("pad-yellow").addEventListener("click", () =>{
            userSequence.push("yellow")
            count++
            if (count === lenSequence) {
                resolve(userSequence)
            }
        })
        document.getElementById("pad-green").addEventListener("click", () =>{
            userSequence.push("green")
            count++
            if (count === lenSequence) {
                resolve(userSequence)
            }
        })
        document.getElementById("pad-red").addEventListener("click", () =>{
            userSequence.push("red")
            count++
            if (count === lenSequence) {
                resolve(userSequence)
            }
        })
    })
};

const postGameState = async (seq) => {
    const url = "http://localhost:3000/api/v1/game-state/sequence";
    const sequence = {"sequence": seq};
    console.log(sequence)

    try {
        const response = await axios.post(url, sequence);
        console.log("updated game state " + response.data);
        return response.data
    } catch (error) {
        console.log("incorrect user sequence");
        await gameOver();
        gameState = await putGameState();
        return gameState;
    }
};

const gameOver = async () => {
    const modal = document.querySelector(".modal");
    const resetBtn = document.getElementById("reset-btn");

    console.log(modal)
    console.log(resetBtn)

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

const displayHighScore = (highScore) => {
    document.getElementById("high-score").innerHTML = highScore;
};

const displayLevel = (level) => {
    document.getElementById("level-indicator").innerHTML = level;
};

const playTone = (synth) => {
    const yellowPad = document.getElementById("pad-yellow");
    const bluePad = document.getElementById("pad-blue");
    const redPad = document.getElementById("pad-red");
    const greenPad = document.getElementById("pad-green");

    yellowPad.addEventListener("click", () => {
        synth.triggerAttackRelease("D4", "8n")
    });
    bluePad.addEventListener("click", () => {
        synth.triggerAttackRelease("F4", "8n")
    });
    redPad.addEventListener("click", () => {
        synth.triggerAttackRelease("C4", "8n")
    });
    greenPad.addEventListener("click", () => {
        synth.triggerAttackRelease("E4", "8n")
    });
};

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
            padArr[index].classList.add("active-effect");
            setTimeout(() => {
                padArr[index].classList.remove("active-effect")
            },300);
        }
    });
};

const changeOscType = () => {
    const dropdown = document.getElementById("sound-select");

    dropdown.addEventListener("change", (event) => {
        synth.oscillator.type = event.target.value;
        console.log("Oscillator type changed to" + synth.oscillator.type);
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
    console.log("Game state fetched on page load:", gameState);
    displayHighScore(gameState.gameState.highScore);
};
document.getElementById("start-btn").addEventListener("click", () => startGame(gameState, synth));
keyPadMap();
playTone(synth);
changeOscType();