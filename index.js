const express = require('express');
const app = express();
app.use(express.json());

// PEGA A CHAVE DO AMBIENTE (RENDER) - SEGURO!
const CHAVE_BREVO = process.env.CHAVE_BREVO;
const ID_MODELO = 1; // ID do seu modelo

// VERIFICA SE A CHAVE EXISTE
if (!CHAVE_BREVO) {
  console.error('❌ ERRO: CHAVE_BREVO não encontrada no ambiente!');
  process.exit(1);
}

app.post('/webhook-vega', async (req, res) => {
  console.log('✅ Webhook recebido:', req.body);
  
  const dados = req.body;
  
  // PEGAR EMAIL E NOME
  const emailCliente = dados.email || dados.client_email || dados.customer_email;
  const nomeCliente = dados.name || dados.nome || dados.client_name;
  
  console.log('📧 Email:', emailCliente);
  console.log('👤 Nome:', nomeCliente);
  
  if (!emailCliente) {
    return res.status(400).json({ erro: 'Email não encontrado' });
  }
  
  try {
    const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': CHAVE_BREVO,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: [{
          email: emailCliente,
          name: nomeCliente || 'Cliente'
        }],
        templateId: ID_MODELO,
        params: {
          nome_cliente: nomeCliente || 'Cliente'
        }
      })
    });
    
    const resultado = await resposta.json();
    console.log('✅ Resposta Brevo:', resultado);
    
    res.json({ ok: true, mensagem: 'E-mail enviado!' });
  } catch (erro) {
    console.error('❌ Erro:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 Webhook Vega + Brevo funcionando!');
});

app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000');
});
