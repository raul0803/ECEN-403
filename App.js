import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

function App() {
  const videoRef = useRef(null);
  const photoRef = useRef(null);
  const [videoStream, setVideoStream] = useState(null);
  const [lidarData, setLidarData] = useState([]);
  const [hasPhoto, setHasPhoto] = useState(false);

  const getVideo = () => {
    if (!videoStream) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 1920, height: 1080 } })
        .then((stream) => {
          let video = videoRef.current;
          video.srcObject = stream;
          video.play().catch((err) => {
            console.error(err);
          });
          setVideoStream(stream);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const width = 414; // Use video's natural width
      const height = width / (16/9); // Use video's natural height
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      let video = videoRef.current;
  
      let ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
  
      // Convert the canvas to a data URL
      const dataURL = canvas.toDataURL("image/png");
  
      // Create a temporary link to download the image
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "snapshot.png"; // Set the filename here
      document.body.appendChild(a);
      a.click();
  
      // Clean up
      document.body.removeChild(a);
    }
  };

  const closePhoto = () => {
    let canvas = photoRef.current;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasPhoto(false);
  };

  const stopLiDar = () => {
    setLidarData([]);
  };

  const receiveLiDARData = (data) => {
    setLidarData(data);
  };

  const stopVideo = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setVideoStream(null);
    }
  };

  useEffect(() => {
    getVideo();
    const ws = new WebSocket("ws://www.host.com/path");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      receiveLiDARData(data);
    };
    return () => {
      stopVideo();
      ws.close();
    };
  }, [videoRef]); // Remove the dependency array

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const lidarPointCloud = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(lidarData),
      new THREE.PointsMaterial({ color: 0x00ff00, size: 0.1 })
    );
    scene.add(lidarPointCloud);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();
  }, [lidarData]);

  return (
    <div className="App">
      <div className="Camera">
      <canvas ref={photoRef}></canvas>
        <video ref={videoRef} autoPlay playsInline></video>
        <button onClick={getVideo} style={{ marginBottom: "10px" }}>
          Camera
        </button>
        &nbsp;&nbsp;
        <button onClick={takePhoto}>Snap</button>
        
        &nbsp;&nbsp;
        <button onClick={stopVideo}>End</button>
      </div>
      {hasPhoto && (
        <div className={'result' + (hasPhoto ? ' hasPhoto' : '')}>
          <button onClick={closePhoto}>Close</button>
        </div>
      )}
      <div className="LiDar">
        <button>LiDar</button>
        &nbsp;&nbsp;
        <button onClick={stopLiDar}>End</button>
      </div>
    </div>
  );
 }
export default App;

