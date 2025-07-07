window.addEventListener('load', () => {
  const videoElement = document.getElementById('video');
  const output = document.getElementById('output');

  const codeReader = new ZXing.BrowserMultiFormatReader();

  codeReader.listVideoInputDevices()
    .then(videoInputDevices => {
      if (videoInputDevices.length === 0) {
        output.textContent = '❌ No camera devices found.';
        return;
      }

      // Prefer rear-facing camera if available
      const rearCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      codeReader.decodeFromVideoDevice(rearCamera.deviceId, videoElement, (result, err) => {
        if (result) {
          output.textContent = `✅ Barcode: ${result.getText()}`;
        } else if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error('Scan error:', err);
          output.textContent = '⚠️ Error scanning barcode.';
        }
      });
    })
    .catch(err => {
      console.error('Camera access error:', err);
      output.textContent = `❌ Camera access error: ${err}`;
    });
});

console.log(videoInputDevices);
