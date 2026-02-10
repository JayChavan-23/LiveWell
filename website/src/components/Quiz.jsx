import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Quiz = ({ quiz, onComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [quizData, setQuizData] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (quiz && !showResults) {
      setTimeLeft(quiz.questions.length * 30); // 30 seconds per question
      setIsTimerRunning(true);
      setStartTime(Date.now());
    }
  }, [quiz, showResults]);

  const handleAnswerSelect = (questionId, selectedOption) => {
    console.log(`Answer selected for question ${questionId}: ${selectedOption}`);
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleSubmit = () => {
    console.log('Quiz submission triggered');
    console.log('Current answers:', answers);
    console.log('Current question:', currentQuestion);
    console.log('Total questions:', quiz.questions.length);
    
    setIsTimerRunning(false);
    let correctAnswers = 0;
    
    // Calculate score based on answered questions
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
    
    console.log('Final score calculated:', finalScore);
    console.log('Correct answers:', correctAnswers, 'out of', quiz.questions.length);
    console.log('Time spent:', timeSpent, 'seconds');
    
    setScore(finalScore);
    setShowResults(true);
    console.log('showResults set to true');
    
    // Store quiz data for when user completes
    setQuizData({
      score: finalScore,
      answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId: parseInt(questionId),
        selectedAnswer
      })),
      timeSpent
    });
    
    // Don't call onComplete here - wait for user to explicitly close the quiz
    // The completion will be tracked when they choose an action
  };

  const handleRetry = () => {
    // Track completion before resetting
    if (onComplete && quizData) {
      onComplete(quiz.id, quizData.score, quizData.answers, quizData.timeSpent);
    }
    
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setQuizData(null);
    setTimeLeft(quiz.questions.length * 30);
    setIsTimerRunning(true);
    setStartTime(Date.now());
  };

  const handleShare = () => {
    const shareText = `🎉 I just completed the ${quiz.title} on LiveWell with a score of ${score}%! Can you beat my score?`;
    
    if (navigator.share) {
      navigator.share({
        title: `LiveWell Quiz Result: ${quiz.title}`,
        text: shareText,
        url: window.location.origin
      }).catch((error) => {
        console.log('Error sharing:', error);
        fallbackShare(shareText);
      });
    } else {
      fallbackShare(shareText);
    }
  };

  const fallbackShare = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Quiz result copied to clipboard! You can now paste it anywhere to share.');
      }).catch(() => {
        alert(`Share this result:\n\n${text}`);
      });
    } else {
      alert(`Share this result:\n\n${text}`);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestion + 1) / quiz.questions.length) * 100;
  };

  const getTimeString = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent timer from auto-submitting when user is manually submitting
  useEffect(() => {
    let timer;
    if (isTimerRunning && timeLeft > 0 && !showResults) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning && !showResults) {
      handleSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isTimerRunning, showResults]);

  if (!quiz) return null;

  if (showResults) {
    console.log('Rendering results screen with score:', score);
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
          {/* Quiz Completion Badge */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fi fi-sr-trophy text-3xl text-white"></i> 
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
            <p className="text-gray-600">Congratulations on finishing the {quiz.title}</p>
          </div>

          {/* Score Display */}
          <div className="text-center mb-6">
            <div className="text-5xl font-bold text-green-600 mb-2">{score}%</div>
            <div className="text-lg text-gray-700">
              {score >= 90 ? '🏆 Outstanding!' :
               score >= 80 ? '🥇 Excellent!' :
               score >= 70 ? '🥈 Great Job!' :
               score >= 60 ? '🥉 Good Work!' :
               score >= 50 ? '👍 Well Done!' : '💪 Keep Learning!'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              You got {Object.values(answers).filter((answer, index) => 
                answer === quiz.questions[index].correctAnswer
              ).length} out of {quiz.questions.length} questions correct
            </p>
            <p className="text-xs text-green-600 mt-2 font-medium">
              <i className="fi fi-sr-check mr-1"></i>
              Your results have been saved!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleShare}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fi fi-sr-share"></i>
              <span>Share Result</span>
            </button>
            
            <button
              onClick={handleRetry}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fi fi-sr-refresh"></i>
              <span>Retry Quiz</span>
            </button>
            
            <button
              onClick={() => {
                // Call onComplete when user chooses to take another quiz
                if (onComplete && quizData) {
                  onComplete(quiz.id, quizData.score, quizData.answers, quizData.timeSpent);
                }
                onClose();
              }}
              className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fi fi-sr-list"></i>
              <span>Take Another Quiz</span>
            </button>
            
            <button
              onClick={() => {
                // Call onComplete when user chooses to go home
                if (onComplete && quizData) {
                  onComplete(quiz.id, quizData.score, quizData.answers, quizData.timeSpent);
                }
                navigate('/dashboard');
              }}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            >
              <i className="fi fi-sr-home"></i>
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <i className={`${quiz.icon} text-white text-lg`}></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-sm text-gray-600">Question {currentQuestion + 1} of {quiz.questions.length}</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{getTimeString(timeLeft)}</div>
            <div className="text-sm text-gray-600">Time Left</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{question.question}</h3>
          
          {/* Last Question Indicator */}
          {currentQuestion === quiz.questions.length - 1 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 text-center">
                <i className="fi fi-sr-check mr-2"></i>
                This is the last question! Click "Submit Quiz" when you're ready.
              </p>
            </div>
          )}
          
          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  answers[currentQuestion] === index
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}>
                    {answers[currentQuestion] === index && (
                      <i className="fi fi-sr-check text-white text-xs"></i>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <i className="fi fi-sr-arrow-left"></i>
            <span>Previous</span>
          </button>

          <div className="flex space-x-3">
            {currentQuestion < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={!answers[currentQuestion]}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Next</span>
                <i className="fi fi-sr-arrow-right"></i>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!answers[currentQuestion]}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>Submit Quiz</span>
                <i className="fi fi-sr-check"></i>
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="fi fi-sr-cross text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default Quiz;
