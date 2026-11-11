(function () {
    "use strict";

    function initializeCalculator() {

        const forceInputs = document.getElementById("force-inputs");
        const addButton = document.getElementById("add-force");
        const calculateButton = document.getElementById("calculate");
        const resetButton = document.getElementById("reset");

        const componentOutput = document.getElementById("component-output");
        const resultOutput = document.getElementById("result-output");
        const stepsOutput = document.getElementById("steps-output");
        const vectorGroup = document.getElementById("vector-group");

        if (
            !forceInputs ||
            !addButton ||
            !calculateButton ||
            !resetButton ||
            !componentOutput ||
            !resultOutput ||
            !stepsOutput ||
            !vectorGroup
        ) {
            console.error("Calculator initialization failed: HTML elements missing.");
            return;
        }

        let forceCount = 0;

        const SVG_NS = "http://www.w3.org/2000/svg";

        const CENTER_X = 300;
        const CENTER_Y = 210;

        const COLORS = [
            "#ff7979",
            "#70bdff",
            "#ffd166",
            "#c792ea",
            "#67dba0",
            "#ff9f68",
            "#f28ab2",
            "#8ce0d0"
        ];

        // NORMALIZE ANGLE TO 0-360 DEGREES

        function normalizeAngle(angle) {
            let normalized = ((angle % 360) + 360) % 360;

            if (Math.abs(normalized - 360) < 0.000001) {
                normalized = 0;
            }

            return normalized;
        }

        // CREATE SVG ELEMENT

        function createSVG(tag, attributes) {

            const element = document.createElementNS(SVG_NS, tag);

            Object.keys(attributes).forEach(function (key) {
                element.setAttribute(key, attributes[key]);
            });

            return element;
        }

        // ADD FORCE

        function addForce() {

            forceCount++;

            const row = document.createElement("div");
            row.className = "force-row";

            row.innerHTML = `
                <div>
                    <label>Force ${forceCount} (N)</label>
                    <input type="number"
                        step="any"
                        min="0"
                        class="force-magnitude"
                        placeholder="Magnitude">
                </div>

                <div>
                    <label>Angle (°)</label>
                    <input type="number"
                        step="any"
                        class="force-angle"
                        placeholder="Angle">
                </div>

                <button type="button" class="remove-force">
                    Remove
                </button>
            `;

            forceInputs.appendChild(row);
        }

        // RENUMBER FORCES

        function renumberForces() {

            const rows = forceInputs.querySelectorAll(".force-row");

            rows.forEach(function (row, index) {

                row.querySelector("label").textContent =
                    "Force " + (index + 1) + " (N)";

            });

            forceCount = rows.length;
        }

        // REMOVE FORCE

        forceInputs.addEventListener("click", function (event) {

            if (event.target.classList.contains("remove-force")) {

                event.target.closest(".force-row").remove();

                renumberForces();
            }

        });

        // CALCULATE RESULTANT

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
                const enteredAngle = Number(angleInput.value);

                if (
                    magnitudeInput.value.trim() === "" ||
                    angleInput.value.trim() === "" ||
                    !Number.isFinite(magnitude) ||
                    !Number.isFinite(enteredAngle) ||
                    magnitude < 0
                ) {

                    alert("Please enter valid values for every force.");
                    return;
                }

                // All displayed angles use the 0-360 degree convention.

                const angle = normalizeAngle(enteredAngle);

                const radians = angle * Math.PI / 180;

                const fx = magnitude * Math.cos(radians);
                const fy = magnitude * Math.sin(radians);

                sumX += fx;
                sumY += fy;

                components.push({
                    name: "F" + (i + 1),
                    magnitude: magnitude,
                    angle: angle,
                    fx: fx,
                    fy: fy
                });

                steps += `
                    <h4>Force ${i + 1}</h4>

                    <p>Given angle = ${enteredAngle}°</p>
                    <p>Standard angle from +X = ${angle.toFixed(2)}°</p>

                    <p>Fx = F cos θ</p>
                    <p>Fx = ${magnitude} × cos(${angle.toFixed(2)}°)</p>
                    <p>Fx = ${fx.toFixed(2)} N</p>

                    <p>Fy = F sin θ</p>
                    <p>Fy = ${magnitude} × sin(${angle.toFixed(2)}°)</p>
                    <p>Fy = ${fy.toFixed(2)} N</p>

                    <hr>
                `;
            }

            // RESULTANT

            const resultant = Math.hypot(sumX, sumY);

            const tolerance = 0.000001;

            const equilibrium = resultant < tolerance;

            let direction = Math.atan2(sumY, sumX) * 180 / Math.PI;

            direction = normalizeAngle(direction);

            const balancingDirection = normalizeAngle(direction + 180);

            // COMPONENT TABLE

            componentOutput.innerHTML = components.map(function (c) {

                return `
                    <tr>
                        <td>${c.name}</td>
                        <td>${c.magnitude.toFixed(2)}</td>
                        <td>${c.angle.toFixed(2)}°</td>
                        <td>${c.fx.toFixed(2)}</td>
                        <td>${c.fy.toFixed(2)}</td>
                    </tr>
                `;

            }).join("") + `
                <tr>
                    <th>Σ</th>
                    <th>—</th>
                    <th>—</th>
                    <th>${sumX.toFixed(2)}</th>
                    <th>${sumY.toFixed(2)}</th>
                </tr>
            `;

            // FINAL RESULT

            resultOutput.innerHTML = `

                <p>ΣFx = <b>${sumX.toFixed(2)} N</b></p>

                <p>ΣFy = <b>${sumY.toFixed(2)} N</b></p>

                <p>Resultant = <b>${resultant.toFixed(2)} N</b></p>

                <p>Direction =
                    <b>${equilibrium ? "Undefined" : direction.toFixed(2) + "° from +X"}</b>
                </p>

                <p>Balancing force =
                    <b>${resultant.toFixed(2)} N</b>
                </p>

                <p>Balancing direction =
                    <b>${equilibrium ? "Not required" : balancingDirection.toFixed(2) + "° from +X"}</b>
                </p>

                <p>Equilibrium =
                    <b style="color:${equilibrium ? "#67dba0" : "#ff7777"}">
                        ${equilibrium ? "YES" : "NO"}
                    </b>
                </p>

            `;

            // STEP-BY-STEP SOLUTION

            steps += `

                <h3>Resultant Force</h3>

                <p>ΣFx = ${sumX.toFixed(2)} N</p>

                <p>ΣFy = ${sumY.toFixed(2)} N</p>

                <p>R = √[(ΣFx)² + (ΣFy)²]</p>

                <p>
                    R = √[(${sumX.toFixed(2)})² +
                    (${sumY.toFixed(2)})²]
                </p>

                <p><b>R = ${resultant.toFixed(2)} N</b></p>

                <p>Direction = atan2(ΣFy, ΣFx)</p>

                <p>
                    <b>
                    ${equilibrium ? "Undefined" : direction.toFixed(2) + "° anticlockwise from +X"}
                    </b>
                </p>

            `;

            stepsOutput.innerHTML = steps;

            drawDiagram(components, sumX, sumY, resultant, direction, equilibrium);
        }

        // CREATE AN ARROWHEAD MARKER

        function addArrowMarker(defs, id, color) {

            const marker = createSVG("marker", {
                id: id,
                markerWidth: 10,
                markerHeight: 10,
                refX: 8,
                refY: 4,
                orient: "auto",
                markerUnits: "userSpaceOnUse"
            });

            const arrow = createSVG("path", {
                d: "M0,0 L0,8 L8,4 Z",
                fill: color
            });

            marker.appendChild(arrow);
            defs.appendChild(marker);
        }

        // DRAW ANGLE ARC FROM POSITIVE X-AXIS

        function drawAngleArc(radius, angle, color, label, index) {

            const radians = angle * Math.PI / 180;

            const endX = CENTER_X + radius * Math.cos(radians);
            const endY = CENTER_Y - radius * Math.sin(radians);

            const middleAngle = angle / 2;
            const middleRadians = middleAngle * Math.PI / 180;

            const labelRadius = radius + 13;

            const labelX =
                CENTER_X + labelRadius * Math.cos(middleRadians);

            const labelY =
                CENTER_Y - labelRadius * Math.sin(middleRadians);

            // A zero-degree angle has no visible arc.

            if (angle > 0.001) {

                const largeArc = angle > 180 ? 1 : 0;

                const arc = createSVG("path", {
                    d: `
                        M ${CENTER_X + radius} ${CENTER_Y}
                        A ${radius} ${radius} 0 ${largeArc} 0 ${endX} ${endY}
                    `,
                    fill: "none",
                    stroke: color,
                    "stroke-width": 1.8,
                    opacity: 0.9
                });

                vectorGroup.appendChild(arc);
            }

            const angleLabel = createSVG("text", {
                x: labelX,
                y: labelY,
                fill: color,
                "font-size": 11,
                "font-weight": "bold",
                "text-anchor": "middle"
            });

            angleLabel.textContent =
                label + " " + angle.toFixed(1) + "°";

            vectorGroup.appendChild(angleLabel);
        }

        // DRAW FORCE DIAGRAM

        function drawDiagram(
            components,
            sumX,
            sumY,
            resultant,
            direction,
            equilibrium
        ) {

            vectorGroup.innerHTML = "";

            const defs = createSVG("defs", {});
            vectorGroup.appendChild(defs);

            const maxValue = Math.max(
                1,
                ...components.map(function (c) {
                    return Math.hypot(c.fx, c.fy);
                }),
                resultant
            );

            const scale = 145 / maxValue;

            // DRAW ANGLE ARCS FIRST

            components.forEach(function (c, index) {

                const color = COLORS[index % COLORS.length];

                const radius = 28 + (index % 5) * 9;

                drawAngleArc(
                    radius,
                    c.angle,
                    color,
                    c.name,
                    index
                );
            });

            // DRAW FORCE VECTORS

            components.forEach(function (c, index) {

                const color = COLORS[index % COLORS.length];

                const x = CENTER_X + c.fx * scale;
                const y = CENTER_Y - c.fy * scale;

                const markerId = "force-arrow-" + index;

                addArrowMarker(defs, markerId, color);

                const line = createSVG("line", {
                    x1: CENTER_X,
                    y1: CENTER_Y,
                    x2: x,
                    y2: y,
                    stroke: color,
                    "stroke-width": 3,
                    "stroke-linecap": "round",
                    "marker-end": "url(#" + markerId + ")"
                });

                vectorGroup.appendChild(line);

                // FORCE LABEL

                const labelX = x + (c.fx >= 0 ? 9 : -9);
                const labelY = y + (c.fy >= 0 ? -9 : 15);

                const label = createSVG("text", {
                    x: labelX,
                    y: labelY,
                    fill: color,
                    "font-size": 13,
                    "font-weight": "bold",
                    "text-anchor": c.fx >= 0 ? "start" : "end"
                });

                label.textContent = c.name;

                vectorGroup.appendChild(label);
            });

            // DRAW RESULTANT VECTOR

            if (!equilibrium) {

                const resultX = CENTER_X + sumX * scale;
                const resultY = CENTER_Y - sumY * scale;

                addArrowMarker(defs, "resultant-arrow", "#67dba0");

                const resultantLine = createSVG("line", {
                    x1: CENTER_X,
                    y1: CENTER_Y,
                    x2: resultX,
                    y2: resultY,
                    stroke: "#67dba0",
                    "stroke-width": 4,
                    "stroke-dasharray": "7,4",
                    "stroke-linecap": "round",
                    "marker-end": "url(#resultant-arrow)"
                });

                vectorGroup.appendChild(resultantLine);

                const resultantLabel = createSVG("text", {
                    x: resultX + (sumX >= 0 ? 10 : -10),
                    y: resultY + (sumY >= 0 ? -10 : 16),
                    fill: "#67dba0",
                    "font-size": 15,
                    "font-weight": "bold",
                    "text-anchor": sumX >= 0 ? "start" : "end"
                });

                resultantLabel.textContent = "R";

                vectorGroup.appendChild(resultantLabel);

                // RESULTANT ANGLE ARC

                drawAngleArc(
                    88,
                    direction,
                    "#67dba0",
                    "R",
                    0
                );
            }
        }

        // RESET

        function reset() {

            forceInputs.innerHTML = "";

            forceCount = 0;

            componentOutput.innerHTML = `
                <tr>
                    <td colspan="5">Enter forces and calculate.</td>
                </tr>
            `;

            resultOutput.innerHTML = `
                <p>Resultant force: —</p>
                <p>Direction: —</p>
                <p>Balancing force: —</p>
                <p>Equilibrium: —</p>
            `;

            stepsOutput.textContent =
                "Enter forces to see the solution.";

            vectorGroup.innerHTML = "";

            addForce();
            addForce();
        }

        // BUTTON EVENTS

        addButton.addEventListener("click", function () {
            addForce();
        });

        calculateButton.addEventListener("click", function () {
            calculate();
        });

        resetButton.addEventListener("click", function () {
            reset();
        });

        // INITIALIZE

        reset();

        console.log("2D Equilibrium Calculator initialized successfully.");
    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", initializeCalculator);

    } else {

        initializeCalculator();
    }

})();

