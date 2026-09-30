import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { BookOpen, Check, X, Award, MapPin, Sparkles, HelpCircle } from 'lucide-react';

export default function AwarenessPage() {
  const [guides, setGuides] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [points, setPoints] = useState([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    const fetchAwareness = async () => {
      try {
        const [gRes, qRes, pRes] = await Promise.all([
          api.get('/api/awareness/guides/').catch(() => ({ data: [] })),
          api.get('/api/awareness/quiz/').catch(() => ({ data: [] })),
          api.get('/api/awareness/collection-points/').catch(() => ({ data: [] })),
        ]);
        setGuides(gRes.data?.results || gRes.data || []);
        setQuizzes(qRes.data?.results || qRes.data || []);
        setPoints(pRes.data?.results || pRes.data || []);
      } catch (err) {
        console.error('Error fetching awareness data:', err);
      }
    };
    fetchAwareness();
  }, []);

  const handleAnswer = (optionIndex) => {
    setSelectedAnswer(optionIndex);
    const currentQ = quizzes[currentQuizIndex];
    if (optionIndex === currentQ?.correct_index) {
      setQuizScore(prev => prev + 1);
    }
    setTimeout(() => {
      if (currentQuizIndex + 1 < quizzes.length) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1200);
  };

  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <span className="text-xs font-semibold tracking-wider uppercase bg-white/20 px-3 py-1 rounded-full">
          Civic Education & Circular Economy
        </span>
        <h1 className="text-3xl font-extrabold mt-2 tracking-tight">Know Your Waste & Segregate Smartly</h1>
        <p className="text-teal-100 mt-1 max-w-xl text-sm">
          Proper segregation at source eliminates 70% of municipal dump pileups. Learn color codes, take the civic quiz, and locate dry waste deposit centers.
        </p>
      </div>

      {/* Segregation Guides */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" /> Waste Stream Separation Standards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(guides.length > 0 ? guides : [
            { id: 1, title: 'Wet & Organic Waste (Green Bin)', color: 'bg-emerald-50 border-emerald-300 text-emerald-800', description: 'Kitchen scraps, vegetable peels, leftovers, tea bags, garden trimmings.', icon: '🍏' },
            { id: 2, title: 'Dry & Recyclable Waste (Blue Bin)', color: 'bg-blue-50 border-blue-300 text-blue-800', description: 'Clean plastics, cardboard, papers, glass bottles, clean cans, packaging.', icon: '📦' },
            { id: 3, title: 'Domestic Hazardous (Red/Black Bin)', color: 'bg-rose-50 border-rose-300 text-rose-800', description: 'Batteries, expired medicines, sanitary waste, chemical containers.', icon: '⚠️' },
          ]).map((g, idx) => (
            <div key={g.id || idx} className={`p-5 rounded-2xl border ${g.color || 'bg-slate-50 border-slate-200'} space-y-2`}>
              <div className="text-2xl">{g.icon || '♻️'}</div>
              <h3 className="font-bold text-base text-slate-900">{g.title || g.category}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{g.description || g.items}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Civic Quiz */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">Civic Waste IQ Quiz</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {quizzes.length > 0 && !quizFinished ? `Question ${currentQuizIndex + 1} of ${quizzes.length}` : 'Segregation Practice'}
          </span>
        </div>

        {quizzes.length > 0 && !quizFinished ? (
          <div className="space-y-4 max-w-xl">
            <h4 className="font-bold text-slate-900 text-sm">{quizzes[currentQuizIndex]?.question}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(quizzes[currentQuizIndex]?.options || []).map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === quizzes[currentQuizIndex]?.correct_index;
                let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (isSelected) {
                  btnStyle = isCorrect ? 'bg-emerald-500 text-white font-bold' : 'bg-rose-500 text-white font-bold';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className={`p-3 text-left border rounded-xl text-xs transition flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isSelected && (isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : quizFinished ? (
          <div className="p-6 text-center space-y-3">
            <div className="text-3xl font-extrabold text-emerald-600">Great Job! 🎉</div>
            <p className="text-sm text-slate-600">
              You scored <strong>{quizScore}</strong> out of {quizzes.length}! You're certified as a Civic Cleanliness Champion.
            </p>
            <button
              onClick={restartQuiz}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <strong>Bonus Tip:</strong> Always rinse beverage containers before disposing into the dry waste bin to prevent flies and odor!
          </div>
        )}
      </div>

      {/* Designated Collection Depots */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" /> Authorized Public Drop-Off Centers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(points.length > 0 ? points : [
            { id: 1, name: 'Connaught Place Smart Depository', address: 'Block C, Radial Road 2, New Delhi', type: 'E-Waste & Dry Recyclables' },
            { id: 2, name: 'Lodhi Road Bio-Methanation Center', address: 'Near Lodhi Colony Flyover, New Delhi', type: 'Organic Compost Drop-off' }
          ]).map((pt, i) => (
            <div key={pt.id || i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
              <span className="font-bold text-slate-900 text-sm">{pt.name}</span>
              <div className="text-xs text-slate-500">{pt.address}</div>
              <div className="text-[11px] text-blue-600 font-semibold pt-1">Type: {pt.type || 'General Material Recovery'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
