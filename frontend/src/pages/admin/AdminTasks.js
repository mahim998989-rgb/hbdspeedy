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
import { Gift, Plus, Trash2 } from 'lucide-react';

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/admin/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
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
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await apiClient.delete(`/admin/tasks/${taskId}`);
      toast.success('✅ Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gift size={32} />
            <h1 className="text-3xl font-bold">Tasks Management</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                      <SelectItem value="group">Telegram Group Join</SelectItem>
                      <SelectItem value="channel">Telegram Channel Join</SelectItem>
                      <SelectItem value="link">External Link Visit</SelectItem>
                      <SelectItem value="custom">Custom Task</SelectItem>
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
                <Button onClick={createTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {tasks.length === 0 ? (
              <Card className="p-12 text-center text-gray-500">
                No tasks yet. Create your first task!
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.task_id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">{task.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          task.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {task.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{task.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">Type: <strong>{task.type}</strong></span>
                        <span className="text-green-600 font-bold">Reward: {task.reward_points} pts</span>
                        {task.url && (
                          <a href={task.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Link
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTask(task.task_id)}
                    >
                      <Trash2 size={16} />
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