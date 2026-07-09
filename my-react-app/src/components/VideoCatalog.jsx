import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getThumbnailUrl, getManifestUrl } from "../config/env";
import "./VideoCatalog.css";

const ACCENTS = ["#ff4d6d", "#ffa53d", "#9b5de5", "#00c2d1"];

function VideoCatalog() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heroVideo, setHeroVideo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = getApiUrl("/api/videos");
      const response = await axios.get(apiUrl, { timeout: 30000 });

      const transformedVideos = response.data.map((video) => ({
        ...video,
        thumbnail: getThumbnailUrl(video.videoId),
        manifestUrl: getManifestUrl(video.videoId),
      }));

      setVideos(transformedVideos);
      if (transformedVideos.length > 0) {
        setHeroVideo(transformedVideos[0]);
      }
    } catch (err) {
      console.error("Error loading videos:", err);
      setError(err.message || "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="netflix-loading">
        <div className="netflix-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={loadVideos}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="netflix-catalog">
      {heroVideo && (
        <HeroSection
          video={heroVideo}
          navigate={navigate}
          accent={ACCENTS[0]}
        />
      )}

      <div className="content-rows">
        <VideoRow
          title="Trending Now"
          videos={videos.slice(0, 6)}
          formatDuration={formatDuration}
          navigate={navigate}
        />

        {videos.length > 6 && (
          <VideoRow
            title="Continue Watching"
            videos={videos.slice(3, 9)}
            formatDuration={formatDuration}
            navigate={navigate}
          />
        )}

        {videos.length > 9 && (
          <VideoRow
            title="Recently Added"
            videos={videos.slice(6)}
            formatDuration={formatDuration}
            navigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

function HeroSection({ video, navigate, accent }) {
  return (
    <div className="hero-section">
      <div className="hero-backdrop">
        <img src={video.thumbnail} alt={video.title} />
        <div className="hero-gradient"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          <span className="hero-dot" style={{ background: accent }}></span>
          {video.title}
        </h1>
        <div className="hero-meta">
          <span className="match-pill" style={{ background: accent }}>
            98% Match
          </span>
          <span className="year">
            {new Date(video.createdAt).getFullYear()}
          </span>
          <span className="rating">HD</span>
        </div>
        <p className="hero-description">
          Watch your uploaded video in stunning quality. Stream instantly across
          all your devices.
        </p>
        <div className="hero-buttons">
          <button
            className="play-btn"
            onClick={() => navigate(`/watch/${video.videoId}`)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play
          </button>
          <button className="info-btn">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

function VideoRow({ title, videos, formatDuration, navigate }) {
  const scrollRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const handleScroll = () => {
    if (scrollRef.current) {
      setShowLeftArrow(scrollRef.current.scrollLeft > 0);
      setShowRightArrow(
        scrollRef.current.scrollLeft <
          scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10,
      );
    }
  };

  return (
    <div className="video-row">
      <h2 className="row-title">{title}</h2>

      <div className="row-container">
        {showLeftArrow && (
          <button className="row-arrow left" onClick={() => scroll("left")}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
              <polygon points="15 18 9 12 15 6 15 18"></polygon>
            </svg>
          </button>
        )}

        <div className="row-content" ref={scrollRef} onScroll={handleScroll}>
          {videos.map((video, index) => (
            <VideoCard
              key={video.videoId}
              video={video}
              index={index}
              formatDuration={formatDuration}
              navigate={navigate}
            />
          ))}
        </div>

        {showRightArrow && (
          <button className="row-arrow right" onClick={() => scroll("right")}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
              <polygon points="9 18 15 12 9 6 9 18"></polygon>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, index, formatDuration, navigate }) {
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div
      className="video-card"
      style={{ animationDelay: `${index * 100}ms`, "--card-accent": accent }}
      onClick={() => navigate(`/watch/${video.videoId}`)}
    >
      <div className="card-thumbnail">
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <div className="card-overlay">
          <div className="card-actions">
            {/* <button
              className="action-btn play"
              style={{ "--card-accent": accent }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/watch/${video.videoId}`);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button
              className="action-btn info"
              onClick={(e) => {
                e.stopPropagation();
                // Add info modal logic here
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button> */}
            <button className="action-btn play">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={accent}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            <button className="action-btn info">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="card-duration">{formatDuration(video.duration)}</div>
      </div>

      <div className="card-info">
        <h3 className="card-title">{video.title}</h3>
        <div className="card-meta">
          <span className="match-mini" style={{ color: accent }}>
            98% Match
          </span>
          <span className="duration-mini">
            {formatDuration(video.duration)}
          </span>
        </div>
        <p className="card-tags">HD • {video.resolution || "1080p"}</p>
      </div>
    </div>
  );
}

export default VideoCatalog;
