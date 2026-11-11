(() => {
    "use strict";

    const ids = ["f1", "f2", "f3", "alpha", "beta", "gamma"];

    const fields = ids.map(id => document.getElementById(id));

    const countOutput = document.getElementById("input-count");
    const messageOutput = document.getElementById("input-message");
    const resultOutput = document.getElementById("result-output");
    const statusOutput = document.getElementById("equilibrium-status");
    const stepsOutput = document.getElementById("steps-output");

    const calculateButton = document.getElementById("calculate");
    const resetButton = document.getElementById("reset");

    const concurrentGroup = document.getElementById("concurrent-group");
    const triangleGroup = document.getElementById("triangle-group");

    if (
        fields.some(field => !field) ||
        !calculateButton ||
        !resetButton ||
        !concurrentGroup ||
        !triangleGroup
    ) {
        console.error("Lami's Theorem Solver: Required HTML elements are missing.");
        return;
    }

    const DEG = Math.PI / 180;
    const RAD = 180 / Math.PI;
    const EPS = 0.0001;

    let lastSolution = null;

    // --------------------------------------------------
    // BASIC HELPERS
    // --------------------------------------------------

    function sin(angle) {
        return Math.sin(angle * DEG);
    }

    function cos(angle) {
        return Math.cos(angle * DEG);
    }

    function format(value, digits = 2) {
        return Number(value).toFixed(digits);
    }

    function clearDiagrams() {
        concurrentGroup.innerHTML = "";
        triangleGroup.innerHTML = "";
    }

    function showError(message) {
        messageOutput.textContent = message;

        resultOutput.innerHTML = "<p>Unable to calculate.</p>";
        statusOutput.textContent = "Equilibrium status: Not verified";
        stepsOutput.innerHTML = "<p>Please correct the inputs and try again.</p>";

        clearDiagrams();
        lastSolution = null;
    }

    function getValues() {
        return fields.map(field => {
            const value = field.value.trim();

            if (value === "") return null;

            const number = Number(value);

            return Number.isFinite(number) ? number : NaN;
        });
    }

    function countKnown(values) {
        return values.filter(value => value !== null).length;
    }

    function updateCount() {
        const values = getValues();
        const count = countKnown(values);

        countOutput.textContent =
            `Known values: ${count} / 3 minimum`;

        if (count < 3) {
            messageOutput.textContent =
                `Enter ${3 - count} more known value(s).`;
        } else if (count === 3) {
            messageOutput.textContent =
                "Ready to calculate.";
        } else {
            messageOutput.textContent =
                "Additional values will help verify the result or resolve ambiguity.";
        }
    }

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    function validateValues(values) {
        if (values.some(value => Number.isNaN(value))) {
            return "Please enter valid numerical values.";
        }

        if (countKnown(values) < 3) {
            return "Please enter at least three known values.";
        }

        for (let i = 0; i < 3; i++) {
            if (values[i] !== null && values[i] <= 0) {
                return "Force magnitudes must be greater than zero.";
            }
        }

        for (let i = 3; i < 6; i++) {
            if (values[i] !== null && (values[i] <= 0 || values[i] >= 180)) {
                return "Angles must be greater than 0° and less than 180°.";
            }
        }

        return null;
    }

    // --------------------------------------------------
    // SOLVER 1: THREE KNOWN FORCES
    // --------------------------------------------------

    function solveThreeForces(values) {
        const F = values.slice(0, 3);

        const [F1, F2, F3] = F;

        if (
            F1 + F2 <= F3 ||
            F1 + F3 <= F2 ||
            F2 + F3 <= F1
        ) {
            return [];
        }

        function angleOpposite(a, b, c) {
            const value =
                (b * b + c * c - a * a) / (2 * b * c);

            const safeValue = Math.max(-1, Math.min(1, value));

            return Math.acos(safeValue) * RAD;
        }

        const alpha = angleOpposite(F1, F2, F3);
        const beta = angleOpposite(F2, F1, F3);
        const gamma = angleOpposite(F3, F1, F2);

        return [{
            F1,
            F2,
            F3,
            alpha,
            beta,
            gamma
        }];
    }

    // --------------------------------------------------
    // SOLVER 2: TWO KNOWN ANGLES AND ONE KNOWN FORCE
    // --------------------------------------------------

    function solveTwoAnglesOneForce(values) {
        const angles = values.slice(3, 6);

        const knownAngles = [];

        for (let i = 0; i < 3; i++) {
            if (angles[i] !== null) {
                knownAngles.push(i);
            }
        }

        const knownForceIndex = values.slice(0, 3)
            .findIndex(value => value !== null);

        const knownForce = values[knownForceIndex];

        const missingAngleIndex =
            [0, 1, 2].find(i => !knownAngles.includes(i));

        const resultAngles = [...angles];

        resultAngles[missingAngleIndex] =
            180 - angles[knownAngles[0]] - angles[knownAngles[1]];

        if (resultAngles[missingAngleIndex] <= 0) {
            return [];
        }

        const knownAngle = resultAngles[knownForceIndex];

        const ratio = knownForce / sin(knownAngle);

        const forces = resultAngles.map(angle => ratio * sin(angle));

        return [{
            F1: forces[0],
            F2: forces[1],
            F3: forces[2],
            alpha: resultAngles[0],
            beta: resultAngles[1],
            gamma: resultAngles[2]
        }];
    }

    // --------------------------------------------------
    // SOLVER 3: TWO KNOWN FORCES AND ONE KNOWN ANGLE
    // --------------------------------------------------

    function solveTwoForcesOneAngle(values) {
        const forceIndexes = [];
        const angleIndex = values.slice(3, 6)
            .findIndex(value => value !== null);

        for (let i = 0; i < 3; i++) {
            if (values[i] !== null) {
                forceIndexes.push(i);
            }
        }

        const p = forceIndexes[0];
        const q = forceIndexes[1];

        const knownAngle = values[3 + angleIndex];

        const unknownIndexes =
            [0, 1, 2].filter(i => i !== angleIndex);

        const i = unknownIndexes[0];
        const j = unknownIndexes[1];

        const remaining = 180 - knownAngle;

        if (remaining <= 0) return [];

        const knownForces = values;

        function residual(x) {
            const angles = [];

            angles[angleIndex] = knownAngle;
            angles[i] = x;
            angles[j] = remaining - x;

            return (
                knownForces[p] * sin(angles[q]) -
                knownForces[q] * sin(angles[p])
            );
        }

        const roots = [];
        const steps = 2000;
        const low = EPS;
        const high = remaining - EPS;

        let previousX = low;
        let previousY = residual(previousX);

        for (let step = 1; step <= steps; step++) {
            const x = low + (high - low) * step / steps;
            const y = residual(x);

            if (Math.abs(y) < 1e-9) {
                roots.push(x);
            }

            if (
                Number.isFinite(previousY) &&
                Number.isFinite(y) &&
                previousY * y < 0
            ) {
                let left = previousX;
                let right = x;
                let leftValue = previousY;

                for (let n = 0; n < 60; n++) {
                    const middle = (left + right) / 2;
                    const middleValue = residual(middle);

                    if (leftValue * middleValue <= 0) {
                        right = middle;
                    } else {
                        left = middle;
                        leftValue = middleValue;
                    }
                }

                roots.push((left + right) / 2);
            }

            previousX = x;
            previousY = y;
        }

        const uniqueRoots = [];

        roots.forEach(root => {
            if (
                !uniqueRoots.some(existing =>
                    Math.abs(existing - root) < 0.01
                )
            ) {
                uniqueRoots.push(root);
            }
        });

        return uniqueRoots.map(root => {
            const angles = [];

            angles[angleIndex] = knownAngle;
            angles[i] = root;
            angles[j] = remaining - root;

            const ratio =
                knownForces[p] / sin(angles[p]);

            const forces = angles.map(angle => ratio * sin(angle));

            return {
                F1: forces[0],
                F2: forces[1],
                F3: forces[2],
                alpha: angles[0],
                beta: angles[1],
                gamma: angles[2]
            };
        });
    }

    // --------------------------------------------------
    // GENERATE POSSIBLE SOLUTIONS FROM ANY THREE INPUTS
    // --------------------------------------------------

    function combinations(array, size) {
        const result = [];

        function build(start, current) {
            if (current.length === size) {
                result.push([...current]);
                return;
            }

            for (let i = start; i < array.length; i++) {
                current.push(array[i]);
                build(i + 1, current);
                current.pop();
            }
        }

        build(0, []);
        return result;
    }

    function solveFromThree(selectedIndexes, values) {
        const subset = Array(6).fill(null);

        selectedIndexes.forEach(index => {
            subset[index] = values[index];
        });

        const forceCount = subset.slice(0, 3)
            .filter(value => value !== null).length;

        const angleCount = subset.slice(3, 6)
            .filter(value => value !== null).length;

        if (forceCount === 3) {
            return solveThreeForces(subset);
        }

        if (forceCount === 1 && angleCount === 2) {
            return solveTwoAnglesOneForce(subset);
        }

        if (forceCount === 2 && angleCount === 1) {
            return solveTwoForcesOneAngle(subset);
        }

        return [];
    }

    function matchesKnownValues(solution, values) {
        const result = [
            solution.F1,
            solution.F2,
            solution.F3,
            solution.alpha,
            solution.beta,
            solution.gamma
        ];

        for (let i = 0; i < 6; i++) {
            if (values[i] === null) continue;

            const expected = values[i];
            const actual = result[i];

            if (i < 3) {
                const tolerance =
                    Math.max(0.02, Math.abs(expected) * 0.001);

                if (Math.abs(actual - expected) > tolerance) {
                    return false;
                }
            } else {
                if (Math.abs(actual - expected) > 0.05) {
                    return false;
                }
            }
        }

        return true;
    }

    function sameSolution(a, b) {
        return (
            Math.abs(a.alpha - b.alpha) < 0.05 &&
            Math.abs(a.beta - b.beta) < 0.05 &&
            Math.abs(a.gamma - b.gamma) < 0.05 &&
            Math.abs(a.F1 - b.F1) < 0.05 &&
            Math.abs(a.F2 - b.F2) < 0.05 &&
            Math.abs(a.F3 - b.F3) < 0.05
        );
    }

    function findSolutions(values) {
        const knownIndexes = [];

        values.forEach((value, index) => {
            if (value !== null) knownIndexes.push(index);
        });

        const groups = combinations(knownIndexes, 3);
        const solutions = [];

        groups.forEach(group => {
            const possible = solveFromThree(group, values);

            possible.forEach(solution => {
                if (!matchesKnownValues(solution, values)) {
                    return;
                }

                if (!solutions.some(existing =>
                    sameSolution(existing, solution)
                )) {
                    solutions.push(solution);
                }
            });
        });

        return solutions;
    }

    // --------------------------------------------------
    // MAIN CALCULATION
    // --------------------------------------------------

    function calculate() {
        const values = getValues();

        const error = validateValues(values);

        if (error) {
            showError(error);
            return;
        }

        const solutions = findSolutions(values);

        if (solutions.length === 0) {
            showError(
                "These values do not produce a valid equilibrium triangle. Check the values and try again."
            );
            return;
        }

        if (solutions.length > 1) {
            showAmbiguousSolutions(solutions);
            return;
        }

        const solution = solutions[0];

        lastSolution = solution;

        messageOutput.textContent = "Calculation completed successfully.";

        displayResults(solution);
        displaySteps(solution, values);
        drawConcurrentDiagram(solution);
        drawTriangleDiagram(solution);
        displayEquilibriumStatus(solution);
    }

    // --------------------------------------------------
    // DISPLAY RESULTS
    // --------------------------------------------------

    function displayResults(s) {
        resultOutput.innerHTML = `
            <div class="formula">
                <strong>Forces</strong><br>
                F₁ = ${format(s.F1)} N<br>
                F₂ = ${format(s.F2)} N<br>
                F₃ = ${format(s.F3)} N
            </div>

            <div class="formula">
                <strong>Angles</strong><br>
                α = ${format(s.alpha)}°<br>
                β = ${format(s.beta)}°<br>
                γ = ${format(s.gamma)}°
            </div>

            <div class="formula">
                <strong>Angle check</strong><br>
                ${format(s.alpha)}° +
                ${format(s.beta)}° +
                ${format(s.gamma)}° =
                ${format(s.alpha + s.beta + s.gamma)}°
            </div>
        `;
    }

    // --------------------------------------------------
    // EQUILIBRIUM VERIFICATION
    // --------------------------------------------------

    function displayEquilibriumStatus(s) {
        const F1x = s.F1;
        const F1y = 0;

        const angle2 = 180 - s.gamma;
        const angle3 = 180 + s.beta;

        const F2x = s.F2 * cos(angle2);
        const F2y = s.F2 * sin(angle2);

        const F3x = s.F3 * cos(angle3);
        const F3y = s.F3 * sin(angle3);

        const sumX = F1x + F2x + F3x;
        const sumY = F1y + F2y + F3y;

        const residual = Math.sqrt(sumX * sumX + sumY * sumY);

        const tolerance =
            0.001 * Math.max(s.F1, s.F2, s.F3);

        if (residual <= tolerance) {
            statusOutput.innerHTML = `
                <strong>Equilibrium verified ✓</strong><br>
                ΣFx ≈ 0 N<br>
                ΣFy ≈ 0 N<br>
                Resultant force ≈ ${format(residual, 4)} N
            `;
        } else {
            statusOutput.innerHTML = `
                <strong>Equilibrium check failed</strong><br>
                Resultant force = ${format(residual)} N
            `;
        }
    }

    // --------------------------------------------------
    // STEP-BY-STEP SOLUTION
    // --------------------------------------------------

    function displaySteps(s, values) {
        const ratio1 = s.F1 / sin(s.alpha);
        const ratio2 = s.F2 / sin(s.beta);
        const ratio3 = s.F3 / sin(s.gamma);

        stepsOutput.innerHTML = `
            <div class="example">

                <h3>Step 1 — Identify the known values</h3>

                <p>
                    We use the given force and angle values
                    to determine the remaining unknowns.
                </p>

                <h3>Step 2 — Apply Lami's Theorem</h3>

                <div class="formula">
                    F₁ / sin α = F₂ / sin β = F₃ / sin γ
                </div>

                <h3>Step 3 — Calculated force values</h3>

                <p>
                    F₁ = ${format(s.F1)} N<br>
                    F₂ = ${format(s.F2)} N<br>
                    F₃ = ${format(s.F3)} N
                </p>

                <h3>Step 4 — Calculated angles</h3>

                <p>
                    α = ${format(s.alpha)}°<br>
                    β = ${format(s.beta)}°<br>
                    γ = ${format(s.gamma)}°
                </p>

                <h3>Step 5 — Verify the angle sum</h3>

                <div class="formula">
                    α + β + γ = 180°<br>
                    ${format(s.alpha)}° +
                    ${format(s.beta)}° +
                    ${format(s.gamma)}° =
                    ${format(s.alpha + s.beta + s.gamma)}°
                </div>

                <h3>Step 6 — Verify Lami's Theorem</h3>

                <div class="formula">
                    F₁ / sin α = ${format(ratio1)}<br>
                    F₂ / sin β = ${format(ratio2)}<br>
                    F₃ / sin γ = ${format(ratio3)}
                </div>

                <p>
                    All three ratios are approximately equal.
                    Therefore, the given values satisfy Lami's theorem.
                </p>

            </div>
        `;
    }

    // --------------------------------------------------
    // SVG HELPERS
    // --------------------------------------------------

    function addArrowMarker(group, id) {
        const svg = group.ownerSVGElement;
        const defs = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "defs"
        );

        defs.innerHTML = `
            <marker id="${id}"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="4"
                    orient="auto"
                    markerUnits="strokeWidth">
                <path d="M0,0 L8,4 L0,8 Z" fill="#66d9ff"/>
            </marker>
        `;

        svg.appendChild(defs);
    }

    function svgElement(tag, attributes, parent) {
        const element = document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag
        );

        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });

        parent.appendChild(element);

        return element;
    }

    function svgText(parent, x, y, text, size = 17) {
        const element = svgElement("text", {
            x,
            y,
            fill: "#edf4ff",
            "font-size": size,
            "font-weight": "bold",
            "text-anchor": "middle"
        }, parent);

        element.textContent = text;

        return element;
    }

    // --------------------------------------------------
    // CONCURRENT FORCE DIAGRAM
    // --------------------------------------------------

    function drawConcurrentDiagram(s) {
        concurrentGroup.innerHTML = "";

        addArrowMarker(concurrentGroup, "lami-arrow");

        const cx = 300;
        const cy = 215;

        const maxForce = Math.max(s.F1, s.F2, s.F3);
        const scale = 145 / maxForce;

        const directions = [
            0,
            180 - s.gamma,
            180 + s.beta
        ];

        const forces = [s.F1, s.F2, s.F3];

        svgElement("line", {
            x1: 55, y1: cy,
            x2: 545, y2: cy,
            stroke: "#536b89",
            "stroke-width": 1.5,
            "stroke-dasharray": "5 6"
        }, concurrentGroup);

        svgElement("line", {
            x1: cx, y1: 35,
            x2: cx, y2: 395,
            stroke: "#536b89",
            "stroke-width": 1.5,
            "stroke-dasharray": "5 6"
        }, concurrentGroup);

        svgText(concurrentGroup, 555, cy + 5, "+X", 13);
        svgText(concurrentGroup, cx + 18, 30, "+Y", 13);

        forces.forEach((force, index) => {
            const angle = directions[index];

            const length = force * scale;

            const radians = angle * DEG;

            const x2 = cx + length * Math.cos(radians);
            const y2 = cy - length * Math.sin(radians);

            svgElement("line", {
                x1: cx,
                y1: cy,
                x2,
                y2,
                stroke: "#66d9ff",
                "stroke-width": 3,
                "marker-end": "url(#lami-arrow)"
            }, concurrentGroup);

            const labelX = cx + (length + 28) * Math.cos(radians);
            const labelY = cy - (length + 28) * Math.sin(radians);

            svgText(
                concurrentGroup,
                labelX,
                labelY,
                `F${index + 1} = ${format(force)} N`,
                14
            );
        });

        svgElement("circle", {
            cx,
            cy,
            r: 5,
            fill: "#ffffff"
        }, concurrentGroup);

        svgText(concurrentGroup, cx + 15, cy + 22, "O", 14);

        svgText(
            concurrentGroup,
            300,
            410,
            `Angles: ${format(180 - s.alpha)}°, ${format(180 - s.beta)}°, ${format(180 - s.gamma)}°`,
            13
        );
    }

    // --------------------------------------------------
    // TRIANGLE OF FORCES
    // --------------------------------------------------

    function drawTriangleDiagram(s) {
        triangleGroup.innerHTML = "";

        addArrowMarker(triangleGroup, "triangle-arrow");

        const A = { x: 0, y: 0 };

        const B = { x: s.F1, y: 0 };

        const angle2 = (180 - s.gamma) * DEG;

        const C = {
            x: B.x + s.F2 * Math.cos(angle2),
            y: B.y + s.F2 * Math.sin(angle2)
        };

        const points = [A, B, C];

        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));

        const width = Math.max(maxX - minX, 1);
        const height = Math.max(maxY - minY, 1);

        const scale = Math.min(
            440 / width,
            260 / height
        );

        const offsetX = (600 - width * scale) / 2;
        const offsetY = (430 + height * scale) / 2;

        function transform(point) {
            return {
                x: offsetX + (point.x - minX) * scale,
                y: offsetY - (point.y - minY) * scale
            };
        }

        const pA = transform(A);
        const pB = transform(B);
        const pC = transform(C);

        const vectors = [
            [pA, pB, `F₁ = ${format(s.F1)} N`],
            [pB, pC, `F₂ = ${format(s.F2)} N`],
            [pC, pA, `F₃ = ${format(s.F3)} N`]
        ];

        vectors.forEach(([start, end, label]) => {
            svgElement("line", {
                x1: start.x,
                y1: start.y,
                x2: end.x,
                y2: end.y,
                stroke: "#66d9ff",
                "stroke-width": 3,
                "marker-end": "url(#triangle-arrow)"
            }, triangleGroup);

            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            svgText(
                triangleGroup,
                midX,
                midY - 13,
                label,
                14
            );
        });

        svgText(triangleGroup, pA.x - 15, pA.y + 22, "A", 15);
        svgText(triangleGroup, pB.x + 15, pB.y + 22, "B", 15);
        svgText(triangleGroup, pC.x, pC.y - 18, "C", 15);

        svgText(
            triangleGroup,
            pA.x + 45,
            pA.y - 12,
            `β = ${format(s.beta)}°`,
            14
        );

        svgText(
            triangleGroup,
            pB.x - 45,
            pB.y - 12,
            `γ = ${format(s.gamma)}°`,
            14
        );

        svgText(
            triangleGroup,
            pC.x,
            pC.y + 22,
            `α = ${format(s.alpha)}°`,
            14
        );
    }

    // --------------------------------------------------
    // AMBIGUOUS SOLUTIONS
    // --------------------------------------------------

    function showAmbiguousSolutions(solutions) {
        lastSolution = null;
        clearDiagrams();

        messageOutput.textContent =
            "More than one valid solution is possible.";

        resultOutput.innerHTML = `
            <p><strong>${solutions.length} possible solutions found.</strong></p>

            ${solutions.map((s, index) => `
                <div class="formula">
                    <strong>Possible solution ${index + 1}</strong><br>
                    F₁ = ${format(s.F1)} N<br>
                    F₂ = ${format(s.F2)} N<br>
                    F₃ = ${format(s.F3)} N<br>
                    α = ${format(s.alpha)}°<br>
                    β = ${format(s.beta)}°<br>
                    γ = ${format(s.gamma)}°
                </div>
            `).join("")}

            <p class="small">
                Enter one additional known value to identify
                the correct solution.
            </p>
        `;

        statusOutput.textContent =
            "Equilibrium: Multiple possible configurations.";

        stepsOutput.innerHTML = `
            <p>
                The given three values allow more than one valid
                triangle of forces. An additional known value
                is needed to select the correct solution.
            </p>
        `;
    }

    // --------------------------------------------------
    // RESET
    // --------------------------------------------------

    function resetCalculator() {
        fields.forEach(field => {
            field.value = "";
        });

        resultOutput.innerHTML =
            "<p>Enter three known values and calculate.</p>";

        statusOutput.textContent =
            "Equilibrium status: —";

        stepsOutput.innerHTML =
            "<p>Calculation steps will appear here.</p>";

        messageOutput.textContent =
            "Enter exactly three known values to begin.";

        countOutput.textContent =
            "Known values: 0 / 3 minimum";

        clearDiagrams();

        lastSolution = null;
    }

    // --------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------

    fields.forEach(field => {
        field.addEventListener("input", updateCount);
    });

    calculateButton.addEventListener("click", calculate);

    resetButton.addEventListener("click", resetCalculator);

    updateCount();

})();
