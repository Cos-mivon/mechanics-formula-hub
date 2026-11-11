```javascript
document.addEventListener("DOMContentLoaded", function () {

    const forceInputs = document.getElementById("force-inputs");
    const addButton = document.getElementById("add-force");
    const calculateButton = document.getElementById("calculate");
    const resetButton = document.getElementById("reset");

    const componentOutput = document.getElementById("component-output");
    const resultOutput = document.getElementById("result-output");
    const stepsOutput = document.getElementById("steps-output");
    const vectorGroup = document.getElementById("vector-group");

    let forceCount = 0;

    function addForce(magnitude = "", angle = "") {

        forceCount++;

        const row = document.createElement("div");
        row.className = "force-row";

        row.innerHTML = `
            <div>
                <label>Force ${forceCount} (N)</label>
                <input type="number"
                    step="any"
                    class="force-magnitude"
                    placeholder="Magnitude"
                    value="${magnitude}">
            </div>

            <div>
                <label>Angle (°)</label>
                <input type="number"
                    step="any"
                    class="force-angle"
                    placeholder="Angle"
                    value="${angle}">
            </div>

            <button type="button" class="remove-force">
                Remove
            </button>
        `;

        forceInputs.appendChild(row);
    }

    function calculate() {

        const rows = forceInputs.querySelectorAll(".force-row");

        if (rows.length === 0) {
            alert("Please add at least one force.");
            return;
        }

        let sumX = 0;
        let sumY = 0;
        let components = [];
        let steps = "";

        for (let i = 0; i < rows.length; i++) {

            const magnitudeInput =
                rows[i].querySelector(".force-magnitude");

            const angleInput =
                rows[i].querySelector(".force-angle");

            const magnitude = Number(magnitudeInput.value);
            const angle = Number(angleInput.value);

            if (
                magnitudeInput.value === "" ||
                angleInput.value === "" ||
                !Number.isFinite(magnitude) ||
                !Number.isFinite(angle) ||
                magnitude < 0
            ) {
                alert("Please enter valid values for every force.");
                return;
            }

            const radians = angle * Math.PI / 180;

            const fx = magnitude * Math.cos(radians);
            const fy = magnitude * Math.sin(radians);

            sumX += fx;
            sumY += fy;

            components.push({
                name: "F" + (i + 1),
                magnitude,
                angle,
                fx,
                fy
            });

            steps += `
                <h4>Force ${i + 1}</h4>
                <p>Fx = F cos θ</p>
                <p>Fx = ${magnitude} × cos(${angle}°)</p>
                <p>Fx = ${fx.toFixed(2)} N</p>

                <p>Fy = F sin θ</p>
                <p>Fy = ${magnitude} × sin(${angle}°)</p>
                <p>Fy = ${fy.toFixed(2)} N</p>
                <hr>
            `;
        }

        const resultant = Math.hypot(sumX, sumY);
        const tolerance = 0.000001;
        const equilibrium = resultant < tolerance;

        let direction = Math.atan2(sumY, sumX) * 180 / Math.PI;

        if (direction < 0) direction += 360;

        const balancingDirection = (direction + 180) % 360;

        componentOutput.innerHTML = components.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.magnitude.toFixed(2)}</td>
                <td>${c.angle}°</td>
                <td>${c.fx.toFixed(2)}</td>
                <td>${c.fy.toFixed(2)}</td>
            </tr>
        `).join("") + `
            <tr>
                <th>Σ</th>
                <th>—</th>
                <th>—</th>
                <th>${sumX.toFixed(2)}</th>
                <th>${sumY.toFixed(2)}</th>
            </tr>
        `;

        resultOutput.innerHTML = `
            <p>ΣFx = <b>${sumX.toFixed(2)} N</b></p>
            <p>ΣFy = <b>${sumY.toFixed(2)} N</b></p>
            <p>Resultant = <b>${resultant.toFixed(2)} N</b></p>

            <p>Direction =
                <b>${equilibrium ? "Undefined (zero resultant)" : direction.toFixed(2) + "°"}</b>
            </p>

            <p>Balancing force =
                <b>${resultant.toFixed(2)} N</b>
            </p>

            <p>Balancing direction =
                <b>${equilibrium ? "Not required" : balancingDirection.toFixed(2) + "°"}</b>
            </p>

            <p>Equilibrium =
                <b style="color:${equilibrium ? "#67dba0" : "#ff7777"}">
                    ${equilibrium ? "YES" : "NO"}
                </b>
            </p>
        `;

        steps += `
            <h3>Resultant Force</h3>

            <p>ΣFx = ${sumX.toFixed(2)} N</p>
            <p>ΣFy = ${sumY.toFixed(2)} N</p>

            <p>R = √[(ΣFx)² + (ΣFy)²]</p>

            <p>R = √[(${sumX.toFixed(2)})² + (${sumY.toFixed(2)})²]</p>

            <p><b>R = ${resultant.toFixed(2)} N</b></p>

            <p>Direction = atan2(ΣFy, ΣFx)</p>

            <p><b>${equilibrium ? "Undefined (zero resultant)" : direction.toFixed(2) + "°"}</b></p>
        `;

        stepsOutput.innerHTML = steps;

        drawDiagram(components, sumX, sumY);
    }

    function drawDiagram(components, sumX, sumY) {

        vectorGroup.innerHTML = "";

        const maxValue = Math.max(
            1,
            ...components.map(c => Math.hypot(c.fx, c.fy)),
            Math.hypot(sumX, sumY)
        );

        const scale = 145 / maxValue;

        components.forEach((c, i) => {

            const x = 300 + c.fx * scale;
            const y = 210 - c.fy * scale;

            const color = `hsl(${(i * 65 + 15) % 360}, 85%, 65%)`;

            const line = document.createElementNS(
                "http://www.w3.org/2000/svg", "line"
            );

            line.setAttribute("x1", 300);
            line.setAttribute("y1", 210);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", color);
            line.setAttribute("stroke-width", 3);

            vectorGroup.appendChild(line);

            const label = document.createElementNS(
                "http://www.w3.org/2000/svg", "text"
            );

            label.setAttribute("x", x + 7);
            label.setAttribute("y", y - 7);
            label.setAttribute("fill", "white");
            label.setAttribute("font-size", "13");
            label.textContent = c.name;

            vectorGroup.appendChild(label);
        });

        if (Math.hypot(sumX, sumY) > 0.000001) {

            const line = document.createElementNS(
                "http://www.w3.org/2000/svg", "line"
            );

            line.setAttribute("x1", 300);
            line.setAttribute("y1", 210);
            line.setAttribute("x2", 300 + sumX * scale);
            line.setAttribute("y2", 210 - sumY * scale);
            line.setAttribute("stroke", "#67dba0");
            line.setAttribute("stroke-width", 4);
            line.setAttribute("stroke-dasharray", "7,4");

            vectorGroup.appendChild(line);

            const label = document.createElementNS(
                "http://www.w3.org/2000/svg", "text"
            );

            label.setAttribute("x", 300 + sumX * scale + 8);
            label.setAttribute("y", 210 - sumY * scale - 8);
            label.setAttribute("fill", "#67dba0");
            label.textContent = "R";

            vectorGroup.appendChild(label);
        }
    }

    function reset() {

        forceInputs.innerHTML = "";

        componentOutput.innerHTML =
            '<tr><td colspan="5">Enter forces and calculate.</td></tr>';

        resultOutput.innerHTML = `
            <p>Resultant force: —</p>
            <p>Direction: —</p>
            <p>Balancing force: —</p>
            <p>Equilibrium: —</p>
        `;

        stepsOutput.textContent =
            "Enter forces to see the solution.";

        vectorGroup.innerHTML = "";

        forceCount = 0;

        addForce();
        addForce();
    }

    // Button event listeners

    // Button event listeners

addButton.addEventListener("click", function () {
    addForce();
});

calculateButton.addEventListener("click", function () {
    calculate();
});

resetButton.addEventListener("click", function () {
    reset();
});

    forceInputs.addEventListener("click", function(event) {

        if (event.target.classList.contains("remove-force")) {

            event.target.closest(".force-row").remove();

            // Renumber remaining forces
            const rows = forceInputs.querySelectorAll(".force-row");

            rows.forEach((row, index) => {
                row.querySelector("label").textContent =
                    `Force ${index + 1} (N)`;
            });

            forceCount = rows.length;
        }
    });

    reset();

});
```
