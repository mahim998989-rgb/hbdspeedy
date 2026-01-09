import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Users, DollarSign, Gift, TrendingUp, CheckCircle, UserPlus, Clock, Award, RefreshCw, Activity } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/recent-activities?limit=30')
      ]);
      setStats(statsRes.data);
      setActivities(activitiesRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_joined': return <UserPlus size={16} className="text-green-500" />;
      case 'task_completed': return <CheckCircle size={16} className="text-blue-500" />;
      case 'withdrawal': return <DollarSign size={16} className="text-orange-500" />;
      case 'checkin': return <Clock size={16} className="text-purple-500" />;
      default: return <Activity size={16} className="text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_joined': return 'border-l-green-500 bg-green-50';
      case 'task_completed': return 'border-l-blue-500 bg-blue-50';
      case 'withdrawal': return 'border-l-orange-500 bg-orange-50';
      case 'checkin': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">📊 Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              onClick={() => fetchData(true)} 
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<Users size={28} />}
                label="Total Users"
                value={stats.total_users || 0}
                color="bg-blue-500"
                subtitle={`+${stats.users_today || 0} today`}
              />
              <StatCard
                icon={<DollarSign size={28} />}
                label="Total Points"
                value={(stats.total_points || 0).toLocaleString()}
                color="bg-green-500"
                subtitle="In circulation"
              />
              <StatCard
                icon={<Gift size={28} />}
                label="Active Tasks"
                value={stats.total_tasks || 0}
                color="bg-purple-500"
                subtitle={`${stats.total_task_completions || 0} completions`}
              />
              <StatCard
                icon={<TrendingUp size={28} />}
                label="Pending Withdrawals"
                value={stats.pending_withdrawals || 0}
                color="bg-orange-500"
                subtitle="Awaiting approval"
              />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<CheckCircle size={28} />}
                label="Total Check-ins"
                value={stats.total_checkins || 0}
                color="bg-indigo-500"
                subtitle="Users checked in"
              />
              <StatCard
                icon={<UserPlus size={28} />}
                label="Total Referrals"
                value={stats.total_referrals || 0}
                color="bg-pink-500"
                subtitle="Successful referrals"
              />
              <StatCard
                icon={<Award size={28} />}
                label="Join Bonus Claimed"
                value={stats.join_bonus_claimed || 0}
                color="bg-yellow-500"
                subtitle={`${stats.total_users ? Math.round((stats.join_bonus_claimed / stats.total_users) * 100) : 0}% claimed`}
              />
              <StatCard
                icon={<Activity size={28} />}
                label="Task Completions"
                value={stats.total_task_completions || 0}
                color="bg-teal-500"
                subtitle="Total completed"
              />
            </div>

            {/* Recent Activity Feed */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity size={24} /> Live Activity Feed
                </h2>
                <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Auto-refreshing
                </span>
              </div>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No activities yet. Users will appear here when they interact with the bot.
                  </div>
                ) : (
                  activities.map((activity, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border-l-4 ${getActivityColor(activity.type)} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">ID: {activity.telegram_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

const StatCard = ({ icon, label, value, color, subtitle }) => (
  <Card className="p-5 hover:shadow-lg transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`${color} p-3 rounded-xl text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  </Card>
);

export default AdminDashboard;
