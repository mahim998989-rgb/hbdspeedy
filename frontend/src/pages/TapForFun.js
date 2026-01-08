import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Play } from 'lucide-react';

const TapForFun = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({});
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleImageClick = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-pink-800 to-red-900 p-4">
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
            <Play size={32} className="text-white" />
            <h1 className="text-2xl font-black text-white">Tap for Fun</h1>
          </div>
          <p className="text-white/80 text-sm">Tap the image to play the video!</p>
          <p className="text-yellow-300 text-xs mt-2">(No points, just for fun!)</p>
        </Card>

        {settings.tap_image_url && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 mb-6">
            <div
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={handleImageClick}
              data-testid="tap-image"
            >
              <img
                src={settings.tap_image_url}
                alt="Tap to play"
                className="w-full rounded-lg"
              />
              <div className="text-center mt-3">
                <Button
                  className="bg-white text-purple-600 hover:bg-gray-100 font-bold"
                  data-testid="play-video-btn"
                >
                  <Play size={20} className="mr-2" /> Tap to Play
                </Button>
              </div>
            </div>
          </Card>
        )}

        {settings.tap_video_url && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <video
              ref={videoRef}
              src={settings.tap_video_url}
              className="w-full rounded-lg"
              controls
              onEnded={() => setVideoPlaying(false)}
              data-testid="tap-video"
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default TapForFun;