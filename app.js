window.addEventListener('load', () => {
  const videoElement = document.getElementById('video');
  const output = document.getElementById('output');
  const startBtn = document.getElementById('startBtn');
  const scanNextBtn = document.getElementById('scanNextBtn');
  const qrInput = document.getElementById('qrData');
  const lot = document.getElementById('lotNumber');
  const produced = document.getElementById('productionDate');
  const expiry = document.getElementById('expiryDate');

  const codeReader = new ZXing.BrowserMultiFormatReader();

  let currentDeviceId = null;

  // Start initial scan
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

  // Scan logic
  function startScan() {
    output.textContent = '📡 Scanning...';
    qrInput.value = '';
    scanNextBtn.disabled = true;

    codeReader.decodeFromVideoDevice(currentDeviceId, videoElement, (result, err) => {
      if (result) {
        const text = result.getText();
        const year = "20";
        console.log('✅ Scanned:', text);
        qrInput.value = text;
        lot.value = text.slice(35,45);
        produced.value = year.concat(text.slice(27,29), "-", text.slice(29,31), "-", text.slice(31,33));
        expiry.value = year.concat(text.slice(19,21), "-", text.slice(21,23), "-", text.slice(23,25));
        output.textContent = '✅ QR code scanned. Data added to form.';
        codeReader.reset(); // Stop scanning until re-enabled
        scanNextBtn.disabled = false;
      } else if (err && !(err instanceof ZXing.NotFoundException)) {
        console.error('Scan error:', err);
        output.textContent = '⚠️ Scan error. Try again.';
      }
    });
  }

  // Handle "Scan Next" click
  scanNextBtn.addEventListener('click', () => {
    startScan();
  });
});
