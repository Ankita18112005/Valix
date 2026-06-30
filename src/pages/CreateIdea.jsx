import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldAlert } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { generateKeywords } from "../lib/keywords";
import { checkDuplicateIdea } from "../services/duplicateDetection";
import { moderateIdea } from "../services/ideaModeration";
import Navbar from "../components/Navbar";
import "./CreateIdea.css";

export default function CreateIdea({ showToast }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [monetization, setMonetization] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);

  // Moderation & Progress States
  const [progressStep, setProgressStep] = useState(null); // null | 'analyzing' | 'quality' | 'duplicates' | 'saving'
  const [rejectionModal, setRejectionModal] = useState({ show: false, reasons: [] });

  const tagOptions = [
    "AI", "SaaS", "FinTech", "EdTech", "HealthTech", "CleanTech", 
    "DevTools", "B2B", "B2C", "Mobile", "Marketplace", "Social"
  ];

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      return;
    }

    setLoading(true);
    setProgressStep("analyzing");
    const reasons = [];

    const ideaInput = { title, problem, solution, targetUsers, monetization, tags };

    try {
      // 1. AI Quality & Spam Validation
      setProgressStep("quality");
      const modResult = await moderateIdea(ideaInput);

      if (!modResult.passed) {
        reasons.push(...modResult.reasons);
      }

      // 2. Duplicate Detection
      setProgressStep("duplicates");
      const dupResult = await checkDuplicateIdea(ideaInput);

      if (dupResult.isDuplicate) {
        reasons.push(`Too similar to existing idea: "${dupResult.similarIdea.title}" (${dupResult.score}% match)`);
      }

      // 3. Evaluate results: All or nothing
      if (reasons.length > 0) {
        // Validation failed, DO NOT save to main ideas
        
        // (Optional) Log to rejected metric silently in the background
        addDoc(collection(db, "rejected_ideas"), {
          ...ideaInput,
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: "rejected",
          rejectionReasons: reasons,
          isSpam: true
        }).catch(err => console.error("Failed to log rejected idea:", err));

        setRejectionModal({ show: true, reasons });
        setLoading(false);
        setProgressStep(null);
        return; // Halt submission completely
      }

      // 4. Save to Firestore directly if all good
      const ideaToSave = {
        ...ideaInput,
        keywords: generateKeywords(title, problem, solution, targetUsers, monetization, ...tags),
        userId: user.uid,
        author: { name: user.displayName || 'User' },
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
        validationScore: 0,
        votes: { useful: 0, wouldPay: 0, needsWork: 0 },
        qualityScore: modResult.qualityScore,
        qualityLevel: modResult.qualityLevel,
        aiReview: {
          qualityScore: modResult.qualityScore,
          qualityLevel: modResult.qualityLevel,
        }
      };

      await saveIdea(ideaToSave);

    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit idea. Check console.");
      setLoading(false);
      setProgressStep(null);
    }
  };

  const saveIdea = async (ideaData) => {
    setProgressStep("saving");
    setLoading(true);
    try {
      await addDoc(collection(db, "ideas"), ideaData);
      showToast("Idea submitted successfully 🚀");
      
      // Reset form
      setTitle("");
      setProblem("");
      setSolution("");
      setTargetUsers("");
      setMonetization("");
      setTags([]);
      
      navigate('/profile');
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save idea.");
    } finally {
      setLoading(false);
      setProgressStep(null);
    }
  };

  return (
    <div className="create-page" id="create-idea-page">
      <Navbar showToast={showToast} />
      <div className="create-container">
        <div className="create-header animate-fade-in-up">
          <h1 className="create-title">Submit a New Idea</h1>
          <p className="create-sub">Describe your startup concept for the community to validate.</p>
        </div>

        <form className="create-form animate-fade-in-up delay-1" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="idea-title">Idea Title</label>
            <input
              id="idea-title" type="text" className="form-input"
              placeholder="e.g., EcoTrack — Carbon Footprint for Consumers"
              value={title} onChange={(e) => setTitle(e.target.value)}
              required
            />
            <span className="form-hint">Give your idea a catchy, descriptive name</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="idea-problem">Problem Statement</label>
            <textarea
              id="idea-problem" className="form-textarea" rows={4}
              placeholder="What problem does this solve? Who experiences it?"
              value={problem} onChange={(e) => setProblem(e.target.value)}
              required
            />
            <span className="form-hint">Clearly define the pain point you're addressing</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="idea-solution">Proposed Solution</label>
            <textarea
              id="idea-solution" className="form-textarea" rows={4}
              placeholder="How does your product or service solve this problem?"
              value={solution} onChange={(e) => setSolution(e.target.value)}
              required
            />
            <span className="form-hint">Describe your approach and key differentiators</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="idea-target">Target Users</label>
              <input
                id="idea-target" type="text" className="form-input"
                placeholder="e.g., Small business owners"
                value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)}
                required
              />
              <span className="form-hint">Who are your primary customers?</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="idea-monetization">Monetization Strategy</label>
              <input
                id="idea-monetization" type="text" className="form-input"
                placeholder="e.g., Freemium SaaS at $29/mo"
                value={monetization} onChange={(e) => setMonetization(e.target.value)}
                required
              />
              <span className="form-hint">How will you generate revenue?</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="form-tags">
              {tagOptions.map((tag) => (
                <button
                  key={tag} type="button"
                  className={`form-tag-chip ${tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {tags.includes(tag) && <X size={12} />}
                </button>
              ))}
            </div>
            <span className="form-hint">Select relevant categories for your idea</span>
          </div>

          <button
            type="submit"
            className={`create-submit ${loading && !progressStep ? 'loading' : ''}`}
            disabled={loading}
            id="create-submit"
          >
            {loading && !progressStep ? <span className="auth-spinner" /> : 'Submit for Validation'}
          </button>
        </form>
      </div>

      {/* Progress Overlay */}
      {progressStep && (
        <div className="mod-overlay">
          <div className="mod-progress-box">
            <div className="auth-spinner mod-spinner" />
            <h3 className="mod-title">
              {progressStep === 'analyzing' && "Analyzing your startup idea..."}
              {progressStep === 'quality' && "Running AI validation..."}
              {progressStep === 'duplicates' && "Checking duplicates..."}
              {progressStep === 'saving' && "Saving..."}
            </h3>
          </div>
        </div>
      )}

      {/* Unified Rejection Modal */}
      {rejectionModal.show && (
        <div className="mod-overlay">
          <div className="mod-modal mod-reject">
            <button className="mod-close-btn" onClick={() => setRejectionModal({ show: false, reasons: [] })}>
              <X size={20} />
            </button>
            <ShieldAlert size={48} className="mod-icon error" />
            <h2 className="mod-title">Idea Rejected</h2>
            <p className="mod-desc">Your submission did not meet the validation criteria.</p>
            
            <div className="mod-reason-box" style={{ textAlign: "left" }}>
              <strong>Reasons:</strong>
              <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                {rejectionModal.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            
            <button className="mod-btn primary" onClick={() => setRejectionModal({ show: false, reasons: [] })}>
              Edit Idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}