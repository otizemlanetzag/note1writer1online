import React, { useState, useEffect } from 'react';
import { AudioPitchEngine } from './components/AudioPitchEngine';
import { SheetMusicRenderer } from './components/SheetMusicRenderer';
import { exportToMIDI, exportToPDF, exportToImage } from './utils/exportUtils';

const CHROMATIC_SCALE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('record'); // record | projects | editor
  const [projectName, setProjectName] = useState('היצירה הרב-קולית שלי');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const [voices, setVoices] = useState([
    { id: 'voice-1', title: 'קול 1', notes: [], color: '#4f46e5' },
    { id: 'voice-2', title: 'קול 2', notes: [], color: '#10b981' }
  ]);
  const [activeVoiceId, setActiveVoiceId] = useState('voice-1');
  const activeVoice = voices.find(v => v.id === activeVoiceId) || voices;

  // האזנה למקש מחיקה
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedNoteId) return;
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setVoices(prev => prev.map(v => ({
          ...v, notes: v.notes.filter(n => n.id !== selectedNoteId)
        })));
        setSelectedNoteId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId]);

  const handleVoiceNoteDetected = (noteInfo) => {
    setVoices(prev => prev.map(v => {
      if (v.id !== activeVoiceId) return v;
      const last = v.notes[v.notes.length - 1];
      if (last && last.key === noteInfo.note && Date.now() - last.timestamp < 600) return v;
      return {
        ...v, notes: [...v.notes, { key: noteInfo.note, octave: noteInfo.octave, duration: 'quarter', id: crypto.randomUUID(), timestamp: Date.now() }]
      };
    }));
  };

  const handleUpdatePosition = (noteId, newKey, newOctave) => {
    setVoices(prev => prev.map(v => ({
      ...v, notes: v.notes.map(n => n.id === noteId ? { ...n, key: newKey, octave: newOctave } : n)
    })));
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col justify-between shadow-2xl relative border-x border-slate-200 overflow-hidden text-slate-800" dir="rtl">
      
      {/* סרגל עליון */}
      <header className="bg-white px-4 py-3 shadow-sm border-b flex justify-between items-center z-10 select-none">
        {currentScreen === 'projects' ? (
          <>
            <span className="font-extrabold text-slate-700">הספריה שלי</span>
            <button onClick={() => { setVoices([{ id: 'voice-1', title: 'קול 1', notes: [], color: '#4f46e5' }]); setCurrentScreen('record'); }} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">➕ חדש</button>
          </>
        ) : (
          <>
            <button onClick={() => alert('הפרויקט נשמר')} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">שמור</button>
            <div className="relative">
              <button onClick={() => setIsExportOpen(!isExportOpen)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">הורד כ...</button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-xl py-1 z-50 text-right text-xs font-semibold">
                  <button onClick={() => { exportToMIDI(voices, projectName); setIsExportOpen(false); }} className="w-full px-3 py-2 hover:bg-slate-50 block text-right">🎹 MIDI פוליפוני</button>
                  <button onClick={() => { exportToPDF(projectName); setIsExportOpen(false); }} className="w-full px-3 py-2 hover:bg-slate-50 block text-right">📄 PDF</button>
                </div>
              )}
            </div>
            <button onClick={() => setCurrentScreen(currentScreen === 'record' ? 'editor' : 'record')} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
              {currentScreen === 'record' ? 'ערוך תווים' : 'רושם משמיעה'}
            </button>
          </>
        )}
      </header>

      {/* תוכן המסך המרכזי */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {currentScreen !== 'projects' && (
          <div className="w-full bg-white p-2 rounded-xl border shadow-sm flex flex-col gap-2 select-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase">ערוצי קול במקביל:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {voices.map(v => (
                <button 
                  key={v.id} 
                  onClick={() => { setActiveVoiceId(v.id); setSelectedNoteId(null); }}
                  style={{ backgroundColor: v.id === activeVoiceId ? v.color : '#f1f5f9', color: v.id === activeVoiceId ? 'white' : '#475569' }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition border"
                >
                  {v.title} ({v.notes.length})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* מסך 1: רושם משמיעה */}
        {currentScreen === 'record' && (
          <div className="w-full flex flex-col items-center justify-between gap-6 flex-1 py-2">
            <div className="w-full flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400">הצצה מהירה (תווים אחרונים):</span>
              <div id="vexflow-container" className="w-full bg-white rounded-xl p-3 border shadow-inner min-h-[140px] flex items-center justify-center">
                <SheetMusicRenderer composition={activeVoice.notes.slice(-4)} clef="treble" voiceColor={activeVoice.color} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 mt-4">
              <button 
                onClick={() => setIsListening(!isListening)}
                style={{ backgroundColor: isListening ? '#ef4444' : '#10b981' }}
                className="w-32 h-32 rounded-full text-white font-black text-5xl flex items-center justify-center shadow-lg border-4 border-white transition-all select-none"
              >
                {isListening ? '🛑' : '𝄞'}
              </button>
              <p className="text-xs text-slate-400 font-bold text-center px-4">
                {isListening ? `מקשיב לקול שלך ומזרים אל ${activeVoice.title}...` : `לחץ על הלחצן והתחל לשיר אל ${activeVoice.title}`}
              </p>
            </div>
            <AudioPitchEngine onNoteDetected={handleVoiceNoteDetected} isListening={isListening} setIsListening={setIsListening} />
          </div>
        )}

        {/* מסך 2: הפרויקטים שלי */}
        {currentScreen === 'projects' && (
          <div className="grid grid-cols-2 gap-4 py-2 select-none">
            {[1, 2, 3, 4].map(id => (
              <div key={id} onClick={() => setCurrentScreen('record')} className="aspect-square bg-blue-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-sm cursor-pointer hover:border-blue-400 transition">
                <div className="w-full h-3/4 bg-white/80 rounded border border-dashed border-slate-200"></div>
                <span className="text-xs font-bold text-slate-600 text-center block mt-1">טיוטת יצירה {id}</span>
              </div>
            ))}
          </div>
        )}

        {/* מסך 3: עורך ידני */}
        {currentScreen === 'editor' && (
          <div className="w-full flex flex-col gap-4 flex-1 py-2">
            <div id="vexflow-container" className="w-full bg-white rounded-xl p-4 border shadow-sm min-h-[200px] flex items-center justify-center overflow-x-auto">
              <SheetMusicRenderer composition={activeVoice.notes} clef="treble" selectedNoteId={selectedNoteId} onSelectNote={setSelectedNoteId} onUpdateNotePosition={handleUpdatePosition} voiceColor={activeVoice.color} />
            </div>
            {selectedNoteId && <p className="text-[10px] text-center text-amber-600 font-bold">💡 גרור את התו הנבחר למעלה/למטה או הקש Delete למחיקה</p>}
          </div>
        )}
      </main>

      {/* סרגל ניווט תחתון קבוע */}
      <footer className="bg-white border-t grid grid-cols-3 h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10 select-none">
        <button onClick={() => setCurrentScreen('editor')} className={`font-extrabold text-xs border-l ${currentScreen === 'editor' ? 'bg-red-600 text-white' : 'text-blue-800 hover:bg-slate-50'}`}>עורך ידני</button>
        <button onClick={() => setCurrentScreen('projects')} className={`font-extrabold text-xs border-l ${currentScreen === 'projects' ? 'bg-red-600 text-white' : 'text-blue-800 hover:bg-slate-50'}`}>הפרויקטים שלי</button>
        <button onClick={() => setCurrentScreen('record')} className={`font-extrabold text-xs ${currentScreen === 'record' ? 'bg-red-600 text-white' : 'text-blue-800 hover:bg-slate-50'}`}>רושם</button>
      </footer>

    </div>
  );
}
