document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('video');
  const output = document.getElementById('output');
  const startBtn = document.getElementById('startBtn');
  const scanNextBtn = document.getElementById('scanNextBtn');
  const removeLastBtn = document.getElementById('removeLastBtn');
  const scanTableBody = document.querySelector('#scanTable tbody');

  const codeReader = new ZXing.BrowserMultiFormatReader();
  const scannedCodes = [];
  let currentDeviceId = null;
  let lastScannedCode = null;

  scanNextBtn.style.visibility = "hidden";
  removeLastBtn.style.visibility = "hidden";

  startBtn.addEventListener('click', () => {
    startBtn.style.display = "none";
    output.textContent = '📷 Initializing camera...';
    videoElement.style.display = 'block';

    codeReader.listVideoInputDevices().then(devices => {
      if (devices.length === 0) {
        output.textContent = '❌ No camera found.';
        return;
      }

      currentDeviceId = devices[0].deviceId;
      startScan();
    }).catch(err => {
      output.textContent = `❌ Camera error: ${err.message || err}`;
      console.error(err);
    });
  });

  function startScan() {
    codeReader.reset();
    output.textContent = '📡 Scanning...';
    scanNextBtn.disabled = true;
    removeLastBtn.style.visibility = "hidden";

    codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
      if (result) {
        const code = result.getText();
        lastScannedCode = code;
        if (removeLastBtn.style.visibility === "hidden") {
          removeLastBtn.style.visibility = "visible";
        };
        if (removeLastBtn) removeLastBtn.disabled = false;

        // Checks QR code is correct length
        if (code.length !== 45) {
          output.textContent = `❌ Invalid code (length ${code.length}, expected 45)`;
          codeReader.reset();
          if (scanNextBtn.style.visibility === "hidden") {
            scanNextBtn.style.visibility = "visible";
          };
          scanNextBtn.disabled = false;
          return;
        }

        const existing = scannedCodes.find(entry => entry.code === code);
        if (existing) {
          existing.count++;
          updateCount(code, existing.count);
          output.textContent = '➕ Duplicate found. Count incremented.';
        } else {
          const entry = { code, count: 1 };
          scannedCodes.push(entry);
          addToTable(scannedCodes.length, entry);
          output.textContent = '✅ New QR code added.';
        }

        codeReader.reset();
        if (scanNextBtn.style.visibility === "hidden") {
          scanNextBtn.style.visibility = "visible";
        };
        scanNextBtn.disabled = false;
      } else if (err && !(err instanceof ZXing.NotFoundException)) {
        output.textContent = '⚠️ Scan error.';
        console.error('Scan error:', err);
        codeReader.reset();
        if (scanNextBtn.style.visibility === "hidden") {
          scanNextBtn.style.visibility = "visible";
        };
        scanNextBtn.disabled = false;
      }
    });
  }

  function addToTable(index, entry) {
    const year = "20"
    const row = document.createElement('tr');
    const device = entry.code.slice(1,17);
    const lot = entry.code.slice(35,45);
    const produced = year.concat(entry.code.slice(27,29), "-", entry.code.slice(29,31), "-", entry.code.slice(31,33));
    const expiry = year.concat(entry.code.slice(19,21), "-", entry.code.slice(21,23), "-", entry.code.slice(23,25));
    row.dataset.code = entry.code;
    row.innerHTML = `<td>${index}</td><td>${device}</td><td>${produced}</td><td>${expiry}</td><td>${lot}</td><td class="count">${entry.count}</td>`;
    scanTableBody.appendChild(row);
  }

  function updateCount(code, count) {
    const row = scanTableBody.querySelector(`tr[data-code="${code}"]`);
    if (row) {
      row.querySelector('.count').textContent = count;
    }
  }

  scanNextBtn.addEventListener('click', () => startScan());

  removeLastBtn.addEventListener('click', () => {
    if (!lastScannedCode) return;

    const index = scannedCodes.findIndex(entry => entry.code === lastScannedCode);
    if (index !== -1) {
      const entry = scannedCodes[index];
      if (entry.count > 1) {
        entry.count--;
        updateCount(entry.code, entry.count);
        output.textContent = `↩️ Decremented count (${entry.count} left)`;
      } else {
        scannedCodes.splice(index, 1);
        scanTableBody.querySelector(`tr[data-code="${entry.code}"]`).remove();
        output.textContent = '🗑️ Removed last scanned code';
      }

      if (scannedCodes.length === 0) {
        if (removeLastBtn) removeLastBtn.disabled = true;
      }
      lastScannedCode = null;
    }
  });
});
