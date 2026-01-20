
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile, CommunityPost } from '../types';
import { gemini } from '../services/geminiService';

interface CommunityScreenProps {
  isDark: boolean;
  accentColor: string;
}

const PROFILE_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#71717A'
];

const Avatar = ({ user, size, fontSize = "text-[10px]" }: { user: any, size: string, fontSize?: string }) => {
  if (!user) return <div className={`${size} rounded-full bg-zinc-800 animate-pulse`}></div>;
  
  if (user.avatar_url && user.avatar_url.trim() !== "") {
    return <img src={user.avatar_url} className={`${size} rounded-full object-cover border-2 border-white/10 shadow-sm`} alt={user.username || 'user'} />;
  }
  
  const firstLetter = (user.username && user.username.length > 0) ? user.username[0].toUpperCase() : '?';
  
  return (
    <div className={`${size} rounded-full flex items-center justify-center font-black text-white shadow-inner transition-colors duration-500`} style={{ backgroundColor: user.profile_color || '#3b82f6' }}>
      <span className={fontSize}>{firstLetter}</span>
    </div>
  );
};

const ProfileSetup = ({ onSave, isDark, initialEmail }: any) => {
  const [data, setData] = useState({ 
    username: initialEmail?.split('@')[0] || '', 
    profile_color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)], 
    avatar_url: '' 
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
      // 1. Converter para Base64 para análise do Gemini
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        // 2. Moderação via Gemini Vision
        const decision = await gemini.analyzeImage(base64String, file.type);
        
        if (decision.startsWith('blocked')) {
          alert("SEGURANÇA: A imagem viola as diretrizes de segurança (conteúdo impróprio detectado) e foi bloqueada.");
          setIsAnalyzing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        // 3. Upload para Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setData(prev => ({ ...prev, avatar_url: publicUrl }));
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar imagem.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 md:mt-20 p-8 animate-fade-in text-center pb-32">
      <h2 className="text-3xl font-black italic mb-2 tracking-tighter">Portal Identity</h2>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-10">Configure sua Identidade de Rede</p>

      <div className="flex justify-center mb-10 relative group">
        <div className="relative">
          <Avatar user={data} size="w-28 h-28" fontSize="text-4xl" />
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
              <i className="fa-solid fa-shield-halved fa-beat text-white text-xl"></i>
            </div>
          )}
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-xl active:scale-90 transition-all"
        >
          <i className="fa-solid fa-camera text-xs"></i>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange}
        />
      </div>

      <div className="space-y-6 text-left">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 mb-2 block">Username da Rede</label>
          <input 
            type="text" placeholder="ex: portal_user" 
            className={`w-full p-4 rounded-2xl border outline-none font-black transition-all focus:ring-2 focus:ring-blue-500/20 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100'}`}
            value={data.username} onChange={e => setData({...data, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})}
          />
        </div>

        <div>
           <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4 mb-2 block">Cor de Identidade</label>
           <div className="grid grid-cols-5 gap-3 p-2">
             {PROFILE_COLORS.map(color => (
               <button 
                 key={color} type="button" onClick={() => setData({...data, profile_color: color})}
                 className={`w-full aspect-square rounded-xl border-4 transition-all ${data.profile_color === color ? 'border-blue-500 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                 style={{ backgroundColor: color }}
               />
             ))}
           </div>
        </div>

        <button 
          disabled={isAnalyzing || !data.username}
          onClick={() => onSave(data)}
          className="w-full py-5 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl active:scale-95 transition-all mt-6 hover:bg-blue-500 disabled:opacity-50"
        >
          {isAnalyzing ? 'MODERAÇÃO ATIVA...' : 'SALVAR IDENTIDADE'}
        </button>
      </div>
    </div>
  );
};

const CommunityScreen: React.FC<CommunityScreenProps> = ({ isDark, accentColor }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [input, setInput] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setIsSetupMode(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !profile) return;
    fetchPosts();

    const channel = supabase
      .channel('community_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'community_posts' 
      }, () => {
        fetchPosts(); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, profile]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error || !data) {
        setIsSetupMode(true);
      } else {
        setProfile(data);
        setIsSetupMode(false);
      }
    } catch (e) {
      setIsSetupMode(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles(*)
      `)
      .order('created_at', { ascending: false });
    
    if (data) {
      setPosts(data.map(p => ({
        ...p,
        timestamp: new Date(p.created_at).getTime(),
        liked_by: p.liked_by || []
      })));
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(authForm);
    
    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp(authForm);
        if (signUpError) {
          alert("Erro: " + signUpError.message);
        } else {
          if (signUpData.session) setSession(signUpData.session);
          else alert("Conta criada com sucesso! Entre agora.");
        }
      } else {
        alert("Erro: " + signInError.message);
      }
    }
    setIsLoggingIn(false);
  };

  const saveProfile = async (setupData: any) => {
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      ...setupData,
      created_at: new Date().toISOString()
    });
    
    if (error) {
      alert("Erro ao salvar perfil: " + error.message);
      setLoading(false);
    } else {
      setProfile({ id: session.user.id, ...setupData });
      setIsSetupMode(false);
      setLoading(false);
      fetchPosts();
    }
  };

  const handlePost = async () => {
    if (!input.trim() || !profile) return;
    const { error } = await supabase.from('community_posts').insert({
      author_id: session.user.id,
      content: input,
      created_at: new Date().toISOString(),
      liked_by: []
    });
    if (error) alert("Erro ao publicar: " + error.message);
    else setInput('');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] opacity-40">
      <i className="fa-solid fa-shield-halved fa-spin text-3xl mb-4 text-blue-500"></i>
      <span className="text-[10px] font-black uppercase tracking-widest">Autenticando Identidade...</span>
    </div>
  );

  if (!session) return (
    <div className="max-w-md mx-auto mt-20 p-8 animate-fade-in pb-40">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-zinc-950 rounded-[2rem] border border-zinc-800 flex items-center justify-center text-blue-500 text-3xl mx-auto mb-6 shadow-2xl relative">
          <i className="fa-solid fa-lock"></i>
        </div>
        <h2 className="text-4xl font-black italic tracking-tighter mb-2">Acesso Seguro</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Área Privada da Comunidade</p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <input 
          type="email" placeholder="E-mail" required
          className={`w-full p-5 rounded-[2rem] border outline-none font-bold transition-all focus:ring-4 focus:ring-blue-500/10 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100'}`}
          value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Senha" required
          className={`w-full p-5 rounded-[2rem] border outline-none font-bold transition-all focus:ring-4 focus:ring-blue-500/10 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100'}`}
          value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}
        />
        <button 
          disabled={isLoggingIn}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-50"
        >
          {isLoggingIn ? <i className="fa-solid fa-spinner fa-spin"></i> : 'AUTENTICAR'}
        </button>
      </form>
    </div>
  );

  if (isSetupMode) return <ProfileSetup onSave={saveProfile} isDark={isDark} initialEmail={session.user.email} />;

  return (
    <div className={`p-4 md:p-10 max-w-4xl mx-auto pb-64 animate-fade-in ${isDark ? 'text-white' : 'text-gray-900'}`}>
      <header className="mb-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter italic leading-none mb-2">Social Hub</h2>
          <div className="flex items-center gap-3">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Sincronização Elite Realtime</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-4 p-3 pr-6 rounded-full border ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-100 shadow-sm'}`}>
           <Avatar user={profile} size="w-12 h-12" />
           <div className="flex flex-col">
             <p className="text-[9px] font-black uppercase tracking-widest opacity-30 leading-none mb-1">Logado como</p>
             <p className="text-sm font-black tracking-tight" style={{ color: profile?.profile_color }}>@{profile?.username}</p>
           </div>
        </div>
      </header>

      <div className={`p-6 md:p-10 rounded-[3rem] mb-16 border transition-all relative ${
        isDark ? 'bg-zinc-900/40 border-zinc-800 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'
      }`}>
        <textarea 
          placeholder={`Compartilhe algo, ${profile?.username}...`}
          className={`w-full bg-transparent outline-none text-xl font-bold resize-none h-32 mb-6 placeholder:opacity-20 ${isDark ? 'text-white' : 'text-gray-900'}`} 
          value={input} onChange={(e) => setInput(e.target.value)} 
        />
        <div className="flex justify-end">
          <button 
            onClick={handlePost} 
            disabled={!input.trim()} 
            className="px-10 py-4 rounded-[2rem] bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all hover:bg-blue-50"
            style={{ backgroundColor: '#2563eb' }} // Cor fixa para manter independência visual
          >
            PUBLICAR
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {posts.map(post => (
          <div key={post.id} className={`p-6 md:p-8 rounded-[2.5rem] border transition-all animate-fade-in ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-gray-100 shadow-sm'
          }`}>
            <div className="flex items-center gap-4 mb-6">
              <Avatar user={post.author} size="w-10 h-10" />
              <div className="flex flex-col">
                <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: post.author?.profile_color || '#3b82f6' }}>
                  {post.author?.username || 'Anônimo'}
                </span>
                <span className="text-[9px] opacity-30 font-bold uppercase tracking-tighter">
                  {new Date(post.timestamp).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <p className={`text-lg font-medium leading-relaxed ${isDark ? 'text-zinc-200' : 'text-gray-700'}`}>
              {post.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityScreen;
