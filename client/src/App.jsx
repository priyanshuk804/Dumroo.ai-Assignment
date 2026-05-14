import React, { useState } from 'react';
import { BookOpen, Plus, FileText, Upload, Settings } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import UploadModal from './components/UploadModal';

function App() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);

  const handleUploadSuccess = (docInfo) => {
    setDocuments(prev => [...prev, docInfo]);
  };

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-72 bg-surface border-r border-border flex flex-col transition-all duration-300 relative z-20 shadow-xl">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-semibold text-lg tracking-wide">
            <BookOpen className="text-primary" size={24} />
            <span>Dumroo.ai Transcripter</span>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-white/5 hover:bg-white/10 border border-border hover:border-primary/50 text-text rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all duration-200 group"
          >
            <Upload size={18} className="text-text-muted group-hover:text-primary transition-colors" />
            <span className="font-medium text-sm">Upload Document</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">
            Uploaded Books
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center p-4 mt-4 bg-white/5 rounded-xl border border-white/5 border-dashed">
              <p className="text-sm text-text-muted">No documents uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc, index) => (
                <li key={index}>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary-300 hover:bg-primary/20 transition-colors text-left group">
                    <FileText size={18} className="text-primary flex-shrink-0" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium truncate group-hover:text-white transition-colors">{doc.name}</p>
                      <p className="text-[10px] text-text-muted/70">{doc.chunks} chunks embedded</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button className="flex items-center gap-3 text-sm font-medium text-text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-white/5 w-full">
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-background relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-10">
          <div className="flex-1">
            <h1 className="text-lg font-medium">Chat</h1>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 relative overflow-hidden">
           <ChatInterface />
        </div>
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={handleUploadSuccess}
      />
      
    </div>
  );
}

export default App;
