import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Calendar } from 'lucide-react';

const Checkin = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckin = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/user/checkin');
      toast.success(`✅ Check-in successful! +${response.data.points} points`);
      toast.info(`🔥 Streak: ${response.data.streak_day} days`);
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-teal-800 to-cyan-900 p-4">
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
            <Calendar size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Daily Check-in</h1>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <h2 className="text-white text-lg font-bold mb-2">Current Streak</h2>
            <div className="text-4xl font-black text-white">{user?.streak_day || 0} Days</div>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-6">
            <h3 className="text-white font-bold mb-2">How it works:</h3>
            <ul className="text-white/90 text-sm space-y-1">
              <li>• Day 1: 100 points</li>
              <li>• Day 2: 200 points</li>
              <li>• Day 3: 400 points</li>
              <li>• Each day doubles!</li>
              <li>• Missing a day resets streak</li>
            </ul>
          </div>

          <Button
            onClick={handleCheckin}
            disabled={loading}
            className="w-full bg-white text-green-600 hover:bg-gray-100 font-bold py-6 text-lg"
            data-testid="checkin-submit-btn"
          >
            {loading ? 'Checking in...' : '✅ Check-in Now'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Checkin;