import React, { useState, useEffect } from 'react';
import { BookOpen, Share2, Check, X } from 'lucide-react';

const BOOKS = [
  { title: "My Brilliant Friend", author: "Elena Ferrante" },
  { title: "Anna Karenina", author: "Leo Tolstoy" },
  { title: "Crying in H Mart", author: "Michelle Zauner" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "A Room of One's Own", author: "Virginia Woolf" },
  { title: "Atonement", author: "Ian McEwan" },
  { title: "The English Patient", author: "Michael Ondaatje" },
  { title: "One Hundred Years of Solitude", author: "Gabriel Garcia Marquez" },
  { title: "Romance of the Three Kingdoms", author: "Luo Guanzhong" },
  { title: "A Tree Grows in Brooklyn", author: "Betty Smith" },
  { title: "Normal People", author: "Sally Rooney" },
  { title: "The Namesake", author: "Jhumpa Lahiri" },
  { title: "Americanah", author: "Chimamanda Ngozi Adichie" },
  { title: "The Vanishing Half", author: "Brit Bennett" },
  { title: "Sula", author: "Toni Morrison" },
  { title: "Convenience Store Woman", author: "Sayaka Murata" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { title: "A Portrait of the Artist as a Young Man", author: "James Joyce" },
  { title: "Charlotte's Web", author: "E.B. White" },
  { title: "The Odyssey", author: "Homer" },
  { title: "All Fours", author: "Miranda July" },
  { title: "Yellowface", author: "R.F. Kuang" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky" },
  { title: "The Anthropocene Reviewed", author: "John Green" },
  { title: "The Goldfinch", author: "Donna Tartt" },
  { title: "Maximum Ride", author: "James Patterson" },
  { title: "Twilight", author: "Stephenie Meyer" },
  { title: "The Hunger Games", author: "Suzanne Collins" },
  { title: "Small Things Like These", author: "Claire Keegan" },
  { title: "The Unbearable Lightness of Being", author: "Milan Kundera" }
];

const MAX_GUESSES = 5;

const getDayIndex = () => {
  const start = new Date('2025-01-01');
  const today = new Date();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff % BOOKS.length;
};

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const App = () => {
  const [currentBook, setCurrentBook] = useState(null);
  const [bookData, setBookData] = useState(null);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initGame = async () => {
      const todayBook = BOOKS[getDayIndex()];
      setCurrentBook(todayBook);

      // Check localStorage for today's progress
      const today = getTodayString();
      const saved = localStorage.getItem('guessShu');
      
      if (saved) {
        const data = JSON.parse(saved);
        if (data.date === today) {
          setGuesses(data.guesses || []);
          setGameState(data.gameState || 'playing');
        } else {
          // New day, clear old data
          localStorage.removeItem('guessShu');
        }
      }

      // Fetch book data from OpenLibrary
      try {
        // First, search for the book
        const searchQuery = `title=${todayBook.title}`;
        // console.log(`https://openlibrary.org/search.json?title=${encodeURIComponent(todayBook.title)}&limit=5`);
        const searchResponse = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(todayBook.title)}&limit=5`,);
        const searchData = await searchResponse.json();
        
        if (searchData.docs && searchData.docs.length > 0) {
          // Find the best match (exact title match preferred)
          const exactMatch = searchData.docs.find(doc => 
            doc.title && doc.title.toLowerCase() === todayBook.title.toLowerCase()
          ) || searchData.docs[0];
          
          setBookData({
            coverId: exactMatch.cover_i,
            firstPublishYear: exactMatch.first_publish_year,
            subject: exactMatch.subject ? exactMatch.subject.slice(0, 3).join(', ') : 'Literary Fiction',
            description: exactMatch.first_sentence ? exactMatch.first_sentence[0] : ''
          });
          // console.log(bookData);

        }
      } catch (err) {
        console.error('Error fetching book data:', err);
      }
      
      setLoading(false);
    };

    initGame();
  }, []);

  useEffect(() => {
    if (currentBook) {
      const today = getTodayString();
      localStorage.setItem('guessShu', JSON.stringify({
        date: today,
        guesses,
        gameState
      }));
    }
  }, [guesses, gameState, currentBook]);

  const handleGuess = () => {
    if (!guess.trim() || gameState !== 'playing') return;

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);

    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedTitle = currentBook.title.toLowerCase().trim();

    if (normalizedGuess === normalizedTitle) {
      setGameState('won');
      setError('');
    } else {
      if (newGuesses.length >= MAX_GUESSES) {
        setGameState('lost');
      }
      setError('Incorrect guess. Try again!');
      setTimeout(() => setError(''), 2000);
    }

    setGuess('');
  };

  const getPixelation = () => {
    if (gameState !== 'playing') return 0;
    const level = Math.max(0, 40 - (guesses.length * 8));
    return level;
  };

  const getMaskedTitle = () => {
    if (!currentBook) return '';
    return currentBook.title.split('').map(char => 
      char === ' ' ? ' ' : '_'
    ).join('');
  };

  const shareResults = () => {
    const emoji = gameState === 'won' ? '📚' : '📖';
    const guessCount = gameState === 'won' ? guesses.length : 'X';
    const text = `Guess Shu ${getTodayString()}\n${emoji} ${guessCount}/${MAX_GUESSES}\n\n${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-amber-900 text-xl">Loading today's book...</div>
      </div>
    );
  }

  const coverUrl = bookData?.coverId 
    ? `https://covers.openlibrary.org/b/id/${bookData.coverId}-L.jpg`
    : null;

  return (
    <div className="min-h-screen bg-amber-50 py-8 px-4 font-serif">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BookOpen className="text-amber-900" size={32} />
            <h1 className="text-4xl font-serif font-bold text-amber-900">Guess Shu (书)</h1>
          </div>
          <p className="text-amber-700 font-serif">Because you need another book for your TBR.</p>
        </div>

        {/* Game Area */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Book Cover */}
          <div className="mb-6 flex justify-center">
            <div 
              className="relative w-64 h-96 bg-gray-200 rounded-lg overflow-hidden"
              style={{
                filter: `blur(${getPixelation()}px)`,
                transition: 'filter 0.5s ease'
              }}
            >
              {coverUrl ? (
                <img 
                  src={coverUrl} 
                  alt="Book cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200">
                  <BookOpen size={64} className="text-amber-400" />
                </div>
              )}
            </div>
          </div>

          {/* Title Mask */}
          <div className="text-center mb-6">
            <div className="text-3xl font-mono tracking-wider text-amber-900">
              {gameState === 'playing' ? getMaskedTitle() : currentBook.title}
            </div>
            {gameState !== 'playing' && (
              <div className="text-xl text-amber-700 mt-2">
                by {currentBook.author}
              </div>
            )}
          </div>

          {/* Guesses Counter */}
          <div className="text-center mb-4">
            <span className="text-lg font-semibold text-amber-900">
              Guesses: {guesses.length}/{MAX_GUESSES}
            </span>
          </div>

          {/* Input Area */}
          {gameState === 'playing' && (
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                  placeholder="Enter book title..."
                  className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleGuess}
                  className="px-6 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors font-semibold"
                >
                  Guess
                </button>
              </div>
              {error && (
                <div className="mt-2 text-red-600 text-center flex items-center justify-center gap-1">
                  <X size={16} />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Game Over State */}
          {gameState !== 'playing' && bookData && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-2 text-lg">
                  <Check className="text-green-600" />
                  <span className="font-semibold text-amber-900">
                    {gameState === 'won' 
                      ? `You got it in ${guesses.length} guess${guesses.length === 1 ? '' : 'es'}!` 
                      : 'Better luck tomorrow!'}
                  </span>
                </div>
                
                <div className="space-y-2 text-amber-900">
                  <p><span className="font-semibold">Title:</span> {currentBook.title}</p>
                  <p><span className="font-semibold">Author:</span> {currentBook.author}</p>
                  {bookData.firstPublishYear && (
                    <p><span className="font-semibold">Published:</span> {bookData.firstPublishYear}</p>
                  )}
                  {bookData.subject && (
                    <p><span className="font-semibold">Genre:</span> {bookData.subject}</p>
                  )}
                </div>

                <button
                  onClick={shareResults}
                  className="w-full mt-4 px-6 py-3 bg-amber-900 text-white rounded-lg hover:bg-amber-800 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Share2 size={18} />
                  Share Results
                </button>
              </div>

              <div className="text-center text-amber-700">
                Come back tomorrow for a new book!
              </div>
            </div>
          )}

          {/* Previous Guesses */}
          {guesses.length > 0 && gameState === 'playing' && (
            <div className="mt-6 pt-6 border-t border-amber-200">
              <h3 className="font-semibold text-amber-900 mb-2">Previous Guesses:</h3>
              <div className="space-y-1">
                {guesses.map((g, i) => (
                  <div key={i} className="text-amber-700 text-sm">
                    {i + 1}. {g}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-amber-700 text-sm font-serif">
          A new book every day • Share with fellow readers
        </div>
      </div>
    </div>
  );
};

export default App;