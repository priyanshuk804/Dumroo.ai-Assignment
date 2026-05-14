import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { askQuestion } from '../services/api';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 p-6 ${isUser ? 'bg-transparent' : 'bg-white/5 border-y border-border/50'}`}
    >
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <User size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Bot size={18} />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-sm text-text-muted">{isUser ? 'You' : 'AI Assistant'}</p>
          {!isUser && (
            <button 
              onClick={handleCopy}
              className="text-text-muted hover:text-text transition-colors p-1"
              title="Copy response"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          )}
        </div>
        <div className="prose prose-invert max-w-none text-text text-[15px] leading-relaxed">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="bg-[#0d1117] rounded-md overflow-hidden my-4 border border-border">
                    <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-border text-xs text-text-muted">
                      <span>{match[1]}</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm text-text">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  </div>
                ) : (
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-primary-300" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Namaste! I am your AI knowledge assistant. Upload a Hindi or Sanskrit PDF using the button above, and then ask me any questions about the content.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    try {
      const response = await askQuestion(userMessage.content);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.answer }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: `**Error:** ${error.message}. Please make sure you have uploaded a document first.` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex gap-4 p-6 bg-white/5 border-y border-border/50">
               <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Bot size={18} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Searching knowledge base...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end bg-surface border border-border rounded-2xl shadow-xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about the uploaded document..."
              className="w-full max-h-[200px] bg-transparent text-text placeholder:text-text-muted/50 p-4 outline-none resize-none overflow-y-auto text-[15px]"
              rows={1}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="m-2 p-2 rounded-xl bg-primary hover:bg-primary-hover disabled:bg-white/5 disabled:text-text-muted/30 text-white transition-colors flex-shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2 text-xs text-text-muted/50">
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
