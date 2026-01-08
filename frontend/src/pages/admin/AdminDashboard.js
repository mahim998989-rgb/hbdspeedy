import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Users, DollarSign, Gift, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<Users size={32} />}
              label="Total Users"
              value={stats.total_users || 0}
              color="bg-blue-500"
            />
            <StatCard
              icon={<DollarSign size={32} />}
              label="Total Points"
              value={stats.total_points || 0}
              color="bg-green-500"
            />
            <StatCard
              icon={<Gift size={32} />}
              label="Active Tasks"
              value={stats.total_tasks || 0}
              color="bg-purple-500"
            />
            <StatCard
              icon={<TrendingUp size={32} />}
              label="Pending Withdrawals"
              value={stats.pending_withdrawals || 0}
              color="bg-orange-500"
            />
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card className="p-6">
    <div className="flex items-center gap-4">
      <div className={`${color} p-3 rounded-lg text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-600 text-sm">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  </Card>
);

export default AdminDashboard;