import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import apiClient from '../../utils/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Settings, Image, Video } from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', settings);
      toast.success('✅ Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings size={32} />
          <h1 className="text-3xl font-bold">Event Settings</h1>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Image size={24} />
                <h2 className="text-xl font-bold">Background Image</h2>
              </div>
              <Input
                value={settings.background_image_url || ''}
                onChange={(e) => setSettings({ ...settings, background_image_url: e.target.value })}
                placeholder="Background image URL"
                className="mb-2"
              />
              {settings.background_image_url && (
                <img
                  src={settings.background_image_url}
                  alt="Background preview"
                  className="w-full max-w-md rounded-lg mt-4"
                />
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Image size={24} />
                <h2 className="text-xl font-bold">Tap for Fun - Image</h2>
              </div>
              <Input
                value={settings.tap_image_url || ''}
                onChange={(e) => setSettings({ ...settings, tap_image_url: e.target.value })}
                placeholder="Tap image URL"
                className="mb-2"
              />
              {settings.tap_image_url && (
                <img
                  src={settings.tap_image_url}
                  alt="Tap image preview"
                  className="w-full max-w-md rounded-lg mt-4"
                />
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Video size={24} />
                <h2 className="text-xl font-bold">Tap for Fun - Video</h2>
              </div>
              <Input
                value={settings.tap_video_url || ''}
                onChange={(e) => setSettings({ ...settings, tap_video_url: e.target.value })}
                placeholder="Tap video URL"
                className="mb-2"
              />
              {settings.tap_video_url && (
                <video
                  src={settings.tap_video_url}
                  controls
                  className="w-full max-w-md rounded-lg mt-4"
                />
              )}
            </Card>

            <Button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;