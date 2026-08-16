function initEventGallery(gallery) {
	const slides = Array.from(gallery.querySelectorAll('.event-gallery__slide'))
	const track = gallery.querySelector('.event-gallery__thumbs-track')
	const thumbsViewport = gallery.querySelector('.event-gallery__thumbs')
	const thumbs = Array.from(gallery.querySelectorAll('.event-gallery__thumb'))
	const prevBtn = gallery.querySelector('.event-gallery__nav--prev')
	const nextBtn = gallery.querySelector('.event-gallery__nav--next')
	const main = gallery.querySelector('.event-gallery__main')

	if (!track || !thumbsViewport || thumbs.length === 0) return

	let windowStart = 0

	function currentIndex() {
		const index = slides.findIndex((slide) => slide.classList.contains('is-active'))
		return index === -1 ? 0 : index
	}

	function getStep() {
		const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0')
		return { thumbWidth: thumbs[0].getBoundingClientRect().width, gap }
	}

	function getVisibleCount() {
		const { thumbWidth, gap } = getStep()
		if (!thumbWidth) return thumbs.length
		const viewportWidth = thumbsViewport.getBoundingClientRect().width
		return Math.max(1, Math.round((viewportWidth + gap) / (thumbWidth + gap)))
	}

	function updateWindow(activeIndex) {
		const visibleCount = getVisibleCount()
		const maxStart = Math.max(0, thumbs.length - visibleCount)

		if (activeIndex < windowStart) {
			windowStart = activeIndex
		} else if (activeIndex > windowStart + visibleCount - 1) {
			windowStart = activeIndex - visibleCount + 1
		}
		windowStart = Math.min(Math.max(windowStart, 0), maxStart)

		const { thumbWidth, gap } = getStep()
		track.style.transform = 'translateX(-' + (windowStart * (thumbWidth + gap)) + 'px)'
	}

	function showSlide(index) {
		slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index))
		thumbs.forEach((thumb, i) => {
			thumb.classList.toggle('is-active', i === index)
			thumb.setAttribute('aria-pressed', i === index ? 'true' : 'false')
		})
		updateWindow(index)
	}

	function showPrev() {
		showSlide((currentIndex() - 1 + slides.length) % slides.length)
	}

	function showNext() {
		showSlide((currentIndex() + 1) % slides.length)
	}

	thumbs.forEach((thumb, i) => {
		thumb.addEventListener('click', () => showSlide(i))
	})

	prevBtn?.addEventListener('click', showPrev)
	nextBtn?.addEventListener('click', showNext)

	if (main && slides.length > 1) {
		let startX = 0
		let startY = 0
		let tracking = false

		main.addEventListener('touchstart', (e) => {
			const touch = e.touches[0]
			startX = touch.clientX
			startY = touch.clientY
			tracking = true
		}, { passive: true })

		main.addEventListener('touchend', (e) => {
			if (!tracking) return
			tracking = false

			const touch = e.changedTouches[0]
			const dx = touch.clientX - startX
			const dy = touch.clientY - startY
			const threshold = 40

			if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
				if (dx < 0) showNext()
				else showPrev()
			}
		}, { passive: true })
	}

	window.addEventListener('resize', () => updateWindow(currentIndex()))

	updateWindow(currentIndex())
}

document.querySelectorAll('.event-gallery').forEach(initEventGallery)
