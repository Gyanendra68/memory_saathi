window.GameSequence = {
    start() {
        const area = document.getElementById("gameArea");

        const seqLength = 5;

        const sequence = Array.from(
            { length: seqLength },
            () => Math.floor(Math.random() * 10).toString()
        );

        area.innerHTML = `
            <h3 id="seq-display" style="font-size:3rem;">
                Ready...
            </h3>
        `;

        setTimeout(() => {
            let index = 0;

            const showNext = () => {
                if (index >= sequence.length) {
                    showInput();
                    return;
                }

                const display = document.getElementById("seq-display");
                display.innerText = sequence[index];

                setTimeout(() => {
                    display.innerText = "";
                    index++;

                    setTimeout(showNext, 200);
                }, 800);
            };

            showNext();
        }, 1500);

        const showInput = () => {
            area.innerHTML = `
                <h3>Enter the sequence:</h3>

                <input
                    type="number"
                    id="seq-input"
                    class="input-large"
                    autofocus
                >

                <button id="seq-submit" class="btn-large">
                    Verify
                </button>
            `;

            const input = document.getElementById("seq-input");
            input.focus();

            document.getElementById("seq-submit").onclick = () => {
                const value = input.value;

                let correctChars = 0;

                for (
                    let i = 0;
                    i < Math.max(value.length, sequence.length);
                    i++
                ) {
                    if (value[i] === sequence[i]) {
                        correctChars++;
                    }
                }

                const accuracy = Math.round(
                    (correctChars / seqLength) * 100
                );

                result(
                    "sequence",
                    correctChars,
                    seqLength,
                    accuracy,
                    {
                        expected: sequence.join(""),
                        answer: value
                    }
                );
            };
        };
    }
};
