import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Users, Edit } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [pointsAdjust, setPointsAdjust] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      toast.error('Failed to adjust points');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users size={32} />
          <h1 className="text-3xl font-bold">Users Management</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Streak</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.telegram_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">@{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.telegram_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-lg">{user.points}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.referral_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.streak_day} days</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.telegram_id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={pointsAdjust}
                              onChange={(e) => setPointsAdjust(e.target.value)}
                              placeholder="±points"
                              className="w-24"
                            />
                            <Button size="sm" onClick={() => adjustPoints(user.telegram_id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user.telegram_id)}
                          >
                            <Edit size={16} className="mr-2" /> Adjust Points
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;