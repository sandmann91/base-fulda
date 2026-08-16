const app = document.querySelector('#app')

if (app) {
	const now = new Date()
	app.textContent = `Vite läuft. Letzter Reload: ${now.toLocaleString()}`
}
