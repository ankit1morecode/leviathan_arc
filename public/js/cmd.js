async function sendCmd(cmd) {
  const res = await fetch("/api/cmd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cmd }),
  });

  const data = await res.json();
  console.log("CMD response:", data);
  if (!data.ok) alert("❌ Command failed: " + data.error);
}

document.getElementById("btnStart")?.addEventListener("click", () => sendCmd("START"));
document.getElementById("btnRTB")?.addEventListener("click", () => sendCmd("RTB"));
document.getElementById("btnStop")?.addEventListener("click", () => sendCmd("STOP"));