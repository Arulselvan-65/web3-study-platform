import { useEffect, useState, useRef } from 'react';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

interface BlogEntry {
  id: string;
  topic: string;
  content: string;
  story: string;
  timestamp: number;
}

const DELAY_BETWEEN_REQUESTS = 10000;

const App = () => {
  const [entries, setEntries] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const fetchInProgress = useRef(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  const cleanFormatting = (text: string): string => {
    return text
    .replace(/\*\*.*?\*\*/g, '')  
    .replace(/\*.*?\*/g, '')      
    .replace(/\*+/g, '')  
    .replace(/\*/g, '')
    .replace(/#{1,3}\s/g, '')    
    .trim();

  };

  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> => {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        if (retries > 0) {
          await sleep(DELAY_BETWEEN_REQUESTS);
          return fetchWithRetry(url, options, retries - 1);
        }
      }

      return response;
    } catch (error) {
      if (retries > 0) {
        await sleep(DELAY_BETWEEN_REQUESTS);
        return fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  };


  const fetchBlogContent = async (topic: string): Promise<BlogEntry> => {
    const cleanTopic = cleanFormatting(topic);
    
    const prompt = `
      Write an engaging blog post about ${cleanTopic} in Web3 and blockchain technology.
      
      First section: A clear, conversational explanation for beginners.
      Focus on real impact and importance.

      Second section: A relatable real-world story or analogy that makes 
      this concept memorable. And must should start with any one of this /Let me share a story:|Here's a story:|To illustrate this:|As an analogy:|To put this in perspective:

      Write naturally, like explaining to a friend.
    `;

  
    try {
      const response = await fetchWithRetry(
        "https://web3-study-platform.onrender.com/api/web3data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: prompt }),
        }
      );

      const data = await response.json();
      const fullResponse = data.choices[0]?.message?.content || "";

      const parts = fullResponse.split(/Let me share a story:|Here's a story:|To illustrate this:|As an analogy:|To put this in perspective:/i);

      return {
        id: `blog-${Date.now()}-${Math.random()}`,
        topic,
        content: parts[0].trim(),
        story: parts[1]?.trim() || "Loading story...",
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("Error fetching content:", error);
      return {
        id: `blog-${Date.now()}-${Math.random()}`,
        topic,
        content: "We're experiencing high traffic. Please check back in a few minutes.",
        story: "Content temporarily unavailable.",
        timestamp: Date.now(),
      };
    }
  };

  const formatContent = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((paragraph, index) => {
      if (paragraph.startsWith('# ')) {
        return (
          <h1 key={index} className="text-4xl font-bold text-gray-900 mb-6 mt-8 border-b pb-4">
            {cleanFormatting(paragraph.replace('# ', ''))}
          </h1>
        );
      }

      if (paragraph.startsWith('## ') || paragraph.startsWith('### ')) {
        return (
          <h2 key={index} className="text-2xl font-semibold text-gray-800 mb-4 mt-6">
            {cleanFormatting(paragraph.replace(/^##\s|###\s/, ''))}
          </h2>
        );
      }
      
      return (
        <p key={index} className="text-gray-700 leading-relaxed mb-4">
          {cleanFormatting(paragraph)}
        </p>
      );
    });
  };

  const fetchAllContent = async () => {
    localStorage.clear();
    try {
      setLoading(true);
      setError(null);
      setEntries([]); 
      
      const response = await fetchWithRetry(
        "https://web3-study-platform.onrender.com/api/web3data",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: "Generate 5 unique Web3 topics like interview questions, concepts, standards, latest news, development, etc., which should be related to blockchain. Return as a list with each topic on a new line."
          }),
        }
      );

      const data = await response.json();
      const topicsResponse = data.choices?.[0]?.message?.content || "";
      
      let topics = topicsResponse
        .split('\n')
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic && !topic.startsWith('[') && !topic.startsWith(']'))
        .slice(0, 5);

      if (!topics.length) {
        topics = [
          "Zero Knowledge Proofs in Modern Blockchain Applications",
          "The Impact of Layer 2 Solutions on Scalability",
          "Web3 Security Best Practices",
          "DeFi Innovation and Market Trends",
          "Blockchain Interoperability Standards"
        ];
      }

      for (let i = 0; i < topics.length; i++) {
        setProgress({ current: i + 1, total: topics.length });
        const entry = await fetchBlogContent(topics[i]);
        setEntries(prev => [...prev, entry]);
        await sleep(DELAY_BETWEEN_REQUESTS);
      }

      localStorage.setItem('web3Blog', JSON.stringify(entries));

    } catch (err) {
      console.error('Error in fetchAllContent:', err);
      setError('Unable to load all content. Please try again later.');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('web3Blog');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setEntries(parsedData);
        setLoading(false);
      } catch (e) {
        }
    } else {
        localStorage.clear();
        fetchAllContent();
      }
  }, []); 

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold">Web3 Learning Hub</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Web3 Insights
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master blockchain concepts through practical examples and engaging stories
          </p>
        </header>

        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-medium text-gray-900">Loading Progress</div>
                <div className="text-sm text-gray-500">
                  {progress.current} of {progress.total} articles
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-12">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <div className="p-8">
                <header className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                      {entry.topic}
                    </h2>
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <time>
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </div>
                </header>

                <div className="prose prose-lg max-w-none">
                  <div className="space-y-6">
                    {formatContent(entry.content)}
                  </div>
                </div>

                <div className="mt-8">
                  <div className="bg-blue-50 rounded-xl p-8">
                    <div className="flex items-center mb-4">
                      <h3 className="text-2xl font-semibold text-gray-900">
                        Real-World Application
                      </h3>
                      <ArrowRight className="ml-2 h-5 w-5 text-blue-600" />
                    </div>
                    <div className="space-y-4">
                      {formatContent(entry.story)}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
