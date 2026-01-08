import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

const Withdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/withdrawal/my-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch withdrawal requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountNum > user?.points) {
      toast.error('Insufficient points');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/withdrawal/request', { amount: amountNum });
      toast.success('✅ Withdrawal request submitted!');
      setAmount('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-red-800 to-pink-900 p-4">
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
            <DollarSign size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Withdrawal</h1>
          </div>

          <div className="bg-white/20 rounded-lg p-4 mb-4 text-center">
            <h2 className="text-white text-sm mb-2">Available Points</h2>
            <div className="text-4xl font-black text-white">{user?.points || 0}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Amount to Withdraw</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                data-testid="withdrawal-amount-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-orange-600 hover:bg-gray-100 font-bold py-6 text-lg"
              data-testid="withdrawal-submit-btn"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
          <h2 className="text-white text-xl font-bold mb-4">My Requests</h2>

          <div className="space-y-3" data-testid="withdrawal-requests">
            {requests.length === 0 ? (
              <p className="text-white/70 text-center py-4">No withdrawal requests yet</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.withdrawal_id}
                  className="bg-white/10 rounded-lg p-4 border border-white/20"
                  data-testid={`request-${req.withdrawal_id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-bold text-lg">{req.amount} pts</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-white/70 text-xs">
                    {new Date(req.timestamp).toLocaleDateString()}
                  </p>
                  {req.admin_note && (
                    <p className="text-yellow-300 text-sm mt-2">{req.admin_note}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: Clock, color: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200', label: 'Pending' },
    approved: { icon: CheckCircle, color: 'bg-green-500/20 border-green-500/50 text-green-200', label: 'Approved' },
    rejected: { icon: XCircle, color: 'bg-red-500/20 border-red-500/50 text-red-200', label: 'Rejected' }
  };

  const { icon: Icon, color, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${color} text-xs font-bold`}>
      <Icon size={14} /> {label}
    </span>
  );
};

export default Withdrawal;