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
  const [videoLoaded, setVideoLoaded] = useState(false);
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

  const handleTap = () => {
    if (videoRef.current && videoLoaded) {
      // Restart video from beginning on every tap
      videoRef.current.currentTime = 0;
      
      // Play with error handling
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoPlaying(true);
          })
          .catch(error => {
            console.error('Video play failed:', error);
            setVideoPlaying(false);
          });
      }
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

        {settings.tap_image_url && settings.tap_video_url && (
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <div
              className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={handleTap}
              data-testid="tap-area"
            >
              {/* Image - shown when video not playing */}
              {!videoPlaying && (
                <div className="relative">
                  <img
                    src={settings.tap_image_url}
                    alt="Tap to play"
                    className="w-full rounded-lg"
                    data-testid="tap-image"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-sm">
                    <div className="bg-white/95 rounded-full p-6 shadow-xl">
                      <Play size={48} className="text-purple-600" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-purple-600 px-4 py-2 rounded-full text-sm font-bold">
                    👆 Tap to Play
                  </div>
                </div>
              )}
              
              {/* Video - shown when playing */}
              <video
                ref={videoRef}
                src={settings.tap_video_url}
                className={`w-full rounded-lg ${!videoPlaying ? 'hidden' : ''}`}
                onEnded={() => setVideoPlaying(false)}
                onLoadedData={() => setVideoLoaded(true)}
                onError={(e) => {
                  console.error('Video error:', e);
                  setVideoPlaying(false);
                }}
                playsInline
                preload="auto"
                data-testid="tap-video"
              />
              
              {/* Tap instruction overlay */}
              {videoPlaying && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm animate-pulse">
                  Tap to restart!
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TapForFun;