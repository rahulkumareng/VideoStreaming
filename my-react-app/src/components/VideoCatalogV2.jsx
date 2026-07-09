import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getThumbnailUrl, getManifestUrl } from "../config/env";
import styles from "./VideoCatalogV2.module.css";

const ACCENTS = ["#e50914", "#ffa53d", "#9b5de5", "#00c2d1"];

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
      <div className={styles.netflixLoading}>
        <div className={styles.netflixSpinner}></div>
        <p>Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button className={styles.errorBtn} onClick={loadVideos}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.netflixCatalog}>
      {heroVideo && (
        <HeroSection
          video={heroVideo}
          navigate={navigate}
          accent={ACCENTS[0]}
        />
      )}

      <div className={styles.contentRows}>
        <VideoRow
          title="Trending Now"
          videos={videos.slice(0, 6)}
          formatDuration={formatDuration}
          navigate={navigate}
        />

        {videos.length > 3 && (
          <VideoRow
            title="Continue Watching"
            videos={videos.slice(3, 9)}
            formatDuration={formatDuration}
            navigate={navigate}
          />
        )}

        {videos.length > 6 && (
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
    <div className={styles.heroSection}>
      <div className={styles.heroBackdrop}>
        <img src={video.thumbnail} alt={video.title} />
        <div className={styles.heroGradient}></div>
      </div>

      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          <span
            className={styles.heroDot}
            style={{ background: accent }}
          ></span>
          {video.title}
        </h1>
        <div className={styles.heroMeta}>
          <span className={styles.matchPill} style={{ background: accent }}>
            98% Match
          </span>
          <span className={styles.year}>
            {new Date(video.createdAt).getFullYear()}
          </span>
          <span className={styles.rating}>HD</span>
        </div>
        <p className={styles.heroDescription}>
          Watch your uploaded video in stunning quality. Stream instantly across
          all your devices with fast global CDN delivery.
        </p>
        <div className={styles.heroButtons}>
          <button
            className={styles.playBtn}
            onClick={() => navigate(`/watch/${video.videoId}`)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play
          </button>
          <button className={styles.infoBtn}>
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
  const rowContentRef = useRef(null);
  const [visibleIds, setVisibleIds] = useState(new Set());

  // Function to handle custom native sliding mechanics via button anchors
  const scrollTrack = (direction) => {
    if (rowContentRef.current) {
      const { scrollLeft, clientWidth } = rowContentRef.current;
      const offset =
        direction === "left"
          ? scrollLeft - clientWidth * 0.75
          : scrollLeft + clientWidth * 0.75;
      rowContentRef.current.scrollTo({ left: offset, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const container = rowContentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const vId = entry.target.dataset.id;
            if (vId) {
              if (entry.intersectionRatio >= 0.99) {
                next.add(vId);
              } else {
                next.delete(vId);
              }
            }
          });
          return next;
        });
      },
      {
        root: container,
        threshold: 0.99,
      },
    );

    const cards = container.querySelectorAll(`.${styles.videoCard}`);
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [videos]);

  return (
    <div className={styles.rowContainer}>
      <h2 className={styles.rowTitle}>{title}</h2>

      <button
        className={`${styles.rowArrow} ${styles.rowArrowLeft}`}
        onClick={() => scrollTrack("left")}
      >
        ‹
      </button>

      <div ref={rowContentRef} className={styles.rowContent}>
        {videos.map((video, index) => {
          const isFullyVisible = visibleIds.has(String(video.videoId));
          return (
            <VideoCard
              key={video.videoId}
              video={video}
              index={index}
              isFullyVisible={isFullyVisible}
              formatDuration={formatDuration}
              navigate={navigate}
            />
          );
        })}
      </div>

      <button
        className={`${styles.rowArrow} ${styles.rowArrowRight}`}
        onClick={() => scrollTrack("right")}
      >
        ›
      </button>
    </div>
  );
}

function VideoCard({ video, index, isFullyVisible, formatDuration, navigate }) {
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <div
      data-id={video.videoId}
      className={`${styles.videoCard} ${!isFullyVisible ? styles.clippedEdge : ""}`}
      style={{ animationDelay: `${index * 50}ms`, "--card-accent": accent }}
      onClick={() => navigate(`/watch/${video.videoId}`)}
    >
      <div className={styles.cardThumbnail}>
        <img src={video.thumbnail} alt={video.title} loading="lazy" />
        <div className={styles.cardOverlay}>
          <div className={styles.cardActions}>
            <button
              className={`${styles.actionBtn} ${styles.play}`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/watch/${video.videoId}`);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="black">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            <button
              className={`${styles.actionBtn} ${styles.info}`}
              onClick={(e) => {
                e.stopPropagation();
                // Add your custom programmatic model view overrides here if needed
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div className={styles.cardDuration}>
            {formatDuration(video.duration)}
          </div>
        </div>
      </div>

      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{video.title}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.matchMini} style={{ color: accent }}>
            98% Match
          </span>
          <span className={styles.durationMini}>
            {formatDuration(video.duration)}
          </span>
        </div>
        <p className={styles.cardTags}>HD • {video.resolution || "1080p"}</p>
      </div>
    </div>
  );
}

export default VideoCatalog;
