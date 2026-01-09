import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Gift, Plus, Trash2, RefreshCw, Users, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'group',
    url: '',
    reward_points: 0
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await apiClient.get('/admin/task-stats');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      // Fallback to regular tasks endpoint
      try {
        const fallbackResponse = await apiClient.get('/admin/tasks');
        setTasks(fallbackResponse.data);
      } catch (e) {
        toast.error('Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.description || newTask.reward_points <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await apiClient.post('/admin/tasks', newTask);
      toast.success('✅ Task created successfully!');
      setDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        type: 'group',
        url: '',
        reward_points: 0
      });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiClient.delete(`/admin/tasks/${taskId}`);
      toast.success('✅ Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'group': return '👥';
      case 'channel': return '📢';
      case 'link': return '🔗';
      case 'custom': return '⭐';
      default: return '📋';
    }
  };

  const getTaskTypeLabel = (type) => {
    switch (type) {
      case 'group': return 'Telegram Group';
      case 'channel': return 'Telegram Channel';
      case 'link': return 'External Link';
      case 'custom': return 'Custom Task';
      default: return type;
    }
  };

  // Calculate totals
  const totalCompletions = tasks.reduce((sum, task) => sum + (task.completion_count || 0), 0);
  const totalPointsAwarded = tasks.reduce((sum, task) => sum + (task.total_points_awarded || 0), 0);
  const activeTasks = tasks.filter(task => task.active).length;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gift size={32} className="text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold">Tasks Management</h1>
              <p className="text-gray-500 text-sm">{activeTasks} active tasks</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => fetchTasks(true)} 
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus size={20} className="mr-2" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select
                      value={newTask.type}
                      onValueChange={(value) => setNewTask({ ...newTask, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="group">👥 Telegram Group Join</SelectItem>
                        <SelectItem value="channel">📢 Telegram Channel Join</SelectItem>
                        <SelectItem value="link">🔗 External Link Visit</SelectItem>
                        <SelectItem value="custom">⭐ Custom Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">URL (optional)</label>
                    <Input
                      value={newTask.url}
                      onChange={(e) => setNewTask({ ...newTask, url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Reward Points</label>
                    <Input
                      type="number"
                      value={newTask.reward_points}
                      onChange={(e) => setNewTask({ ...newTask, reward_points: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <Button onClick={createTask} className="w-full bg-purple-600 hover:bg-purple-700">
                    Create Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Total Completions</p>
                <p className="text-2xl font-bold text-purple-600">{totalCompletions.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-green-50 to-teal-50">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Points Awarded</p>
                <p className="text-2xl font-bold text-green-600">{totalPointsAwarded.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <Gift size={24} className="text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Active Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{activeTasks}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-purple-500" />
            <p>Loading tasks...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                <Gift size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No tasks yet. Create your first task!</p>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.task_id} className={`p-6 ${!task.active ? 'opacity-60 bg-gray-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTaskTypeIcon(task.type)}</span>
                        <h3 className="text-xl font-bold">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          task.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      
                      {/* Task Stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                          <span className="font-medium">Type:</span> {getTaskTypeLabel(task.type)}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                          <Gift size={14} /> {task.reward_points} pts
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                          <Users size={14} /> {task.completion_count || 0} completions
                        </span>
                        {task.total_points_awarded > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                            <TrendingUp size={14} /> {(task.total_points_awarded || 0).toLocaleString()} pts awarded
                          </span>
                        )}
                        {task.url && (
                          <a 
                            href={task.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            <ExternalLink size={14} /> View Link
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTask(task.task_id)}
                      className="ml-4"
                    >
                      <Trash2 size={16} className="mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTasks;
