function navMenu() {
	document.getElementById('burger-btn').addEventListener('click', function() {
		this.classList.toggle('burger-btn--active');
		document.querySelector('.header__nav').classList.toggle('header__nav--active');
		document.body.classList.toggle('lock');
	});
}

navMenu();
