import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Users, Copy, Gift } from 'lucide-react';

const Referral = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await apiClient.get('/user/referral-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch referral stats:', error);
    }
  };

  const getReferralLink = () => {
    return `https://t.me/hbdspeedy_io_bot?start=${user?.telegram_id}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    toast.success('✅ Referral link copied!');
  };

  const claimReward = async (milestone) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/user/claim-referral-reward?milestone=${milestone}`);
      toast.success(`🎉 Claimed ${response.data.reward} points!`);
      fetchReferralStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to claim reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-indigo-800 to-purple-900 p-4">
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
            <Users size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Referral Program</h1>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-4 text-center">
            <h2 className="text-white text-lg mb-2">Total Referrals</h2>
            <div className="text-5xl font-black text-white">{stats?.referral_count || 0}</div>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-4">
            <p className="text-white/90 text-sm mb-2 font-medium">Your Referral Link:</p>
            <div className="bg-black/30 rounded p-2 mb-2 break-all text-white text-xs">
              {getReferralLink()}
            </div>
            <Button
              onClick={copyReferralLink}
              className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold"
              data-testid="copy-link-btn"
            >
              <Copy size={20} className="mr-2" /> Copy Link
            </Button>
          </div>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
            <Gift size={24} /> Rewards
          </h2>

          <div className="space-y-3">
            <RewardMilestone
              milestone={1}
              reward={1000}
              current={stats?.referral_count || 0}
              claimed={stats?.claimed_milestones?.includes(1)}
              onClaim={() => claimReward(1)}
              loading={loading}
            />
            <RewardMilestone
              milestone={3}
              reward={5000}
              current={stats?.referral_count || 0}
              claimed={stats?.claimed_milestones?.includes(3)}
              onClaim={() => claimReward(3)}
              loading={loading}
            />
            <RewardMilestone
              milestone={5}
              reward={10000}
              current={stats?.referral_count || 0}
              claimed={stats?.claimed_milestones?.includes(5)}
              onClaim={() => claimReward(5)}
              loading={loading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

const RewardMilestone = ({ milestone, reward, current, claimed, onClaim, loading }) => {
  const isReached = current >= milestone;
  const canClaim = isReached && !claimed;

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-white font-bold">{milestone} Referrals</h3>
          <p className="text-yellow-300 text-sm font-bold">+{reward} points</p>
        </div>
        <div>
          {claimed ? (
            <span className="text-green-400 text-sm font-bold">✅ Claimed</span>
          ) : canClaim ? (
            <Button
              onClick={onClaim}
              disabled={loading}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
              size="sm"
              data-testid={`claim-${milestone}-btn`}
            >
              Claim
            </Button>
          ) : (
            <span className="text-white/50 text-sm">{current}/{milestone}</span>
          )}
        </div>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min((current / milestone) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default Referral;