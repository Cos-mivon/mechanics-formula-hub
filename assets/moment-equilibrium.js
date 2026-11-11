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

        const diagramGroup = document.getElementById("diagram-group");

        if (
            !forceInputs ||
            !addButton ||
            !calculateButton ||
            !resetButton ||
            !componentOutput ||
            !resultOutput ||
            !stepsOutput ||
            !diagramGroup
        ) {
            console.error("Moment calculator: HTML elements missing.");
            return;
        }

        const SVG_NS = "http://www.w3.org/2000/svg";

        const CENTER_X = 350;
        const CENTER_Y = 250;

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

        const TOLERANCE = 0.000001;

        let forceCount = 0;


        // CREATE SVG ELEMENT

        function createSVG(tag, attributes) {

            const element = document.createElementNS(SVG_NS, tag);

            Object.keys(attributes).forEach(function (key) {

                element.setAttribute(key, attributes[key]);

            });

            return element;
        }


        // ADD FORCE INPUT

        function addForce() {

            forceCount++;

            const row = document.createElement("div");

            row.className = "force-row";

            row.style.display = "grid";
            row.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
            row.style.gap = "10px";
            row.style.marginBottom = "18px";
            row.style.padding = "12px";
            row.style.border = "1px solid #304765";
            row.style.borderRadius = "10px";

            row.innerHTML = `

                <h3 style="grid-column:1/-1;">
                    Force ${forceCount}
                </h3>

                <div>
                    <label>Magnitude (N)</label>
                    <input type="number"
                           class="force-magnitude"
                           step="any"
                           min="0"
                           placeholder="100">
                </div>

                <div>
                    <label>Angle (°)</label>
                    <input type="number"
                           class="force-angle"
                           step="any"
                           placeholder="30">
                </div>

                <div>
                    <label>X-coordinate (m)</label>
                    <input type="number"
                           class="force-x"
                           step="any"
                           placeholder="2">
                </div>

                <div>
                    <label>Y-coordinate (m)</label>
                    <input type="number"
                           class="force-y"
                           step="any"
                           placeholder="1">
                </div>

                <button type="button"
                        class="remove-force back"
                        style="grid-column:1/-1;">
                    Remove Force
                </button>

            `;

            forceInputs.appendChild(row);
        }


        // RENUMBER FORCE INPUTS

        function renumberForces() {

            const rows = forceInputs.querySelectorAll(".force-row");

            rows.forEach(function (row, index) {

                row.querySelector("h3").textContent =
                    "Force " + (index + 1);

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


        // NORMALIZE ANGLE

        function normalizeAngle(angle) {

            let result = ((angle % 360) + 360) % 360;

            if (
                Math.abs(result) < TOLERANCE ||
                Math.abs(result - 360) < TOLERANCE
            ) {
                result = 0;
            }

            return result;
        }


        // CALCULATE MOMENTS

        function calculate() {

            const rows = forceInputs.querySelectorAll(".force-row");

            if (rows.length === 0) {

                alert("Please add at least one force.");
                return;
            }

            let totalMoment = 0;

            let forces = [];

            let steps = "";

            for (let i = 0; i < rows.length; i++) {

                const row = rows[i];

                const magnitudeInput =
                    row.querySelector(".force-magnitude");

                const angleInput =
                    row.querySelector(".force-angle");

                const xInput =
                    row.querySelector(".force-x");

                const yInput =
                    row.querySelector(".force-y");


                const values = [
                    magnitudeInput.value,
                    angleInput.value,
                    xInput.value,
                    yInput.value
                ];

                if (values.some(value => value.trim() === "")) {

                    alert("Please complete all inputs for every force.");
                    return;
                }

                const F = Number(magnitudeInput.value);

                const enteredAngle = Number(angleInput.value);

                const x = Number(xInput.value);

                const y = Number(yInput.value);

                if (
                    !Number.isFinite(F) ||
                    !Number.isFinite(enteredAngle) ||
                    !Number.isFinite(x) ||
                    !Number.isFinite(y) ||
                    F < 0
                ) {

                    alert("Please enter valid numerical values.");
                    return;
                }

                const angle = normalizeAngle(enteredAngle);

                const radians = angle * Math.PI / 180;


                // RESOLVE FORCE

                const Fx = F * Math.cos(radians);

                const Fy = F * Math.sin(radians);


                // MOMENT ABOUT ORIGIN

                const moment = x * Fy - y * Fx;

                totalMoment += moment;


                forces.push({

                    name: "F" + (i + 1),

                    magnitude: F,

                    angle: angle,

                    x: x,

                    y: y,

                    Fx: Math.abs(Fx) < TOLERANCE ? 0 : Fx,

                    Fy: Math.abs(Fy) < TOLERANCE ? 0 : Fy,

                    moment: Math.abs(moment) < TOLERANCE ? 0 : moment

                });


                // STEP-BY-STEP CALCULATION

                steps += `

                    <h3>Force ${i + 1}</h3>

                    <p>Given:</p>

                    <p>
                        F = ${F.toFixed(2)} N
                    </p>

                    <p>
                        θ = ${angle.toFixed(2)}°
                    </p>

                    <p>
                        Position = (${x.toFixed(2)}, ${y.toFixed(2)}) m
                    </p>

                    <p><b>Step 1: Resolve the force</b></p>

                    <p>
                        Fx = F cos θ
                    </p>

                    <p>
                        Fx = ${Fx.toFixed(2)} N
                    </p>

                    <p>
                        Fy = F sin θ
                    </p>

                    <p>
                        Fy = ${Fy.toFixed(2)} N
                    </p>

                    <p><b>Step 2: Calculate the moment</b></p>

                    <p>
                        M = xFy − yFx
                    </p>

                    <p>
                        M = (${x.toFixed(2)} × ${Fy.toFixed(2)})
                        − (${y.toFixed(2)} × ${Fx.toFixed(2)})
                    </p>

                    <p>
                        <b>M = ${moment.toFixed(2)} N·m</b>
                    </p>

                    <p>
                        Direction:
                        ${moment > TOLERANCE
                            ? "Anticlockwise (+)"
                            : moment < -TOLERANCE
                                ? "Clockwise (−)"
                                : "Zero moment"}
                    </p>

                    <hr>

                `;

            }


            // TOTAL MOMENT

            if (Math.abs(totalMoment) < TOLERANCE) {

                totalMoment = 0;

            }

            const equilibrium =
                Math.abs(totalMoment) < TOLERANCE;

            const balancingMoment = -totalMoment;


            // COMPONENT AND MOMENT TABLE

            componentOutput.innerHTML = forces.map(function (f) {

                return `

                    <tr>

                        <td>${f.name}</td>

                        <td>${f.Fx.toFixed(2)}</td>

                        <td>${f.Fy.toFixed(2)}</td>

                        <td style="color:${
                            f.moment >= 0 ? "#67dba0" : "#ff7979"
                        }">

                            ${f.moment.toFixed(2)}

                        </td>

                    </tr>

                `;

            }).join("") + `

                <tr>

                    <th>Total</th>

                    <th>—</th>

                    <th>—</th>

                    <th>${totalMoment.toFixed(2)}</th>

                </tr>

            `;


            // RESULTS

            resultOutput.innerHTML = `

                <p>
                    Total moment:
                    <b>${totalMoment.toFixed(2)} N·m</b>
                </p>

                <p>
                    Direction:
                    <b>
                        ${equilibrium
                            ? "Zero resultant moment"
                            : totalMoment > 0
                                ? "Anticlockwise"
                                : "Clockwise"}
                    </b>
                </p>

                <p>
                    Balancing moment required:
                    <b>${balancingMoment.toFixed(2)} N·m</b>
                </p>

                <p>
                    Rotational equilibrium:
                    <b style="color:${
                        equilibrium ? "#67dba0" : "#ff7979"
                    }">

                        ${equilibrium ? "YES" : "NO"}

                    </b>
                </p>

            `;


            // FINAL STEPS

            steps += `

                <h3>Final Result</h3>

                <p>
                    ΣM₀ = M₁ + M₂ + M₃ + ...
                </p>

                <p>
                    ΣM₀ = ${forces.map(f =>
                        "(" + f.moment.toFixed(2) + ")"
                    ).join(" + ")}
                </p>

                <p>
                    <b>
                        ΣM₀ = ${totalMoment.toFixed(2)} N·m
                    </b>
                </p>

                <p>
                    Rotational equilibrium condition:
                    ΣM₀ = 0
                </p>

                <p>
                    ${equilibrium
                        ? "The system satisfies rotational equilibrium."
                        : "The system does not satisfy rotational equilibrium."}
                </p>

                <p>
                    Required balancing moment:
                    ${balancingMoment.toFixed(2)} N·m
                </p>

            `;

            stepsOutput.innerHTML = steps;


            // DRAW DIAGRAM

            drawDiagram(forces);

        }


        // DRAW ARROWHEAD

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


        // DRAW MOMENT ARC

        function drawMomentArc(radius, moment, color, index) {

            if (Math.abs(moment) < TOLERANCE) return;

            const startAngle = 35;

            const endAngle = 325;

            const startRad = startAngle * Math.PI / 180;

            const endRad = endAngle * Math.PI / 180;

            const startX =
                CENTER_X + radius * Math.cos(startRad);

            const startY =
                CENTER_Y - radius * Math.sin(startRad);

            const endX =
                CENTER_X + radius * Math.cos(endRad);

            const endY =
                CENTER_Y - radius * Math.sin(endRad);

            const sweep = moment > 0 ? 0 : 1;

            const markerId = "moment-arrow-" + index;

            const defs = diagramGroup.querySelector("defs");

            addArrowMarker(defs, markerId, color);

            const arc = createSVG("path", {

                d: `
                    M ${startX} ${startY}
                    A ${radius} ${radius}
                    0 1 ${sweep}
                    ${endX} ${endY}
                `,

                fill: "none",

                stroke: color,

                "stroke-width": 2.5,

                "marker-end": "url(#" + markerId + ")"

            });

            diagramGroup.appendChild(arc);

            const label = createSVG("text", {

                x: CENTER_X,

                y: CENTER_Y - radius - 8,

                fill: color,

                "font-size": 11,

                "font-weight": "bold",

                "text-anchor": "middle",

                "paint-order": "stroke",

                stroke: "#081426",

                "stroke-width": 3

            });

            label.textContent =
                "M" + (index + 1) + ": " +
                moment.toFixed(1);

            diagramGroup.appendChild(label);

        }


        // DRAW COMPLETE DIAGRAM

        function drawDiagram(forces) {

            diagramGroup.innerHTML = "";

            const defs = createSVG("defs", {});

            diagramGroup.appendChild(defs);


            // FIND MAXIMUM POSITION

            let maxPosition = 1;

            forces.forEach(function (f) {

                maxPosition = Math.max(

                    maxPosition,

                    Math.abs(f.x),

                    Math.abs(f.y)

                );

            });


            const positionScale = Math.min(
                150 / maxPosition,
                45
            );


            // AXES

            const axisColor = "#91a8c2";

            const xAxis = createSVG("line", {

                x1: 45,

                y1: CENTER_Y,

                x2: 655,

                y2: CENTER_Y,

                stroke: axisColor,

                "stroke-width": 1.5

            });

            const yAxis = createSVG("line", {

                x1: CENTER_X,

                y1: 465,

                x2: CENTER_X,

                y2: 35,

                stroke: axisColor,

                "stroke-width": 1.5

            });

            diagramGroup.appendChild(xAxis);

            diagramGroup.appendChild(yAxis);


            // AXIS LABELS

            function addText(x, y, text) {

                const element = createSVG("text", {

                    x: x,

                    y: y,

                    fill: "white",

                    "font-size": 13

                });

                element.textContent = text;

                diagramGroup.appendChild(element);

            }

            addText(660, CENTER_Y - 5, "+X");

            addText(CENTER_X + 10, 32, "+Y");

            addText(25, CENTER_Y - 5, "−X");

            addText(CENTER_X + 10, 480, "−Y");


            // ORIGIN

            const origin = createSVG("circle", {

                cx: CENTER_X,

                cy: CENTER_Y,

                r: 5,

                fill: "white"

            });

            diagramGroup.appendChild(origin);

            addText(CENTER_X + 9, CENTER_Y + 17, "O");


            // MOMENT ARCS

            forces.forEach(function (f, index) {

                const radius = 42 + index * 12;

                drawMomentArc(

                    radius,

                    f.moment,

                    COLORS[index % COLORS.length],

                    index

                );

            });


            // FORCE VECTOR SCALE

            const maxForce = Math.max(

                1,

                ...forces.map(f => f.magnitude)

            );

            const forceScale = 100 / maxForce;


            // DRAW FORCES

            forces.forEach(function (f, index) {

                const color = COLORS[index % COLORS.length];


                // APPLICATION POINT

                const px = CENTER_X + f.x * positionScale;

                const py = CENTER_Y - f.y * positionScale;


                // POSITION LINE

                const positionLine = createSVG("line", {

                    x1: CENTER_X,

                    y1: CENTER_Y,

                    x2: px,

                    y2: py,

                    stroke: "#91a8c2",

                    "stroke-width": 1.2,

                    "stroke-dasharray": "5,5",

                    opacity: 0.6

                });

                diagramGroup.appendChild(positionLine);


                // FORCE VECTOR

                const angleRad = f.angle * Math.PI / 180;

                const vectorLength = f.magnitude * forceScale;

                const endX =
                    px + vectorLength * Math.cos(angleRad);

                const endY =
                    py - vectorLength * Math.sin(angleRad);


                const markerId = "force-arrow-" + index;

                addArrowMarker(defs, markerId, color);


                const forceLine = createSVG("line", {

                    x1: px,

                    y1: py,

                    x2: endX,

                    y2: endY,

                    stroke: color,

                    "stroke-width": 3,

                    "stroke-linecap": "round",

                    "marker-end": "url(#" + markerId + ")"

                });

                diagramGroup.appendChild(forceLine);


                // APPLICATION POINT MARKER

                const point = createSVG("circle", {

                    cx: px,

                    cy: py,

                    r: 4,

                    fill: color

                });

                diagramGroup.appendChild(point);


                // FORCE LABEL

                const forceLabel = createSVG("text", {

                    x: endX + 8,

                    y: endY - 8,

                    fill: color,

                    "font-size": 13,

                    "font-weight": "bold",

                    "paint-order": "stroke",

                    stroke: "#081426",

                    "stroke-width": 3

                });

                forceLabel.textContent =
                    f.name + " (" + f.angle.toFixed(0) + "°)";

                diagramGroup.appendChild(forceLabel);


                // POSITION LABEL

                const positionLabel = createSVG("text", {

                    x: px + 7,

                    y: py + 17,

                    fill: color,

                    "font-size": 10

                });

                positionLabel.textContent =
                    "(" + f.x + ", " + f.y + ")";

                diagramGroup.appendChild(positionLabel);

            });

        }


        // RESET

        function reset() {

            forceInputs.innerHTML = "";

            forceCount = 0;

            addForce();

            addForce();

            componentOutput.innerHTML = `

                <tr>

                    <td colspan="4">
                        Enter forces and calculate.
                    </td>

                </tr>

            `;

            resultOutput.innerHTML = `

                <p>Total moment: —</p>

                <p>Rotational equilibrium: —</p>

            `;

            stepsOutput.textContent =
                "Enter forces to see the solution.";

            diagramGroup.innerHTML = "";

        }


        // BUTTON EVENTS

        addButton.addEventListener("click", addForce);

        calculateButton.addEventListener("click", calculate);

        resetButton.addEventListener("click", reset);


        // INITIALIZE

        reset();

        console.log("Moment Equilibrium Calculator initialized.");

    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeCalculator
        );

    } else {

        initializeCalculator();

    }

})();
