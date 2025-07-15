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
        const code = result.getText();
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
    const row = document.createElement('tr');
    const parsed = parseGS1(entry.code, entry.format);

    row.dataset.code = entry.code;
    row.innerHTML = `
      <td>${index}</td>
      <td>${parsed.code || ''}</td>
      <td>${parsed.device || ''}</td>
      <td>${parsed.produced || ''}</td>
      <td>${parsed.expiry || ''}</td>
      <td>${parsed.lot || ''}</td>
      <td class="count">${entry.count}</td>
      <td><button class="inline-remove">Remove</button></td>
    `;

    // Add event listener to the inline remove button
    row.querySelector('.inline-remove').addEventListener('click', () => {
      const code = entry.code;
      const index = scannedCodes.findIndex(e => e.code === code);
      if (index !== -1) {
        const item = scannedCodes[index];
        if (item.count > 1) {
          item.count--;
          updateCount(code, item.count);
          output.textContent = `↩️ Decremented count (${item.count} left)`;
        } else {
          scannedCodes.splice(index, 1);
          row.remove();
          output.textContent = `🗑️ Removed code from list`;
        }

        // Re-disable global buttons if nothing left
        if (scannedCodes.length === 0) {
          removeLastBtn.disabled = true;
          submitBtn.disabled = true;
        }
      }
    });

    scanTableBody.appendChild(row);  
  }

  // function addToTable(index, entry) {
  //   const row = document.createElement('tr');
  //   const parsed = parseGS1(entry.code, entry.format);
    
  //   row.dataset.code = entry.code;
  //   row.innerHTML = `
  //     <td>${index}</td>
  //     <td>${parsed.code || ''}</td>
  //     <td>${parsed.device || ''}</td>
  //     <td>${parsed.produced || ''}</td>
  //     <td>${parsed.expiry || ''}</td>
  //     <td>${parsed.lot || ''}</td>
  //     <td class="count">${entry.count}</td>
  //   `;
  //   scanTableBody.appendChild(row);  
  // }

  function parseGS1(code, format) {
    const result = {
      code: code.replace(/[\x00-\x1F]/g, '')  // Remove control characters like FNC1
    };

    // const result = {
    //   code: code
    // };

    // If the format is CODE_128 and it's a GS1 format, parse with AI logic
    if (format === ZXing.BarcodeFormat.CODE_128) {
      // Replace non-printable ASCII characters (usually FNC1 = ASCII 29)
      const fnc1 = String.fromCharCode(29);

      let i = 0;
      while (i < code.length) {
        const ai2 = code.substr(i, 2);
        const ai3 = code.substr(i, 3);
        let ai = null;

        // Try 3-digit AI first
        if (['240', '241'].includes(ai3)) {
          ai = ai3;
          i += 3;
        } else if (['00', '01', '10', '11', '17', '21'].includes(ai2)) {
          ai = ai2;
          i += 2;
        } else {
          console.warn('Unknown AI at position', i, code.substr(i, 4));
          break;
        }

        let value;
        if (['00'].includes(ai)) {
          value = code.substr(i, 18); i += 18;
        } else if (['01'].includes(ai)) {
          value = code.substr(i, 14); i += 14;
        } else if (['17', '11'].includes(ai)) {
          value = code.substr(i, 6); i += 6;
        } else if (['10', '21', '240', '241'].includes(ai)) {
          // Variable length, ends with FNC1 or end of string
          let end = code.indexOf(fnc1, i);
          if (end === -1) end = code.length;
          value = code.substring(i, end);
          i = end + 1; // skip past separator
        } else {
          console.warn('Unhandled AI:', ai);
          break;
        }

        switch (ai) {
          case '01': result.device = value; break;
          case '17': result.expiry = `20${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`; break;
          case '11': result.produced = `20${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`; break;
          case '10': result.lot = value; break;
          default:
            result[`AI_${ai}`] = value;
        }
      }
    }

    // If the format is DATA_MATRIX, parse by fixed slices (your logic seems fine)
    else if (format === ZXing.BarcodeFormat.DATA_MATRIX) {
      if (code.charCodeAt(0) < 32) {
        code = code.slice(1);
      }

      result.device = code.slice(0, 16);
      result.expiry = `20${code.slice(18, 20)}-${code.slice(20, 22)}-${code.slice(22, 24)}`;
      result.produced = `20${code.slice(26, 28)}-${code.slice(28, 30)}-${code.slice(30, 32)}`;
      result.lot = code.slice(34, 44);
    }

    return result;
  }


  // function parseGS1(code, format) {
  // const result = {};

  //   // If the format is CODE_128 (4)
  //   if (format === ZXing.BarcodeFormat.CODE_128) {
  //     const aiRegex = /\((\d{2})\)([^\(]+)/g;
  //     let match;
  //     while ((match = aiRegex.exec(code)) !== null) {
  //       const ai = match[1];
  //       const value = match[2].trim();

  //       result.code = code;

  //       switch (ai) {
  //         case '01':
  //           result.device = value;
  //           break;
  //         case '17':
  //           result.expiry = `20${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
  //           break;
  //         case '11':
  //           result.produced = `20${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 6)}`;
  //           break;
  //         case '10':
  //           result.lot = value;
  //           break;
  //         default:
  //           result[`AI_${ai}`] = value;
  //       }
  //     }
  //   }

  //   // If the format is DATA_MATRIX (5)
  //   else if (format === ZXing.BarcodeFormat.DATA_MATRIX) {
  //     // Strip control character at beginning if present
  //     if (code.charCodeAt(0) < 32) {
  //       code = code.slice(1);
  //     }

  //     result.code = code;
  //     result.device = code.slice(0, 16);
  //     result.expiry = `20${code.slice(18, 20)}-${code.slice(20, 22)}-${code.slice(22, 24)}`;
  //     result.produced = `20${code.slice(26, 28)}-${code.slice(28, 30)}-${code.slice(30, 32)}`;
  //     result.lot = code.slice(34, 44);
  //   }

  //   return result;
  // }


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
