console.log("send_email.js caricato!");

export function setupEmailFormListener() {
  const emailForm = document.getElementById('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(emailForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message')
      };

      try {
        const response = await fetch('/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          alert('Messaggio inviato con successo!');
          emailForm.reset();
        } else {
          alert(result.error || 'Errore durante l\'invio del messaggio.');
        }
      } catch (err) {
        alert('Errore di rete durante l\'invio del messaggio.');
      }
    });
  }
}
