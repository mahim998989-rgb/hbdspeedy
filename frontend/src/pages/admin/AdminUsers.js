import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Users, Edit, Eye, Search, RefreshCw, CheckCircle, DollarSign, Gift, UserPlus, Clock, X } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [pointsAdjust, setPointsAdjust] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.telegram_id?.toString().includes(searchQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserDetails = async (telegram_id) => {
    setDetailsLoading(true);
    try {
      const response = await apiClient.get(`/admin/users/${telegram_id}`);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      toast.error('Failed to fetch user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const adjustPoints = async (telegram_id) => {
    const amount = parseInt(pointsAdjust);
    if (isNaN(amount)) {
      toast.error('Invalid amount');
      return;
    }

    try {
      await apiClient.post('/admin/adjust-points', { telegram_id, amount });
      toast.success(`Points adjusted: ${amount > 0 ? '+' : ''}${amount}`);
      setEditingUser(null);
      setPointsAdjust('');
      fetchUsers();
      if (selectedUser === telegram_id) {
        fetchUserDetails(telegram_id);
      }
    } catch (error) {
      toast.error('Failed to adjust points');
    }
  };

  const openUserDetails = (user) => {
    setSelectedUser(user.telegram_id);
    fetchUserDetails(user.telegram_id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Users Management</h1>
              <p className="text-gray-500 text-sm">{users.length} total users</p>
            </div>
          </div>
          <Button 
            onClick={() => fetchUsers(true)} 
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username or Telegram ID..."
              className="pl-10 py-6 text-lg"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredUsers.length} user(s)
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
            <p>Loading users...</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Streak</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.telegram_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-blue-600">@{user.username}</div>
                        <div className="text-xs text-gray-500">ID: {user.telegram_id}</div>
                        {user.join_bonus_claimed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            <Gift size={10} className="mr-1" /> Bonus Claimed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-lg text-green-600">{user.points?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle size={12} className="mr-1" /> {user.tasks_completed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <UserPlus size={12} className="mr-1" /> {user.referral_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Clock size={12} className="mr-1" /> {user.streak_day || 0} days
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(user.join_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserDetails(user)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye size={16} className="mr-1" /> View
                          </Button>
                          {editingUser === user.telegram_id ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={pointsAdjust}
                                onChange={(e) => setPointsAdjust(e.target.value)}
                                placeholder="±pts"
                                className="w-20"
                              />
                              <Button size="sm" onClick={() => adjustPoints(user.telegram_id)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUser(user.telegram_id)}
                            >
                              <Edit size={16} className="mr-1" /> Points
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* User Details Dialog */}
        <Dialog open={selectedUser !== null} onOpenChange={() => { setSelectedUser(null); setUserDetails(null); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users size={24} /> User Details
              </DialogTitle>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="text-center py-12">
                <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500" />
                <p>Loading user details...</p>
              </div>
            ) : userDetails ? (
              <div className="space-y-6 mt-4">
                {/* User Profile */}
                <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-blue-600">@{userDetails.user.username}</h3>
                      <p className="text-sm text-gray-500">Telegram ID: {userDetails.user.telegram_id}</p>
                      <p className="text-sm text-gray-500">Joined: {formatDate(userDetails.user.join_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">{userDetails.user.points?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Points</p>
                    </div>
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatMini 
                    icon={<CheckCircle size={20} />} 
                    label="Tasks Done" 
                    value={userDetails.total_tasks_completed || 0} 
                    color="blue"
                  />
                  <StatMini 
                    icon={<UserPlus size={20} />} 
                    label="Referrals" 
                    value={userDetails.user.referral_count || 0} 
                    color="purple"
                  />
                  <StatMini 
                    icon={<Clock size={20} />} 
                    label="Streak" 
                    value={`${userDetails.user.streak_day || 0} days`} 
                    color="orange"
                  />
                  <StatMini 
                    icon={<DollarSign size={20} />} 
                    label="Withdrawals" 
                    value={userDetails.total_withdrawals || 0} 
                    color="green"
                  />
                </div>

                {/* Completed Tasks */}
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle size={20} className="text-blue-500" /> Completed Tasks ({userDetails.completed_tasks?.length || 0})
                  </h4>
                  {userDetails.completed_tasks?.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userDetails.completed_tasks.map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-gray-500">{formatDate(task.completed_at)}</p>
                          </div>
                          <span className="text-green-600 font-bold">+{task.reward_points} pts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No tasks completed yet</p>
                  )}
                </div>

                {/* Referred Users */}
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <UserPlus size={20} className="text-purple-500" /> Users Referred ({userDetails.referred_users?.length || 0})
                  </h4>
                  {userDetails.referred_users?.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userDetails.referred_users.map((refUser, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div>
                            <p className="font-medium">@{refUser.username}</p>
                            <p className="text-xs text-gray-500">{formatDate(refUser.join_date)}</p>
                          </div>
                          <span className="text-purple-600 font-bold">{refUser.points} pts</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No referrals yet</p>
                  )}
                </div>

                {/* Withdrawals */}
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <DollarSign size={20} className="text-orange-500" /> Withdrawal History ({userDetails.withdrawals?.length || 0})
                  </h4>
                  {userDetails.withdrawals?.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userDetails.withdrawals.map((withdrawal, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium">{withdrawal.amount} points</p>
                            <p className="text-xs text-gray-500">{formatDate(withdrawal.timestamp)}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            withdrawal.status === 'approved' ? 'bg-green-100 text-green-700' :
                            withdrawal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {withdrawal.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No withdrawals yet</p>
                  )}
                </div>

                {/* Referral Milestones */}
                {userDetails.referral_milestones?.length > 0 && (
                  <div>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Gift size={20} className="text-yellow-500" /> Referral Rewards Claimed
                    </h4>
                    <div className="flex gap-2">
                      {userDetails.referral_milestones.map((milestone, idx) => (
                        <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          {milestone.milestone} referral milestone
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

const StatMini = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600'
  };
  
  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-75">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

export default AdminUsers;
