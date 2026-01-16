export function startRecord() {
  const name = prompt("Enter Path Name:", "route1");
  if (!name) return;

  fetch(`/record/start/${name}`)
    .then((res) => res.text())
    .then((msg) => alert(msg));
}

export function stopRecord() {
  fetch("/record/stop")
    .then((res) => res.text())
    .then((msg) => alert(msg));
}

export function replay() {
  const name = prompt("Replay which path?", "route1");
  if (!name) return;

  fetch(`/replay/${name}`)
    .then((res) => res.text())
    .then((msg) => alert(msg));
}
