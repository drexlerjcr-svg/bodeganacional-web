const webAppUrl = "https://script.google.com/macros/s/AKfycbyrff3ZX9PsTV9DcFqwUrZBv-wFWuGXW9q9GXmQpPmGmWr7pfUe45VzX4WGl4lWBkjS/exec";

document.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('pin-input');
    if (pinInput) {
        pinInput.addEventListener('keypress', e => { 
            if (e.key === 'Enter') checkAuth(); 
        });
    }
});

function showVerify(state, title, sub) {
    const overlay = document.getElementById('verify-overlay');
    const card = document.getElementById('verify-card');
    const iconI = document.getElementById('verify-icon-i');
    if (!overlay || !card || !iconI) return;
    
    card.className = 'verify-card state-' + state;
    const icons = { pending: 'fa-sync-alt', success: 'fa-check', error: 'fa-times' };
    iconI.className = 'fas ' + icons[state];
    document.getElementById('verify-title').textContent = title;
    document.getElementById('verify-sub').innerHTML = sub;
    overlay.classList.add('active');
}

function hideVerify() { 
    const overlay = document.getElementById('verify-overlay');
    if (overlay) overlay.classList.remove('active'); 
}

async function checkAuth() {
    const pinInput = document.getElementById('pin-input').value;
    if (!pinInput) { alert("Código requerido"); return; }
    showVerify('pending', 'Verificando credenciales', 'Por favor espere...');
    try {
        const res = await fetch(`${webAppUrl}?pass=${pinInput}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showVerify('success', 'Acceso concedido', 'Bienvenido al sistema');
        
        sessionStorage.setItem('authPin', pinInput);
        
        setTimeout(() => { 
            hideVerify(); 
            window.location.href = 'estadisticas.html';
        }, 900);
    } catch (error) {
        showVerify('error', 'Acceso denegado', 'Credenciales invalidas');
        setTimeout(() => { hideVerify(); }, 2000);
    }
}
