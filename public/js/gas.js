import { socket } from "./socket.js";

socket.on("gas_update", (data) => {
  const rawEl = document.getElementById("gasRaw");
  const voltEl = document.getElementById("gasVoltage");
  const statusEl = document.getElementById("gasStatus");

  if (rawEl) rawEl.innerText = data.gas_raw ?? "--";
  if (voltEl) voltEl.innerText = (data.gas_voltage ?? 0).toFixed(2);
  if (statusEl) statusEl.innerText = data.gas_status ?? "NO_DATA";
});

const statusEl = document.getElementById("gasStatus");
statusEl.classList.remove("safe", "warning", "danger");

if (data.gas_status === "SAFE") statusEl.classList.add("safe");
else if (data.gas_status === "WARNING") statusEl.classList.add("warning");
else if (data.gas_status === "DANGER") statusEl.classList.add("danger");
