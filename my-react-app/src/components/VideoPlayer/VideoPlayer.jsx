// import React, { useEffect, useRef, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import Hls from 'hls.js';
// import './VideoPlayer.css';

// function VideoPlayer() {
//   const { videoId } = useParams();
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const hlsRef = useRef(null);

//   const [video, setVideo] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // States for Resolution Dropdown
//   const [levels, setLevels] = useState([]);
//   const [currentLevel, setCurrentLevel] = useState(-1); // -1 = AUTO mode

//   useEffect(() => {
//     loadVideo();
//     return () => {
//       if (hlsRef.current) {
//         hlsRef.current.destroy();
//       }
//     };
//   }, [videoId]);

//   const loadVideo = async () => {
//     try {
//       const response = await axios.get(`/api/videos/${videoId}`);
//       console.log('📥 Video data received:', response.data);
//       console.log('🔗 Manifest URL:', response.data.manifestUrl);
//       setVideo(response.data);
//       setLoading(false);
//     } catch (err) {
//       console.error('❌ Error loading video:', err);
//       setError('Video not found');
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (!video || !videoRef.current) return;

//     const videoElement = videoRef.current;

//     if (Hls.isSupported()) {
//       const hls = new Hls({
//         enableWorker: true,
//         lowLatencyMode: true,
//         debug: true, // Enable debug logs
//       });

//       console.log('🎬 Loading HLS source:', video.manifestUrl);

//       hls.loadSource(video.manifestUrl);
//       hls.attachMedia(videoElement);

//       hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
//         console.log('✅ MANIFEST_PARSED');
//         console.log('📊 Available levels:', data.levels);
//         console.log('📊 Level details:', data.levels.map(l => ({
//           height: l.height,
//           width: l.width,
//           bitrate: l.bitrate,
//           name: l.name
//         })));

//         videoElement.play().catch(e => console.log("Autoplay blocked:", e));

//         // Extract available resolutions for the dropdown
//         if (data.levels && data.levels.length > 0) {
//           const availableLevels = data.levels.map((level, index) => ({
//             index,
//             height: level.height,
//             width: level.width,
//             bitrate: Math.round(level.bitrate / 1000) // Convert to kbps
//           }));

//           console.log('🎯 Setting levels:', availableLevels);
//           setLevels(availableLevels);

//           // Auto-select highest quality initially
//           if (availableLevels.length > 1) {
//             setCurrentLevel(-1); // Start with Auto
//           }
//         } else {
//           console.warn('⚠️ No levels found in manifest!');
//         }
//       });

//       hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
//         console.log('🔄 Level switched to:', data.level);
//       });

//       hls.on(Hls.Events.ERROR, (event, data) => {
//         console.error('❌ HLS Error:', data);
//         if (data.fatal) {
//           switch (data.type) {
//             case Hls.ErrorTypes.NETWORK_ERROR:
//               console.log('🌐 Network error, retrying...');
//               hls.startLoad();
//               break;
//             case Hls.ErrorTypes.MEDIA_ERROR:
//               console.log('🎵 Media error, recovering...');
//               hls.recoverMediaError();
//               break;
//             default:
//               console.log('💀 Fatal error, destroying HLS instance');
//               hls.destroy();
//               break;
//           }
//         }
//       });

//       hlsRef.current = hls;
//     } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
//       console.log('🍎 Using native HLS (Safari)');
//       videoElement.src = video.manifestUrl;
//       videoElement.addEventListener('loadedmetadata', () => {
//         videoElement.play().catch(e => console.log("Autoplay blocked:", e));
//       });
//     }
//   }, [video]);

//   // Handle Manual Quality Selection
//   const handleQualityChange = (e) => {
//     const selectedLevel = parseInt(e.target.value, 10);
//     console.log('👆 User selected quality level:', selectedLevel);
//     setCurrentLevel(selectedLevel);

//     if (hlsRef.current) {
//       hlsRef.current.currentLevel = selectedLevel;
//       console.log('🎯 Set hls.currentLevel to:', selectedLevel);
//     }
//   };

//   if (loading) return <div className="loading">Loading video...</div>;
//   if (error) return <div className="error">{error}</div>;
//   if (!video) return null;

//   return (
//     <div className="video-player-page">
//       <button className="back-btn" onClick={() => navigate(-1)}>
//         ← Back
//       </button>

//       <div className="video-container">
//         <video
//           ref={videoRef}
//           controls
//           className="video-element"
//           crossOrigin="anonymous"
//         />
//       </div>

//       {/* Debug: Show levels count */}
//       {process.env.NODE_ENV === 'development' && (
//         <div style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
//           Debug: {levels.length} levels available | Current: {currentLevel === -1 ? 'Auto' : currentLevel}
//         </div>
//       )}

//       {/* Custom Resolution Dropdown */}
//       {levels.length > 1 && Hls.isSupported() && (
//         <div className="quality-selector" style={{ margin: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
//           <label htmlFor="quality-select" style={{ fontWeight: 'bold' }}>Quality:</label>
//           <select
//             id="quality-select"
//             value={currentLevel}
//             onChange={handleQualityChange}
//             style={{ padding: '8px', borderRadius: '4px', fontSize: '14px' }}
//           >
//             <option value={-1}>Auto</option>
//             {levels.map((level) => (
//               <option key={level.index} value={level.index}>
//                 {level.height}p ({level.bitrate} kbps)
//               </option>
//             ))}
//           </select>
//         </div>
//       )}

//       {levels.length <= 1 && Hls.isSupported() && (
//         <div style={{ color: '#ff9800', marginTop: '10px' }}>
//           ⚠️ Only {levels.length} quality level detected. Check if backend generated master.m3u8 with multiple renditions.
//         </div>
//       )}

//       <div className="video-details">
//         <h1>{video.title}</h1>
//         <div className="video-meta">
//           <span>{video.resolution}</span>
//           <span>•</span>
//           <span>{new Date(video.createdAt).toLocaleDateString()}</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default VideoPlayer;
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Hls from "hls.js";
import "./VideoPlayer.css";

function VideoPlayer() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = Auto
  const [autoLevel, setAutoLevel] = useState(null); // tracks what auto/manual actually resolved to

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${videoId}`);
      setVideo(response.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error loading video:", err);
      setError("Video not found");
      setLoading(false);
    }
  };

  const getQualityLabel = (bitrate, height) => {
    if (height && height > 0) {
      return `${height}p`;
    }
    const bitrateKbps = Math.round(bitrate / 1000);
    if (bitrateKbps >= 5000) return "1080p";
    if (bitrateKbps >= 2500) return "720p";
    if (bitrateKbps >= 1000) return "480p";
    if (bitrateKbps >= 500) return "360p";
    return `${bitrateKbps}kbps`;
  };

  useEffect(() => {
    if (!video || !videoRef.current) return;

    const videoElement = videoRef.current;

    if (hlsRef.current) {
      console.log("⚠️ HLS already initialized, skipping...");
      return;
    }

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        debug: false,
      });

      hls.loadSource(video.manifestUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("✅ Media attached successfully");
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("✅ MANIFEST_PARSED - Levels found:", data.levels.length);

        if (data.levels && data.levels.length > 0) {
          const availableLevels = data.levels.map((level, index) => {
            const height = level.height || 0;
            const bitrate = level.bitrate || 0;

            return {
              index, // keep original hls.js index for currentLevel/nextLevel assignment
              height,
              width: level.width || 0,
              bitrate: Math.round(bitrate / 1000),
              label: getQualityLabel(bitrate, height),
            };
          });

          // Sort a copy for display (highest first, YouTube-style) —
          // original `index` values are preserved so hls.js assignment stays correct
          const sorted = [...availableLevels].sort(
            (a, b) => b.height - a.height || b.bitrate - a.bitrate,
          );
          setLevels(sorted);
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log("🔄 Level switched to:", data.level);
        setAutoLevel(data.level); // always update, so "Auto (720p)" reflects reality

        const v = videoElement;
        if (v.paused) {
          v.play().catch((e) => console.log("Autoplay prevented:", e));
        } else {
          // Safety-net nudge: forces the decoder to resync even if a segment
          // boundary wasn't perfectly keyframe-aligned. Harmless if unnecessary.
          const t = v.currentTime;
          // eslint-disable-next-line no-self-assign
          v.currentTime = t + 0.001;
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("❌ HLS Error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("🌐 Network error, retrying...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("🎵 Media error, recovering...");
              hls.recoverMediaError();
              break;
            default:
              console.log("💀 Destroying HLS instance");
              hls.destroy();
              hlsRef.current = null;
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari) — no manual quality selector available here,
      // Safari's native ABR handles switching internally
      videoElement.src = video.manifestUrl;
      videoElement.addEventListener("loadedmetadata", () => {
        videoElement.play().catch((e) => console.log("Autoplay prevented:", e));
      });
    }

    // Single consolidated cleanup — runs on unmount or when `video` changes
    return () => {
      if (hlsRef.current) {
        console.log("🧹 Cleaning up HLS instance...");
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video]);

  const handleQualityChange = (e) => {
    const selectedLevel = parseInt(e.target.value, 10);
    console.log("👆 User selected level:", selectedLevel);

    if (hlsRef.current) {
      hlsRef.current.currentLevel = selectedLevel; // immediate switch + buffer flush
      setCurrentLevel(selectedLevel);
    } else {
      console.error("❌ HLS instance not found!");
    }
  };

  const resolvedAutoLabel =
    currentLevel === -1 && autoLevel !== null
      ? levels.find((l) => l.index === autoLevel)?.label
      : null;

  if (loading) return <div className="loading">Loading video...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!video) return null;

  return (
    <div className="video-player-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="video-container">
        <video
          ref={videoRef}
          controls
          className="video-element"
          crossOrigin="anonymous"
        />
      </div>

      {levels.length > 1 && (
        <div
          className="quality-selector"
          style={{
            margin: "15px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <label htmlFor="quality-select" style={{ fontWeight: "bold" }}>
            Quality:
          </label>
          <select
            id="quality-select"
            value={currentLevel}
            onChange={handleQualityChange}
            style={{ padding: "8px", borderRadius: "4px", fontSize: "14px" }}
          >
            <option value={-1}>
              Auto{resolvedAutoLabel ? ` (${resolvedAutoLabel})` : ""}
            </option>
            {levels.map((level) => (
              <option key={level.index} value={level.index}>
                {level.label} ({level.bitrate} kbps)
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="video-details">
        <h1>{video.title}</h1>
        <div className="video-meta">
          <span>{video.resolution}</span>
          <span>•</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
