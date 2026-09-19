window.GameCards = {
    start() {
        const area = document.getElementById("gameArea");

        area.innerHTML = `
            <div class="game-grid"
                 style="grid-template-columns:repeat(3,1fr);">
            </div>

            <button id="start-pattern" class="btn-large">
                Start Pattern
            </button>

            <p id="pattern-msg"></p>
        `;

        const grid = area.querySelector(".game-grid");

        // Create 3 × 3 grid
        for (let i = 0; i < 9; i++) {
            grid.innerHTML += `
                <div class="game-cell" data-index="${i}"></div>
            `;
        }

        document.getElementById("start-pattern").onclick = async () => {

            document.getElementById("start-pattern").style.display = "none";

            // Generate pattern of 5 cells
            const pattern = [];

            while (pattern.length < 5) {
                const r = Math.floor(Math.random() * 9);

                if (pattern[pattern.length - 1] !== r) {
                    pattern.push(r);
                }
            }

            document.getElementById("pattern-msg").innerText =
                "Watch carefully...";

            await wait(1000);

            // Show pattern
            for (const p of pattern) {
                grid.children[p].classList.add("active");

                await wait(600);

                grid.children[p].classList.remove("active");

                await wait(200);
            }

            document.getElementById("pattern-msg").innerText =
                "Repeat the pattern!";

            const startTime = Date.now();
            const userPattern = [];
            let finished = false;

            grid.querySelectorAll(".game-cell").forEach(cell => {

                cell.onclick = () => {
                    if (finished) return;

                    const index = parseInt(cell.dataset.index);

                    cell.classList.add("active");

                    setTimeout(() => {
                        cell.classList.remove("active");
                    }, 200);

                    userPattern.push(index);

                    // Wrong step
                    if (
                        userPattern[userPattern.length - 1] !==
                        pattern[userPattern.length - 1]
                    ) {
                        finished = true;

                        const score = userPattern.length - 1;
                        const accuracy = Math.round(
                            (score / pattern.length) * 100
                        );

                        result(
                            "cards",
                            score,
                            pattern.length,
                            accuracy,
                            {
                                pattern: pattern,
                                answer: userPattern,
                                responseTime: Date.now() - startTime
                            }
                        );
                    }

                    // Perfect
                    else if (userPattern.length === pattern.length) {
                        finished = true;

                        result(
                            "cards",
                            5,
                            5,
                            100,
                            {
                                pattern: pattern,
                                answer: userPattern,
                                responseTime: Date.now() - startTime
                            }
                        );
                    }
                };
            });
        };
    }
};
