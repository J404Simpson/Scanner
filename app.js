document.addEventListener('DOMContentLoaded', () => {
  const videoElement = document.getElementById('video');
  const output = document.getElementById('output');
  const startBtn = document.getElementById('startBtn');
  const scanNextBtn = document.getElementById('scanNextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const removeLastBtn = document.getElementById('removeLastBtn');
  const scanTableBody = document.querySelector('#scanTable tbody');

  const codeReader = new ZXing.BrowserMultiFormatReader();
  const scannedCodes = []; // array of { code: string, count: number }

  let currentDeviceId = null;
  let lastScannedCode = null;

  startBtn.addEventListener('click', () => {
    output.textContent = '📷 Initializing camera...';
    videoElement.style.display = 'block';

    codeReader.listVideoInputDevices()
      .then(videoInputDevices => {
        if (videoInputDevices.length === 0) {
          output.textContent = '❌ No camera devices found.';
          return;
        }

        const rearCamera = videoInputDevices.find(device =>
          device.label.toLowerCase().includes('back')
        ) || videoInputDevices[0];

        currentDeviceId = rearCamera.deviceId;
        startScan();
      })
      .catch(err => {
        console.error('Camera access error:', err);
        output.textContent = `❌ Camera access error: ${err}`;
      });
  });

  function startScan() {
    codeReader.reset(); // 🚨 Reset before starting a new scan
    output.textContent = '📡 Scanning...';
    scanNextBtn.disabled = true;

    codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
      if (result) {
        const scanned = result.getText();
        console.log('✅ Scanned:', scanned);

        lastScannedCode = scanned;
        removeLastBtn.disabled = false;

        if (scanned.length !== 45) {
          output.textContent = `❌ Invalid QR code. Length is ${scanned.length}, expected 45.`;
          codeReader.reset();
          scanNextBtn.disabled = false;
          return;
        }

        const existing = scannedCodes.find(entry => entry.code === scanned);
        if (existing) {
          existing.count += 1;
          updateTableCount(existing.code, existing.count);
          output.textContent = '➕ Duplicate found. Count incremented.';
        } else {
          const entry = { code: scanned, count: 1 };
          scannedCodes.push(entry);
          addToTable(scannedCodes.length, entry);
          output.textContent = '✅ New QR code added.';
        }

        codeReader.reset();
        scanNextBtn.disabled = false;
        submitBtn.disabled = scannedCodes.length === 0;
        removeLastBtn.disabled = scannedCodes.length === 0;

      } else if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error('Scan error:', err);
        output.textContent = `⚠️ Scan error: ${err.message || err}`;
        codeReader.reset();
        scanNextBtn.disabled = false;
      }
    });
  }

  scanNextBtn.addEventListener('click', () => {
    startScan();
  });

  function addToTable(index, entry) {
    const row = document.createElement('tr');
    row.setAttribute('data-code', entry.code); // used to update count later
    row.innerHTML = `<td>${index}</td><td>${entry.code}</td><td class="count-cell">1</td>`;
    scanTableBody.appendChild(row);
  }

  function updateTableCount(code, newCount) {
    const row = scanTableBody.querySelector(`tr[data-code="${code}"]`);
    if (row) {
      const countCell = row.querySelector('.count-cell');
      if (countCell) {
        countCell.textContent = newCount;
      }
    }
  }

  function removeTableRow(code) {
    const row = scanTableBody.querySelector(`tr[data-code="${code}"]`);
    if (row) {
      scanTableBody.removeChild(row);
    }
  }

  // Submit scanned data
  submitBtn.addEventListener('click', () => {
    if (scannedCodes.length === 0) return;

    output.textContent = '🚀 Submitting scanned codes...';

    fetch('https://your-api.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes: scannedCodes })
    })
    .then(res => {
      if (!res.ok) throw new Error('Submission failed');
      return res.json();
    })
    .then(data => {
      output.textContent = '✅ Data submitted successfully!';
      console.log(data);
    })
    .catch(err => {
      console.error(err);
      output.textContent = '❌ Failed to submit. See console.';
    });
  });

  // Remove last added
  removeLastBtn.addEventListener('click', () => {
    if (!lastScannedCode) return;

    const index = scannedCodes.findIndex(entry => entry.code === lastScannedCode);
    if (index === -1) return;

    const entry = scannedCodes[index];

    if (entry.count > 1) {
      entry.count -= 1;
      updateTableCount(entry.code, entry.count);
      output.textContent = `↩️ Removed 1 from count (${entry.count} remaining)`;
    } else {
      scannedCodes.splice(index, 1);
      removeTableRow(entry.code);
      output.textContent = `🗑️ Removed last scanned code`;
    }

    // Update states
    if (scannedCodes.length === 0) {
      submitBtn.disabled = true;
      removeLastBtn.disabled = true;
    }

    lastScannedCode = null;
  });
});

// window.addEventListener('load', () => {
//   const videoElement = document.getElementById('video');
//   const output = document.getElementById('output');
//   const startBtn = document.getElementById('startBtn');
//   const scanNextBtn = document.getElementById('scanNextBtn');
//   const submitBtn = document.getElementById('submitBtn');
//   const scanTableBody = document.querySelector('#scanTable tbody');

//   const codeReader = new ZXing.BrowserMultiFormatReader();

//   let currentDeviceId = null;
//   const scannedCodes = [];

//   // Start scanning when user clicks
//   startBtn.addEventListener('click', () => {
//     output.textContent = '📷 Initializing camera...';
//     videoElement.style.display = 'block';

//     codeReader.listVideoInputDevices()
//       .then(videoInputDevices => {
//         if (videoInputDevices.length === 0) {
//           output.textContent = '❌ No camera devices found.';
//           return;
//         }

//         const rearCamera = videoInputDevices.find(device =>
//           device.label.toLowerCase().includes('back')
//         ) || videoInputDevices[0];

//         currentDeviceId = rearCamera.deviceId;
//         startScan();
//       })
//       .catch(err => {
//         console.error('Camera error:', err);
//         output.textContent = `❌ Camera access error: ${err}`;
//       });
//   });

//   function startScan() {
//     output.textContent = '📡 Scanning...';
//     scanNextBtn.disabled = true;

//     codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
//       if (result) {
//         const scanned = result.getText();
//         console.log('✅ Scanned:', scanned);

//         // Prevent duplicates
//         // if (!scannedCodes.includes(scanned)) {
//           scannedCodes.push(scanned);
//           addToTable(scannedCodes.length, scanned);
//         // } else {
//           // output.textContent = '⚠️ Duplicate QR code ignored.';
//         // }

//         output.textContent = '✅ Scan complete. Click "Scan Next" to continue.';
//         codeReader.reset();
//         scanNextBtn.disabled = false;
//         submitBtn.disabled = scannedCodes.length === 0;
//       } else if (err && !(err instanceof ZXing.NotFoundException)) {
//         console.error('Scan error:', err);
//         output.textContent = '⚠️ Scan error.';
//       }
//     });
//   }

//   scanNextBtn.addEventListener('click', () => {
//     startScan();
//   });

//   function addToTable(index, code) {
//     const row = document.createElement('tr');
//     const numCell = document.createElement('td');
//     const codeCell = document.createElement('td');

//     numCell.textContent = index;
//     codeCell.textContent = code;

//     row.appendChild(numCell);
//     row.appendChild(codeCell);
//     scanTableBody.appendChild(row);
//   }

//   submitBtn.addEventListener('click', () => {
//     if (scannedCodes.length === 0) return;

//     output.textContent = '🚀 Submitting scanned codes...';

//     // Replace this with your actual API endpoint
//     const apiUrl = 'https://your-api.com/submit';

//     fetch(apiUrl, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ data: scannedCodes })
//     })
//     .then(res => {
//       if (!res.ok) throw new Error('Submission failed');
//       return res.json();
//     })
//     .then(data => {
//       output.textContent = '✅ Data submitted successfully!';
//       console.log('Server response:', data);
//       // Optional: clear list after submission
//     })
//     .catch(err => {
//       output.textContent = '❌ Failed to submit. Check console for details.';
//       console.error(err);
//     });
//   });
// });

// window.addEventListener('load', () => {
//   const videoElement = document.getElementById('video');
//   const output = document.getElementById('output');
//   const startBtn = document.getElementById('startBtn');
//   const scanNextBtn = document.getElementById('scanNextBtn');
//   const qrInput = document.getElementById('qrData');
//   const lot = document.getElementById('lotNumber');
//   const produced = document.getElementById('productionDate');
//   const expiry = document.getElementById('expiryDate');

//   const codeReader = new ZXing.BrowserMultiFormatReader();

//   let currentDeviceId = null;

//   // Start initial scan
//   startBtn.addEventListener('click', () => {
//     output.textContent = '📷 Initializing camera...';
//     videoElement.style.display = 'block';

//     codeReader.listVideoInputDevices()
//       .then(videoInputDevices => {
//         if (videoInputDevices.length === 0) {
//           output.textContent = '❌ No camera devices found.';
//           return;
//         }

//         const rearCamera = videoInputDevices.find(device =>
//           device.label.toLowerCase().includes('back')
//         ) || videoInputDevices[0];

//         currentDeviceId = rearCamera.deviceId;

//         startScan();
//       })
//       .catch(err => {
//         console.error('Camera access error:', err);
//         output.textContent = `❌ Camera access error: ${err}`;
//       });
//   });

//   // Scan logic
//   function startScan() {
//     output.textContent = '📡 Scanning...';
//     qrInput.value = '';
//     scanNextBtn.disabled = true;

//     codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
//       if (result) {
//         const text = result.getText();
//         const year = "20";
//         console.log('✅ Scanned:', text);
//         qrInput.value = text;
//         lot.value = text.slice(35,45);
//         produced.value = year.concat(text.slice(27,29), "-", text.slice(29,31), "-", text.slice(31,33));
//         expiry.value = year.concat(text.slice(19,21), "-", text.slice(21,23), "-", text.slice(23,25));
//         output.textContent = '✅ QR code scanned. Data added to form.';
//         codeReader.reset(); // Stop scanning until re-enabled
//         scanNextBtn.disabled = false;
//       } else if (err && !(err instanceof ZXing.NotFoundException)) {
//         console.error('Scan error:', err);
//         output.textContent = '⚠️ Scan error. Try again.';
//       }
//     });
//   }

//   // Handle "Scan Next" click
//   scanNextBtn.addEventListener('click', () => {
//     startScan();
//   });
// });
