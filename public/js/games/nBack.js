window.GameNBack = {
    start() {
        const area = document.getElementById("gameArea");

        area.innerHTML = `
            <h3>2-Back Memory</h3>
            <p>
                Click MATCH if the current letter matches
                the one shown 2 steps ago.
            </p>

            <div id="nb-display"
                 style="
                    font-size:6rem;
                    font-weight:bold;
                    height:120px;
                    line-height:120px;
                 ">
            </div>

            <button id="nb-match"
                    class="btn-large">
                MATCH
            </button>
        `;

        const letters = ["A", "B", "C", "D"];
        const sequence = [];
        const matches = [];

        // Generate 12-letter sequence
        for (let i = 0; i < 12; i++) {

            if (i >= 2 && Math.random() > 0.6) {
                sequence.push(sequence[i - 2]);
                matches.push(i);
            } else {
                sequence.push(
                    letters[Math.floor(Math.random() * letters.length)]
                );
            }
        }

        const userHits = new Set();
        let currentIndex = -1;

        document.getElementById("nb-match").onclick = () => {
            if (currentIndex >= 0) {
                userHits.add(currentIndex);
            }
        };

        // Start after 1 second
        setTimeout(() => {

            const startTime = Date.now();

            let i = 0;

            const showNext = () => {

                if (i >= sequence.length) {

                    let truePos = 0;
                    let falsePos = 0;

                    userHits.forEach(index => {
                        if (matches.includes(index)) {
                            truePos++;
                        } else {
                            falsePos++;
                        }
                    });

                    const maxPos = matches.length || 1;

                    const accuracy = Math.max(
                        0,
                        ((truePos - falsePos * 0.5) / maxPos) * 100
                    );

                    result(
                        "nback",
                        truePos,
                        maxPos,
                        Math.min(100, Math.round(accuracy)),
                        {
                            sequence: sequence,
                            matches: matches,
                            userHits: [...userHits],
                            responseTime: Date.now() - startTime
                        }
                    );

                    return;
                }

                currentIndex = i;

                const display =
                    document.getElementById("nb-display");

                display.innerText = sequence[i];

                setTimeout(() => {
                    display.innerText = "";

                    i++;

                    setTimeout(showNext, 300);

                }, 1200);
            };

            showNext();

        }, 1000);
    }
};
