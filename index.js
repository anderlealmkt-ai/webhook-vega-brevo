const express = require('express');
const app = express();
app.use(express.json());

const CHAVE_BREVO = process.env.CHAVE_BREVO;
const ID_MODELO_FRONT = 1;          // e-mail de acesso (link fixo)
const ID_MODELO_UPSELL = 2;          // e-mail com link para página de ativação

// CÓDIGOS DOS PRODUTOS NA VEGA
const CODIGOS_FRONT = ['3MFC1G', '3MK863', '3MK9S2'];      // produtos front (acesso)
const CODIGOS_UPSELL = ['3MFF77', '3MKGB4'];               // produtos upsell (código ativação)

// Link da página de ativação (Netlify)
const LINK_ATIVACAO = 'https://ativacaoespecial-pro.netlify.app/';

if (!CHAVE_BREVO) {
  console.error('❌ ERRO: CHAVE_BREVO não encontrada!');
  process.exit(1);
}

app.post('/webhook-vega', async (req, res) => {
  console.log('✅ Webhook recebido');
  
  const dados = req.body;
  const email = dados.customer?.email;
  const nome = dados.customer?.name;
  
  if (!email) {
    return res.status(400).json({ erro: 'Email não encontrado' });
  }
  
  const produtos = dados.products || [];
  let tipoEnvio = null; // 'front', 'upsell', ou null
  let produtoIdentificado = null;
  
  // Verificar qual tipo de produto foi comprado
  for (const produto of produtos) {
    if (CODIGOS_FRONT.includes(produto.code)) {
      tipoEnvio = 'front';
      produtoIdentificado = produto.code;
      console.log(`🎯 Produto FRONT detectado: ${produto.code} - ${produto.title || ''}`);
      break;
    } else if (CODIGOS_UPSELL.includes(produto.code)) {
      tipoEnvio = 'upsell';
      produtoIdentificado = produto.code;
      console.log(`🎯 Produto UPSELL detectado: ${produto.code} - ${produto.title || ''}`);
      break;
    }
  }
  
  try {
    if (tipoEnvio === 'front') {
      // ✅ Envia e-mail de acesso (produto front)
      console.log(`📧 Enviando e-mail de acesso para ${email} (produto front ${produtoIdentificado})`);
      
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': CHAVE_BREVO,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: [{ email, name: nome || 'Cliente' }],
          templateId: ID_MODELO_FRONT,
          params: { 
            nome_cliente: nome || 'Cliente'
          }
        })
      });
      
      console.log(`✅ E-mail de acesso enviado para ${email}`);
      
    } else if (tipoEnvio === 'upsell') {
      // ✅ Envia e-mail com link para página de ativação
      console.log(`📧 Enviando e-mail de upsell para ${email} com link de ativação`);
      
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': CHAVE_BREVO,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: [{ email, name: nome || 'Cliente' }],
          templateId: ID_MODELO_UPSELL,
          params: {
            nome_cliente: nome || 'Cliente',
            link_ativacao: LINK_ATIVACAO
          }
        })
      });
      
      console.log(`✅ E-mail do upsell enviado para ${email}`);
      
    } else {
      console.log(`ℹ️ Produto não identificado nas listas - nenhum e-mail enviado. Códigos recebidos: ${produtos.map(p => p.code).join(', ')}`);
    }
    
    res.json({ ok: true });
    
  } catch (erro) {
    console.error('❌ Erro:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 Webhook funcionando com front (3 produtos) e upsell (2 produtos)!');
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
