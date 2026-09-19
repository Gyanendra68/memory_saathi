window.GameFace = {
    start() {
        const area = document.getElementById("gameArea");

        const emojis = [
            '🐶','🐱','🐭','🐹','🐰','🦊',
            '🐻','🐼','🐨','🐯','🦁','🐮'
        ];

        const targets = [...emojis]
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        const distractors = [...emojis]
            .filter(x => !targets.includes(x))
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);

        const options = [...targets, ...distractors]
            .sort(() => 0.5 - Math.random());

        // Show faces to memorize
        area.innerHTML = `
            <h3>Memorize these faces:</h3>
            <div>
                ${targets.map(e =>
                    `<span class="emoji-btn"
                        style="font-size:60px; margin:10px; display:inline-block;">
                        ${e}
                    </span>`
                ).join("")}
            </div>
            <p id="face-memory-msg">You have 5 seconds...</p>
        `;

        // After 5 seconds, show choices
        setTimeout(() => {
            area.innerHTML = `
                <h3>Select the 4 faces you saw:</h3>

                <div id="face-options">
                    ${options.map((e, i) =>
                        `<button class="emoji-btn"
                            data-index="${i}"
                            style="font-size:50px; margin:8px;">
                            ${e}
                        </button>`
                    ).join("")}
                </div>

                <br>
                <button id="face-submit" class="btn-large">
                    Submit
                </button>
            `;

            const selected = [];

            area.querySelectorAll(".emoji-btn").forEach(btn => {
                btn.onclick = () => {
                    const emoji = btn.innerText.trim();

                    if (selected.includes(emoji)) {
                        selected.splice(selected.indexOf(emoji), 1);
                        btn.classList.remove("selected");
                    } else {
                        selected.push(emoji);
                        btn.classList.add("selected");
                    }
                };
            });

            document.getElementById("face-submit").onclick = () => {
                const correct = selected.filter(
                    x => targets.includes(x)
                ).length;

                const wrong = selected.filter(
                    x => !targets.includes(x)
                ).length;

                const accuracy = Math.max(
                    0,
                    Math.round(((correct - wrong) / 4) * 100)
                );

                result(
                    "face",
                    correct,
                    4,
                    accuracy,
                    {
                        targets: targets.join(", "),
                        selected: selected.join(", ")
                    }
                );
            };

        }, 5000);
    }
};
