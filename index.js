const express = require('express');
const app = express();
app.use(express.json());

// VOCÊ VAI SUBSTITUIR DEPOIS PELA SUA CHAVE
const CHAVE_BREVO = 'coloque_sua_chave_api_aqui';
const ID_MODELO = 123456; // DEPOIS VOCÊ MUDA

app.post('/webhook-vega', async (req, res) => {
  console.log('Webhook recebido:', req.body);
  
  const dados = req.body;
  
  const emailCliente = dados.email || dados.client_email || dados.customer_email;
  const nomeCliente = dados.name || dados.nome || dados.client_name;
  
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
          nome_cliente: nomeCliente || 'Cliente',
          email_cliente: emailCliente
        }
      })
    });
    
    const resultado = await resposta.json();
    console.log('Resposta Brevo:', resultado);
    
    res.json({ ok: true, resultado });
  } catch (erro) {
    console.error('Erro:', erro);
    res.status(500).json({ erro: erro.message });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor do webhook OK!');
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
