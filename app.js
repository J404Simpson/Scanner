const videoElement = document.getElementById('video');
const resultElement = document.getElementById('result');

const codeReader = new ZXing.BrowserMultiFormatReader();

codeReader.listVideoInputDevices()
  .then(videoInputDevices => {
    console.log("Video devices found:", videoInputDevices);

    const rearCamera = videoInputDevices.find(device =>
      device.label.toLowerCase().includes('back')
    ) || videoInputDevices[0];

    if (!rearCamera) {
      throw new Error("No video input devices found.");
    }

    console.log("Using camera:", rearCamera.label || rearCamera.deviceId);

    codeReader.decodeFromVideoDevice(
      rearCamera.deviceId,
      videoElement,
      (result, err, controls) => {
        if (result) {
          resultElement.textContent = result.getText();
          console.log("Barcode result:", result.getText());
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error("Decode error:", err);
        }
      }
    );
  })
  .catch(err => {
    console.error("Error accessing camera:", err);
    resultElement.textContent = "Camera error: " + err.message;
  });

// const codeReader = new ZXing.BrowserMultiFormatReader();
// const videoElement = document.getElementById('video');
// const resultElement = document.getElementById('result');

// // List cameras and start with rear-facing camera
// codeReader
//   .listVideoInputDevices()
//   .then(videoInputDevices => {
//     const rearCamera = videoInputDevices.find(device =>
//       device.label.toLowerCase().includes('back')
//     ) || videoInputDevices[0];

//     return codeReader.decodeFromVideoDevice(
//       rearCamera.deviceId,
//       videoElement,
//       (result, err) => {
//         if (result) {
//           resultElement.textContent = result.getText();
//         } else if (err && !(err instanceof ZXing.NotFoundException)) {
//           console.error(err);
//         }
//       }
//     );
//   })
//   .catch(err => {
//     console.error("Camera setup error:", err);
//     alert("Could not start camera: " + err.message);
//   });

// const video = document.getElementById('video');
// const canvas = document.getElementById('canvas');
// const output = document.getElementById('output');
// const captureButton = document.getElementById('capture');
// const context = canvas.getContext('2d');

// // Start the camera
// navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
//   .then(stream => {
//     video.srcObject = stream;
//   })
//   .catch(err => {
//     console.error("Camera access error:", err);
//     alert("Could not access the camera.");
//   });

// captureButton.addEventListener('click', async () => {
//   context.drawImage(video, 0, 0, canvas.width, canvas.height);

//   canvas.toBlob(async (blob) => {
//     output.textContent = 'Scanning...';
//     const worker = await Tesseract.createWorker();

//     await worker.loadLanguage('eng');
//     await worker.initialize('eng');
//     const { data: { text } } = await worker.recognize(blob);

//     output.textContent = text;
//     await worker.terminate();
//   }, 'image/png');
// });
