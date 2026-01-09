import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Home as HomeIcon, CheckCircle, Gift, Users, Play, DollarSign, Trophy } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [countdown, setCountdown] = useState({});
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchCountdown();
    fetchSettings();
    const interval = setInterval(fetchCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchCountdown = async () => {
    try {
      const response = await apiClient.get('/countdown');
      setCountdown(response.data);
    } catch (error) {
      console.error('Failed to fetch countdown:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const claimJoinBonus = async () => {
    try {
      const response = await apiClient.post('/user/claim-join-bonus');
      toast.success(`🎉 ${response.data.message}`);
      refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to claim bonus');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: settings.background_image_url 
          ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${settings.background_image_url})`
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Countdown */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6 text-center" data-testid="countdown-card">
          <h1 className="text-3xl font-black text-white mb-2">
            {countdown.message || "🎂 Speedy's Birthday Event 🎉"}
          </h1>
          {countdown.is_active && (
            <div className="flex justify-center gap-4 mt-4">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-3xl font-bold text-white">{countdown.days}</div>
                <div className="text-xs text-white/80">DAYS</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-3xl font-bold text-white">{countdown.hours}</div>
                <div className="text-xs text-white/80">HOURS</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-3xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-xs text-white/80">MINS</div>
              </div>
            </div>
          )}
        </Card>

        {/* User Points */}
        <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 border-0 p-6 mb-6 text-center" data-testid="points-card">
          <h2 className="text-white text-lg mb-2">Your Points</h2>
          <div className="text-5xl font-black text-white">{user?.points || 0}</div>
          {!user?.join_bonus_claimed && (
            <Button
              onClick={claimJoinBonus}
              className="mt-4 bg-white text-orange-600 hover:bg-gray-100 font-bold"
              data-testid="claim-join-bonus-btn"
            >
              🎁 Claim Join Bonus
            </Button>
          )}
        </Card>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MenuButton
            icon={<CheckCircle size={32} />}
            label="Daily Check-in"
            onClick={() => navigate('/checkin')}
            gradient="from-green-400 to-cyan-500"
            testId="checkin-btn"
          />
          <MenuButton
            icon={<Gift size={32} />}
            label="Tasks"
            onClick={() => navigate('/tasks')}
            gradient="from-pink-400 to-rose-500"
            testId="tasks-btn"
          />
          <MenuButton
            icon={<Users size={32} />}
            label="Referral"
            onClick={() => navigate('/referral')}
            gradient="from-blue-400 to-indigo-500"
            testId="referral-btn"
          />
          <MenuButton
            icon={<Play size={32} />}
            label="Tap for Fun"
            onClick={() => navigate('/tap')}
            gradient="from-purple-400 to-pink-500"
            testId="tap-btn"
          />
          <MenuButton
            icon={<DollarSign size={32} />}
            label="Withdrawal"
            onClick={() => navigate('/withdrawal')}
            gradient="from-orange-400 to-red-500"
            testId="withdrawal-btn"
          />
          <MenuButton
            icon={<Trophy size={32} />}
            label="Leaderboard"
            onClick={() => navigate('/leaderboard')}
            gradient="from-yellow-400 to-orange-500"
            testId="leaderboard-btn"
          />
        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ icon, label, onClick, gradient, testId }) => (
  <Card
    onClick={onClick}
    className={`bg-gradient-to-br ${gradient} border-0 p-6 cursor-pointer hover:scale-105 transition-transform duration-200 flex flex-col items-center justify-center gap-2`}
    data-testid={testId}
  >
    <div className="text-white">{icon}</div>
    <div className="text-white font-bold text-center text-sm">{label}</div>
  </Card>
);

export default Home;