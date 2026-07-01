import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";

import { Toaster, toast } from "react-hot-toast";
import { Star, Send, User, MessageSquareDashed } from "lucide-react";

const CommunityFeedback = ({ ideaId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [feedback, setFeedback] = useState("");
  const [clarity, setClarity] = useState(0);
  const [market, setMarket] = useState(0);
  const [difficulty, setDifficulty] = useState(0);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ideaId) return;
    const q = query(
      collection(db, `ideas/${ideaId}/comments`),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFeedbacks(data);
    });

    return () => unsubscribe();
  }, [ideaId]);

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
      <div className="flex gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            onClick={() => setValue(star)}
            className={`cursor-pointer transition-colors duration-150 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mt-8" id="comments-section">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Community Feedback ({feedbacks.length})
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What's your take on this idea?"
            className="w-full h-32 border border-gray-300 rounded-lg p-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y text-base text-gray-800"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Problem Clarity</h3>
            <RatingStars value={clarity} setValue={setClarity} />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Market Demand</h3>
            <RatingStars value={market} setValue={setMarket} />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="font-semibold text-gray-700 text-sm">Execution Difficulty</h3>
            <RatingStars value={difficulty} setValue={setDifficulty} />
          </div>
        </div>

        <div className="flex justify-start pt-2">
          <button
            onClick={handleSubmitFeedback}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-50 transition-colors w-full sm:w-auto"
          >
            <Send size={18} />
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-xl font-bold mb-4 text-gray-900">
          Community Responses
        </h3>
        
        <div className="space-y-6">
            {feedbacks.map((item, i) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.userName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                        : "Just now"}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 text-base leading-relaxed mb-4">
                  {item.feedback || item.text}
                </p>

                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-50 rounded px-3 py-1.5 border border-gray-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Problem</span>
                    <div className="flex gap-0.5">
                      {"⭐".repeat(item.clarity || item.ratings?.problemClarity || item.problemClarity || 0)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-1.5 border border-gray-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Demand</span>
                    <div className="flex gap-0.5">
                      {"⭐".repeat(item.market || item.ratings?.marketDemand || item.marketDemand || 0)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded px-3 py-1.5 border border-gray-200 flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Difficulty</span>
                    <div className="flex gap-0.5">
                      {"⭐".repeat(item.difficulty || item.ratings?.executionDifficulty || item.executionDifficulty || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {feedbacks.length === 0 && (
            <div className="py-6">
              <p className="text-gray-600 text-lg mb-4">Be the first to share your thoughts with the community!</p>
              <button
                onClick={() => document.querySelector('textarea').focus()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2 rounded-lg font-medium transition-colors text-sm border border-gray-200 shadow-sm"
              >
                Write a response
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeedback;
