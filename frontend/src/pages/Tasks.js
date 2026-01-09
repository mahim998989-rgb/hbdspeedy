import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Gift, CheckCircle, ExternalLink } from 'lucide-react';

const Tasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clickedLinks, setClickedLinks] = useState(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/tasks/list');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleLinkClick = (taskId, url) => {
    // Open the link
    window.open(url, '_blank');
    
    // Mark this task link as clicked
    setClickedLinks(prev => new Set([...prev, taskId]));
    
    // Show toast
    toast.info('Link opened! Now you can claim your reward.', {
      duration: 3000
    });
  };

  const completeTask = async (taskId) => {
    // Check if link was clicked for tasks with URLs
    const task = tasks.find(t => t.task_id === taskId);
    if (task.url && !clickedLinks.has(taskId)) {
      toast.error('⚠️ Please click "Visit Link" button first!');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/tasks/complete', { task_id: taskId });
      toast.success(`✅ Task completed! +${response.data.reward} points`);
      fetchTasks();
      // Remove from clicked links after claiming
      setClickedLinks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 via-rose-800 to-red-900 p-4">
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
            <Gift size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Tasks</h1>
          </div>
          <p className="text-white/80 text-sm">Complete tasks to earn points!</p>
          <p className="text-yellow-300 text-xs mt-2">💡 You must click "Visit Link" before claiming rewards</p>
        </Card>

        <div className="space-y-4" data-testid="tasks-list">
          {tasks.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6 text-center">
              <p className="text-white">No tasks available at the moment.</p>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.task_id}
                className="bg-white/10 backdrop-blur-md border-white/20 p-4"
                data-testid={`task-${task.task_id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{task.title}</h3>
                    <p className="text-white/70 text-sm mb-2">{task.description}</p>
                    <div className="inline-block bg-yellow-500/20 border border-yellow-500/50 rounded px-2 py-1">
                      <span className="text-yellow-200 text-sm font-bold">+{task.reward_points} pts</span>
                    </div>
                  </div>
                </div>

                {task.completed ? (
                  <Button
                    disabled
                    className="w-full mt-3 bg-green-600 text-white"
                    data-testid={`task-completed-${task.task_id}`}
                  >
                    <CheckCircle size={20} className="mr-2" /> Completed
                  </Button>
                ) : (
                  <div className="space-y-2 mt-3">
                    {task.url && (
                      <>
                        <Button
                          onClick={() => handleLinkClick(task.task_id, task.url)}
                          className={`w-full ${
                            clickedLinks.has(task.task_id)
                              ? 'bg-green-500/20 text-green-200 border border-green-500/50'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                          data-testid={`task-visit-${task.task_id}`}
                        >
                          <ExternalLink size={20} className="mr-2" />
                          {clickedLinks.has(task.task_id) ? '✅ Link Opened' : 'Visit Link'}
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={() => completeTask(task.task_id)}
                      disabled={loading || (task.url && !clickedLinks.has(task.task_id))}
                      className={`w-full font-bold ${
                        task.url && !clickedLinks.has(task.task_id)
                          ? 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                          : 'bg-white text-pink-600 hover:bg-gray-100'
                      }`}
                      data-testid={`task-claim-${task.task_id}`}
                    >
                      {task.url && !clickedLinks.has(task.task_id) ? '🔒 Click Link First' : 'Claim Reward'}
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tasks;