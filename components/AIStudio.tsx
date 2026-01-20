
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { gemini } from '../services/geminiService';

interface AIStudioProps {
  isDark?: boolean;
}

const AIStudio: React.FC<AIStudioProps> = ({ isDark = false }) => {
  const [chatInput, setChatInput] = useState('');
  const [history, setHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => scrollToBottom(), [history, isTyping]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMessage = chatInput.trim();
    const newUserItem = { role: 'user', parts: [{ text: userMessage }] };
    const currentHist = [...history];
    setHistory(prev => [...prev, newUserItem]);
    setChatInput('');
    setIsTyping(true);
    try {
      const responseText = await gemini.chat(userMessage, currentHist);
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: responseText }] }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Erro de conexão.' }] }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden ${isDark ? 'bg-zinc-950' : 'bg-white'}`} style={{ height: '100dvh' }}>
      <div className={`px-6 py-4 border-b flex items-center gap-4 shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-robot"></i>
        </div>
        <div>
          <h3 className={`font-black text-base leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Assistente Portal</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Protocolo Neural Ativo</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 space-y-5 ${isDark ? 'bg-zinc-950' : 'bg-gray-50/50'}`}>
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl mb-4 ${isDark ? 'bg-zinc-900 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              <i className="fa-solid fa-brain"></i>
            </div>
            <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tutor Digital</h3>
            <p className="text-zinc-500 text-xs font-bold leading-relaxed max-w-[240px]">Pergunte sobre qualquer recurso do portal ou peça ajuda com tarefas complexas.</p>
          </div>
        )}
        {history.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : (isDark ? 'bg-zinc-900 border border-zinc-800 text-white rounded-tl-none' : 'bg-white border border-gray-100 text-gray-900 rounded-tl-none')
            }`}>{m.parts[0].text}</div>
          </div>
        ))}
        {isTyping && <div className="text-blue-500 font-black text-[10px] uppercase animate-pulse">IA está processando...</div>}
      </div>

      <div className={`p-4 shrink-0 ${isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white border-t border-gray-100'}`}>
        <div className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text" 
            placeholder="Digite sua mensagem..." 
            className={`flex-grow rounded-2xl px-5 py-3.5 outline-none font-bold text-sm transition-all ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:border-blue-500' : 'bg-gray-50 border-gray-100 text-black focus:border-blue-500 focus:bg-white'
            }`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button onClick={handleSendMessage} disabled={isTyping || !chatInput.trim()} className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-40"><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
