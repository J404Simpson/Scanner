document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('video');
  const output = document.getElementById('output');
  const startBtn = document.getElementById('startBtn');
  const scanNextBtn = document.getElementById('scanNextBtn');
  const removeLastBtn = document.getElementById('removeLastBtn');
  const submitBtn = document.getElementById('submitBtn');
  const scanTableBody = document.querySelector('#scanTable tbody');

  const hints = new Map();
  const formats = [
    ZXing.BarcodeFormat.CODE_128,
    ZXing.BarcodeFormat.DATA_MATRIX
  ];

  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);

  const codeReader = new ZXing.BrowserMultiFormatReader(hints);

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
    submitBtn.disabled = false;

    codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
      if (result) {
        const format = result.getBarcodeFormat();
        const code = result.getText().slice(1);
        lastScannedCode = code;
        if (removeLastBtn.style.visibility === "hidden") {
          removeLastBtn.style.visibility = "visible";
        };
        if (removeLastBtn) removeLastBtn.disabled = false;

        // Checks QR code is correct length
        // if (code.length < 43 || code.length > 44) {
        //   output.textContent = `❌ Invalid code (length ${code.length}, expected 45). ${code}`;
        //   codeReader.reset();
        //   if (scanNextBtn.style.visibility === "hidden") {
        //     scanNextBtn.style.visibility = "visible";
        //   };
        //   scanNextBtn.disabled = false;
        //   return;
        // }

        // Checks if QR code already exists in table
        const existing = scannedCodes.find(entry => entry.code === code);
        if (existing) {
          existing.count++;
          updateCount(code, existing.count);
          output.textContent = '➕ Duplicate found. Count incremented.';
        } else {
          const entry = { code, format, count: 1 };
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
    const code = entry.code;
    const format = entry.format;
    const device = entry.code.slice(0,16);
    const lot = entry.code.slice(34,44);
    const produced = year.concat(entry.code.slice(26,28), "-", entry.code.slice(28,30), "-", entry.code.slice(30,32));
    const expiry = year.concat(entry.code.slice(18,20), "-", entry.code.slice(20,22), "-", entry.code.slice(22,24));
    row.dataset.code = entry.code;
    row.innerHTML = `<td>${index}</td><td>${format}</td><td>${code}</td><td>${device}</td><td>${produced}</td><td>${expiry}</td><td>${lot}</td><td class="count">${entry.count}</td>`;
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

    removeLastBtn.style.visibility = "hidden";

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
        if (submitBtn) submitBtn.disabled = true;
      }
      lastScannedCode = null;
    }
  });

  submitBtn.addEventListener('click', () => {
    if (scannedCodes.length === 0) {
      output.textContent = '⚠️ No codes to submit.';
      return;
    }

    output.textContent = '🚀 Submitting scanned codes...';

    console.log({ codes: scannedCodes })

    // 🔁 Replace this with your real API URL
    // fetch('https://your-api.com/submit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ codes: scannedCodes })
    // })
    // .then(res => {
    //   if (!res.ok) throw new Error('Server returned an error');
    //   return res.json();
    // })
    // .then(data => {
    //   output.textContent = '✅ Data submitted successfully!';
    //   console.log('Server response:', data);
    // })
    // .catch(err => {
    //   output.textContent = '❌ Submission failed. Check console.';
    //   console.error('Submission error:', err);
    // });

  });
});
