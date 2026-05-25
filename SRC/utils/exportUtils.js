import { jsPDF } from 'jspdf';
import { Midi } from '@tonejs/midi';

export const exportToMIDI = (voicesArray, projectName) => {
  const midi = new Midi();
  const noteMapping = { "C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11 };

  voicesArray.forEach((voice) => {
    if (voice.notes.length === 0) return;
    
    const track = midi.addTrack();
    track.name = voice.title;
    
    let time = 0;
    voice.notes.forEach((note) => {
      let duration = 0.5;
      if (note.duration === 'whole') duration = 2.0;
      if (note.duration === 'half') duration = 1.0;
      if (note.duration === 'eighth') duration = 0.25;

      const midiNumber = 12 * (note.octave + 1) + noteMapping[note.key];
      
      track.addNote({
        midi: midiNumber,
        time: time,
        duration: duration
      });
      
      time += duration;
    });
  });

  const blob = new Blob([midi.toArray()], { type: "audio/midi" });
  downloadBlob(blob, `${projectName || 'polyphonic_score'}.mid`);
};

export const exportToPDF = (projectName) => {
  const svgElement = document.querySelector('#vexflow-container svg');
  if (!svgElement) return alert('אין תווים זמינים לייצוא');

  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = URL.createObjectURL(svgBlob);
  
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.clientWidth * 2;
    canvas.height = svgElement.clientHeight * 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('landscape', 'px', [canvas.width / 2, canvas.height / 2]);
    pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${projectName || 'score'}.pdf`);
    URL.revokeObjectURL(blobURL);
  };
  image.src = blobURL;
};

export const exportToImage = (format, projectName) => {
  const svgElement = document.querySelector('#vexflow-container svg');
  if (!svgElement) return;

  const svgString = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = URL.createObjectURL(svgBlob);
  
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.clientWidth * 2;
    canvas.height = svgElement.clientHeight * 2;
    const context = canvas.getContext('2d');
    
    if (format === 'jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.scale(2, 2);
    context.drawImage(image, 0, 0);
    
    canvas.toBlob((blob) => {
      downloadBlob(blob, `${projectName || 'score'}.${format === 'jpeg' ? 'jpg' : 'png'}`);
      URL.revokeObjectURL(blobURL);
    }, format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.95);
  };
  image.src = blobURL;
};

const downloadBlob = (blob, filename) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
