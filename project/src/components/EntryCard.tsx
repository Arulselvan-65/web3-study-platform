import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Web3Entry } from "../types";

const EntryCard = ({ entry }: { entry: Web3Entry }) => {
  return (
    <Card className="w-full mb-4 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          {entry.topic}
        </CardTitle>
        <div className="text-sm text-gray-500">
          {new Date(entry.timestamp).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Question:</h3>
            <p className="text-gray-600">{entry.question}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700">Answer:</h3>
            <p className="text-gray-600">{entry.answer}</p>
          </div>
          
          {entry.story && (
            <div>
              <h3 className="font-semibold text-gray-700">Related Story:</h3>
              <p className="text-gray-600 italic">{entry.story}</p>
            </div>
          )}
          
          <div className="mt-2">
            <span className="inline-block px-2 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded">
              {entry.category}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EntryCard;