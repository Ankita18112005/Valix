import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase"; // Fixed import path
import { generateKeywords } from "../lib/keywords";
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

    try {
      const generatedKeywords = generateKeywords(title, problem, solution, targetUsers, monetization, ...tags);

      await addDoc(collection(db, "ideas"), {
        title,
        problem,
        solution,
        targetUsers,
        monetization,
        tags,
        keywords: generatedKeywords,
        userId: user.uid,
        author: { name: user.displayName || 'User' }, // Prevent crashing IdeaCard
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0,
        validationScore: 0,
        votes: { useful: 0, wouldPay: 0, needsWork: 0 } // Prevent crashing IdeaCard
      });

      alert("Idea submitted successfully 🚀");

      // Reset form
      setTitle("");
      setProblem("");
      setSolution("");
      setTargetUsers("");
      setMonetization("");
      setTags([]);

      // Redirect to profile so user sees their new idea
      navigate('/profile');

    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit idea. Check console.");
    }

    setLoading(false);
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
            className={`create-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
            id="create-submit"
          >
            {loading ? <span className="auth-spinner" /> : 'Submit for Validation'}
          </button>
        </form>
      </div>
    </div>
  );
}