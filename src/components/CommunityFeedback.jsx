import React, { useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";

import { Toaster, toast } from "react-hot-toast";
import { Star, Send } from "lucide-react";

const CommunityFeedback = ({ ideaId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [feedback, setFeedback] = useState("");
  const [clarity, setClarity] = useState(0);
  const [market, setMarket] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!currentUser) {
      toast.error("Please sign in to share feedback");
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    if (clarity === 0 || market === 0 || difficulty === 0) {
        toast.error("Please provide ratings for all criteria");
        return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, `ideas/${ideaId}/comments`), {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        feedback: feedback,
        text: feedback,
        clarity,
        market,
        difficulty,
        ratings: {
          problemClarity: clarity,
          marketDemand: market,
          executionDifficulty: difficulty
        },
        problemClarity: clarity,
        marketDemand: market,
        executionDifficulty: difficulty,
        createdAt: serverTimestamp(),
      });

      try {
        await updateDoc(doc(db, 'ideas', ideaId), {
           commentCount: increment(1)
        });
      } catch (updateErr) {
        console.error("Failed to update comment count:", updateErr);
      }

      toast.success("Feedback submitted successfully!");

      setFeedback("");
      setClarity(0);
      setMarket(0);
      setDifficulty(0);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message ? `Error: ${error.message}` : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ value, setValue }) => {
    return (
      <div className="flex gap-1.5 mt-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={22}
            onClick={() => setValue(star)}
            className={`cursor-pointer transition-all duration-200 hover:scale-110 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                : "text-gray-200 hover:text-yellow-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 mt-8 mb-12" 
      id="comments-section"
      style={{ padding: '2rem' }}
    >
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ marginBottom: '0.5rem' }}>
          Community Feedback
        </h2>
        <p className="text-gray-500 text-sm">Share your thoughts to help improve this idea.</p>
      </div>

      <div className="space-y-8" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What's your take on this idea?"
            className="w-full h-36 border border-gray-200 rounded-xl p-5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y text-base text-gray-800 placeholder:text-gray-400 bg-gray-50/50"
            style={{ width: '100%', padding: '1.25rem' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:border-blue-100 hover:shadow-md group">
            <h3 className="font-semibold text-gray-800 text-sm tracking-wide group-hover:text-blue-600 transition-colors">Problem Clarity</h3>
            <RatingStars value={clarity} setValue={setClarity} />
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:border-blue-100 hover:shadow-md group">
            <h3 className="font-semibold text-gray-800 text-sm tracking-wide group-hover:text-blue-600 transition-colors">Market Demand</h3>
            <RatingStars value={market} setValue={setMarket} />
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:border-blue-100 hover:shadow-md group">
            <h3 className="font-semibold text-gray-800 text-sm tracking-wide group-hover:text-blue-600 transition-colors">Execution Difficulty</h3>
            <RatingStars value={difficulty} setValue={setDifficulty} />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmitFeedback}
            disabled={loading}
            className="flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:shadow-none transition-all w-full md:w-auto text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} strokeWidth={2.5} />
            )}
            {loading ? "Submitting Feedback..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityFeedback;
