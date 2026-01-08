import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, XCircle } from 'lucide-react';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await apiClient.get('/admin/withdrawals');
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveWithdrawal = async (withdrawalId) => {
    if (!confirm('Approve this withdrawal?')) return;

    try {
      await apiClient.post(`/admin/withdrawal/${withdrawalId}/approve`);
      toast.success('✅ Withdrawal approved');
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const openRejectDialog = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectDialogOpen(true);
  };

  const rejectWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    try {
      await apiClient.post(
        `/admin/withdrawal/${selectedWithdrawal.withdrawal_id}/reject?reason=${encodeURIComponent(rejectReason || 'Rejected')}`
      );
      toast.success('❌ Withdrawal rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign size={32} />
          <h1 className="text-3xl font-bold">Withdrawal Management</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                No withdrawal requests
              </Card>
            ) : (
              withdrawals.map((withdrawal) => (
                <Card key={withdrawal.withdrawal_id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">@{withdrawal.username}</h3>
                        <StatusBadge status={withdrawal.status} />
                      </div>
                      <p className="text-gray-600">User ID: {withdrawal.user_id}</p>
                      <p className="text-2xl font-bold text-green-600 my-2">{withdrawal.amount} points</p>
                      <p className="text-sm text-gray-500">
                        {new Date(withdrawal.timestamp).toLocaleString()}
                      </p>
                      {withdrawal.admin_note && (
                        <p className="mt-2 text-sm text-orange-600">
                          Note: {withdrawal.admin_note}
                        </p>
                      )}
                    </div>
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => approveWithdrawal(withdrawal.withdrawal_id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={16} className="mr-2" /> Approve
                        </Button>
                        <Button
                          onClick={() => openRejectDialog(withdrawal)}
                          variant="destructive"
                        >
                          <XCircle size={16} className="mr-2" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Withdrawal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={rejectWithdrawal} variant="destructive" className="flex-1">
                  Reject
                </Button>
                <Button onClick={() => setRejectDialogOpen(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
    approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' }
  };

  const { color, label } = config[status] || config.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>
      {label}
    </span>
  );
};

export default AdminWithdrawals;