
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, SearchParams, MyCompany } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function prospectLeads(params: SearchParams, myCompany?: MyCompany): Promise<{ leads: Lead[], sources: any[] }> {
  let companyContext = '';
  if (myCompany && myCompany.name && myCompany.industry) {
    companyContext = `Sua empresa é ${myCompany.name} da indústria de ${myCompany.industry}.`;
    if (myCompany.website) companyContext += ` O website é ${myCompany.website}.`;
    if (myCompany.description) companyContext += ` Sua descrição é: ${myCompany.description}.`;
    companyContext += ' ';
  }

  let servicesContext = '';
  if (params.servicesOffered) {
    servicesContext = `Sua empresa oferece os seguintes serviços: ${params.servicesOffered}. Encontre leads que possam ter interesse ativo ou necessidade por estes serviços.`;
  }

  const isProfessional = params.targetType === 'professionals';
  const isFreelance = params.targetType === 'freelance_opportunities';
  
  let targetEntity = 'empresas reais';
  let targetRole = 'especialista em prospecção de vendas B2B';
  let nameLabel = 'Nome completo da empresa';
  let industryLabel = 'Setor/Indústria';
  let websiteLabel = 'URL do Website';

  if (isProfessional) {
    targetEntity = 'profissionais (pessoas físicas, autônomos ou especialistas)';
    targetRole = 'especialista em recrutamento e prospecção de profissionais';
    nameLabel = 'Nome completo do profissional';
    industryLabel = 'Profissão / Especialidade';
    websiteLabel = 'URL do Portfólio, LinkedIn ou Site';
  } else if (isFreelance) {
    targetEntity = 'PESSOAS FÍSICAS, influenciadores, criadores de conteúdo ou pequenos empreendedores que estão buscando serviços (NÃO foque em grandes empresas, foque em indivíduos postando em redes sociais ou sites de freelancers)';
    targetRole = 'especialista em encontrar indivíduos e criadores que precisam de ajuda imediata com serviços';
    nameLabel = 'Nome do Contratante / Criador';
    industryLabel = 'Serviço Solicitado';
    websiteLabel = 'Link do Post ou Perfil';
  }

  const prompt = `
    Atue como um ${targetRole}. 
    ${companyContext}Encontre até 50 ${targetEntity} (o máximo que conseguir sem exceder o tempo limite) que se encaixam neste critério:
    Nicho/Serviço: ${params.niche}
    Localização: ${params.location}
    ${servicesContext}
    ${isFreelance ? 'FOCO: Encontre postagens de PESSOAS REAIS (criadores, influencers, autônomos) em redes sociais ou fóruns que precisam de ' + params.niche + '. EVITE empresas corporativas, foque no contato direto com o indivíduo.' : 'Objetivo: Identificar leads qualificados para expansão de negócios ou parcerias.'}
    Seja extremamente conciso nas descrições e sugestões para uma resposta rápida e garanta que o JSON seja bem formatado.

    Para cada lead, forneça:
    - ${nameLabel} (campo "name")
    - ${industryLabel} (campo "industry")
    - ${websiteLabel} (campo "website")
    - Uma breve descrição (máximo 1 frase)
    - Pontuação de potencial (0-100)
    - Sugestões de como abordá-los (1 frase curta)
    - Localização exata.
    - E-mail (se disponível publicamente).
    - Telefone fixo ou comercial (campo "phone").
    - Links para redes sociais (LinkedIn, Instagram, Facebook, Twitter) se disponíveis.
    - Número de WhatsApp (campo "whatsapp"): EXTREMAMENTE IMPORTANTE: Só preencha este campo se for um número de celular válido ou explicitamente listado como WhatsApp. No Brasil, celulares têm 9 dígitos após o DDD (ex: 11 9XXXX-XXXX). Inclua o código do país (ex: +55). Não coloque telefones fixos aqui. Se não tiver certeza, deixe em branco.
    - Análise de Redes Sociais (campo "socialMediaAnalysis"): Avalie a qualidade da presença digital (especialmente Instagram). Se for ruim ou inexistente, destaque isso como uma oportunidade de serviço.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leads: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  industry: { type: Type.STRING },
                  website: { type: Type.STRING },
                  description: { type: Type.STRING },
                  potentialScore: { type: Type.NUMBER },
                  contactSuggestions: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  location: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  whatsapp: { type: Type.STRING },
                  socialMediaAnalysis: {
                    type: Type.OBJECT,
                    properties: {
                      quality: { 
                        type: Type.STRING,
                        description: "Qualidade da presença no Instagram/Redes Sociais: 'excelente', 'bom', 'regular', 'ruim' ou 'inexistente'"
                      },
                      observations: { type: Type.STRING, description: "Breve observação sobre o que falta ou o que está ruim." }
                    },
                    required: ["quality", "observations"]
                  },
                  socialMedia: {
                    type: Type.OBJECT,
                    properties: {
                      linkedin: { type: Type.STRING },
                      instagram: { type: Type.STRING },
                      facebook: { type: Type.STRING },
                      twitter: { type: Type.STRING }
                    }
                  }
                },
                required: ["name", "industry", "website", "description", "potentialScore", "contactSuggestions", "location"]
              }
            }
          },
          required: ["leads"]
        }
      },
    });

    let result;
    try {
      let cleanText = response.text || '{"leads": []}';
      // Remove possible markdown formatting that sometimes gets included even with responseMimeType
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", response.text);
      // Se falhar o parse, tenta retornar um array vazio para não quebrar a UI
      result = { leads: [] };
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Add unique IDs to leads
    const leadsWithIds = result.leads.map((l: any, index: number) => ({
      ...l,
      id: `lead-${Date.now()}-${index}`
    }));

    return { leads: leadsWithIds, sources };
  } catch (error) {
    console.error("Erro na prospecção via Gemini:", error);
    throw error;
  }
}

export async function analyzeLeadOutreach(lead: Lead, myCompany?: MyCompany, targetType?: string): Promise<string> {
  let companyContext = '';
  if (myCompany && myCompany.name && myCompany.industry) {
    companyContext = `Sua empresa, ${myCompany.name}, é da indústria de ${myCompany.industry}.`;
    if (myCompany.description) companyContext += ` Ela é descrita como: ${myCompany.description}.`;
    companyContext += ' ';
  }

  const isProfessional = targetType === 'professionals';
  const isFreelance = targetType === 'freelance_opportunities';

  const targetNameLabel = isFreelance ? 'Contratante' : (isProfessional ? 'Profissional' : 'Empresa');
  const targetIndustryLabel = isFreelance ? 'Serviço Necessário' : (isProfessional ? 'Especialidade' : 'Indústria');

  const prompt = `Crie uma estratégia de abordagem (outreach) personalizada para o seguinte lead:
    ${targetNameLabel}: ${lead.name}
    ${targetIndustryLabel}: ${lead.industry}
    Descrição: ${lead.description}
    Site/Vaga: ${lead.website}
    ${lead.email ? `E-mail: ${lead.email}` : ''}
    ${lead.phone ? `Telefone: ${lead.phone}` : ''}
    
    ${companyContext}A estratégia deve incluir um script de abordagem curto (pode ser para e-mail, LinkedIn ou WhatsApp), focando em como você pode resolver o problema específico do lead. ${isFreelance ? 'Como é uma vaga/projeto, foque em destacar suas habilidades relevantes.' : 'A abordagem deve ser relevante para a sua empresa.'}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a estratégia.";
  } catch (error) {
    console.error("Erro na análise de outreach:", error);
    return "Erro ao gerar estratégia personalizada.";
  }
}