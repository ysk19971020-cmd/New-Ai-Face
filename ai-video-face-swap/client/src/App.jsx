import { useState } from "react";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Sparkles,
  Download,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [face, setFace] = useState(null);
  const [video, setVideo] = useState(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  function selectFile(file, type) {
    if (!file) return;

    setError("");
    setResult("");

    if (type === "face") {
      if (!file.type.startsWith("image/")) {
        setError("කරුණාකර Image එකක් තෝරන්න.");
        return;
      }
      setFace(file);
    } else {
      if (!file.type.startsWith("video/")) {
        setError("කරුණාකර Video එකක් තෝරන්න.");
        return;
      }
      setVideo(file);
    }
  }

  async function createSwap() {
    if (!face || !video) {
      setError("Photo එක සහ Video එක දෙකම Upload කරන්න.");
      return;
    }

    if (!consent) {
      setError("මුහුණ සහ වීඩියෝව භාවිත කිරීමට අවසර ඇති බව තහවුරු කරන්න.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setStatus("වීඩියෝව Upload කරමින්...");

    try {
      const formData = new FormData();
      formData.append("face", face);
      formData.append("video", video);

      const response = await fetch(`${API_URL}/api/swap`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload කිරීම අසාර්ථකයි.");
      }

      const jobId = data.jobId;

      if (!jobId) {
        throw new Error("Server එකෙන් Job ID එකක් ලැබුණේ නැහැ.");
      }

      setStatus("AI මඟින් මුහුණ මාරු කරමින්...");

      // Check the job status every 3 seconds.
      const deadline = Date.now() + 15 * 60 * 1000;

      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(
          `${API_URL}/api/jobs/${jobId}`
        );

        const job = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(job.error || "Job එක සොයාගත නොහැක.");
        }

        if (job.status === "succeeded" && job.output) {
          setResult(job.output);
          setStatus("වීඩියෝව සාර්ථකව සකස් කළා!");
          return;
        }

        if (job.status === "failed") {
          throw new Error(job.error || "Face Swap අසාර්ථකයි.");
        }
      }

      throw new Error(
        "Processing සඳහා වැඩි කාලයක් ගතවෙනවා. පසුව නැවත පරීක්ෂා කරන්න."
      );
    } catch (err) {
      setError(err.message || "දෝෂයක් සිදුවුණා.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand-icon">
          <Sparkles size={23} />
        </div>

        <div>
          <h2>FaceSwap AI</h2>
          <span>VIDEO CREATOR STUDIO</span>
        </div>

        <div className="secure-badge">
          <ShieldCheck size={15} />
          AI Studio
        </div>
      </header>

      <section className="hero">
        <span className="eyebrow">
          <Sparkles size={14} /> AI VIDEO TECHNOLOGY
        </span>

        <h1>
          Your Face.
          <br />
          <span>Your Video.</span>
        </h1>

        <p>
          ඔබේ Photo එක Upload කරන්න.
          වීඩියෝවක මුහුණ ඔබේ මුහුණට මාරු කරන්න.
        </p>
      </section>

      <section className="upload-grid">
        <div className="upload-card">
          <div className="card-heading">
            <ImageIcon size={20} />
            <span>01 — FACE PHOTO</span>
          </div>

          <label className="dropzone">
            {face ? (
              <>
                <img
                  className="face-preview"
                  src={URL.createObjectURL(face)}
                  alt="Selected face"
                />
                <strong>{face.name}</strong>
                <span>වෙනත් Photo එකක් තෝරන්න</span>
              </>
            ) : (
              <>
                <Upload size={32} />
                <strong>මුහුණේ Photo එක තෝරන්න</strong>
                <span>JPG, PNG හෝ WEBP</span>
              </>
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => selectFile(e.target.files?.[0], "face")}
            />
          </label>

          {face && (
            <button
              className="remove-button"
              onClick={() => setFace(null)}
              type="button"
            >
              <X size={15} /> Remove Photo
            </button>
          )}
        </div>

        <div className="upload-card">
          <div className="card-heading">
            <Video size={20} />
            <span>02 — TARGET VIDEO</span>
          </div>

          <label className="dropzone">
            {video ? (
              <>
                <Video size={34} />
                <strong>{video.name}</strong>
                <span>වෙනත් Video එකක් තෝරන්න</span>
              </>
            ) : (
              <>
                <Upload size={32} />
                <strong>වීඩියෝව තෝරන්න</strong>
                <span>MP4, MOV හෝ WEBM</span>
              </>
            )}

            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={(e) => selectFile(e.target.files?.[0], "video")}
            />
          </label>

          {video && (
            <button
              className="remove-button"
              onClick={() => setVideo(null)}
              type="button"
            >
              <X size={15} /> Remove Video
            </button>
          )}
        </div>
      </section>

      <label className="consent-box">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />

        <span>
          මෙම Photo සහ Video භාවිත කිරීමට මට අවසර තිබෙන බව තහවුරු කරමි.
        </span>
      </label>

      <button
        className="create-button"
        onClick={createSwap}
        disabled={loading || !face || !video}
      >
        {loading ? (
          <>
            <LoaderCircle className="spin" size={20} />
            Processing...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Create Face Swap
          </>
        )}
      </button>

      {status && (
        <div className="status-box">
          {loading && <LoaderCircle className="spin" size={18} />}
          <span>{status}</span>
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {result && (
        <section className="result-card">
          <h2>
            <Sparkles size={21} /> Your AI Video
          </h2>

          <video
            src={result}
            controls
            playsInline
            className="result-video"
          />

          <a
            className="download-button"
            href={result}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={19} />
            Open / Download Video
          </a>

          <p className="result-note">
            මෙය AI මඟින් වෙනස් කළ වීඩියෝවකි.
          </p>
        </section>
      )}

      <footer>
        <ShieldCheck size={16} />
        <span>
          Use authorized content. Respect privacy and consent.
        </span>
      </footer>
    </main>
  );
}
