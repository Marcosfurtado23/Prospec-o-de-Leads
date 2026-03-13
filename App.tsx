
import React, { useState, useEffect } from 'react';
import { prospectLeads, analyzeLeadOutreach } from './services/geminiService';
import { Lead, SearchParams, MyCompany } from './types';
import LeadCard from './components/LeadCard';
import LoadingScreen from './components/LoadingScreen'; // Import the new LoadingScreen component
import { sounds } from './services/soundService';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [params, setParams] = useState<SearchParams>({
    targetType: 'companies',
    niche: '',
    location: '',
    country: 'Brasil',
    allCountries: false,
    city: '',
    state: '',
    allCities: false,
    allStates: false,
    servicesOffered: '', // Initialize new field
  });

  const countries = [
    'Brasil',
    'Estados Unidos',
    'Portugal',
    'Angola',
    'Moçambique',
    'Reino Unido',
    'Alemanha',
    'França',
    'Espanha',
    'Itália',
    'Canadá',
    'Austrália',
    'Japão',
    'China',
    'Argentina',
    'Chile',
    'Colômbia',
    'México'
  ];

  const states = [
    { name: 'Acre', uf: 'AC' },
    { name: 'Alagoas', uf: 'AL' },
    { name: 'Amapá', uf: 'AP' },
    { name: 'Amazonas', uf: 'AM' },
    { name: 'Bahia', uf: 'BA' },
    { name: 'Ceará', uf: 'CE' },
    { name: 'Distrito Federal', uf: 'DF' },
    { name: 'Espírito Santo', uf: 'ES' },
    { name: 'Goiás', uf: 'GO' },
    { name: 'Maranhão', uf: 'MA' },
    { name: 'Mato Grosso', uf: 'MT' },
    { name: 'Mato Grosso do Sul', uf: 'MS' },
    { name: 'Minas Gerais', uf: 'MG' },
    { name: 'Pará', uf: 'PA' },
    { name: 'Paraíba', uf: 'PB' },
    { name: 'Paraná', uf: 'PR' },
    { name: 'Pernambuco', uf: 'PE' },
    { name: 'Piauí', uf: 'PI' },
    { name: 'Rio de Janeiro', uf: 'RJ' },
    { name: 'Rio Grande do Norte', uf: 'RN' },
    { name: 'Rio Grande do Sul', uf: 'RS' },
    { name: 'Rondônia', uf: 'RO' },
    { name: 'Roraima', uf: 'RR' },
    { name: 'Santa Catarina', uf: 'SC' },
    { name: 'São Paulo', uf: 'SP' },
    { name: 'Sergipe', uf: 'SE' },
    { name: 'Tocantins', uf: 'TO' }
  ];
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Novo estado para geração de PDF
  const [myCompany, setMyCompany] = useState<MyCompany | undefined>(() => {
    if (typeof window !== 'undefined') {
      const storedCompany = localStorage.getItem('myCompany');
      return storedCompany ? JSON.parse(storedCompany) : undefined;
    }
    return undefined;
  });
  const [showMyCompanyForm, setShowMyCompanyForm] = useState(false);

  // New states for loading screen
  const [appLoading, setAppLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate app loading progress
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5; // Increment progress
      if (currentProgress <= 100) {
        setLoadingProgress(currentProgress);
      }
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setAppLoading(false); // Hide loading screen after a short delay
        }, 500); // Small delay to show 100%
      }
    }, 100); // Update every 100ms
    return () => clearInterval(interval);
  }, []); // Run only once on component mount


  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (myCompany) {
      localStorage.setItem('myCompany', JSON.stringify(myCompany));
    } else {
      localStorage.removeItem('myCompany');
    }
  }, [myCompany]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.niche) return;

    // Construct location string
    let finalLocation = '';

    if (params.allCountries) {
      finalLocation = 'Global (Todos os países)';
    } else if (params.country === 'Brasil') {
      if (params.allStates) {
        finalLocation = 'Brasil (Todos os estados)';
      } else if (params.state) {
        const stateName = states.find(s => s.uf === params.state)?.name || params.state;
        if (params.allCities) {
          finalLocation = `Todas as cidades de ${stateName}, Brasil`;
        } else if (params.city) {
          finalLocation = `${params.city}, ${params.state}, Brasil`;
        } else {
          finalLocation = `${stateName}, Brasil`;
        }
      } else {
        finalLocation = 'Brasil';
      }
    } else if (params.country) {
      if (params.city) {
        finalLocation = `${params.city}, ${params.country}`;
      } else {
        finalLocation = params.country;
      }
    } else {
      finalLocation = params.location || 'Brasil';
    }

    const searchParams = { ...params, location: finalLocation };

    sounds.playSearch();
    setLoading(true);
    setError(null);
    try {
      const result = await prospectLeads(searchParams, myCompany);
      setLeads(result.leads);
      setSources(result.sources);
      if (result.leads.length > 0) {
        sounds.playSuccess();
      }
    } catch (err: any) {
      setError("Ocorreu um erro ao buscar leads. Verifique sua conexão ou tente novamente mais tarde.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    if (leads.length === 0) {
      alert("Nenhum lead para exportar.");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      let yPos = 10;
      const margin = 10;
      const lineHeight = 7;
      const pageHeight = doc.internal.pageSize.height;

      doc.setFontSize(16);
      doc.text("Contatos de Leads Gerados pelo LeadGenius AI", margin, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      leads.forEach((lead, index) => {
        if (yPos + 4 * lineHeight > pageHeight - margin) { // Check if new content fits
          doc.addPage();
          yPos = margin; // Reset yPos for new page
          doc.setFontSize(16);
          doc.text("Contatos de Leads Gerados pelo LeadGenius AI (Continuação)", margin, yPos);
          yPos += 15;
          doc.setFontSize(10);
        }

        doc.setFontSize(12);
        doc.text(`${index + 1}. ${lead.name}`, margin, yPos);
        yPos += lineHeight;

        doc.setFontSize(10);
        if (lead.email) {
          doc.text(`   Email: ${lead.email}`, margin, yPos);
          yPos += lineHeight;
        }
        if (lead.phone) {
          doc.text(`   Telefone: ${lead.phone}`, margin, yPos);
          yPos += lineHeight;
        }
        doc.text(`   Website: ${lead.website}`, margin, yPos);
        yPos += lineHeight;
        yPos += 5; // Extra space between leads
      });

      doc.save('contatos_leads.pdf');
    } catch (pdfError) {
      console.error("Erro ao gerar PDF:", pdfError);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSaveMyCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newCompany: MyCompany = {
      name: form.companyName.value,
      industry: form.companyIndustry.value,
      website: form.companyWebsite.value,
      description: form.companyDescription.value,
    };
    setMyCompany(newCompany);
    setShowMyCompanyForm(false);
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    sounds.playToggle(nextDark);
  };

  if (appLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="tech-ring group-hover:opacity-100 transition-opacity"></div>
              <div className="tech-glow"></div>
              <div className="relative w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center z-10 shadow-lg shadow-blue-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">LeadGenius <span className="text-blue-600 dark:text-blue-400 font-medium">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</a>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Prospects</a>
            </div>

            <button
              onClick={() => setShowMyCompanyForm(true)}
              className="p-2 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all flex items-center gap-2"
              aria-label="Configurar Minha Empresa"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Minha Empresa
            </button>
            
            <button
              onClick={handleExportPdf}
              disabled={isGeneratingPdf || leads.length === 0}
              className="p-2 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-2"
              aria-label="Exportar contatos para PDF"
            >
              {isGeneratingPdf ? (
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM9.998 12.55C9.467 12.019 9 11.458 9 11s.467-1.019.998-1.55c.532-.531 1.057-.96 1.402-1.285.344-.326.608-.54.67-.597.062-.057.172-.116.321-.177.149-.061.34-.092.571-.092.23 0 .422.031.571.092.149-.061.26.12.321.177.062-.057.326.271.67.597.345.325.87.754 1.402 1.285.531.531.998 1.121.998 1.55s-.467 1.019-.998 1.55c-.532.531-1.057.96-1.402 1.285-.344.326-.608.54-.67.597-.062-.057-.172.116-.321-.177-.149-.061-.34.092-.571.092-.23 0-.422-.031-.571-.092-.149-.061-.26-.12-.321-.177-.062-.057-.326-.271-.67-.597-.345-.325-.87-.754-1.402-1.285zM13 9.47L12 8.47l-1 1V14h2V9.47zM13 2v6h6l-6-6z"/></svg>
              )}
              PDF
            </button>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* My Company Form Overlay */}
      {showMyCompanyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Configurar Minha Empresa</h3>
            <form onSubmit={handleSaveMyCompany} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                <input 
                  type="text" 
                  id="companyName" 
                  name="companyName" 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                  defaultValue={myCompany?.name || ''} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="companyIndustry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Setor/Indústria</label>
                <input 
                  type="text" 
                  id="companyIndustry" 
                  name="companyIndustry" 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                  defaultValue={myCompany?.industry || ''} 
                  required 
                />
              </div>
              <div>
                <label htmlFor="companyWebsite" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Website</label>
                <input 
                  type="url" 
                  id="companyWebsite" 
                  name="companyWebsite" 
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" 
                  defaultValue={myCompany?.website || ''} 
                  placeholder="https://suaempresa.com"
                />
              </div>
              <div>
                <label htmlFor="companyDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição (breve)</label>
                <textarea 
                  id="companyDescription" 
                  name="companyDescription" 
                  rows={3}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 resize-y" 
                  defaultValue={myCompany?.description || ''} 
                  placeholder="O que sua empresa faz?"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowMyCompanyForm(false)}
                  className="px-6 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
            <button 
              onClick={() => setShowMyCompanyForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}

      {/* Hero Search Section */}
      <section className="bg-slate-900 dark:bg-slate-950 text-white py-16 px-4 transition-colors">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-4xl font-extrabold mb-4">Encontre seus próximos clientes ideais</h2>
          <p className="text-slate-400 text-lg">Use inteligência artificial avançada para prospectar empresas e criar estratégias de vendas em segundos.</p>
          {myCompany?.name && (
            <p className="text-blue-300 text-md mt-4">
              Gerando leads para: <span className="font-bold">{myCompany.name}</span> ({myCompany.industry})
            </p>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch} className="glass-morphism bg-white/10 dark:bg-slate-900/50 p-2 rounded-2xl flex flex-col gap-2 shadow-2xl border border-white/10 dark:border-slate-800">
            {/* Target Type Selection */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-2 w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setParams({...params, targetType: 'companies'})}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${params.targetType === 'companies' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Empresas (B2B)
              </button>
              <button
                type="button"
                onClick={() => setParams({...params, targetType: 'professionals'})}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${params.targetType === 'professionals' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Profissionais / Pessoas
              </button>
            </div>

            {/* Niche and Location inputs */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
                <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input 
                  type="text" 
                  placeholder={params.targetType === 'professionals' ? "Qual profissão? (Ex: Arquitetos, Veterinários)" : "Qual nicho de empresa você procura?"}
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm py-2"
                  value={params.niche}
                  onChange={(e) => setParams({...params, niche: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Country Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">País</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                        checked={params.allCountries}
                        onChange={(e) => setParams({...params, allCountries: e.target.checked, country: e.target.checked ? '' : 'Brasil', state: '', city: '', allStates: false, allCities: false})}
                      />
                      <span className="text-xs text-slate-400">Todos</span>
                    </label>
                  </div>
                  <select
                    disabled={params.allCountries}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    value={params.country}
                    onChange={(e) => setParams({...params, country: e.target.value, state: '', city: '', allStates: false, allCities: false})}
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        disabled={params.allCountries || params.country !== 'Brasil'}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        checked={params.allStates}
                        onChange={(e) => setParams({...params, allStates: e.target.checked, state: '', city: '', allCities: false})}
                      />
                      <span className="text-xs text-slate-400">Todos</span>
                    </label>
                  </div>
                  <select
                    disabled={params.allCountries || params.allStates || params.country !== 'Brasil'}
                    className="w-full bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    value={params.state}
                    onChange={(e) => setParams({...params, state: e.target.value})}
                  >
                    <option value="">Selecione um Estado</option>
                    {states.map(s => (
                      <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cidade</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        disabled={params.allCountries || (params.country === 'Brasil' && (params.allStates || !params.state))}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        checked={params.allCities}
                        onChange={(e) => setParams({...params, allCities: e.target.checked, city: ''})}
                      />
                      <span className="text-xs text-slate-400">Todas</span>
                    </label>
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
                    <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <input 
                      type="text" 
                      placeholder="Nome da Cidade" 
                      disabled={params.allCountries || params.allCities || (params.country === 'Brasil' && !params.state)}
                      className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm py-2 disabled:opacity-50"
                      value={params.city}
                      onChange={(e) => setParams({...params, city: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* New Services Offered input */}
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl px-4 py-2 border border-slate-200 dark:border-slate-700">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M6.343 17.657l-.707.707M18 10v4m-6-4v4m-6-4v4m14-4a2 2 0 11-4 0 2 2 0 014 0zM5.454 11.13A7 7 0 0112 4a7 7 0 016.546 7.13M12 17a7 7 0 01-7-7c0-3.866 3.134-7 7-7s7 3.134 7 7c0 3.866-3.134 7-7 7z"/></svg>
              <textarea
                rows={2} // Use textarea for multi-line description
                placeholder="Quais serviços sua empresa oferece? (Ex: Consultoria de marketing digital, desenvolvimento de software)"
                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 text-sm py-2 resize-y"
                value={params.servicesOffered}
                onChange={(e) => setParams({...params, servicesOffered: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Buscando...
                </div>
              ) : 'Prospectar'}
            </button>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-12">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {leads.length > 0 ? `Encontrados ${leads.length} Leads Qualificados` : 'Comece sua busca'}
            </h3>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {leads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onAnalyzeLead={(l) => analyzeLeadOutreach(l, myCompany, params.targetType === 'professionals')} />
                ))}
                {leads.length === 0 && !loading && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    <p className="text-lg font-medium">Nenhum resultado para exibir</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
                Fontes de Dados
              </h4>
              <div className="space-y-3">
                {sources.length > 0 ? (
                  sources.map((source, idx) => (
                    <a key={idx} href={source.web?.uri || '#'} target="_blank" className="block p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{source.web?.title || 'Informação de Mercado'}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">As fontes aparecerão aqui após a busca.</p>
                )}
              </div>
            </div>

            <div className="bg-blue-600 dark:bg-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none">
              <h4 className="font-bold mb-2">Dica de Prospecção</h4>
              <p className="text-sm text-blue-50 leading-relaxed">
                Leads com score acima de 80 são prioridade máxima. Use o script de IA para iniciar a conversa com relevância.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-slate-400 dark:text-slate-600 text-sm">
        <p>&copy; 2026 LeadGenius AI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default App;