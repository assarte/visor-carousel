/**
 * Created by assarte on 2015.10.22.
 */
+function ($) {
	'use strict';

	// VISOR CAROUSEL CLASS DEFINITION
	// ===============================

	var VisorCarousel = function (element, options) {
		this.$element    = $(element);
		this.$indicators = this.$element.find('.carousel-indicators');
		this.options     = options;
		this.paused      = null;
		this.sliding     = null;
		this.interval    = null;
		this.$active     = null;
		this.$items      = null;

		this.options.keyboard && this.$element.on('keydown.bs.visorcarousel', $.proxy(this.keydown, this));

		this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element
			.on('mouseenter.bs.visorcarousel', $.proxy(this.pause, this))
			.on('mouseleave.bs.visorcarousel', $.proxy(this.cycle, this));
	};

	VisorCarousel.VERSION  = '1.0.0';

	VisorCarousel.TRANSITION_DURATION = 600;

	VisorCarousel.DEFAULTS = {
		interval: 5000,
		pause: 'hover',
		wrap: true,
		keyboard: true
	};


	// VISOR CAROUSEL PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data('bs.visorcarousel');
			var options = $.extend({}, VisorCarousel.DEFAULTS, $this.data(), typeof option == 'object' && option);
			var action  = typeof option == 'string' ? option : options.slide;

			if (!data) $this.data('bs.visorcarousel', (data = new VisorCarousel(this, options)));
			if (typeof option == 'number') data.to(option);
			else if (action) data[action]();
			else if (options.interval) data.pause().cycle();
		});
	}

	var old = $.fn.visorCarousel;

	$.fn.visorCarousel             = Plugin;
	$.fn.visorCarousel.Constructor = VisorCarousel;


	// VISOR CAROUSEL NO CONFLICT
	// ==========================

	$.fn.carousel.noConflict = function () {
		$.fn.carousel = old;
		return this;
	};


	// VISOR CAROUSEL DATA-API
	// =======================

	var clickHandler = function (e) {
		var href;
		var $this   = $(this);
		var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
		if (!$target.hasClass('visor-carousel')) return;
		var options = $.extend({}, $target.data(), $this.data());
		var slideIndex = $this.attr('data-slide-to');
		if (slideIndex) options.interval = false;

		Plugin.call($target, options);

		if (slideIndex) {
			$target.data('bs.visorcarousel').to(slideIndex);
		}

		e.preventDefault();
	};

	$(document)
		.on('click.bs.visorcarousel.data-api', '[data-slide]', clickHandler)
		.on('click.bs.visorcarousel.data-api', '[data-slide-to]', clickHandler);

	$(window).on('load', function () {
		$('[data-ride="carousel"]').each(function () {
			var $carousel = $(this);
			Plugin.call($carousel, $carousel.data());
		});
	});

}(jQuery);