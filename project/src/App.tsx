import { useEffect, useState, useRef } from 'react';

interface BlogEntry {
  id: string;
  topic: string;
  content: string;
  story: string;
  timestamp: number;
}

const DELAY_BETWEEN_REQUESTS = 30000;

const App = () => {
  const [entries, setEntries] = useState<BlogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const fetchInProgress = useRef(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Rest of the fetchWithRetry function remains the same...

  const cleanFormatting = (text: string): string => {
    return text
      .replace(/\*\*/g, '') // Remove **
      .replace(/\*/g, '')
      .replace('*','').replace('**','')   // Remove single *
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

    // Rest of the fetchBlogContent function remains the same...
    try {
      const response = await fetchWithRetry(
        "http://localhost:5000/api/web3data",
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
    try {
      setLoading(true);
      setError(null);
      setEntries([]); 
      
      const response = await fetchWithRetry(
        "http://localhost:5000/api/web3data",
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
        fetchAllContent();
      }
  }, []); 

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Web3 Insights
          </h1>
          <p className="text-xl text-gray-600">
            Exploring blockchain concepts through stories
          </p>
        </header>

        {loading && (
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full max-w-md mx-auto">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
            <p className="text-gray-600">
              Loading article {progress.current} of {progress.total}
            </p>
          </div>
        )}

        {error && (
          <div className="text-red-600 text-center mb-8">
            {error}
          </div>
        )}

        <div className="space-y-16">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="bg-white rounded-2xl shadow-sm p-8 space-y-8"
            >
              <header className="border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {entry.topic}
                </h2>
                <time className="text-gray-500">
                  {new Date(entry.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </header>

              <div className="prose prose-lg max-w-none">
                <div className="space-y-4">
                  {formatContent(entry.content)}
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-xl">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  A Story to Remember
                </h3>
                <div className="space-y-4">
                  {formatContent(entry.story)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;