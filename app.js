let entries = JSON.parse(localStorage.getItem("ketoEntries") || "[]");
const targetWeight = 90;

// Save to localStorage
function save() {
  localStorage.setItem("ketoEntries", JSON.stringify(entries));
  render();
}

// Add new entry
function addEntry() {
  const date = document.getElementById("date").value;
  const weight = parseFloat(document.getElementById("weight").value);
  const waist = parseFloat(document.getElementById("waist").value);

  if (!date || !weight) {
    alert("Please enter date and weight");
    return;
  }
  entries.push({ date, weight, waist });
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  save();
}

// Render stats + chart
function render() {
  if (entries.length === 0) return;

  const current = entries[entries.length - 1];
  document.getElementById("currentWeight").textContent = current.weight;

  // Goal progress
  const start = entries[0].weight;
  const loss = start - current.weight;
  const totalNeeded = start - targetWeight;
  const percent = Math.max(0, Math.min(100, ((loss / totalNeeded) * 100)));
  document.getElementById("progressPercent").textContent = percent.toFixed(1);

  // ETA Projection
  const proj = projectedETA(entries, targetWeight);
  document.getElementById("eta").textContent =
    proj ? proj.etaDate.toDateString() + ` (≈ ${proj.weeksNeeded.toFixed(1)} weeks)` : "Not enough data";

  drawChart();
}

// Chart.js weight/waist
function drawChart() {
  const ctx = document.getElementById("weightChart").getContext("2d");
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: entries.map(e => e.date),
      datasets: [
        { label: "Weight (kg)", data: entries.map(e => e.weight), borderWidth: 2 },
        { label: "Waist (cm)", data: entries.map(e => e.waist || null), borderWidth: 2 }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}

// ETA projection
function projectedETA(entries, targetKg, lookback = 3) {
  if (entries.length < 2) return null;
  const lastIndex = entries.length - 1;
  const startIndex = Math.max(0, lastIndex - lookback);
  const weeks =
    (new Date(entries[lastIndex].date) - new Date(entries[startIndex].date)) /
    (1000 * 60 * 60 * 24 * 7);
  if (weeks <= 0) return null;
  const loss = entries[startIndex].weight - entries[lastIndex].weight;
  const rate = loss / weeks || 0.25;
  const remaining = entries[lastIndex].weight - targetKg;
  const weeksNeeded = remaining / rate;
  const etaDate = new Date(entries[lastIndex].date);
  etaDate.setDate(etaDate.getDate() + Math.round(weeksNeeded * 7));
  return { weeksNeeded, etaDate, rate };
}

// CSV export
function exportCSV() {
  const header = ["date", "weight", "waist"];
  const rows = entries.map(e => [e.date, e.weight, e.waist || ""].join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "keto-data.csv";
  a.click();
}

// CSV import
function importCSV(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text.trim().split("\n").slice(1); // skip header
    entries = lines.map(line => {
      const [date, weight, waist] = line.split(",");
      return { date, weight: parseFloat(weight), waist: parseFloat(waist) || null };
    });
    save();
  };
  reader.readAsText(file);
}

render();
