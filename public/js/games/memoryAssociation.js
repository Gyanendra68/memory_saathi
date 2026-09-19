window.GameAssociation = {
    start() {
        const area = document.getElementById("gameArea");

        const allPairs = [
            ["Ocean", "Blue"],
            ["Sun", "Hot"],
            ["Apple", "Red"],
            ["Tree", "Green"],
            ["Night", "Dark"],
            ["Snow", "Cold"]
        ];

        const pairs = [...allPairs]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        // Memorization screen
        area.innerHTML = `
            <h3>Memorize the Associations</h3>

            <div style="font-size:1.5rem; line-height:2;">
                ${pairs.map(p =>
                    `<b>${p[0]}</b> ➔ ${p[1]}`
                ).join("<br>")}
            </div>

            <p id="association-msg">
                You have 6 seconds...
            </p>
        `;

        // After 6 seconds, ask a question
        setTimeout(() => {

            const target =
                pairs[Math.floor(Math.random() * pairs.length)];

            let options = allPairs
                .map(p => p[1])
                .sort(() => 0.5 - Math.random())
                .slice(0, 4);

            // Make sure correct answer is included
            if (!options.includes(target[1])) {
                options[0] = target[1];
            }

            options.sort(() => 0.5 - Math.random());

            area.innerHTML = `
                <h3>
                    What was associated with
                    <b>"${target[0]}"</b>?
                </h3>

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    justify-content:center;
                    gap:10px;
                ">
                    ${options.map(option =>
                        `<button class="btn-large pair-opt">
                            ${option}
                        </button>`
                    ).join("")}
                </div>
            `;

            area.querySelectorAll(".pair-opt").forEach(button => {

                button.onclick = () => {

                    const correct =
                        button.innerText.trim() === target[1];

                    result(
                        "association",
                        correct ? 1 : 0,
                        1,
                        correct ? 100 : 0,
                        {
                            target: target[0],
                            expected: target[1],
                            answer: button.innerText.trim()
                        }
                    );
                };

            });

        }, 6000);
    }
};
