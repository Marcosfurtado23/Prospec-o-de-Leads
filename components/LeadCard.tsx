
import React, { useState } from 'react';
import { Lead } from '../types';
import { analyzeLeadOutreach } from '../services/geminiService';
import { sounds } from '../services/soundService';
import { Linkedin, Instagram, Facebook, Twitter, MessageCircle, Globe, Mail, Phone, MapPin } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onAnalyzeLead?: (lead: Lead) => Promise<string>; // Optional prop for custom analysis logic
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onAnalyzeLead }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);

  const handleAnalyze = async () => {
    sounds.playAnalyze();
    setIsAnalyzing(true);
    try {
      let result: string;
      if (onAnalyzeLead) {
        result = await onAnalyzeLead(lead);
      } else {
        // Fallback to default analysis if no custom handler is provided
        result = await analyzeLeadOutreach(lead);
      }
      setStrategy(result);
    } catch (error) {
      alert("Falha ao analisar lead.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatWhatsAppLink = (phone: string, location: string) => {
    let numbers = phone.replace(/\D/g, '');
    const locLower = location.toLowerCase();
    
    // Auto-adiciona o código do país se faltar
    if (locLower.includes('brasil') || locLower.includes('br')) {
      if (numbers.length === 10 || numbers.length === 11) {
        numbers = '55' + numbers;
      }
    } else if (locLower.includes('estados unidos') || locLower.includes('usa')) {
      if (numbers.length === 10) {
        numbers = '1' + numbers;
      }
    } else if (locLower.includes('portugal') || locLower.includes('pt')) {
      if (numbers.length === 9) {
        numbers = '351' + numbers;
      }
    }
    
    return `https://wa.me/${numbers}`;
  };

  const isLikelyMobile = (phone: string, location: string) => {
    const numbers = phone.replace(/\D/g, '');
    const locLower = location.toLowerCase();
    
    if (locLower.includes('brasil') || locLower.includes('br')) {
      const localNumber = numbers.startsWith('55') ? numbers.slice(2) : numbers;
      // Celulares no Brasil têm 11 dígitos (DDD + 9 dígitos) e o terceiro dígito é 9
      return localNumber.length === 11 && localNumber[2] === '9';
    }
    return true; // Assume true for other countries
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{lead.name}</h3>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">{lead.industry}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          lead.potentialScore > 75 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          Score: {lead.potentialScore}
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3 leading-relaxed">
        {lead.description}
      </p>

      <div className="space-y-2 mb-6 text-sm">
        <div className="flex items-center text-slate-500 dark:text-slate-500">
          <MapPin className="w-4 h-4 mr-2" />
          {lead.location}
        </div>
        <div className="flex items-center text-slate-500 dark:text-slate-500">
          <Globe className="w-4 h-4 mr-2" />
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline truncate">
            {lead.website}
          </a>
        </div>
        {lead.email && (
          <div className="flex items-center text-slate-500 dark:text-slate-500">
            <Mail className="w-4 h-4 mr-2" />
            <a href={`mailto:${lead.email}`} className="text-blue-500 dark:text-blue-400 hover:underline truncate">
              {lead.email}
            </a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center text-slate-500 dark:text-slate-500">
            <Phone className="w-4 h-4 mr-2" />
            <a href={`tel:${lead.phone}`} className="text-blue-500 dark:text-blue-400 hover:underline truncate">
              {lead.phone}
            </a>
          </div>
        )}
      </div>

      {/* Social Media & WhatsApp Section */}
      <div className="flex flex-wrap gap-3 mb-6">
        {lead.socialMedia?.linkedin && (
          <a href={lead.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#0077b5] dark:hover:text-[#0077b5] transition-colors" title="LinkedIn">
            <Linkedin size={18} />
          </a>
        )}
        {lead.socialMedia?.instagram && (
          <a href={lead.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#E1306C] dark:hover:text-[#E1306C] transition-colors" title="Instagram">
            <Instagram size={18} />
          </a>
        )}
        {lead.socialMedia?.facebook && (
          <a href={lead.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#1877F2] dark:hover:text-[#1877F2] transition-colors" title="Facebook">
            <Facebook size={18} />
          </a>
        )}
        {lead.socialMedia?.twitter && (
          <a href={lead.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 hover:text-[#1DA1F2] dark:hover:text-[#1DA1F2] transition-colors" title="Twitter">
            <Twitter size={18} />
          </a>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {(lead.whatsapp || lead.phone) && (lead.whatsapp || lead.phone || '').replace(/\D/g, '').length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            <a 
              href={formatWhatsAppLink(lead.whatsapp || lead.phone || '', lead.location)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2 px-4 rounded-lg font-medium transition-colors shadow-sm"
            >
              <MessageCircle size={18} />
              Chamar no WhatsApp
            </a>
            {!isLikelyMobile(lead.whatsapp || lead.phone || '', lead.location) && (
              <span className="text-[10px] text-yellow-600 dark:text-yellow-500 text-center">
                ⚠️ Este número parece ser fixo e pode não ter WhatsApp.
              </span>
            )}
          </div>
        )}
        
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex-1 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-sm py-2 px-4 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 border border-slate-700 dark:border-slate-700"
        >
          {isAnalyzing ? 'Analisando...' : 'Ver Estratégia de IA'}
        </button>
      </div>

      {strategy && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm border border-blue-100 dark:border-blue-800">
          <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Sugestão de Abordagem:</h4>
          <div className="prose prose-sm text-blue-800 dark:text-blue-400 whitespace-pre-wrap">
            {strategy}
          </div>
          <button 
            onClick={() => setStrategy(null)}
            className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
};

export default LeadCard;