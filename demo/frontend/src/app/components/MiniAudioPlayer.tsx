import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface MiniAudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  onEnded: () => void;  // Notify parent when audio ends
  onToggle?: () => void;  // Optional: Notify parent when user clicks play/pause
}

export default function MiniAudioPlayer({ audioUrl, isPlaying, onEnded, onToggle }: MiniAudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Use refs to store callbacks to avoid dependency issues
  const onEndedRef = useRef(onEnded);
  const onToggleRef = useRef(onToggle);
  
  // Keep refs up to date
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  // Setup event listeners (no callback dependencies!)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      console.log('🏁 Audio ended for URL:', audioUrl);
      setCurrentTime(0);
      onEndedRef.current();  // Use ref instead of direct callback
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);  // Only depend on audioUrl!

  // Handle play/pause when isPlaying changes
  useEffect(() => {
    console.log('🎼 MiniAudioPlayer isPlaying changed:', isPlaying, 'audioRef:', !!audioRef.current, 'URL:', audioUrl);
    if (audioRef.current) {
      if (isPlaying) {
        // Force load audio if not loaded yet
        if (audioRef.current.readyState < 2) {
          console.log('⏳ Audio not ready, loading...');
          audioRef.current.load();
        }
        audioRef.current.play()
          .then(() => console.log('✅ Audio playing'))
          .catch(err => console.log('❌ Play prevented:', err));
      } else {
        audioRef.current.pause();
      }
    } else {
      console.warn('⚠️ audioRef.current is null!');
    }
  }, [isPlaying]);  // Only depend on isPlaying!

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTogglePlay = () => {
    if (onToggleRef.current) {
      onToggleRef.current();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-[280px]"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={audioUrl} />
      
      {/* Progress Bar */}
      <div 
        className="h-1.5 bg-gray-200 rounded-full cursor-pointer mb-2 relative group"
        onClick={handleProgressClick}
      >
        <div 
          className="h-full bg-[#007aff] rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-[#007aff] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between">
        <button
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleTogglePlay();
          }}
        >
          {isPlaying ? 
            <Pause className="w-4 h-4 text-[#007aff]" /> : 
            <Play className="w-4 h-4 text-[#007aff]" />
          }
        </button>
        
        <span className="font-['SF_Pro_Text:Regular',sans-serif] text-[12px] text-[rgba(28,28,30,0.64)]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}