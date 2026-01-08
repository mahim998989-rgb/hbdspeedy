import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await apiClient.get('/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-900 via-orange-800 to-red-900 p-4">
      <div className="container mx-auto max-w-md">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-white mb-4"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} className="mr-2" /> Back
        </Button>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Trophy size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Leaderboard</h1>
          </div>
          <p className="text-white/80 text-sm">Top 100 participants</p>
        </Card>

        <div className="space-y-3" data-testid="leaderboard-list">
          {leaderboard.map((user, index) => (
            <Card
              key={user.telegram_id}
              className={`p-4 border-2 ${
                index === 0
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-400'
                  : index === 1
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 border-gray-300'
                  : index === 2
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 border-orange-500'
                  : 'bg-white/10 backdrop-blur-md border-white/20'
              }`}
              data-testid={`leaderboard-rank-${index + 1}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  {index < 3 ? (
                    <Medal size={24} className="text-white" />
                  ) : (
                    <span className="text-white font-bold text-lg">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">@{user.username}</h3>
                  <p className="text-white/80 text-sm">{user.points} points</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;