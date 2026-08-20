// mio-account.js

let profiloCorrente = null;

async function caricaDatiAccount() {
  const { data: { user }, error: userError } = await _supabase.auth.getUser();

  if (userError || !user) {
    window.location.href = "index.html";
    return;
  }

  const container = document.getElementById('account-data');
  const { data: profilo, error: profiloError } = await _supabase
    .from('profiles')
    .select('nome, cognome, telefono, email, data_nascita')
    .eq('id', user.id)
    .single();

  if (profiloError || !profilo) {
    container.innerHTML = '<p class="booking-notes">Errore nel caricamento del profilo.</p>';
    console.error(profiloError);
    return;
  }

  profiloCorrente = profilo;
  renderModalitaLettura(profilo);
}

function renderModalitaLettura(profilo) {
  const container = document.getElementById('account-data');
  container.innerHTML = `
    <div class="account-row">
      <span class="account-icon">👤</span>
      <div>
        <p class="booking-date">Nome</p>
        <p class="booking-service">${profilo.nome ?? '-'} ${profilo.cognome ?? ''}</p>
      </div>
    </div>

    <div class="account-row">
      <span class="account-icon">📞</span>
      <div>
        <p class="booking-date">Telefono</p>
        <p class="booking-service">${profilo.telefono ?? '-'}</p>
      </div>
    </div>

    <div class="account-row">
      <span class="account-icon">✉️</span>
      <div>
        <p class="booking-date">Email</p>
        <p class="booking-service">${profilo.email ?? '-'}</p>
      </div>
    </div>

    <div class="account-row" style="border-bottom:none;">
      <span class="account-icon">🎂</span>
      <div>
        <p class="booking-date">Data di nascita</p>
        <p class="booking-service">${profilo.data_nascita ?? '-'}</p>
      </div>
    </div>
  `;
}
function renderModalitaModifica(profilo) {
  const container = document.getElementById('account-data');
  container.innerHTML = `
    <p class="booking-date">Nome</p>
    <input type="text" id="inputNome" class="auth-input" value="${profilo.nome ?? ''}">

    <p class="booking-date" style="margin-top:15px;">Cognome</p>
    <input type="text" id="inputCognome" class="auth-input" value="${profilo.cognome ?? ''}">

    <p class="booking-date" style="margin-top:15px;">Telefono</p>
    <input type="tel" id="inputTelefono" class="auth-input" value="${profilo.telefono ?? ''}">

    <p class="booking-date" style="margin-top:15px;">Email</p>
    <p class="booking-service">${profilo.email ?? '-'}</p>

    <p class="booking-date" style="margin-top:15px;">Data di nascita</p>
    <input type="date" id="inputDataNascita" class="auth-input" value="${profilo.data_nascita ?? ''}">
  `;
}

async function salvaModifiche() {
  const msg = document.getElementById('account-msg');
  const { data: { user } } = await _supabase.auth.getUser();

  const aggiornamento = {
    nome: document.getElementById('inputNome').value.trim(),
    cognome: document.getElementById('inputCognome').value.trim(),
    telefono: document.getElementById('inputTelefono').value.trim(),
    data_nascita: document.getElementById('inputDataNascita').value || null
  };

  const { error } = await _supabase
    .from('profiles')
    .update(aggiornamento)
    .eq('id', user.id);

  if (error) {
    msg.style.color = '#c0392b';
    msg.innerText = 'Errore nel salvataggio.';
    console.error(error);
    return;
  }

  msg.style.color = '#c5a059';
  msg.innerText = 'Dati aggiornati ✓';

  profiloCorrente = { ...profiloCorrente, ...aggiornamento };
  renderModalitaLettura(profiloCorrente);

  document.getElementById('btnModifica').style.display = 'inline-block';
  document.getElementById('btnSalva').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  caricaDatiAccount();

  document.getElementById('btnModifica').addEventListener('click', () => {
    renderModalitaModifica(profiloCorrente);
    document.getElementById('btnModifica').style.display = 'none';
    document.getElementById('btnSalva').style.display = 'inline-block';
    document.getElementById('account-msg').innerText = '';
  });

  document.getElementById('btnSalva').addEventListener('click', salvaModifiche);
});