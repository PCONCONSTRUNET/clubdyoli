"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit3, Trash2, Gift, Play, Pause, X, Image as ImageIcon, CheckCircle2, Trophy } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { FeedbackModal, translateError } from "../../../../components/FeedbackModal";
import { ConfirmModal } from "../../../../components/ConfirmModal";

export default function AdminSorteiosPage() {
  const [sorteios, setSorteios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sorteando, setSorteando] = useState<string | null>(null);
  
  // Form State
  const [id, setId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [premio, setPremio] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [status, setStatus] = useState("Ativo");
  
  // Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Feedback State
  const [feedback, setFeedback] = useState<{isOpen: boolean, type: "error"|"success", title: string, message: string}>({
    isOpen: false, type: "success", title: "", message: ""
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean,
    actionType: "delete" | "sortear" | null,
    targetId: string | null,
    targetData: any
  }>({
    isOpen: false,
    actionType: null,
    targetId: null,
    targetData: null
  });

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, actionType: null, targetId: null, targetData: null });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSorteios();
  }, []);

  const fetchSorteios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sorteios")
      .select("*, ganhador:profiles(nome)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSorteios(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (sorteio?: any) => {
    if (sorteio) {
      setIsEditing(true);
      setId(sorteio.id);
      setTitulo(sorteio.titulo);
      setDescricao(sorteio.descricao || "");
      setPremio(sorteio.premio);
      
      const start = new Date(sorteio.data_inicio);
      const end = new Date(sorteio.data_fim);
      
      const formatDT = (d: Date) => {
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };
      
      setDataInicio(formatDT(start));
      setDataFim(formatDT(end));
      setStatus(sorteio.status);
      setImagePreview(sorteio.imagem_url || "");
    } else {
      setIsEditing(false);
      setId("");
      setTitulo("");
      setDescricao("");
      setPremio("");
      setDataInicio("");
      setDataFim("");
      setStatus("Ativo");
      setImagePreview("");
    }
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!titulo || !premio || !dataInicio || !dataFim) {
      setFeedback({ isOpen: true, type: 'error', title: 'Atenção', message: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    setUploading(true);
    let finalImageUrl = imagePreview;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sorteios')
        .upload(filePath, imageFile);

      if (uploadError) {
        setFeedback({ isOpen: true, type: 'error', title: 'Erro de Upload', message: uploadError.message });
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('sorteios').getPublicUrl(filePath);
      finalImageUrl = publicUrl;
    }

    const payload = {
      titulo,
      descricao,
      premio,
      data_inicio: new Date(dataInicio).toISOString(),
      data_fim: new Date(dataFim).toISOString(),
      status,
      imagem_url: finalImageUrl
    };

    if (isEditing) {
      const { error } = await supabase.from('sorteios').update(payload).eq('id', id);
      if (error) { setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) }); setUploading(false); return; }
    } else {
      const { error } = await supabase.from('sorteios').insert([payload]);
      if (error) { setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: translateError(error.message) }); setUploading(false); return; }
    }

    setFeedback({ isOpen: true, type: 'success', title: 'Sucesso', message: isEditing ? 'Sorteio atualizado!' : 'Sorteio criado!' });
    setUploading(false);
    setModalOpen(false);
    fetchSorteios();
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      actionType: "delete",
      targetId: id,
      targetData: null
    });
  };

  const executeDelete = async () => {
    const { targetId } = confirmModal;
    if (targetId) {
      await supabase.from('sorteios').delete().eq('id', targetId);
      fetchSorteios();
    }
    closeConfirmModal();
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Ativo' ? 'Pausado' : 'Ativo';
    await supabase.from('sorteios').update({ status: newStatus }).eq('id', id);
    fetchSorteios();
  };

  const handleSortear = async (sorteio: any) => {
    setConfirmModal({
      isOpen: true,
      actionType: "sortear",
      targetId: sorteio.id,
      targetData: sorteio
    });
  };

  const executeSortear = async () => {
    const sorteio = confirmModal.targetData;
    closeConfirmModal();
    setSorteando(sorteio.id);

    try {
      // 1. Pegar todos os assinantes ativos
      const { data: assinaturas } = await supabase
        .from('assinaturas')
        .select('user_id')
        .eq('status', 'Ativa');
      
      if (!assinaturas || assinaturas.length === 0) {
        setFeedback({ isOpen: true, type: 'error', title: 'Nenhum assinante', message: 'Nenhum assinante ativo encontrado para participar do sorteio.' });
        setSorteando(null);
        return;
      }

      // 2. Escolher um ganhador
      const indexSorteado = Math.floor(Math.random() * assinaturas.length);
      const ganhadorId = assinaturas[indexSorteado].user_id;

      // 3. Criar cupom tipo Prêmio
      const codigoCupom = `SRT${Math.random().toString(36).substring(2,8).toUpperCase()}`;
      const { data: cupomData, error: cupomError } = await supabase.from('cupons').insert([{
        codigo: codigoCupom,
        tipo: 'Premio',
        valor_premio: `Prêmio do Sorteio: ${sorteio.premio}`,
        validade: 'Sem validade',
        total_usos: 1,
        status: 'Ativo'
      }]).select().single();

      if (cupomError) throw cupomError;

      // 4. Vincular o cupom ao ganhador
      await supabase.from('user_cupons').insert([{
        user_id: ganhadorId,
        cupom_id: cupomData.id
      }]);

      // 5. Atualizar o Sorteio
      await supabase.from('sorteios').update({
        status: 'Finalizado',
        ganhador_id: ganhadorId,
        cupom_gerado_id: cupomData.id
      }).eq('id', sorteio.id);

      setFeedback({ isOpen: true, type: 'success', title: 'Sucesso!', message: 'Sorteio realizado com sucesso! O ganhador já recebeu o cupom na carteira.' });
      fetchSorteios();
    } catch (error: any) {
      console.error("Erro ao realizar sorteio", error);
      setFeedback({ isOpen: true, type: 'error', title: 'Erro', message: error.message || 'Falha ao realizar sorteio.' });
    } finally {
      setSorteando(null);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <FeedbackModal 
        isOpen={feedback.isOpen} 
        type={feedback.type} 
        title={feedback.title} 
        message={feedback.message} 
        onClose={() => setFeedback(f => ({...f, isOpen: false}))} 
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.actionType === "delete" ? "Excluir Sorteio" : "Realizar Sorteio"}
        message={confirmModal.actionType === "delete" 
          ? "Tem certeza que deseja excluir este sorteio? Esta ação não pode ser desfeita." 
          : "Deseja realmente realizar este sorteio agora? O prêmio será enviado para o ganhador e o sorteio será finalizado."}
        type={confirmModal.actionType === "delete" ? "danger" : "warning"}
        confirmText={confirmModal.actionType === "delete" ? "Sim, Excluir" : "Sim, Sortear"}
        onConfirm={confirmModal.actionType === "delete" ? executeDelete : executeSortear}
        onCancel={closeConfirmModal}
      />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sorteios</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie sorteios e realize prêmios automáticos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(255,20,147,0.6)] transition-all"
        >
          <Plus size={18} /> Novo Sorteio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-gray-500 font-bold">Carregando sorteios...</div>
        ) : sorteios.length === 0 ? (
          <div className="col-span-full py-10 text-center bg-white rounded-[24px] border border-gray-100 shadow-sm">
            <Gift className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">Nenhum sorteio cadastrado ainda.</p>
          </div>
        ) : (
          sorteios.map(sorteio => (
            <div key={sorteio.id} className={`bg-white rounded-[24px] border shadow-sm overflow-hidden flex flex-col transition-shadow ${sorteio.status === 'Finalizado' ? 'border-amber-200' : 'border-gray-100 hover:shadow-md'}`}>
              
              <div className="h-48 bg-gray-100 relative group">
                {sorteio.imagem_url ? (
                  <img src={sorteio.imagem_url} alt={sorteio.titulo} className={`w-full h-full object-cover ${sorteio.status === 'Finalizado' ? 'grayscale opacity-70' : ''}`} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon size={40} />
                  </div>
                )}
                
                {sorteio.status !== 'Finalizado' && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(sorteio)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-gray-700 hover:text-[#ff1493] shadow-sm">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(sorteio.id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-lg text-red-500 hover:text-red-700 shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-md ${
                  sorteio.status === 'Ativo' ? 'bg-emerald-100/90 text-emerald-700' : 
                  sorteio.status === 'Pausado' ? 'bg-gray-100/90 text-gray-700' : 
                  'bg-amber-400 text-amber-900'
                }`}>
                  {sorteio.status}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{sorteio.titulo}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{sorteio.descricao}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Prêmio:</span>
                    <span className="font-bold text-[#ff1493]">{sorteio.premio}</span>
                  </div>

                  {sorteio.status === 'Finalizado' ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                      <div className="bg-amber-200 text-amber-700 p-2 rounded-lg">
                        <Trophy size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-600">Ganhador</p>
                        <p className="font-bold text-amber-900">{sorteio.ganhador?.nome || 'Cliente Oculto'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-500">Início</span>
                        {new Date(sorteio.data_inicio).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="font-medium text-gray-500">Fim</span>
                        {new Date(sorteio.data_fim).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>

                {sorteio.status !== 'Finalizado' && (
                  <div className="pt-4 mt-4 border-t border-gray-50 flex gap-2">
                    <button 
                      onClick={() => handleToggleStatus(sorteio.id, sorteio.status)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-colors ${
                        sorteio.status === 'Ativo' 
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {sorteio.status === 'Ativo' ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Retomar</>}
                    </button>

                    {sorteio.status === 'Ativo' && (
                      <button 
                        onClick={() => handleSortear(sorteio)}
                        disabled={sorteando === sorteio.id}
                        className="flex-[2] flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-colors bg-emerald-500 text-white hover:bg-emerald-600 shadow-md disabled:opacity-50"
                      >
                        {sorteando === sorteio.id ? "Sorteando..." : <><Trophy size={14} /> Realizar Sorteio</>}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl m-auto flex flex-col animate-in zoom-in-95 my-4 sm:my-8">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-[32px]">
              <div>
                <h2 className="text-2xl font-black text-gray-900">{isEditing ? 'Editar Sorteio' : 'Novo Sorteio'}</h2>
                <p className="text-gray-500 text-sm mt-1">Configure os detalhes do sorteio e o prêmio.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Upload de Imagem */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Imagem Principal</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#ff1493] hover:bg-[#ff1493]/5 transition-colors relative overflow-hidden group"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold flex items-center gap-2"><Edit3 size={18} /> Trocar Imagem</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 group-hover:text-[#ff1493] transition-colors">
                      <ImageIcon className="mx-auto mb-2" size={32} />
                      <span className="font-bold text-sm">Clique para enviar imagem</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Título do Sorteio *</label>
                  <input 
                    type="text" 
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                    placeholder="Ex: Sorteio de Fim de Ano"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
                  <textarea 
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors h-24 resize-none"
                    placeholder="Regras e detalhes..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Prêmio *</label>
                  <input 
                    type="text" 
                    value={premio}
                    onChange={e => setPremio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                    placeholder="Ex: 1 Sessão de Tatuagem Pequena"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Data e Hora de Início *</label>
                  <input 
                    type="datetime-local" 
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Data e Hora de Fim *</label>
                  <input 
                    type="datetime-local" 
                    value={dataFim}
                    onChange={e => setDataFim(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Status Inicial</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-[#ff1493] focus:ring-1 focus:ring-[#ff1493] transition-colors"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-gray-100 flex gap-3 justify-end shrink-0 bg-gray-50/50 rounded-b-[32px]">
              <button 
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-[#ff1493] to-[#ff4081] text-white px-8 py-3 rounded-xl font-bold shadow-[0_8px_20px_-6px_rgba(255,20,147,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(255,20,147,0.6)] transition-all disabled:opacity-50"
              >
                {uploading ? "Salvando..." : <><CheckCircle2 size={18} /> Salvar Sorteio</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
