
(function () {
  function initializeCoplanarModel() {
    const root = document.getElementById("coplanar-model");

    if (!root || root.dataset.initialized === "true") return;

    const get = id => root.querySelector("#" + id);

    const fxInput = get("coplanar-fx");
    const fyInput = get("coplanar-fy");
    const vectors = get("coplanar-vectors");
    const resetButton = get("cp-reset");

    if (!fxInput || !fyInput || !vectors || !resetButton) return;

    root.dataset.initialized = "true";

    function updateModel() {
      const fx = Number(fxInput.value);
      const fy = Number(fyInput.value);

      if (
        !Number.isFinite(fx) ||
        !Number.isFinite(fy) ||
        fx < 0 || fy < 0 ||
        fx > 10000 || fy > 10000
      ) {
        return;
      }

      const magnitude = Math.hypot(fx, fy);

      const angle = magnitude === 0
        ? 0
        : Math.atan2(fy, fx) * 180 / Math.PI;

      const scale = 155 / Math.max(fx, fy, magnitude, 1);

      const ox = 300;
      const oy = 210;

      const x1 = ox + fx * scale;
      const y1 = oy;

      const x2 = ox;
      const y2 = oy - fy * scale;

      const x3 = ox - fx * scale;
      const y3 = oy + fy * scale;

      vectors.innerHTML = `
        <line x1="${ox}" y1="${oy}"
          x2="${x1}" y2="${y1}"
          stroke="#e53935" stroke-width="4"
          marker-end="url(#cp-red-arrow)"/>

        <line x1="${ox}" y1="${oy}"
          x2="${x2}" y2="${y2}"
          stroke="#159447" stroke-width="4"
          marker-end="url(#cp-green-arrow)"/>

        <line x1="${ox}" y1="${oy}"
          x2="${x3}" y2="${y3}"
          stroke="#2368d8" stroke-width="4"
          marker-end="url(#cp-blue-arrow)"/>

        <text x="${x1 - 5}" y="${y1 + 25}"
          fill="#c62828" font-size="15"
          text-anchor="end">
          F₁ = ${fx} N
        </text>

        <text x="${x2 + 12}" y="${Math.max(20, y2 - 12)}"
          fill="#087b36" font-size="15">
          F₂ = ${fy} N
        </text>

        <text x="${x3 + 5}" y="${y3 + 22}"
          fill="#174ca5" font-size="15">
          F₃ = ${magnitude.toFixed(2)} N
        </text>
      `;

      get("cp-out-x").textContent =
        (-fx).toFixed(2) + " N";

      get("cp-out-y").textContent =
        (-fy).toFixed(2) + " N";

      get("cp-magnitude").textContent =
        magnitude.toFixed(2) + " N";

      get("cp-angle").textContent =
        magnitude === 0
          ? "Undefined (zero force)"
          : angle.toFixed(2) + "° below negative X-axis";

      get("cp-resultant").textContent = "0 N";
    }

    fxInput.addEventListener("input", updateModel);
    fyInput.addEventListener("input", updateModel);

    resetButton.addEventListener("click", function () {
      fxInput.value = 100;
      fyInput.value = 80;
      updateModel();
    });

    updateModel();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeCoplanarModel
    );
  } else {
    initializeCoplanarModel();
  }
})();
